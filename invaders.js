// invaders.js — Invader formation, movement, drawing, explosion effects, score
// Card: "Sprite rendering and collision detection"

import { CANVAS_WIDTH } from './gameConfig.js';

// ─── Formation constants ──────────────────────────────────────────────────────
const COLS          = 11;
const ROWS          = 5;
const INV_W         = 32;   // px per cell width
const INV_H         = 24;   // px per cell height
const H_GAP         = 8;    // px horizontal gap between cells
const V_GAP         = 8;    // px vertical gap between cells
const CELL_W        = INV_W + H_GAP;   // 40 px stride
const CELL_H        = INV_H + V_GAP;   // 32 px stride
const FORMATION_W   = COLS * CELL_W - H_GAP;  // total px width of the grid
const START_X       = Math.floor((CANVAS_WIDTH - FORMATION_W) / 2);
const START_Y       = 80;
const MOVE_SPEED    = 60;   // px per second (horizontal)
const DROP_AMOUNT   = CELL_H;  // px to drop on direction reversal (32 px)
const EXPLOSION_FRAMES = 8;   // frames the flash persists

// ─── Score export ────────────────────────────────────────────────────────────
export let score = 0;

/** Called by collision.js to increment score and keep this module as owner. */
export function addScore(n) {
  score += n;
}

// ─── Invader array ───────────────────────────────────────────────────────────
/**
 * Each entry: { x, y, width, height, alive, explosion }
 *   explosion: null | { framesLeft: number }
 */
export const invaders = [];

// Build the initial 11×5 grid
function buildFormation() {
  invaders.length = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      invaders.push({
        x:         START_X + col * CELL_W,
        y:         START_Y + row * CELL_H,
        width:     INV_W,
        height:    INV_H,
        alive:     true,
        explosion: null,
      });
    }
  }
}

buildFormation();

// ─── Formation movement state ─────────────────────────────────────────────────
let dx = MOVE_SPEED;   // positive = rightward

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Update formation position for this fixed-timestep tick.
 * @param {number} dt  seconds
 */
export function updateFormation(dt) {
  // Tick explosion frame counters first
  for (const inv of invaders) {
    if (inv.explosion !== null) {
      inv.explosion.framesLeft -= 1;
      if (inv.explosion.framesLeft <= 0) {
        inv.explosion = null;
      }
    }
  }

  // Only alive invaders contribute to boundary checks
  const alive = invaders.filter(i => i.alive);
  if (alive.length === 0) return;

  // Candidate positions after moving
  const proposedDx = dx * dt;

  // Check if any invader would breach a boundary
  let hitRight = false;
  let hitLeft  = false;
  for (const inv of alive) {
    const nx = inv.x + proposedDx;
    if (nx + inv.width > CANVAS_WIDTH) hitRight = true;
    if (nx < 0)                        hitLeft  = true;
  }

  if (hitRight || hitLeft) {
    // Drop the entire formation (all invaders, alive or dead) one row
    for (const inv of invaders) {
      inv.y += DROP_AMOUNT;
    }
    // Reverse direction
    dx = -dx;
  } else {
    // Normal horizontal step
    for (const inv of invaders) {
      inv.x += proposedDx;
    }
  }
}

/**
 * Draw the living invaders and any active explosion effects.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawFormation(ctx) {
  ctx.save();

  for (const inv of invaders) {
    if (inv.alive) {
      // Row tint: top rows are lighter (classic arcade look)
      const row = invaders.indexOf(inv) / COLS | 0;  // integer division
      const colours = ['#ff4444', '#ff8844', '#ffdd00', '#44ff44', '#44ccff'];
      ctx.fillStyle = colours[row % colours.length];
      ctx.fillRect(inv.x, inv.y, inv.width, inv.height);

      // Simple eye-like detail — two small dark squares
      ctx.fillStyle = '#000';
      ctx.fillRect(inv.x + 6,  inv.y + 6, 6, 6);
      ctx.fillRect(inv.x + 20, inv.y + 6, 6, 6);
    } else if (inv.explosion !== null) {
      // Brief flash/burst at the dead cell position
      const t = inv.explosion.framesLeft / EXPLOSION_FRAMES;  // 1→0
      const alpha = t;
      // Expanding bright yellow-orange burst
      const spread = (1 - t) * 16;
      ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
      ctx.fillRect(
        inv.x - spread,
        inv.y - spread,
        inv.width  + spread * 2,
        inv.height + spread * 2
      );
      // Inner white core
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.fillRect(
        inv.x + 4,
        inv.y + 4,
        inv.width  - 8,
        inv.height - 8
      );
    }
  }

  ctx.restore();
}

/**
 * Trigger an explosion effect on a (just-killed) invader.
 * Called by collision.js after marking alive = false.
 * @param {object} inv  reference to the invader entry
 */
export function triggerExplosion(inv) {
  inv.explosion = { framesLeft: EXPLOSION_FRAMES };
}

/**
 * Reset the formation to the initial state (called when starting a new game).
 */
export function resetFormation() {
  score = 0;
  dx = MOVE_SPEED;
  buildFormation();
}
