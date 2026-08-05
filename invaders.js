// invaders.js — Invader formation, movement, and rendering

import { CANVAS_WIDTH } from './gameConfig.js';

// Invader dimensions — exported so collision.js and explosion.js can use them
export const INVADER_WIDTH  = 30;
export const INVADER_HEIGHT = 20;
export const H_GAP = 10;
export const V_GAP = 10;

const COLS = 11;
const ROWS = 5;

// Formation total width: 11*30 + 10*10 = 430
const FORMATION_WIDTH = COLS * INVADER_WIDTH + (COLS - 1) * H_GAP;  // 430

// Top-left origin so the grid is centred horizontally, near the top
const FORMATION_START_X = Math.round((CANVAS_WIDTH - FORMATION_WIDTH) / 2);  // 169
const FORMATION_START_Y = 80;

// Horizontal speed in pixels per frame (1 px/frame at 60 fps)
const INVADER_SPEED_PX_PER_FRAME = 1;

// Formation-level movement state
let invaders = [];
let directionX = 1;        // +1 = right, -1 = left
let formationOffsetX = 0;  // cumulative horizontal shift
let formationOffsetY = 0;  // cumulative vertical drop

/**
 * initInvaders()
 * Populates the invaders array and resets movement state.
 * Call once when entering the playing scene.
 */
export function initInvaders() {
  invaders = [];
  directionX = 1;
  formationOffsetX = 0;
  formationOffsetY = 0;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const baseX = FORMATION_START_X + col * (INVADER_WIDTH  + H_GAP);
      const baseY = FORMATION_START_Y + row * (INVADER_HEIGHT + V_GAP);
      invaders.push({
        col,
        row,
        alive: true,
        baseX,
        baseY,
        x: baseX,
        y: baseY,
        width:  INVADER_WIDTH,
        height: INVADER_HEIGHT,
      });
    }
  }
}

/**
 * getInvaders()
 * Returns the full invader array (both alive and dead entries).
 * Callers filter by .alive as needed.
 */
export function getInvaders() {
  return invaders;
}

/**
 * updateInvaders()
 * Moves the entire formation one step. Called once per game-loop update tick.
 */
export function updateInvaders() {
  const alive = invaders.filter(inv => inv.alive);
  if (alive.length === 0) return;

  // Current leading edges (before this frame's move)
  let minX = Infinity;
  let maxX = -Infinity;
  for (const inv of alive) {
    if (inv.x < minX) minX = inv.x;
    if (inv.x + INVADER_WIDTH > maxX) maxX = inv.x + INVADER_WIDTH;
  }

  // Predict next position
  const nextMinX = minX + directionX * INVADER_SPEED_PX_PER_FRAME;
  const nextMaxX = maxX + directionX * INVADER_SPEED_PX_PER_FRAME;

  if (nextMinX < 0 || nextMaxX > CANVAS_WIDTH) {
    // Hit a boundary — reverse and drop, do not apply horizontal move this frame
    directionX *= -1;
    formationOffsetY += 20;
  } else {
    formationOffsetX += directionX * INVADER_SPEED_PX_PER_FRAME;
  }

  // Apply accumulated offsets to every invader
  for (const inv of invaders) {
    inv.x = inv.baseX + formationOffsetX;
    inv.y = inv.baseY + formationOffsetY;
  }
}

/**
 * renderInvaders(ctx)
 * Draws all live invaders as lime-green filled rectangles.
 * @param {CanvasRenderingContext2D} ctx
 */
export function renderInvaders(ctx) {
  ctx.fillStyle = '#00FF00';
  for (const inv of invaders) {
    if (inv.alive) {
      ctx.fillRect(Math.round(inv.x), Math.round(inv.y), INVADER_WIDTH, INVADER_HEIGHT);
    }
  }
}
