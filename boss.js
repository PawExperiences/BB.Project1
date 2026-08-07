/**
 * boss.js — Boss Level (Level 4): multi-phase finale.
 *
 * Exports:
 *   initBoss(ctx, canvas, score)  → starts the boss fight
 *   updateBoss(dt)                 → call each frame; returns a status string:
 *                                     'playing' | 'gameover' | 'win'
 *   renderBoss()                   → draw boss, projectiles, health bar
 *   getBossPlayerBullets()         → returns the boss level's player bullet array
 *                                     (so game.js can feed player shooting into it)
 *   setBossPlayerBullets(arr)      → replace the bullet array (game.js push)
 *   getBossFinalScore()            → returns final score when win/loss resolved
 *
 * Collision detection is handled exclusively via collision.js.
 */

import { checkCollision } from './collision.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const BOSS_WIDTH        = 160;
const BOSS_HEIGHT       = 80;
const BOSS_SPEED        = 90;        // px/s horizontal drift
const BOSS_START_Y      = 60;        // top of boss rect (near top of canvas)
const BOSS_MAX_HP       = 10;
const PHASE2_HP         = 5;         // HP threshold: <= this value → Phase 2
const FIRE_INTERVAL_P1  = 1500;      // ms, Phase 1
const FIRE_INTERVAL_P2  = 700;       // ms, Phase 2
const BULLET_SPEED_BOSS = 260;       // px/s for boss projectiles
const SPREAD_ANGLE_DEG  = 20;        // degrees left/right from straight down
const BULLET_RADIUS     = 4;         // visual radius of boss bullets
const PLAYER_BULLET_W   = 4;         // assumed player bullet width (matches player.js)
const PLAYER_BULLET_H   = 12;        // assumed player bullet height

// ─── Module-level state ──────────────────────────────────────────────────────

let _ctx    = null;
let _canvas = null;
let _score  = 0;

let boss = null;           // boss entity
let bossProjectiles = [];  // bullets fired by boss
let playerBullets   = [];  // bullets fired by player (injected by game.js)
let gameStatus      = 'playing'; // 'playing' | 'gameover' | 'win'
let finalScore      = 0;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialise (or re-initialise) the boss level.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement}        canvas
 * @param {number}                   score  — score carried in from previous levels
 */
export function initBoss(ctx, canvas, score) {
    _ctx    = ctx;
    _canvas = canvas;
    _score  = score;

    bossProjectiles = [];
    playerBullets   = [];
    gameStatus      = 'playing';
    finalScore      = 0;

    boss = {
        x:          (CANVAS_WIDTH  - BOSS_WIDTH)  / 2,
        y:          BOSS_START_Y,
        w:          BOSS_WIDTH,
        h:          BOSS_HEIGHT,
        hp:         BOSS_MAX_HP,
        vx:         BOSS_SPEED,           // positive = moving right
        fireTimer:  0,                    // ms until next shot
        phase:      1,
    };
}

/** Returns the current player-bullet array so game.js can push into it. */
export function getBossPlayerBullets() {
    return playerBullets;
}

/** Replace the player-bullet array (used by game.js to inject shots). */
export function setBossPlayerBullets(arr) {
    playerBullets = arr;
}

/** Returns the resolved final score (valid after status becomes 'win'/'gameover'). */
export function getBossFinalScore() {
    return finalScore;
}

/**
 * Update all boss-level state.
 * @param {number} dt  — elapsed seconds since last frame
 * @returns {'playing'|'gameover'|'win'}
 */
export function updateBoss(dt) {
    if (gameStatus !== 'playing') return gameStatus;

    _updateBossMovement(dt);
    _updateShooting(dt);
    _updateBossProjectiles(dt);
    _updatePlayerProjectiles();

    return gameStatus;
}

/**
 * Render the boss level: health bar, boss body, and all projectiles.
 * Call after updateBoss() each frame.
 */
export function renderBoss() {
    if (!_ctx) return;

    if (gameStatus === 'win') {
        _drawWinScreen();
        return;
    }

    // Normal play or game-over: draw the play field then overlay
    _drawHealthBar();
    _drawBoss();
    _drawBossProjectiles();

    if (gameStatus === 'gameover') {
        // game.js handles the standard game-over overlay / restart
        // We just stop drawing game elements on top.
    }
}

