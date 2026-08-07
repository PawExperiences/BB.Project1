/**
 * game.js — Main game loop and scene/level manager.
 *
 * Levels:
 *   1 — Classic invaders
 *   2 — Faster invaders
 *   3 — Shields + formation split (level3.js)
 *   4 — Boss fight          (boss.js)
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, BULLET_SPEED, STARTING_LIVES } from './gameConfig.js';
import { initInput, isKeyHeld } from './input.js';
import { initPlayer, updatePlayer, renderPlayer, getPlayerRect, resetPlayer } from './player.js';
import { initLevel3, updateLevel3, renderLevel3, getLevel3Status, getLevel3PlayerBullets, setLevel3PlayerBullets } from './level3.js';
import {
    initBoss, updateBoss, renderBoss,
    getBossPlayerBullets, setBossPlayerBullets,
    getBossProjectiles, removeBossProjectile,
    getBossFinalScore, getWinButtonBounds,
} from './boss.js';
import { checkCollision } from './collision.js';

// ─── Canvas setup ────────────────────────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ─── Game state ──────────────────────────────────────────────────────────────

let currentLevel = 1;
let score        = 0;
let lives        = STARTING_LIVES;
let gameState    = 'playing'; // 'playing' | 'gameover' | 'win'
let lastTime     = null;

// Player bullets (shared across level contexts where relevant)
let playerBullets = [];

// Shooting cooldown
let shootCooldown = 0;
const SHOOT_COOLDOWN_MS = 300;

// ─── Input ───────────────────────────────────────────────────────────────────

initInput();

// ─── Level initialisation ────────────────────────────────────────────────────

function startLevel(level) {
    currentLevel  = level;
    playerBullets = [];
    shootCooldown = 0;
    resetPlayer(canvas);

    if (level === 3) {
        initLevel3(ctx, canvas, score);
    } else if (level === 4) {
        initBoss(ctx, canvas, score);
    }
    // Levels 1 and 2 are handled inline in the update loop below.
}

function restartGame() {
    score        = 0;
    lives        = STARTING_LIVES;
    gameState    = 'playing';
    startLevel(1);
}

// ─── Shooting ────────────────────────────────────────────────────────────────

function handleShooting(dt) {
    shootCooldown -= dt * 1000;
    if (isKeyHeld(' ') && shootCooldown <= 0) {
        const pr = getPlayerRect();
        playerBullets.push({
            x: pr.x + pr.w / 2,
            y: pr.y,
            w: 4,
            h: 12,
            vy: -BULLET_SPEED,
        });
        shootCooldown = SHOOT_COOLDOWN_MS;
    }
}

function updatePlayerBullets(dt) {
    for (const b of playerBullets) {
        b.y += b.vy * dt;
    }
    playerBullets = playerBullets.filter(b => b.y + b.h > 0);
}

// ─── Invader helpers (Levels 1 & 2) ─────────────────────────────────────────

// Invader grid state for Levels 1–2
let invaders    = [];
let invaderVx   = 60; // px/s
let invaderBullets = [];
let invaderFireTimer = 0;
const INVADER_FIRE_INTERVAL = 1200; // ms

const INVADER_COLS = 11;
const INVADER_ROWS = 5;
const INVADER_W    = 36;
const INVADER_H    = 24;
const INVADER_PAD  = 16;
const INVADER_START_Y = 80;

function initInvaders(level) {
    invaders       = [];
    invaderBullets = [];
    invaderFireTimer = 0;
    invaderVx = level === 2 ? 90 : 60;

    for (let row = 0; row < INVADER_ROWS; row++) {
        for (let col = 0; col < INVADER_COLS; col++) {
            invaders.push({
                x: 40 + col * (INVADER_W + INVADER_PAD),
                y: INVADER_START_Y + row * (INVADER_H + INVADER_PAD),
                w: INVADER_W,
                h: INVADER_H,
                alive: true,
            });
        }
    }
}

function updateInvaders(dt) {
    const alive = invaders.filter(i => i.alive);
    if (alive.length === 0) return;

    // Edge detection
    let hitEdge = false;
    for (const inv of alive) {
        if ((invaderVx > 0 && inv.x + inv.w >= CANVAS_WIDTH - 4) ||
            (invaderVx < 0 && inv.x <= 4)) {
            hitEdge = true;
            break;
        }
    }

    if (hitEdge) {
        invaderVx = -invaderVx;
        for (const inv of alive) inv.y += 16;
    }

    for (const inv of alive) inv.x += invaderVx * dt;

    // Invader shooting
    invaderFireTimer -= dt * 1000;
    if (invaderFireTimer <= 0 && alive.length > 0) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        invaderBullets.push({
            x: shooter.x + shooter.w / 2,
            y: shooter.y + shooter.h,
            w: 4,
            h: 12,
            vy: 220,
        });
        invaderFireTimer = INVADER_FIRE_INTERVAL;
    }

    // Move invader bullets
    for (const b of invaderBullets) b.y += b.vy * dt;
    invaderBullets = invaderBullets.filter(b => b.y < CANVAS_HEIGHT);

    // Invader bullets hit player
    const pr = getPlayerRect();
    for (let i = invaderBullets.length - 1; i >= 0; i--) {
        const b  = invaderBullets[i];
        const br = { x: b.x - b.w / 2, y: b.y, w: b.w, h: b.h };
        if (checkCollision(br, pr)) {
            invaderBullets.splice(i, 1);
            lives--;
            if (lives <= 0) {
                gameState = 'gameover';
            }
        }
    }

    // Player bullets hit invaders
    for (let bi = playerBullets.length - 1; bi >= 0; bi--) {
        const b  = playerBullets[bi];
        const br = { x: b.x - b.w / 2, y: b.y, w: b.w, h: b.h };
        for (let ii = 0; ii < invaders.length; ii++) {
            const inv = invaders[ii];
            if (!inv.alive) continue;
            if (checkCollision(br, { x: inv.x, y: inv.y, w: inv.w, h: inv.h })) {
                inv.alive = false;
                playerBullets.splice(bi, 1);
                score += 10;
                break;
            }
        }
    }
}

function renderInvaders() {
    const ctx2 = ctx;
    // Draw invaders
    for (const inv of invaders) {
        if (!inv.alive) continue;
        ctx2.fillStyle = currentLevel === 2 ? '#ff6644' : '#44ff88';
        ctx2.fillRect(inv.x, inv.y, inv.w, inv.h);
        // Simple eye detail
        ctx2.fillStyle = '#000';
        ctx2.fillRect(inv.x + 6,  inv.y + 6,  8, 6);
        ctx2.fillRect(inv.x + 22, inv.y + 6,  8, 6);
    }
    // Draw invader bullets
    for (const b of invaderBullets) {
        ctx2.fillStyle = '#ff4444';
        ctx2.fillRect(b.x - b.w / 2, b.y, b.w, b.h);
    }
}

function renderPlayerBullets() {
    ctx.fillStyle = '#ffff00';
    for (const b of playerBullets) {
        ctx.fillRect(b.x - b.w / 2, b.y, b.w, b.h);
    }
}

// ─── HUD ─────────────────────────────────────────────────────────────────────

function renderHUD() {
    ctx.fillStyle  = '#fff';
    ctx.font       = '18px monospace';
    ctx.textAlign  = 'left';
    ctx.fillText(`Score: ${score}`, 12, CANVAS_HEIGHT - 12);
    ctx.textAlign  = 'right';
    ctx.fillText(`Lives: ${lives}  Level: ${currentLevel}`, CANVAS_WIDTH - 12, CANVAS_HEIGHT - 12);
}

// ─── Overlays ────────────────────────────────────────────────────────────────

function renderGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle  = '#ff4444';
    ctx.font       = 'bold 48px monospace';
    ctx.textAlign  = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    ctx.fillStyle  = '#fff';
    ctx.font       = '24px monospace';
    ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

// ─── Click handler (win screen restart button) ────────────────────────────────

canvas.addEventListener('click', (e) => {
    if (currentLevel !== 4 || gameState !== 'win') return;

    const rect   = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH  / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const mx     = (e.clientX - rect.left) * scaleX;
    const my     = (e.clientY - rect.top)  * scaleY;

    const btn = getWinButtonBounds();
    if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        restartGame();
    }
});

// ENTER key restarts from game-over
window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (gameState === 'gameover') {
            restartGame();
        }
    }
});

// ─── Main loop ────────────────────────────────────────────────────────────────

function loop(timestamp) {
    requestAnimationFrame(loop);

    const dt = lastTime === null ? 0 : Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState === 'gameover') {
        renderPlayer();
        renderGameOver();
        return;
    }

    // ── Level 4: Boss ──
    if (currentLevel === 4) {
        handleShooting(dt);
        updatePlayerBullets(dt);

        // Sync player bullets into boss module
        setBossPlayerBullets(playerBullets);

        const bossStatus = updateBoss(dt);

        // Retrieve (possibly trimmed) bullet array back from boss module
        playerBullets = getBossPlayerBullets();

        // Check boss projectiles against player — sudden death
        if (bossStatus === 'playing') {
            const pr      = getPlayerRect();
            const bProjs  = getBossProjectiles();
            for (let i = bProjs.length - 1; i >= 0; i--) {
                const p  = bProjs[i];
                // Treat each boss bullet as a small AABB for collision
                const br = { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 };
                if (checkCollision(br, pr)) {
                    // Sudden death — game over, restart from Level 1
                    gameState = 'gameover';
                    score     = 0; // reset score on boss sudden-death game-over
                    break;
                }
            }
        }

        if (bossStatus === 'win') {
            gameState = 'win';
        }

        updatePlayer(dt, canvas);
        renderPlayer();
        renderPlayerBullets();
        renderBoss(); // draws health bar, boss, boss projectiles (and win screen if won)
        renderHUD();
        return;
    }

    // ── Level 3 ──
    if (currentLevel === 3) {
        handleShooting(dt);
        updatePlayerBullets(dt);
        setLevel3PlayerBullets(playerBullets);

        updateLevel3(dt);

        playerBullets = getLevel3PlayerBullets();

        const l3status = getLevel3Status();
        if (l3status === 'gameover') {
            gameState = 'gameover';
        } else if (l3status === 'cleared') {
            startLevel(4);
            return;
        }

        updatePlayer(dt, canvas);
        renderPlayer();
        renderPlayerBullets();
        renderLevel3();
        renderHUD();
        return;
    }

    // ── Levels 1 & 2 ──
    handleShooting(dt);
    updatePlayerBullets(dt);
    updateInvaders(dt);
    updatePlayer(dt, canvas);

    const aliveCount = invaders.filter(i => i.alive).length;
    if (aliveCount === 0 && gameState === 'playing') {
        if (currentLevel === 1) {
            startLevel(2);
            initInvaders(2);
        } else if (currentLevel === 2) {
            startLevel(3);
        }
        return;
    }

    renderPlayer();
    renderPlayerBullets();
    renderInvaders();
    renderHUD();
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

startLevel(1);
initInvaders(1);
requestAnimationFrame(loop);
