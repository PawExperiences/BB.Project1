// invaders.js — Invader grid implementation.
// Exported class: InvaderGrid

import {
  CANVAS_WIDTH,
  INV_CELL_W,
  INV_CELL_H,
  INV_GAP_X,
  INV_GAP_Y,
  INV_DROP_STEP,
  INV_EDGE_PAD,
  INV_BASE_SPEED,
  SCORE_PER_KILL,
  EXPLOSION_DURATION_MS,
} from './gameConfig.js';

// ─────────────────────────────────────────────
// Grid dimensions
// ─────────────────────────────────────────────

/** Number of columns in the invader grid. */
const COLS = 11;
/** Number of rows in the invader grid. */
const ROWS = 5;

/**
 * Point values per row (top → bottom).
 * Classic Space Invaders: top rows worth more.
 */
const ROW_POINTS = [30, 30, 20, 20, 10];

/** Uniform fill colour for all invaders (single colour for this card). */
const INVADER_COLOUR = '#00ccff';

/** Fill colour for the explosion flash. */
const EXPLOSION_COLOUR = '#ff8800';

// ─────────────────────────────────────────────
// InvaderGrid
// ─────────────────────────────────────────────

export class InvaderGrid {
  /**
   * @param {object} opts
   * @param {number} [opts.speedMultiplier=1]  Multiplier on INV_BASE_SPEED.
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
          x:      INV_EDGE_PAD + c * (INV_CELL_W + INV_GAP_X),
          y:      startY       + r * (INV_CELL_H + INV_GAP_Y),
          w:      INV_CELL_W,
          h:      INV_CELL_H,
          alive:  true,
          points: ROW_POINTS[r],
          row:    r,
        });
      }
      this.invaders.push(row);
    }

    // Movement state
    this.dir   = 1;   // +1 = right, -1 = left
    this.speed = INV_BASE_SPEED * speedMultiplier;

    /**
     * Active explosion effects.
     * Each entry: { x, y, w, h, timer } where timer counts down from EXPLOSION_DURATION_MS.
     * @type {Array<{x:number, y:number, w:number, h:number, timer:number}>}
     */
    this.explosions = [];
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Returns true when every invader has been destroyed. */
  allDefeated() {
    return this.invaders.every(row => row.every(inv => !inv.alive));
  }

  /**
   * Mark an invader as defeated and spawn an explosion at its position.
   * Called by collision.js after a confirmed hit.
   * @param {{ x:number, y:number, w:number, h:number, alive:boolean }} inv
   */
  killInvader(inv) {
    inv.alive = false;
    this.explosions.push({
      x:     inv.x,
      y:     inv.y,
      w:     inv.w,
      h:     inv.h,
      timer: EXPLOSION_DURATION_MS,
    });
  }

  /**
   * Advance the grid by dt seconds.
   * Moves the formation horizontally; reverses and drops on edge contact.
   * Also ticks down active explosions.
   * @param {number} dt  Delta time in seconds.
   */
  update(dt) {
    // Tick explosions
    for (const exp of this.explosions) {
      exp.timer -= dt * 1000; // convert s → ms
    }
    // Remove expired explosions
    this.explosions = this.explosions.filter(e => e.timer > 0);

    const aliveInvaders = this.invaders.flat().filter(i => i.alive);
    if (aliveInvaders.length === 0) return;

    // Speed scales up as invaders are destroyed (classic feel)
    const remaining   = aliveInvaders.length;
    const total       = ROWS * COLS;
    const scaledSpeed = this.speed * (1 + (total - remaining) / total);

    const dx = scaledSpeed * this.dir * dt;

    // Find the actual left/right extents of alive invaders
    let minX = Infinity;
    let maxX = -Infinity;
    for (const inv of aliveInvaders) {
      if (inv.x         < minX) minX = inv.x;
      if (inv.x + inv.w > maxX) maxX = inv.x + inv.w;
    }

    // Will the move push us past an edge?
    const nextMinX = minX + dx;
    const nextMaxX = maxX + dx;

    if (nextMinX <= 0 || nextMaxX >= CANVAS_WIDTH - INV_EDGE_PAD) {
      // Reverse direction and drop the entire formation
      this.dir *= -1;
      for (const inv of this.invaders.flat()) {
        inv.y += INV_DROP_STEP;
      }
    } else {
      // Normal horizontal step
      for (const inv of this.invaders.flat()) {
        inv.x += dx;
      }
    }
  }

  /**
   * Render all alive invaders as filled rectangles, plus any active explosion flashes.
   * NOTE: collision logic is NEVER called from here — draw() is pure rendering.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();

    // Draw alive invaders as simple coloured rectangles (per acceptance criteria)
    ctx.fillStyle = INVADER_COLOUR;
    for (const row of this.invaders) {
      for (const inv of row) {
        if (!inv.alive) continue;
        ctx.fillRect(inv.x, inv.y, inv.w, inv.h);
      }
    }

    // Draw explosion flashes
    for (const exp of this.explosions) {
      // Fade: fully opaque at start, transparent at end
      const alpha = Math.max(0, exp.timer / EXPLOSION_DURATION_MS);
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = EXPLOSION_COLOUR;
      // Expanding rectangle: grows outward as timer decreases
      const progress = 1 - alpha; // 0 at start → 1 at end
      const expand   = progress * 8; // up to 8 px expansion
      ctx.fillRect(
        exp.x - expand,
        exp.y - expand,
        exp.w + expand * 2,
        exp.h + expand * 2,
      );
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}