// ─── Private helpers ─────────────────────────────────────────────────────────

function _updateBossMovement(dt) {
    boss.x += boss.vx * dt;

    // Reverse at canvas edges
    if (boss.x <= 0) {
        boss.x  = 0;
        boss.vx = BOSS_SPEED;
    } else if (boss.x + boss.w >= CANVAS_WIDTH) {
        boss.x  = CANVAS_WIDTH - boss.w;
        boss.vx = -BOSS_SPEED;
    }
}

function _updateShooting(dt) {
    const interval = boss.phase === 1 ? FIRE_INTERVAL_P1 : FIRE_INTERVAL_P2;
    boss.fireTimer -= dt * 1000; // convert to ms

    if (boss.fireTimer <= 0) {
        _fireBossSpread();
        boss.fireTimer = interval;
    }
}

function _fireBossSpread() {
    // Origin: centre-bottom of boss
    const originX = boss.x + boss.w / 2;
    const originY = boss.y + boss.h;

    const angleRad = (SPREAD_ANGLE_DEG * Math.PI) / 180;

    // Three directions: straight down (90°), 20° left, 20° right
    const directions = [
        { vx: 0,                        vy: BULLET_SPEED_BOSS },
        { vx: -Math.sin(angleRad) * BULLET_SPEED_BOSS, vy: Math.cos(angleRad) * BULLET_SPEED_BOSS },
        { vx:  Math.sin(angleRad) * BULLET_SPEED_BOSS, vy: Math.cos(angleRad) * BULLET_SPEED_BOSS },
    ];

    for (const dir of directions) {
        bossProjectiles.push({
            x:  originX,
            y:  originY,
            vx: dir.vx,
            vy: dir.vy,
            r:  BULLET_RADIUS,
        });
    }
}

function _updateBossProjectiles(dt) {
    // Move boss bullets
    for (const p of bossProjectiles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
    }

    // Remove off-screen bullets (no player reference needed for removal)
    bossProjectiles = bossProjectiles.filter(
        p => p.y < CANVAS_HEIGHT + p.r && p.y > -p.r &&
             p.x > -p.r && p.x < CANVAS_WIDTH + p.r
    );
}

function _updatePlayerProjectiles() {
    if (!playerBullets || playerBullets.length === 0) return;

    // Check each player bullet against the boss
    const bulletsToRemove = new Set();

    for (let i = 0; i < playerBullets.length; i++) {
        const b = playerBullets[i];
        // Represent bullet as an AABB rect centred on bullet x,y
        const bulletRect  = { x: b.x - PLAYER_BULLET_W / 2, y: b.y - PLAYER_BULLET_H / 2,
                               w: PLAYER_BULLET_W,           h: PLAYER_BULLET_H };
        const bossRect    = { x: boss.x, y: boss.y, w: boss.w, h: boss.h };

        if (checkCollision(bulletRect, bossRect)) {
            bulletsToRemove.add(i);
            boss.hp -= 1;

            // Phase transition
            if (boss.phase === 1 && boss.hp <= PHASE2_HP) {
                boss.phase = 2;
                // Immediately apply shorter interval; keep remaining timer capped
                boss.fireTimer = Math.min(boss.fireTimer, FIRE_INTERVAL_P2);
            }

            // Win condition
            if (boss.hp <= 0) {
                boss.hp    = 0;
                gameStatus = 'win';
                finalScore = _score;
                return; // stop processing further bullets
            }
        }
    }

    // Remove hit bullets (iterate in reverse to preserve indices)
    playerBullets = playerBullets.filter((_, i) => !bulletsToRemove.has(i));
}

// ─── Rendering helpers ───────────────────────────────────────────────────────

