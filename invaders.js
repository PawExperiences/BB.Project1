// invaders.js — Invader grid implementation.
// Exported class: InvaderGrid

import { CANVAS_WIDTH } from './player.js';

// ─────────────────────────────────────────────
// Layout constants
// ─────────────────────────────────────────────

/** Number of columns in the invader grid. */
const COLS = 11;
/** Number of rows in the invader grid. */
const ROWS = 5;

/** Invader sprite dimensions (pixels). */
const INV_W = 36;
const INV_H = 24;

/** Horizontal and vertical gap between invaders. */
const GAP_X = 16;
const GAP_Y = 18;

/** Horizontal padding from canvas edge before reversing direction. */
const EDGE_PAD = 16;

/** How many pixels the grid drops each time it reverses direction. */
const DROP_STEP = 20;

/** Base horizontal speed of the grid in pixels per second. */
const BASE_SPEED = 60;

/**
 * Point values per row (top → bottom).
 * Classic Space Invaders: top rows worth more.
 */
const ROW_POINTS = [30, 30, 20, 20, 10];

// ─────────────────────────────────────────────
// InvaderGrid
// ─────────────────────────────────────────────

export class InvaderGrid {
  /**
   * @param {object} opts
   * @param {number} [opts.speedMultiplier=1]  Multiplier on BASE_SPEED.
   * @param {number} [opts.startY=80]          Top Y of the first row.
   */
  constructor({ speedMultiplier = 1, startY = 80 } = {}) {
    this.speedMultiplier = speedMultiplier;
    this.startY          = startY;

    // Build the 2-D grid of invader objects
    this.invaders = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          // Pixel position of top-left corner
          x:      EDGE_PAD + c * (INV_W + GAP_X),
          y:      startY   + r * (INV_H + GAP_Y),
          w:      INV_W,
          h:      INV_H,
          alive:  true,
          points: ROW_POINTS[r],
          // Cosmetic: which row type (0=top, 4=bottom) for colour
          row:    r,
        });
      }
      this.invaders.push(row);
    }

    // Movement state
    this.dir      = 1;   // +1 = right, -1 = left
    this.speed    = BASE_SPEED * speedMultiplier;
    this.moveAccum = 0;  // accumulated horizontal movement this direction
  }

  /** Returns true when every invader has been destroyed. */
  allDefeated() {
    return this.invaders.every(row => row.every(inv => !inv.alive));
  }

  /**
   * Advance the grid by dt seconds.
   * @param {number} dt
   */
  update(dt) {
    const aliveInvaders = this.invaders.flat().filter(i => i.alive);
    if (aliveInvaders.length === 0) return;

    // Speed scales up as invaders are destroyed (classic feel)
    const remaining    = aliveInvaders.length;
    const total        = ROWS * COLS;
    const scaledSpeed  = this.speed * (1 + (total - remaining) / total);

    const dx = scaledSpeed * this.dir * dt;

    // Find the actual left/right extents of alive invaders
    let minX = Infinity, maxX = -Infinity;
    for (const inv of aliveInvaders) {
      if (inv.x < minX) minX = inv.x;
      if (inv.x + inv.w > maxX) maxX = inv.x + inv.w;
    }

    // Will the move push us past an edge?
    const nextMinX = minX + dx;
    const nextMaxX = maxX + dx;

    if (nextMinX <= 0 || nextMaxX >= CANVAS_WIDTH - EDGE_PAD) {
      // Reverse and drop
      this.dir *= -1;
      for (const inv of this.invaders.flat()) {
        inv.y += DROP_STEP;
      }
    } else {
      // Normal horizontal move
      for (const inv of this.invaders.flat()) {
        inv.x += dx;
      }
    }
  }

  /**
   * Render all alive invaders.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    for (const row of this.invaders) {
      for (const inv of row) {
        if (!inv.alive) continue;
        this._drawInvader(ctx, inv);
      }
    }
  }

  /**
   * Draw a single invader sprite (pixel-art style, no images).
   * @param {CanvasRenderingContext2D} ctx
   * @param {{x:number,y:number,w:number,h:number,row:number}} inv
   */
  _drawInvader(ctx, inv) {
    const colours = ['#ff4444', '#ff4444', '#ffaa00', '#ffaa00', '#00ccff'];
    ctx.save();
    ctx.fillStyle = colours[inv.row] || '#ffffff';
    const { x, y, w, h } = inv;

    // Body
    ctx.fillRect(x + w * 0.2, y + h * 0.25, w * 0.6, h * 0.55);
    // Left antenna
    ctx.fillRect(x + w * 0.1, y,             w * 0.15, h * 0.3);
    // Right antenna
    ctx.fillRect(x + w * 0.75, y,            w * 0.15, h * 0.3);
    // Left foot
    ctx.fillRect(x,            y + h * 0.75, w * 0.2,  h * 0.25);
    // Right foot
    ctx.fillRect(x + w * 0.8,  y + h * 0.75, w * 0.2,  h * 0.25);
    // Eyes (two small dark squares)
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + w * 0.28, y + h * 0.35, w * 0.15, h * 0.2);
    ctx.fillRect(x + w * 0.57, y + h * 0.35, w * 0.15, h * 0.2);

    ctx.restore();
  }
}
