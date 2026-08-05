// invaders.js — Invader formation: creation, step-and-drop movement, rendering, and explosions.

import { CANVAS_WIDTH } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Named constants — exported so level modules can compute layout geometry
// without redeclaring them.
// ---------------------------------------------------------------------------
export const POINTS_PER_KILL = 10;
export const INVADER_WIDTH   = 30;   // px
export const INVADER_HEIGHT  = 20;   // px
export const INVADER_GAP     = 10;   // px — same gap used horizontally and vertically

const H_GAP          = INVADER_GAP;
const V_GAP          = INVADER_GAP;
const COLS           = 11;
const ROWS           = 5;
const FORMATION_ORIGIN_X = 50;   // left-edge x where the formation starts
const FORMATION_ORIGIN_Y = 80;   // top-edge y where the formation starts (below HUD)
const STEP_X         = 8;    // px moved horizontally each tick (legacy tick-based path)
const DROP_Y         = INVADER_HEIGHT + INVADER_GAP;  // px dropped when reversing
const INVADER_COLOR  = '#00ccff';
const EXPLOSION_COLOR = '#ff6600';
const EXPLOSION_DURATION = 400; // ms

// ---------------------------------------------------------------------------
// Invader factory — returns a plain object
// ---------------------------------------------------------------------------
function makeInvader(col, row, x, y) {
  return { col, row, x, y, alive: true };
}

// ---------------------------------------------------------------------------
// Formation state
// ---------------------------------------------------------------------------
let invaders = [];          // all living invaders
let explosions = [];        // active explosion flashes: { x, y, expireAt }
let dirX = 1;               // +1 = moving right, -1 = moving left
let offsetX = 0;            // cumulative horizontal offset applied to the formation
let offsetY = 0;            // cumulative vertical offset applied to the formation

/**
 * (Re-)initialises the formation. Call once when entering the Playing scene.
 */
export function initInvaders() {
  invaders  = [];
  explosions = [];
  dirX      = 1;
  offsetX   = 0;
  offsetY   = 0;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const baseX = FORMATION_ORIGIN_X + col * (INVADER_WIDTH + H_GAP);
      const baseY = FORMATION_ORIGIN_Y + row * (INVADER_HEIGHT + V_GAP);
      invaders.push(makeInvader(col, row, baseX, baseY));
    }
  }
}

/**
 * Returns the current bounding box of all living invaders, or null if none.
 * @returns {{ left: number, right: number, top: number, bottom: number } | null}
 */
function getFormationBounds() {
  if (invaders.length === 0) return null;
  let left   = Infinity, right  = -Infinity;
  let top    = Infinity, bottom = -Infinity;
  for (const inv of invaders) {
    const x = inv.x + offsetX;
    const y = inv.y + offsetY;
    if (x             < left)   left   = x;
    if (x + INVADER_WIDTH  > right)  right  = x + INVADER_WIDTH;
    if (y             < top)    top    = y;
    if (y + INVADER_HEIGHT > bottom) bottom = y + INVADER_HEIGHT;
  }
  return { left, right, top, bottom };
}

/**
 * Advances invader formation state by one fixed-timestep tick.
 * Used by the legacy game loop path (game.js direct call).
 * Level modules that manage their own time-based stepping should call
 * stepFormation() / dropFormation() directly instead.
 */
export function updateInvaders() {
  if (invaders.length === 0) return;

  const bounds = getFormationBounds();
  if (!bounds) return;

  // Prospective new offset
  const nextOffsetX = offsetX + dirX * STEP_X;

  // Compute prospective bounds with next offset
  const nextLeft  = bounds.left  + dirX * STEP_X;
  const nextRight = bounds.right + dirX * STEP_X;

  if (nextRight > CANVAS_WIDTH || nextLeft < 0) {
    // Hit a wall — drop and reverse
    offsetY += DROP_Y;
    dirX    *= -1;
  } else {
    offsetX = nextOffsetX;
  }
}

/**
 * Moves the entire formation horizontally by the given number of pixels.
 * Positive dx = right, negative = left.
 * Called by level modules that manage their own step timing.
 * @param {number} dx
 */
export function stepFormation(dx) {
  offsetX += dx;
}

/**
 * Drops the entire formation down by one drop unit (INVADER_HEIGHT + INVADER_GAP).
 * Called by level modules on edge-bounce detection.
 */
export function dropFormation() {
  offsetY += DROP_Y;
}

/**
 * Returns a shallow copy of the living invaders array with current world positions.
 * Each element has { x, y, width, height } suitable for AABB tests.
 */
export function getLivingInvaders() {
  return invaders.map(inv => ({
    _ref: inv,
    x:   inv.x + offsetX,
    y:   inv.y + offsetY,
    width:  INVADER_WIDTH,
    height: INVADER_HEIGHT,
  }));
}

/**
 * Removes an invader from the active set and records an explosion.
 * @param {object} inv — the raw invader object (from _ref)
 * @param {number} worldX — current world x for the explosion rect
 * @param {number} worldY — current world y for the explosion rect
 */
export function killInvader(inv, worldX, worldY) {
  const idx = invaders.indexOf(inv);
  if (idx !== -1) {
    invaders.splice(idx, 1);
  }
  explosions.push({
    x:        worldX,
    y:        worldY,
    expireAt: performance.now() + EXPLOSION_DURATION,
  });
}

/**
 * Draws all living invaders and active explosion flashes.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawInvaders(ctx) {
  const now = performance.now();

  // Remove expired explosions
  explosions = explosions.filter(e => now < e.expireAt);

  // Draw living invaders
  ctx.fillStyle = INVADER_COLOR;
  for (const inv of invaders) {
    ctx.fillRect(
      Math.round(inv.x + offsetX),
      Math.round(inv.y + offsetY),
      INVADER_WIDTH,
      INVADER_HEIGHT
    );
  }

  // Draw explosion flashes
  ctx.fillStyle = EXPLOSION_COLOR;
  for (const exp of explosions) {
    ctx.fillRect(
      Math.round(exp.x),
      Math.round(exp.y),
      INVADER_WIDTH,
      INVADER_HEIGHT
    );
  }
}