function _drawHealthBar() {
    const ctx    = _ctx;
    const ratio  = Math.max(0, boss.hp / BOSS_MAX_HP);
    const barH   = 14;
    const barY   = 4;
    const margin = 4;
    const barW   = CANVAS_WIDTH - margin * 2;

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(margin, barY, barW, barH);

    // Foreground (colour shifts red → green with HP)
    const r = Math.round(255 * (1 - ratio));
    const g = Math.round(255 * ratio);
    ctx.fillStyle = `rgb(${r},${g},0)`;
    ctx.fillRect(margin, barY, barW * ratio, barH);

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1;
    ctx.strokeRect(margin, barY, barW, barH);

    // Label
    ctx.fillStyle  = '#fff';
    ctx.font       = '11px monospace';
    ctx.textAlign  = 'center';
    ctx.fillText(`HP  ${boss.hp} / ${BOSS_MAX_HP}`, CANVAS_WIDTH / 2, barY + barH - 2);
}

function _drawBoss() {
    const ctx = _ctx;
    const { x, y, w, h } = boss;

    // Main hull — dark gunmetal with a gradient-like layered look
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, w, h);

    // Glowing cockpit dome
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, 28, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle   = boss.phase === 2 ? '#ff2200' : '#00ccff';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Left wing
    ctx.beginPath();
    ctx.moveTo(x,            y + h * 0.3);
    ctx.lineTo(x - 20,       y + h * 0.7);
    ctx.lineTo(x + w * 0.3,  y + h * 0.8);
    ctx.closePath();
    ctx.fillStyle = '#16213e';
    ctx.fill();
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(x + w,           y + h * 0.3);
    ctx.lineTo(x + w + 20,      y + h * 0.7);
    ctx.lineTo(x + w * 0.7,     y + h * 0.8);
    ctx.closePath();
    ctx.fillStyle   = '#16213e';
    ctx.fill();
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Gun barrel
    ctx.fillStyle = '#e94560';
    ctx.fillRect(x + w / 2 - 4, y + h - 8, 8, 10);

    // Phase 2 indicator: pulsing red edge outline
    if (boss.phase === 2) {
        ctx.strokeStyle = '#ff2200';
        ctx.lineWidth   = 3;
        ctx.strokeRect(x, y, w, h);
    } else {
        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth   = 2;
        ctx.strokeRect(x, y, w, h);
    }
}

function _drawBossProjectiles() {
    const ctx = _ctx;
    for (const p of bossProjectiles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6600';
        ctx.fill();
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth   = 1;
        ctx.stroke();
    }
}

function _drawWinScreen() {
    const ctx = _ctx;
    const cx  = CANVAS_WIDTH  / 2;
    const cy  = CANVAS_HEIGHT / 2;

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Title
    ctx.fillStyle  = '#ffd700';
    ctx.font       = 'bold 52px monospace';
    ctx.textAlign  = 'center';
    ctx.fillText('YOU WIN!', cx, cy - 100);

    // Score
    ctx.fillStyle  = '#ffffff';
    ctx.font       = '28px monospace';
    ctx.fillText(`Final Score: ${finalScore}`, cx, cy - 40);

    // Restart button background
    const btnW  = 220;
    const btnH  = 50;
    const btnX  = cx - btnW / 2;
    const btnY  = cy + 20;

    ctx.fillStyle   = '#ffd700';
    ctx.fillRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle  = '#000';
    ctx.font       = 'bold 22px monospace';
    ctx.textAlign  = 'center';
    ctx.fillText('RESTART', cx, btnY + 34);

    // Store button bounds for click detection (on the module)
    _winButton.x = btnX;
    _winButton.y = btnY;
    _winButton.w = btnW;
    _winButton.h = btnH;
}

// Bounds of the win-screen restart button (updated each render frame)
const _winButton = { x: 0, y: 0, w: 0, h: 0 };

/**
 * Returns the bounds of the win-screen restart button so game.js can
 * detect a click on it.
 */
export function getWinButtonBounds() {
    return { ..._winButton };
}

/**
 * Exposes the current boss projectiles so game.js can check player collision.
 * game.js should call this each frame and test the player rect against each
 * returned bullet using collision.js.
 */
export function getBossProjectiles() {
    return bossProjectiles;
}

/**
 * Remove a boss projectile by index (called by game.js after a hit).
 */
export function removeBossProjectile(index) {
    bossProjectiles.splice(index, 1);
}
