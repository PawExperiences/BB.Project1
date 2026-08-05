// boss.js — Boss fight: multi-phase finale.
// ES module; exports { init, update, render }.
// All boss logic (movement, phasing, firing, HP tracking) lives here.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Boss visual constants
// ---------------------------------------------------------------------------
const BOSS_WIDTH   = 120;  // px — much larger than a standard 30px invader
const BOSS_HEIGHT  = 60;   // px
const BOSS_Y       = 40;   // top-edge y — sits near the top of the canvas
const BOSS_SPEED   = 100;  // px/sec

// Projectile
const PROJ_WIDTH   = 8;    // px
const PROJ_HEIGHT  = 20;   // px
const PROJ_SPEED   = 220;  // px/sec (downward)

// Health-bar rendering
const MAX_HP       = 10;
const BAR_WIDTH    = 200;
const BAR_HEIGHT   = 18;
const BAR_X        = (CANVAS_WIDTH - BAR_WIDTH) / 2;
const BAR_Y        = 8;

// Phase thresholds
const PHASE2_HP_THRESHOLD = 5;   // enter phase 2 when HP drops to this value
const PHASE1_FIRE_MS = 2000;     // ms between shots in phase 1
const PHASE2_FIRE_MS = 1000;     // ms between shots in phase 2

// ---------------------------------------------------------------------------
// Module-level state (reset on every init() call)
// ---------------------------------------------------------------------------
let bossX   = 0;   // left-edge x of boss
let dirX    = 1;   // +1 = moving right, -1 = moving left
let hp      = MAX_HP;
let fireTimer = 0; // ms since last shot

// Active boss projectiles: array of { x, y, active }
let projectiles = [];

// Callbacks injected by game.js so boss can trigger game-level transitions
let _onPlayerHit = null;   // called when a projectile hits the player
let _onBossDead  = null;   // called when boss HP reaches 0

// Shared state reference (for reading player position)
let _sharedState = null;

// ---------------------------------------------------------------------------
// Exported lifecycle
// ---------------------------------------------------------------------------

/**
 * Called once when the boss scene begins.
 *
 * @param {CanvasRenderingContext2D} _ctx  — not stored; passed to render each frame
 * @param {object} state                  — shared game-state object
 * @param {Function} onPlayerHit          — callback: boss projectile hit player
 * @param {Function} onBossDead           — callback: boss HP reached 0
 */
export function init(_ctx, state, onPlayerHit, onBossDead) {
  _sharedState  = state;
  _onPlayerHit  = onPlayerHit;
  _onBossDead   = onBossDead;

  // Start boss centred horizontally
  bossX     = (CANVAS_WIDTH - BOSS_WIDTH) / 2;
  dirX      = 1;
  hp        = MAX_HP;
  fireTimer = 0;
  projectiles = [];
}

/**
 * Returns the boss's current axis-aligned bounding rect (world space).
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function getBossRect() {
  return { x: bossX, y: BOSS_Y, width: BOSS_WIDTH, height: BOSS_HEIGHT };
}

/**
 * Returns the current boss HP (0–10).
 * @returns {number}
 */
export function getBossHP() {
  return hp;
}

/**
 * Reduces boss HP by 1 in response to a player bullet collision.
 * Called by the collision logic in game.js (not by boss.js itself).
 */
export function hitBoss() {
  if (hp <= 0) return;
  hp -= 1;
  if (hp <= 0 && typeof _onBossDead === 'function') {
    _onBossDead();
  }
}

/**
 * Updates boss state for one frame.
 * @param {number} dt — delta-time in SECONDS
 */
export function update(dt) {
  if (hp <= 0) return;

  const dtMs = dt * 1000;

  // ── Movement ────────────────────────────────────────────────────────────
  bossX += dirX * BOSS_SPEED * dt;

  if (bossX + BOSS_WIDTH >= CANVAS_WIDTH) {
    bossX = CANVAS_WIDTH - BOSS_WIDTH;
    dirX  = -1;
  } else if (bossX <= 0) {
    bossX = 0;
    dirX  = 1;
  }

  // ── Fire rate (phase-dependent) ─────────────────────────────────────────
  const fireInterval = (hp <= PHASE2_HP_THRESHOLD) ? PHASE2_FIRE_MS : PHASE1_FIRE_MS;

  fireTimer += dtMs;
  if (fireTimer >= fireInterval) {
    fireTimer -= fireInterval;
    _spawnProjectile();
  }

  // ── Move existing projectiles ────────────────────────────────────────────
  for (const p of projectiles) {
    if (!p.active) continue;
    p.y += PROJ_SPEED * dt;
    if (p.y > CANVAS_HEIGHT) {
      p.active = false;
    }
  }

  // ── Player collision ────────────────────────────────────────────────────
  if (_sharedState && _sharedState.player) {
    const player = _sharedState.player;
    const px = player.x;
    const py = player.y;
    // Match player ship bounding box from player.js: 40 × 32 px
    const playerRect = { x: px, y: py, width: 40, height: 32 };

    for (const p of projectiles) {
      if (!p.active) continue;
      if (_aabb({ x: p.x, y: p.y, width: PROJ_WIDTH, height: PROJ_HEIGHT }, playerRect)) {
        p.active = false;
        if (typeof _onPlayerHit === 'function') {
          _onPlayerHit();
        }
        return; // one hit ends the run; stop processing
      }
    }
  }

  // Prune inactive projectiles to keep the array from growing forever
  projectiles = projectiles.filter(p => p.active);
}

