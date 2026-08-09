// invaders.js — Invader grid logic: data, movement, explosion effects, score, drawing
import { CANVAS_WIDTH } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Grid configuration
// ---------------------------------------------------------------------------
const COLS            = 11;
const ROWS            = 5;
const INVADER_WIDTH   = 36;
const INVADER_HEIGHT  = 24;
const H_GAP           = 16;   // horizontal gap between invaders
const V_GAP           = 16;   // vertical gap between invaders
const START_X         = 64;   // left edge of the grid
const START_Y         = 80;   // top edge of the grid (below HUD)

// Movement
const STEP_X          = 4;    // pixels moved per frame laterally
const DROP_Y          = INVADER_HEIGHT + V_GAP; // pixels dropped when hitting edge

// Score
export let score = 0;

// ---------------------------------------------------------------------------
// Build the invader array (55 objects)
// ---------------------------------------------------------------------------
export let invaders = [];

(function buildGrid() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      invaders.push({
        x:      START_X + col * (INVADER_WIDTH + H_GAP),
        y:      START_Y + row * (INVADER_HEIGHT + V_GAP),
        width:  INVADER_WIDTH,
        height: INVADER_HEIGHT,
        alive:  true,
      });
    }
  }
})();

// ---------------------------------------------------------------------------
// Formation movement state
// ---------------------------------------------------------------------------
let directionX = 1; // +1 = right, -1 = left

// ---------------------------------------------------------------------------
// Explosion effects list
// Each entry: { x, y, width, height, ttl }  ttl counts down from ~20
// ---------------------------------------------------------------------------
const EXPLOSION_TTL    = 20; // frames
const explosions       = [];

/**
 * Record an explosion effect at an invader's position.
 * Called by collision.js when an invader is killed.
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 */
export function addExplosion(x, y, width, height) {
  explosions.push({ x, y, width, height, ttl: EXPLOSION_TTL });
}

/**
 * Increment the exported score by a fixed amount.
 * Called by collision.js on each kill.
 */
export function addScore(amount) {
  score += amount;
}

// ---------------------------------------------------------------------------
// updateInvaders — called every fixed-step frame with delta time (seconds)
// ---------------------------------------------------------------------------
export function updateInvaders(dt) {
  // --- Tick explosions ---
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].ttl -= 1;
    if (explosions[i].ttl <= 0) {
      explosions.splice(i, 1);
    }
  }

  // --- Check if any alive invader would breach the canvas edge this step ---
  let minX = Infinity;
  let maxX = -Infinity;

  for (const inv of invaders) {
    if (!inv.alive) continue;
    if (inv.x < minX) minX = inv.x;
    if (inv.x + inv.width > maxX) maxX = inv.x + inv.width;
  }

  // If all invaders are dead, nothing to do
  if (minX === Infinity) return;

  // Would the next step cause any invader to go out of bounds?
  const nextMinX = minX + directionX * STEP_X;
  const nextMaxX = maxX + directionX * STEP_X;

  if (nextMinX < 0 || nextMaxX > CANVAS_WIDTH) {
    // Reverse direction and drop
    directionX *= -1;
    for (const inv of invaders) {
      if (!inv.alive) continue;
      inv.y += DROP_Y;
    }
  } else {
    // Move laterally
    for (const inv of invaders) {
      if (!inv.alive) continue;
      inv.x += directionX * STEP_X;
    }
  }
}

// ---------------------------------------------------------------------------
// drawInvaders — render alive invaders and active explosions
// ---------------------------------------------------------------------------
export function drawInvaders(ctx) {
  // Draw alive invaders
  ctx.fillStyle = '#33ff33';
  for (const inv of invaders) {
    if (!inv.alive) continue;
    ctx.fillRect(inv.x, inv.y, inv.width, inv.height);
  }

  // Draw explosion flashes
  ctx.fillStyle = '#ffaa00';
  for (const exp of explosions) {
    ctx.fillRect(exp.x, exp.y, exp.width, exp.height);
  }
}
