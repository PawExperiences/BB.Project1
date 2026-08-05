/**
 * invaders.js — Invader formation state, movement logic, and rendering.
 * ES module.
 *
 * Exports:
 *   Constants  — INVADER_COLS, INVADER_ROWS, INVADER_WIDTH, INVADER_HEIGHT,
 *                INVADER_H_GAP, INVADER_V_GAP, INVADER_SPEED, INVADER_DROP,
 *                INVADER_COLOR, INVADER_CELL_HEIGHT
 *   State      — invaders[], formationOffsetX, formationOffsetY
 *   Functions  — initInvaders(), invaderRect(inv),
 *                getAliveCount(), getFormationBottom(),
 *                stepInvaders(stepPx), updateInvaders(dt), drawInvaders(ctx)
 *
 * Movement models:
 *   stepInvaders(stepPx)  — discrete-step model used by level1.js
 *   updateInvaders(dt)    — legacy continuous model (kept for compatibility)
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
export const INVADER_SPEED       = 60;   // px/s (legacy continuous model)
export const INVADER_DROP        = INVADER_HEIGHT + INVADER_V_GAP; // 24 px drop per edge-hit
export const INVADER_COLOR       = '#00FF00';

/**
 * INVADER_CELL_HEIGHT — the drop distance applied each time the formation
 * reverses at a canvas edge (= INVADER_DROP = 24 px).  Exported as a
 * descriptive alias for use by level modules.
 */
export const INVADER_CELL_HEIGHT = INVADER_DROP;

// Formation total width: 11×24 + 10×12 = 384 px
const FORMATION_WIDTH = INVADER_COLS * INVADER_WIDTH + (INVADER_COLS - 1) * INVADER_H_GAP;

// Centred on canvas
const FORMATION_ORIGIN_X = (CANVAS_WIDTH - FORMATION_WIDTH) / 2;
const FORMATION_ORIGIN_Y = 64; // px from canvas top

// ---------------------------------------------------------------------------
// Formation state
// ---------------------------------------------------------------------------

/**
 * Array of invader objects: { col, row, alive, baseX, baseY }.
 * Screen position = (baseX + formationOffsetX, baseY + formationOffsetY).
 */
export let invaders = [];

/** Horizontal offset of the entire formation (px). */
export let formationOffsetX = 0;

/** Vertical offset of the entire formation (px). */
export let formationOffsetY = 0;

/** Horizontal direction: +1 right, -1 left. */
let direction = 1;

// ---------------------------------------------------------------------------
// Initialise
// ---------------------------------------------------------------------------

/**
 * (Re)initialise the invader formation to a fresh 11×5 grid.
 * Resets offsets, direction, and the invader array.
 */
export function initInvaders() {
  invaders         = [];
  formationOffsetX = 0;
  formationOffsetY = 0;
  direction        = 1;

  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let col = 0; col < INVADER_COLS; col++) {
      const baseX = FORMATION_ORIGIN_X + col * (INVADER_WIDTH + INVADER_H_GAP);
      const baseY = FORMATION_ORIGIN_Y + row * (INVADER_HEIGHT + INVADER_V_GAP);
      invaders.push({ col, row, alive: true, baseX, baseY });
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the current screen-space rect for an invader.
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

/**
 * Returns the number of surviving invaders.
 * @returns {number}
 */
export function getAliveCount() {
  let n = 0;
  for (const inv of invaders) {
    if (inv.alive) n += 1;
  }
  return n;
}

/**
 * Returns the Y coordinate of the bottom edge of the lowest surviving invader.
 * Returns 0 if no invaders are alive.
 * @returns {number}
 */
export function getFormationBottom() {
  let maxBottom = 0;
  for (const inv of invaders) {
    if (!inv.alive) continue;
    const r = invaderRect(inv);
    const b = r.y + r.height;
    if (b > maxBottom) maxBottom = b;
  }
  return maxBottom;
}

// ---------------------------------------------------------------------------
// Discrete-step movement — used by level1.js
// ---------------------------------------------------------------------------

/**
 * Move the formation one discrete step of stepPx pixels in the current
 * direction, then handle edge-collision and drop.
 *
 * The drop on each edge-hit is exactly INVADER_DROP (= INVADER_CELL_HEIGHT
 * = 24 px) — one invader cell height.
 *
 * @param {number} stepPx  Pixels to advance per step (must be > 0).
 */
export function stepInvaders(stepPx) {
  formationOffsetX += stepPx * direction;

  // Bounding box of surviving invaders only
  let minX = Infinity;
  let maxX = -Infinity;

  for (const inv of invaders) {
    if (!inv.alive) continue;
    const r = invaderRect(inv);
    if (r.x < minX)           minX = r.x;
    if (r.x + r.width > maxX) maxX = r.x + r.width;
  }

  if (minX === Infinity) return; // no survivors

  if (direction === 1 && maxX >= CANVAS_WIDTH) {
    formationOffsetX -= (maxX - CANVAS_WIDTH); // clamp flush to right edge
    formationOffsetY += INVADER_DROP;           // drop one cell height
    direction = -1;
  } else if (direction === -1 && minX <= 0) {
    formationOffsetX -= minX;                   // minX ≤ 0 → shift right
    formationOffsetY += INVADER_DROP;           // drop one cell height
    direction = 1;
  }
}

// ---------------------------------------------------------------------------
// Legacy continuous movement — kept for API compatibility
// ---------------------------------------------------------------------------

/**
 * Update formation using continuous dt-based movement.
 * level1.js uses stepInvaders() instead; this is retained for compatibility.
 * @param {number} dt  Fixed timestep in seconds.
 */
export function updateInvaders(dt) {
  formationOffsetX += INVADER_SPEED * direction * dt;

  let minX = Infinity;
  let maxX = -Infinity;

  for (const inv of invaders) {
    if (!inv.alive) continue;
    const r = invaderRect(inv);
    if (r.x < minX) minX = r.x;
    if (r.x + r.width > maxX) maxX = r.x + r.width;
  }

  if (direction === 1 && maxX >= CANVAS_WIDTH) {
    formationOffsetX -= (maxX - CANVAS_WIDTH);
    formationOffsetY += INVADER_DROP;
    direction = -1;
  } else if (direction === -1 && minX <= 0) {
    formationOffsetX -= minX;
    formationOffsetY += INVADER_DROP;
    direction = 1;
  }
}

// ---------------------------------------------------------------------------
// Rendering
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
