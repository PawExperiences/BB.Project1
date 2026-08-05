// invaders.js — 11×5 invader grid: state, movement, and AABB export.
//
// Formation layout:
//   COLS = 11, ROWS = 5
//   Each invader: 24 px wide × 16 px tall
//   Horizontal gap: 12 px, Vertical gap: 8 px
//   Total width:  11×24 + 10×12 = 384 px
//   Total height:  5×16 +  4×8  = 112 px
//   Starting top-left: x = 208, y = 60  (centres 384 px inside 768 px canvas)

import { CANVAS_WIDTH } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Invader dimensions & grid constants
// ---------------------------------------------------------------------------
export const INVADER_WIDTH  = 24;   // px
export const INVADER_HEIGHT = 16;   // px
const INVADER_GAP_X  = 12;          // horizontal gap between invaders
const INVADER_GAP_Y  = 8;           // vertical gap between rows
const COLS           = 11;
const ROWS           = 5;

// Movement speed — change this single constant to tune the whole formation.
export const INVADER_SPEED_X = 1;   // px per tick (at 60 fps)

// How far the formation drops when it hits a canvas edge.
const DROP_AMOUNT = INVADER_HEIGHT + INVADER_GAP_Y; // 24 px

// Formation starting top-left corner.
const FORMATION_START_X = 208;
const FORMATION_START_Y = 60;

// ---------------------------------------------------------------------------
// Build the initial invader array.
// Each invader: { x, y, alive: true }
// x, y are the top-left corner of the invader rectangle.
// ---------------------------------------------------------------------------
export const invaders = [];

for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    invaders.push({
      x:     FORMATION_START_X + col * (INVADER_WIDTH  + INVADER_GAP_X),
      y:     FORMATION_START_Y + row * (INVADER_HEIGHT + INVADER_GAP_Y),
      alive: true,
    });
  }
}

// ---------------------------------------------------------------------------
// Movement state
// ---------------------------------------------------------------------------
let directionX = 1;   // +1 = right, -1 = left

/**
 * updateInvaders — advance formation by one tick.
 * Called once per fixed-timestep tick from game.js.
 */
export function updateInvaders() {
  const living = invaders.filter(inv => inv.alive);
  if (living.length === 0) return;

  // Determine the leading and trailing horizontal edges of the formation.
  const rightEdge = Math.max(...living.map(inv => inv.x + INVADER_WIDTH));
  const leftEdge  = Math.min(...living.map(inv => inv.x));

  // Check if the formation has hit a canvas boundary.
  const hitRight = directionX > 0 && rightEdge >= CANVAS_WIDTH;
  const hitLeft  = directionX < 0 && leftEdge  <= 0;

  if (hitRight || hitLeft) {
    // Drop the entire formation and reverse direction.
    for (const inv of invaders) {
      inv.y += DROP_AMOUNT;
    }
    directionX = -directionX;
  } else {
    // Move horizontally.
    const step = INVADER_SPEED_X * directionX;
    for (const inv of invaders) {
      inv.x += step;
    }
  }
}

/**
 * drawInvaders — render all live invaders as solid green rectangles.
 *
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawInvaders(ctx) {
  ctx.save();
  ctx.fillStyle = '#00FF00';
  for (const inv of invaders) {
    if (!inv.alive) continue;
    ctx.fillRect(inv.x, inv.y, INVADER_WIDTH, INVADER_HEIGHT);
  }
  ctx.restore();
}