/**
 * Draws the boss, its health bar, and all active projectiles.
 * @param {CanvasRenderingContext2D} ctx
 */
export function render(ctx) {
  _drawHealthBar(ctx);
  if (hp > 0) {
    _drawBoss(ctx);
    _drawProjectiles(ctx);
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function _spawnProjectile() {
  // Fire from the horizontal centre of the boss
  const projX = bossX + BOSS_WIDTH / 2 - PROJ_WIDTH / 2;
  const projY = BOSS_Y + BOSS_HEIGHT;
  projectiles.push({ x: projX, y: projY, active: true });
}

/**
 * AABB intersection test.
 * @param {{ x, y, width, height }} a
 * @param {{ x, y, width, height }} b
 * @returns {boolean}
 */
function _aabb(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Draws the boss entity using canvas primitives.
 * Phase 2 (hp ≤ 5) changes colour and adds a jagged inner ring.
 */
function _drawBoss(ctx) {
  const phase2 = (hp <= PHASE2_HP_THRESHOLD);

  const primaryColor   = phase2 ? '#ff2200' : '#cc00ff';
  const accentColor    = phase2 ? '#ff8800' : '#ff00ff';
  const eyeColor       = phase2 ? '#ffff00' : '#00ffff';

  const cx = bossX + BOSS_WIDTH / 2;   // horizontal centre
  const ty = BOSS_Y;                   // top of bounding box

  // ── Main body: wide rectangle ───────────────────────────────────────────
  ctx.fillStyle = primaryColor;
  ctx.fillRect(Math.round(bossX), Math.round(ty + 20), BOSS_WIDTH, 40);

  // ── Top dome: large semicircle ───────────────────────────────────────────
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.arc(Math.round(cx), Math.round(ty + 20), BOSS_WIDTH / 2, Math.PI, 0, false);
  ctx.fill();

  // ── Accent stripe across body ────────────────────────────────────────────
  ctx.fillStyle = accentColor;
  ctx.fillRect(Math.round(bossX + 10), Math.round(ty + 28), BOSS_WIDTH - 20, 8);

  // ── Eyes / cannons: two arcs ─────────────────────────────────────────────
  ctx.fillStyle = eyeColor;
  // Left eye
  ctx.beginPath();
  ctx.arc(Math.round(bossX + 30), Math.round(ty + 22), 8, 0, Math.PI * 2);
  ctx.fill();
  // Right eye
  ctx.beginPath();
  ctx.arc(Math.round(bossX + BOSS_WIDTH - 30), Math.round(ty + 22), 8, 0, Math.PI * 2);
  ctx.fill();

  // ── Phase 2 extra detail: jagged spikes on the dome ─────────────────────
  if (phase2) {
    ctx.fillStyle = '#ff6600';
    const spikeCount = 5;
    const spikeBase  = BOSS_WIDTH / spikeCount;
    for (let i = 0; i < spikeCount; i++) {
      const sx = bossX + i * spikeBase + spikeBase / 2;
      const sy = ty + 20;
      // Calculate dome surface y at this x via circle equation
      const dx   = sx - cx;
      const r    = BOSS_WIDTH / 2;
      const domeY = sy - Math.sqrt(Math.max(0, r * r - dx * dx));
      ctx.beginPath();
      ctx.moveTo(Math.round(sx), Math.round(domeY - 14)); // spike tip
      ctx.lineTo(Math.round(sx - 5), Math.round(domeY));  // left base
      ctx.lineTo(Math.round(sx + 5), Math.round(domeY));  // right base
      ctx.closePath();
      ctx.fill();
    }

    // Pulsing inner ring (static drawn darker circle to show damage)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.arc(Math.round(cx), Math.round(ty + 40), 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // ── Underside cannons ────────────────────────────────────────────────────
  ctx.fillStyle = accentColor;
  ctx.fillRect(Math.round(cx - PROJ_WIDTH / 2 - 1), Math.round(ty + 55), PROJ_WIDTH + 2, 8);
}

/**
 * Renders the health bar at the top-centre of the canvas.
 */
function _drawHealthBar(ctx) {
  // Background track
  ctx.fillStyle = '#333333';
  ctx.fillRect(BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT);

  // Filled portion — proportional to current HP
  const fillW = Math.round((Math.max(0, hp) / MAX_HP) * BAR_WIDTH);
  ctx.fillStyle = (hp <= PHASE2_HP_THRESHOLD) ? '#ff4400' : '#cc00ff';
  ctx.fillRect(BAR_X, BAR_Y, fillW, BAR_HEIGHT);

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth   = 1;
  ctx.strokeRect(BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT);

  // Label
  ctx.save();
  ctx.font         = '12px monospace';
  ctx.fillStyle    = '#ffffff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`BOSS  ${hp} / ${MAX_HP}`, CANVAS_WIDTH / 2, BAR_Y + BAR_HEIGHT / 2);
  ctx.restore();
}

/**
 * Draws all active boss projectiles.
 */
function _drawProjectiles(ctx) {
  ctx.fillStyle = '#ff4444';
  for (const p of projectiles) {
    if (!p.active) continue;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), PROJ_WIDTH, PROJ_HEIGHT);
  }
}
