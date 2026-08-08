// boss.js — Level 4: Multi-Phase Boss Finale
// ES module; all boss state, rendering, movement, and firing logic lives here.
// Depends on gameConfig.js for canvas dimensions.
// Uses AABB collision matching collision.js's internal aabb() contract.
// NOTE: collision.js does not export checkCollision() or aabb(); it only
// exports runCollisions(). A local checkCollision() is provided here that
// implements the identical AABB formula — this is NOT a duplicate of any
// exported interface; it fulfils the groomed spec's interface contract.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BOSS_WIDTH        = 160;   // px
const BOSS_HEIGHT       = 80;    // px
const BOSS_Y            = 80;    // fixed Y (top edge), never changes
const BOSS_SPEED        = 90;    // px/s horizontal drift
const BOSS_MAX_HP       = 10;
const PHASE2_HP         = 5;     // HP at which Phase 2 begins
const FIRE_INTERVAL_P1  = 1500;  // ms between shots in Phase 1
const FIRE_INTERVAL_P2  = 700;   // ms between shots in Phase 2
const BULLET_SPEED      = 260;   // px/s for boss projectiles
const SPREAD_ANGLE_DEG  = 20;    // degrees for side bullets
const SPREAD_ANGLE_RAD  = SPREAD_ANGLE_DEG * Math.PI / 180;

// Bullet dimensions (for collision rects)
const BOSS_BULLET_W     = 5;
const BOSS_BULLET_H     = 12;

// Health bar dimensions
const HBAR_X            = 10;
const HBAR_Y            = 8;
const HBAR_W            = CANVAS_WIDTH - 20;
const HBAR_H            = 18;

