// invaders.js — InvaderGrid: state, march logic, and draw.
// 11 columns × 5 rows = 55 invaders, each 24×16 px, 8 px gaps.

import { CANVAS_WIDTH } from './gameConfig.js';

// Invader dimensions
export const INVADER_W = 24;
export const INVADER_H = 16;
export const GAP       = 8;

const COLS = 11;
const ROWS = 5;

// Formation dimensions (px)
const FORMATION_W = COLS * INVADER_W + (COLS - 1) * GAP; // 344
const FORMATION_H = ROWS * INVADER_H + (ROWS - 1) * GAP; // 112

// Starting top-left of the formation
const START_X = Math.round((CANVAS_WIDTH - FORMATION_W) / 2); // centred horizontally
const START_Y = 80; // some distance from the top, below the HUD

// March parameters
const STEP_PX       = 8;  // pixels moved sideways per step
const STEP_INTERVAL = 30; // game-loop ticks between steps
const DROP_PX       = 16; // pixels dropped when reversing

export class InvaderGrid {
  constructor() {
    // Build the flat array of invader objects
    this.invaders = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        this.invaders.push({
          row,
          col,
          alive: true,
        });
      }
    }

    // Shared formation offset applied to every invader
    this.offsetX = 0;
    this.offsetY = 0;

    // March state
    this._direction  = 1;  // 1 = right, -1 = left
    this._tickCount  = 0;  // counts ticks since last step
  }

  // -------------------------------------------------------------------------
  // Geometry helpers
  // -------------------------------------------------------------------------

  /** Return the canvas-space bounding box of a given invader. */
  invaderRect(invader) {
    const x = START_X + invader.col * (INVADER_W + GAP) + this.offsetX;
    const y = START_Y + invader.row * (INVADER_H + GAP) + this.offsetY;
    return { x, y, w: INVADER_W, h: INVADER_H };
  }

  /** Return all live invaders. */
  liveInvaders() {
    return this.invaders.filter(inv => inv.alive);
  }

  // -------------------------------------------------------------------------
  // March (called once per game-loop tick)
  // -------------------------------------------------------------------------
  update() {
    this._tickCount++;
    if (this._tickCount < STEP_INTERVAL) return;
    this._tickCount = 0;

    const live = this.liveInvaders();
    if (live.length === 0) return;

    // Candidate next offset
    const nextOffsetX = this.offsetX + this._direction * STEP_PX;

    // Compute the rightmost right-edge and leftmost left-edge after the step
    let minLeft  = Infinity;
    let maxRight = -Infinity;
    for (const inv of live) {
      const baseX = START_X + inv.col * (INVADER_W + GAP);
      const left  = baseX + nextOffsetX;
      const right = left + INVADER_W;
      if (left  < minLeft)  minLeft  = left;
      if (right > maxRight) maxRight = right;
    }

    // Edge check: if moving right and right edge would reach/exceed CANVAS_WIDTH,
    // or moving left and left edge would reach/go below 0 — drop and reverse.
    if (maxRight >= CANVAS_WIDTH || minLeft <= 0) {
      this.offsetY += DROP_PX;
      this._direction *= -1;
      // Do NOT apply the sideways step this tick (drop only)
    } else {
      this.offsetX = nextOffsetX;
    }
  }

  // -------------------------------------------------------------------------
  // Draw (called once per render frame, after collision pass)
  // -------------------------------------------------------------------------
  draw(ctx) {
    ctx.fillStyle = '#00FF00';
    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      const { x, y, w, h } = this.invaderRect(inv);
      ctx.fillRect(Math.round(x), Math.round(y), w, h);
    }
  }
}
