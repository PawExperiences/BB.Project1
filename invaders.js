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
  SCORE_PER_KILL,
  EXPLOSION_DURATION_MS,
  STEP_INTERVAL_MAX_MS,
  STEP_INTERVAL_MIN_MS,
  TOTAL_INVADERS,
  INV_STEP_PX,
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
   * @param {number} [opts.speedMultiplier=1]  Multiplier scales the step pixel distance.
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

    // Expose a speed property for back-compat with verification steps.
    // It represents how many pixels each horizontal step covers.
    this.speed = INV_STEP_PX * speedMultiplier;

    // Movement state
    this.dir = 1; // +1 = right, -1 = left

    /**
     * Accumulated time in ms since the last discrete step.
     * @type {number}
     */
    this._stepAccum = 0;

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
   * Returns the number of currently alive invaders.
   * @returns {number}
   */
  remainingCount() {
    return this.invaders.flat().filter(i => i.alive).length;
  }

  /**
   * Compute the step interval in ms for the current remaining count.
   * Formula: interval = MIN + (remaining / TOTAL) * (MAX - MIN)
   *   55 alive → 800 ms
   *    1 alive → 100 ms
   * @param {number} remaining
   * @returns {number} interval in ms
   */
  _stepInterval(remaining) {
    const clamped = Math.max(1, Math.min(remaining, TOTAL_INVADERS));
    return STEP_INTERVAL_MIN_MS + (clamped / TOTAL_INVADERS) * (STEP_INTERVAL_MAX_MS - STEP_INTERVAL_MIN_MS);
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
   * Uses a discrete step-timer: the formation only moves when the accumulated
   * time exceeds the current step interval (which shrinks as invaders die).
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

    // Accumulate time
    this._stepAccum += dt * 1000; // ms

    const interval = this._stepInterval(aliveInvaders.length);

    // Only step when the accumulated time has reached the interval.
    // Consume as many steps as have elapsed (usually just 1).
    while (this._stepAccum >= interval) {
      this._stepAccum -= interval;
      this._doStep(aliveInvaders);
    }
  }

  /**
   * Execute one discrete movement step.
   * Checks edge conditions and either drops+reverses or moves horizontally.
   * @param {Array} aliveInvaders  Pre-filtered list of alive invader objects.
   */
  _doStep(aliveInvaders) {
    // Pixels to move per step, scaled by speedMultiplier
    const stepPx = this.speed; // this.speed = INV_STEP_PX * speedMultiplier

    // Find actual left/right extents of alive invaders
    let minX = Infinity;
    let maxX = -Infinity;
    for (const inv of aliveInvaders) {
      if (inv.x         < minX) minX = inv.x;
      if (inv.x + inv.w > maxX) maxX = inv.x + inv.w;
    }

    // Determine what the new extents would be after a horizontal step
    const nextMinX = minX + stepPx * this.dir;
    const nextMaxX = maxX + stepPx * this.dir;

    if (nextMinX <= INV_EDGE_PAD || nextMaxX >= CANVAS_WIDTH - INV_EDGE_PAD) {
      // Hit an edge: reverse direction and drop by exactly one cell height
      this.dir *= -1;
      for (const inv of this.invaders.flat()) {
        inv.y += INV_CELL_H; // exactly one invader cell height
      }
    } else {
      // Normal horizontal step
      for (const inv of this.invaders.flat()) {
        inv.x += stepPx * this.dir;
      }
    }
  }

  /**
   * Returns the Y coordinate of the bottom edge of the lowest alive invader.
   * Returns -Infinity when no invaders are alive.
   * @returns {number}
   */
  bottomY() {
    let maxY = -Infinity;
    for (const row of this.invaders) {
      for (const inv of row) {
        if (!inv.alive) continue;
        if (inv.y + inv.h > maxY) maxY = inv.y + inv.h;
      }
    }
    return maxY;
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
