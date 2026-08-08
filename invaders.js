// invaders.js — Invader entity, formation creation, movement, and drawing
// ES module; depends on gameConfig.js only.

import { CANVAS_WIDTH } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const INVADER_WIDTH  = 32;  // px
export const INVADER_HEIGHT = 24;  // px

const COLS           = 11;
const ROWS           = 5;
const H_GAP          = 16;  // horizontal gap between invaders
const V_GAP          = 16;  // vertical gap between invaders
const FORMATION_SPEED = 60; // px/s horizontal
const DROP_STEP      = 16;  // px dropped when reversing
const INVADER_COLOUR = '#00ff00';

// Starting top-left origin of the formation
const FORMATION_START_X = 64;
const FORMATION_START_Y = 80;

// ---------------------------------------------------------------------------
// Invader class
// ---------------------------------------------------------------------------
export class Invader {
  /**
   * @param {number} x  – left edge
   * @param {number} y  – top edge
   */
  constructor(x, y) {
    this.x      = x;
    this.y      = y;
    this.width  = INVADER_WIDTH;
    this.height = INVADER_HEIGHT;
    this.alive  = true;
  }
}

// ---------------------------------------------------------------------------
// createFormation — returns a flat array of 55 Invader instances
// ---------------------------------------------------------------------------
export function createFormation() {
  const invaders = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = FORMATION_START_X + col * (INVADER_WIDTH  + H_GAP);
      const y = FORMATION_START_Y + row * (INVADER_HEIGHT + V_GAP);
      invaders.push(new Invader(x, y));
    }
  }
  return invaders; // length === 55
}

// ---------------------------------------------------------------------------
// Formation movement state (module-level so it persists across frames)
// ---------------------------------------------------------------------------
let direction = 1; // +1 = right, -1 = left

/**
 * updateFormation — moves the entire formation each frame.
 *
 * @param {Invader[]} invaders  – flat array from createFormation()
 * @param {HTMLCanvasElement} canvas
 * @param {number} dt           – delta time in seconds
 */
export function updateFormation(invaders, canvas, dt) {
  const canvasW = canvas ? canvas.width : CANVAS_WIDTH;
  const dx = FORMATION_SPEED * direction * dt;

  // Tentatively move all invaders
  for (const inv of invaders) {
    inv.x += dx;
  }

  // Check whether any live invader has breached a boundary
  let hitWall = false;
  for (const inv of invaders) {
    if (!inv.alive) continue;
    if (inv.x < 0 || inv.x + inv.width > canvasW) {
      hitWall = true;
      break;
    }
  }

  if (hitWall) {
    // Reverse direction
    direction *= -1;

    // Undo the overshot move and drop down
    for (const inv of invaders) {
      inv.x -= dx;       // undo the overshot step
      inv.y += DROP_STEP;
    }
  }
}

// ---------------------------------------------------------------------------
// drawFormation — draws every alive invader
// ---------------------------------------------------------------------------
/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Invader[]} invaders
 */
export function drawFormation(ctx, invaders) {
  ctx.fillStyle = INVADER_COLOUR;
  for (const inv of invaders) {
    if (inv.alive) {
      ctx.fillRect(Math.round(inv.x), Math.round(inv.y), inv.width, inv.height);
    }
  }
}
