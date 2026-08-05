/**
 * invaders.js — Invader formation state, movement logic, and rendering.
 * ES module; exports initInvaders(), updateInvaders(dt), drawInvaders(ctx),
 * and the INVADER_SPEED constant.
 *
 * Reads/writes gameState imported from state.js (provided by prior cards
 * via game.js; we import the shared object reference).
 */

import { CANVAS_WIDTH } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const INVADER_COLS        = 11;
export const INVADER_ROWS        = 5;
export const INVADER_WIDTH       = 24;   // px per invader cell
export const INVADER_HEIGHT      = 16;   // px per invader cell
export const INVADER_H_GAP       = 12;   // px horizontal gap between cells
export const INVADER_V_GAP       = 8;    // px vertical gap between cells
export const INVADER_SPEED       = 60;   // px/s horizontal movement speed (named constant)
export const INVADER_DROP        = INVADER_HEIGHT + INVADER_V_GAP; // 24 px per edge-hit
export const INVADER_COLOR       = '#00FF00';

// Formation total width: 11*24 + 10*12 = 264 + 120 = 384 px
const FORMATION_WIDTH = INVADER_COLS * INVADER_WIDTH + (INVADER_COLS - 1) * INVADER_H_GAP;

// Formation origin x so it is centred on the canvas
const FORMATION_ORIGIN_X = (CANVAS_WIDTH - FORMATION_WIDTH) / 2;
const FORMATION_ORIGIN_Y = 64; // top of invader grid (px from canvas top)

// ---------------------------------------------------------------------------
// Invader formation state
// ---------------------------------------------------------------------------

/**
 * Array of invader objects:
 *   { col, row, alive, baseX, baseY }
 * baseX/baseY are the positions relative to formation offset=0.
 * Actual position = baseX + formationOffsetX, baseY + formationOffsetY.
 */
export let invaders = [];

/** Horizontal offset of the entire formation (px, starts at 0). */
export let formationOffsetX = 0;

/** Vertical offset of the entire formation (px, starts at 0). */
export let formationOffsetY = 0;

/** Current horizontal movement direction: +1 (right) or -1 (left). */
let direction = 1;

// ---------------------------------------------------------------------------
// Initialise invader grid
// ---------------------------------------------------------------------------

/**
 * (Re)initialise the invader formation to a fresh 11×5 grid.
 * Call once at game start (or on restart).
 */
export function initInvaders() {
  invaders = [];
  formationOffsetX = 0;
  formationOffsetY = 0;
  direction = 1;

  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let col = 0; col < INVADER_COLS; col++) {
      const baseX = FORMATION_ORIGIN_X + col * (INVADER_WIDTH + INVADER_H_GAP);
      const baseY = FORMATION_ORIGIN_Y + row * (INVADER_HEIGHT + INVADER_V_GAP);
      invaders.push({
        col,
        row,
        alive: true,
        baseX,
        baseY,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the current screen rect of an invader.
 * @param {{ baseX: number, baseY: number }} inv
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function invaderRect(inv) {
  return {
    x:      inv.baseX + formationOffsetX,
    y:      inv.baseY + formationOffsetY,
    width:  INVADER_WIDTH,
    height: INVADER_HEIGHT,
  };
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Update formation position. Call each fixed-timestep frame.
 * @param {number} dt  Fixed timestep in seconds (1/60).
 */
export function updateInvaders(dt) {
  // Move formation horizontally
  formationOffsetX += INVADER_SPEED * direction * dt;

  // Find bounding box of surviving invaders only
  let minX = Infinity;
  let maxX = -Infinity;

  for (const inv of invaders) {
    if (!inv.alive) continue;
    const r = invaderRect(inv);
    if (r.x < minX) minX = r.x;
    if (r.x + r.width > maxX) maxX = r.x + r.width;
  }

  // Edge detection against canvas bounds
  if (direction === 1 && maxX >= CANVAS_WIDTH) {
    // Overshot the right edge — clamp so the rightmost invader is flush
    formationOffsetX -= (maxX - CANVAS_WIDTH);
    formationOffsetY += INVADER_DROP;
    direction = -1;
  } else if (direction === -1 && minX <= 0) {
    // Overshot the left edge — clamp so the leftmost invader is flush
    formationOffsetX -= minX; // minX is negative, so this moves right
    formationOffsetY += INVADER_DROP;
    direction = 1;
  }
}

// ---------------------------------------------------------------------------
// Draw
// ---------------------------------------------------------------------------

/**
 * Draw all surviving invaders.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawInvaders(ctx) {
  ctx.fillStyle = INVADER_COLOR;
  for (const inv of invaders) {
    if (!inv.alive) continue;
    const r = invaderRect(inv);
    ctx.fillRect(Math.round(r.x), Math.round(r.y), r.width, r.height);
  }
}
