// invaders.js — Invader formation for Space Invaders

import { CANVAS_WIDTH } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Invader dimensions and formation layout
// ---------------------------------------------------------------------------
const INVADER_WIDTH  = 30; // px
const INVADER_HEIGHT = 20; // px
const COL_GAP        = 20; // px between columns
const ROW_GAP        = 20; // px between rows
const COLS           = 11;
const ROWS           = 5;

// Horizontal formation speed (px/s)
const FORMATION_SPEED = 60;

// How far the formation drops when it hits an edge (px)
const DROP_AMOUNT = INVADER_HEIGHT + ROW_GAP;

// Total formation width: 11 columns of 30 px + 10 gaps of 20 px
const FORMATION_WIDTH = COLS * INVADER_WIDTH + (COLS - 1) * COL_GAP;

// Start X so the formation is horizontally centred
const START_X = Math.floor((CANVAS_WIDTH - FORMATION_WIDTH) / 2);

// Start Y below the HUD (HUD is 40 px tall)
const START_Y = 60;

// ---------------------------------------------------------------------------
// Invader class
// ---------------------------------------------------------------------------
export class Invader {
  constructor(x, y) {
    this.x      = x;
    this.y      = y;
    this.width  = INVADER_WIDTH;
    this.height = INVADER_HEIGHT;
    this.alive  = true;
  }
}

// ---------------------------------------------------------------------------
// Formation — flat array of Invader instances
// ---------------------------------------------------------------------------
export const formation = [];

for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    formation.push(new Invader(
      START_X + col * (INVADER_WIDTH + COL_GAP),
      START_Y + row * (INVADER_HEIGHT + ROW_GAP)
    ));
  }
}

// ---------------------------------------------------------------------------
// Formation movement state
// ---------------------------------------------------------------------------
let directionX = 1; // +1 = right, -1 = left

// ---------------------------------------------------------------------------
// updateFormation(dt)
// Moves the entire formation sideways. When any living invader would exceed
// the left or right canvas boundary, the formation drops and reverses.
// dt — elapsed time in seconds
// ---------------------------------------------------------------------------
export function updateFormation(dt) {
  const dx = FORMATION_SPEED * directionX * dt;

  // Check if the move would push any living invader out of bounds
  let wouldHitRight = false;
  let wouldHitLeft  = false;

  for (const inv of formation) {
    if (!inv.alive) continue;
    const nextX = inv.x + dx;
    if (nextX + inv.width >= CANVAS_WIDTH) wouldHitRight = true;
    if (nextX <= 0)                        wouldHitLeft  = true;
  }

  if (wouldHitRight || wouldHitLeft) {
    // Drop the formation down and reverse
    for (const inv of formation) {
      inv.y += DROP_AMOUNT;
    }
    directionX = -directionX;
  } else {
    // Normal sideways movement
    for (const inv of formation) {
      inv.x += dx;
    }
  }
}

// ---------------------------------------------------------------------------
// drawFormation(ctx)
// Renders only alive invaders as filled rectangles.
// ---------------------------------------------------------------------------
export function drawFormation(ctx) {
  ctx.fillStyle = '#00ff00'; // classic green invaders
  for (const inv of formation) {
    if (inv.alive) {
      ctx.fillRect(inv.x, inv.y, inv.width, inv.height);
    }
  }
}
