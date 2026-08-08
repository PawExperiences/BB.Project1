// invaders.js — Invader formation, movement, draw, and explosion effects
// Owned by card: "Sprite rendering and collision detection"

import { CANVAS_WIDTH } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Named constants
// ---------------------------------------------------------------------------
export const INVADER_COLS          = 11;
export const INVADER_ROWS          = 5;
export const INVADER_WIDTH         = 32;   // px — bounding box width
export const INVADER_HEIGHT        = 24;   // px — bounding box height
export const INVADER_H_SPACING     = 48;   // px — horizontal spacing (centre-to-centre)
export const INVADER_V_SPACING     = 40;   // px — vertical spacing (centre-to-centre)
export const INVADER_TOP_PADDING   = 60;   // px — y offset from top of play area (below HUD)
export const INVADER_SPEED         = 30;   // px per second — horizontal movement speed
export const INVADER_DROP          = 20;   // px — vertical drop per edge hit
export const EXPLOSION_FRAMES      = 20;   // ticks an explosion remains visible
export const INVADER_FILL_COLOR    = '#44dd44';
export const EXPLOSION_COLOR_1     = '#ffaa00';
export const EXPLOSION_COLOR_2     = '#ff4400';

// ---------------------------------------------------------------------------
// Formation state
// ---------------------------------------------------------------------------

/**
 * Flat array of invader objects.
 * Each: { x, y, alive: boolean }
 * x/y are the TOP-LEFT corner of the invader rectangle.
 */
export let invaders = [];

/**
 * Active explosions: { x, y, framesLeft }
 * State is internal to this module; drawn by drawExplosions.
 */
let explosions = [];

/** Current horizontal direction: +1 = right, -1 = left */
let dirX = 1;

/**
 * initInvaders()
 * Populate the invaders array with a fresh 11 × 5 formation.
 * Call once when the playing scene starts.
 */
export function initInvaders() {
  invaders = [];
  explosions = [];
  dirX = 1;

  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let col = 0; col < INVADER_COLS; col++) {
      invaders.push({
        x: col * INVADER_H_SPACING + 40,
        y: row * INVADER_V_SPACING + INVADER_TOP_PADDING,
        alive: true,
      });
    }
  }
}

/**
 * updateInvaders(dt)
 * Advance formation logic by dt seconds.
 * Detects edge collisions, drops and reverses.
 * Updates explosion timers.
 * @param {number} dt — delta time in seconds
 */
export function updateInvaders(dt) {
  // --- Move formation ---
  const step = INVADER_SPEED * dirX * dt;

  // Tentatively move
  for (const inv of invaders) {
    if (inv.alive) inv.x += step;
  }

  // Check if any live invader has hit a wall
  let hitLeft  = false;
  let hitRight = false;
  for (const inv of invaders) {
    if (!inv.alive) continue;
    if (inv.x < 0)                                 hitLeft  = true;
    if (inv.x + INVADER_WIDTH > CANVAS_WIDTH)      hitRight = true;
  }

  if ((dirX < 0 && hitLeft) || (dirX > 0 && hitRight)) {
    // Reverse direction and drop the whole formation
    dirX *= -1;
    for (const inv of invaders) {
      // Move back to undo overshoot, then drop
      inv.x -= step;          // undo this tick's move
      inv.y += INVADER_DROP;
    }
  }

  // --- Tick explosions ---
  for (const exp of explosions) {
    exp.framesLeft -= 1;
  }
  // Remove expired explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    if (explosions[i].framesLeft <= 0) {
      explosions.splice(i, 1);
    }
  }
}

/**
 * registerExplosion(x, y)
 * Create a short-lived explosion at the given top-left position.
 * Called by collision.js via the onKill callback.
 * @param {number} x
 * @param {number} y
 */
export function registerExplosion(x, y) {
  explosions.push({ x, y, framesLeft: EXPLOSION_FRAMES });
}

/**
 * drawInvaders(ctx)
 * Pure render pass — draws all alive invaders and active explosions.
 * No state mutation.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawInvaders(ctx) {
  ctx.save();

  // Draw alive invaders
  ctx.fillStyle = INVADER_FILL_COLOR;
  for (const inv of invaders) {
    if (!inv.alive) continue;
    ctx.fillRect(inv.x, inv.y, INVADER_WIDTH, INVADER_HEIGHT);
  }

  // Draw explosions — two overlapping fillRects forming a cross/spark
  for (const exp of explosions) {
    const cx = exp.x + INVADER_WIDTH  / 2;
    const cy = exp.y + INVADER_HEIGHT / 2;

    // Horizontal bar
    ctx.fillStyle = EXPLOSION_COLOR_1;
    ctx.fillRect(cx - 12, cy - 4, 24, 8);

    // Vertical bar
    ctx.fillStyle = EXPLOSION_COLOR_2;
    ctx.fillRect(cx - 4, cy - 12, 8, 24);
  }

  ctx.restore();
}
