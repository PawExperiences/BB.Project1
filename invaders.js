// invaders.js — Invader formation, movement, drawing, explosion effects, score
// Card: "Sprite rendering and collision detection"

import { CANVAS_WIDTH } from './gameConfig.js';

// ─── Formation constants ──────────────────────────────────────────────────────
export const COLS          = 11;
export const ROWS          = 5;
export const INV_W         = 32;   // px per cell width
export const INV_H         = 24;   // px per cell height
export const H_GAP         = 8;    // px horizontal gap between cells
export const V_GAP         = 8;    // px vertical gap between cells
export const CELL_W        = INV_W + H_GAP;   // 40 px stride
export const CELL_H        = INV_H + V_GAP;   // 32 px stride  (also the drop amount)
const FORMATION_W   = COLS * CELL_W - H_GAP;  // total px width of the grid
export const START_X       = Math.floor((CANVAS_WIDTH - FORMATION_W) / 2);
export const START_Y       = 80;
const EXPLOSION_FRAMES = 8;   // frames the flash persists

// ─── Score export ────────────────────────────────────────────────────────────
export let score = 0;

/** Called by collision.js to increment score and keep this module as owner. */
export function addScore(n) {
  score += n;
}

// ─── Invader array ───────────────────────────────────────────────────────────
/**
 * Each entry: { x, y, width, height, alive, explosion, row, col }
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
        row:       row,
        col:       col,
      });
    }
  }
}

buildFormation();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Tick explosion frame counters (called each game-loop tick).
 * Movement is now owned by level1.js via stepFormation().
 * @param {number} dt  seconds (unused here, kept for signature compat)
 */
export function updateFormation(dt) {
  // Tick explosion frame counters
  for (const inv of invaders) {
    if (inv.explosion !== null) {
      inv.explosion.framesLeft -= 1;
      if (inv.explosion.framesLeft <= 0) {
        inv.explosion = null;
      }
    }
  }
}

/**
 * Move the entire formation one discrete horizontal step.
 * Called by level1.js when the step timer fires.
 * @param {number} stepPx  pixels to move (positive = right, negative = left)
 */
export function stepFormation(stepPx) {
  for (const inv of invaders) {
    inv.x += stepPx;
  }
}

/**
 * Drop the entire formation by one sprite height and reverse direction signal.
 * Called by level1.js on edge detection.
 */
export function dropFormation() {
  for (const inv of invaders) {
    inv.y += CELL_H;
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
      const colours = ['#ff4444', '#ff8844', '#ffdd00', '#44ff44', '#44ccff'];
      ctx.fillStyle = colours[inv.row % colours.length];
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
  buildFormation();
}