// ---------------------------------------------------------------------------
// AABB collision — mirrors collision.js internal aabb() exactly.
// collision.js does not export this function, so we provide it here.
// Rects: { x, y, width, height } top-left origin.
// ---------------------------------------------------------------------------
export function checkCollision(rectA, rectB) {
  return (
    rectA.x < rectB.x + rectB.width  &&
    rectA.x + rectA.width  > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}

// ---------------------------------------------------------------------------
// Module-level state (reset by init())
// ---------------------------------------------------------------------------
let _canvas        = null;
let _ctx           = null;

let _bossX         = 0;     // left edge of boss
let _bossDir       = 1;     // +1 right, -1 left
let _hp            = BOSS_MAX_HP;
let _fireTimer     = 0;     // accumulated ms since last shot
let _bossBullets   = [];    // array of { x, y, vx, vy, width, height }
let _alive         = false; // true while boss is active

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * init — (re)initialises boss state for a new Level 4 run.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 */
export function init(canvas, ctx) {
  _canvas      = canvas;
  _ctx         = ctx;
  _bossX       = (canvas.width - BOSS_WIDTH) / 2;  // start centred
  _bossDir     = 1;
  _hp          = BOSS_MAX_HP;
  _fireTimer   = 0;
  _bossBullets = [];
  _alive       = true;
}

/**
 * update — advances boss logic one frame.
 *
 * @param {number} dt              seconds elapsed since last frame
 * @param {Array}  playerBullets   player bullet objects { x, y, width, height, ... }
 *                                 (top-left origin); hits are spliced out
 * @param {{ x:number, y:number, width:number, height:number }} playerRect
 *                                 top-left-origin rect of the player ship
 * @returns {null | 'PLAYER_HIT' | 'BOSS_DEAD'}
 */
export function update(dt, playerBullets, playerRect) {
  if (!_alive) return null;

  const canvasW = _canvas ? _canvas.width : CANVAS_WIDTH;

  // -----------------------------------------------------------------------
  // 1. Horizontal drift
  // -----------------------------------------------------------------------
  _bossX += BOSS_SPEED * _bossDir * dt;

  // Reverse at canvas edges (bounding-box contact)
  if (_bossX < 0) {
    _bossX  = 0;
    _bossDir = 1;
  } else if (_bossX + BOSS_WIDTH > canvasW) {
    _bossX  = canvasW - BOSS_WIDTH;
    _bossDir = -1;
  }

  // -----------------------------------------------------------------------
  // 2. Boss shooting
  // -----------------------------------------------------------------------
  _fireTimer += dt * 1000; // convert to ms
  const fireInterval = _hp >= PHASE2_HP ? FIRE_INTERVAL_P1 : FIRE_INTERVAL_P2;

  if (_fireTimer >= fireInterval) {
    _fireTimer = 0; // reset (not -= to avoid drift accumulation)
    _spawnBullets();
  }

  // -----------------------------------------------------------------------
  // 3. Move existing boss bullets
  // -----------------------------------------------------------------------
  for (let i = _bossBullets.length - 1; i >= 0; i--) {
    const b = _bossBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Remove if off-screen
    const h = _canvas ? _canvas.height : CANVAS_HEIGHT;
    if (b.y > h || b.y + b.height < 0 || b.x > canvasW || b.x + b.width < 0) {
      _bossBullets.splice(i, 1);
    }
  }

  // -----------------------------------------------------------------------
  // 4. Player bullets vs boss
  // -----------------------------------------------------------------------
  const bossRect = { x: _bossX, y: BOSS_Y, width: BOSS_WIDTH, height: BOSS_HEIGHT };

  for (let i = playerBullets.length - 1; i >= 0; i--) {
    const pb = playerBullets[i];
    if (checkCollision(pb, bossRect)) {
      playerBullets.splice(i, 1);
      _hp -= 1;
      if (_hp <= 0) {
        _hp    = 0;
        _alive = false;
        return 'BOSS_DEAD';
      }
    }
  }

  // -----------------------------------------------------------------------
  // 5. Boss bullets vs player
  // -----------------------------------------------------------------------
  for (let i = _bossBullets.length - 1; i >= 0; i--) {
    const bb = _bossBullets[i];
    if (checkCollision(bb, playerRect)) {
      _bossBullets.splice(i, 1);
      return 'PLAYER_HIT';
    }
  }

  return null;
}

/**
 * draw — renders the boss, its health bar, and all boss bullets.
 * Must be called from the game loop's render phase.
 */
export function draw() {
  if (!_ctx) return;
  const ctx = _ctx;

  // -----------------------------------------------------------------------
  // Health bar (always visible during fight)
  // -----------------------------------------------------------------------
  _drawHealthBar(ctx);

  // -----------------------------------------------------------------------
  // Boss bullets
  // -----------------------------------------------------------------------
  ctx.fillStyle = '#ff4400';
  for (const b of _bossBullets) {
    ctx.fillRect(Math.round(b.x), Math.round(b.y), b.width, b.height);
  }

  if (!_alive) return;

  // -----------------------------------------------------------------------
  // Boss body — 160 × 80 px, Canvas 2D primitives only
  // -----------------------------------------------------------------------
  const bx = Math.round(_bossX);
  const by = BOSS_Y;
  const cx = bx + BOSS_WIDTH  / 2;
  const cy = by + BOSS_HEIGHT / 2;

  // Outer hull — dark red base
  ctx.fillStyle = '#660000';
  ctx.fillRect(bx, by + 20, BOSS_WIDTH, BOSS_HEIGHT - 20);

  // Upper dome body
  ctx.fillStyle = '#aa0000';
  ctx.fillRect(bx + 20, by + 10, BOSS_WIDTH - 40, 30);

  // Top cap
  ctx.fillStyle = '#cc2222';
  ctx.fillRect(bx + 50, by, 60, 20);

  // Engine pods — left
  ctx.fillStyle = '#440000';
  ctx.fillRect(bx, by + 50, 30, 24);

  // Engine pods — right
  ctx.fillRect(bx + BOSS_WIDTH - 30, by + 50, 30, 24);

  // Cockpit dome — glowing arc
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.arc(cx, by + 28, 20, Math.PI, 0, false);
  ctx.closePath();
  ctx.fill();

  // Cockpit inner
  ctx.fillStyle = '#ffaa00';
  ctx.beginPath();
  ctx.arc(cx, by + 28, 12, Math.PI, 0, false);
  ctx.closePath();
  ctx.fill();

  // Eye / sensor
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(cx, by + 28, 6, 0, Math.PI * 2);
  ctx.fill();

  // Cannon tip centre
  ctx.fillStyle = '#888888';
  ctx.fillRect(cx - 5, by + BOSS_HEIGHT - 10, 10, 10);

  // Side cannons
  ctx.fillRect(bx + 30, by + BOSS_HEIGHT - 8, 8, 8);
  ctx.fillRect(bx + BOSS_WIDTH - 38, by + BOSS_HEIGHT - 8, 8, 8);

  // Phase 2 indicator — red glow strips when HP <= 5
  if (_hp <= PHASE2_HP) {
    ctx.fillStyle = 'rgba(255,0,0,0.35)';
    ctx.fillRect(bx, by, BOSS_WIDTH, BOSS_HEIGHT);
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function _drawHealthBar(ctx) {
  const fraction  = Math.max(0, _hp) / BOSS_MAX_HP;
  const fillW     = Math.round(HBAR_W * fraction);

  // Background track
  ctx.fillStyle = '#333';
  ctx.fillRect(HBAR_X, HBAR_Y, HBAR_W, HBAR_H);

  // HP fill — green→red based on phase
  ctx.fillStyle = _hp > PHASE2_HP ? '#00cc00' : '#cc0000';
  if (fillW > 0) {
    ctx.fillRect(HBAR_X, HBAR_Y, fillW, HBAR_H);
  }

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth   = 1;
  ctx.strokeRect(HBAR_X, HBAR_Y, HBAR_W, HBAR_H);

  // HP label
  ctx.save();
  ctx.fillStyle    = '#ffffff';
  ctx.font         = '12px monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`BOSS HP: ${_hp} / ${BOSS_MAX_HP}`, CANVAS_WIDTH / 2, HBAR_Y + HBAR_H / 2);
  ctx.restore();
}

/**
 * _spawnBullets — fires the 3-bullet spread from the boss centre.
 * Angles: 0° (straight down), ±20° from vertical.
 */
function _spawnBullets() {
  const originX = _bossX + BOSS_WIDTH  / 2;
  const originY = BOSS_Y + BOSS_HEIGHT;  // bottom-centre of boss

  const angles = [
    -SPREAD_ANGLE_RAD,   // 20° left of downward
    0,                   // straight down
    +SPREAD_ANGLE_RAD,   // 20° right of downward
  ];

  for (const angle of angles) {
    // angle is from vertical (downward = 0)
    const vx = BULLET_SPEED * Math.sin(angle);
    const vy = BULLET_SPEED * Math.cos(angle);
    _bossBullets.push({
      x:      originX - BOSS_BULLET_W / 2,
      y:      originY,
      vx,
      vy,
      width:  BOSS_BULLET_W,
      height: BOSS_BULLET_H,
    });
  }
}

/** Returns whether the boss is currently alive (HP > 0). */
export function isAlive() { return _alive; }

/** Returns current HP (for external HUD or testing). */
export function getHP() { return _hp; }
