// invaders.js — Invader grid implementation.
// Exported classes: InvaderGrid, SplitInvaderGrid

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
// InvaderHalf — one independently sweeping half after a split
// ─────────────────────────────────────────────

/**
 * Represents one independently-sweeping half of a split formation.
 * Used internally by SplitInvaderGrid.
 */
class InvaderHalf {
  /**
   * @param {Array<object>} invaders  Flat array of invader objects belonging to this half.
   * @param {number}        dir       Initial direction: +1 (right) or -1 (left).
   * @param {number}        speed     Pixels per step (same as the pre-split formation).
   * @param {number}        stepAccum Accumulated step time inherited from parent grid.
   * @param {number}        startingCount  Count used for step-interval formula.
   */
  constructor(invaders, dir, speed, stepAccum, startingCount) {
    /** @type {Array<object>} */
    this.invaders     = invaders;
    this.dir          = dir;
    this.speed        = speed;
    this._stepAccum   = stepAccum;
    this._startingCount = startingCount;

    /** @type {Array<{x:number,y:number,w:number,h:number,timer:number}>} */
    this.explosions   = [];
  }

  /** Returns true when every invader in this half is destroyed. */
  allDefeated() {
    return this.invaders.every(inv => !inv.alive);
  }

  remainingCount() {
    return this.invaders.filter(i => i.alive).length;
  }

  /**
   * Compute step interval based on remaining count.
   * Uses the same formula as InvaderGrid but relative to this half's starting count.
   */
  _stepInterval(remaining) {
    const total   = Math.max(1, this._startingCount);
    const clamped = Math.max(1, Math.min(remaining, total));
    return STEP_INTERVAL_MIN_MS + (clamped / total) * (STEP_INTERVAL_MAX_MS - STEP_INTERVAL_MIN_MS);
  }

  /**
   * Mark an invader as defeated and spawn an explosion.
   * @param {object} inv
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
   * Advance this half by dt seconds.
   * @param {number} dt
   */
  update(dt) {
    // Tick explosions
    for (const exp of this.explosions) exp.timer -= dt * 1000;
    this.explosions = this.explosions.filter(e => e.timer > 0);

    const alive = this.invaders.filter(i => i.alive);
    if (alive.length === 0) return;

    this._stepAccum += dt * 1000;
    const interval = this._stepInterval(alive.length);

    while (this._stepAccum >= interval) {
      this._stepAccum -= interval;
      this._doStep(alive);
    }
  }

  _doStep(aliveInvaders) {
    const stepPx = this.speed;

    let minX = Infinity;
    let maxX = -Infinity;
    for (const inv of aliveInvaders) {
      if (inv.x         < minX) minX = inv.x;
      if (inv.x + inv.w > maxX) maxX = inv.x + inv.w;
    }

    const nextMinX = minX + stepPx * this.dir;
    const nextMaxX = maxX + stepPx * this.dir;

    if (nextMinX <= INV_EDGE_PAD || nextMaxX >= CANVAS_WIDTH - INV_EDGE_PAD) {
      this.dir *= -1;
      for (const inv of this.invaders) inv.y += INV_CELL_H;
    } else {
      for (const inv of this.invaders) inv.x += stepPx * this.dir;
    }
  }

  /**
   * Returns the Y coordinate of the bottom edge of the lowest alive invader.
   * @returns {number}
   */
  bottomY() {
    let maxY = -Infinity;
    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      if (inv.y + inv.h > maxY) maxY = inv.y + inv.h;
    }
    return maxY;
  }

  /**
   * Draw all alive invaders in this half plus explosion flashes.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.fillStyle = INVADER_COLOUR;
    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      ctx.fillRect(inv.x, inv.y, inv.w, inv.h);
    }

    for (const exp of this.explosions) {
      const alpha   = Math.max(0, exp.timer / EXPLOSION_DURATION_MS);
      const progress = 1 - alpha;
      const expand   = progress * 8;
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = EXPLOSION_COLOUR;
      ctx.fillRect(exp.x - expand, exp.y - expand, exp.w + expand * 2, exp.h + expand * 2);
    }
    ctx.globalAlpha = 1;
  }
}

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
          x:      INV_EDGE_PAD + c * (INV_CELL_W + INV_GAP_X),
          y:      startY       + r * (INV_CELL_H + INV_GAP_Y),
          w:      INV_CELL_W,
          h:      INV_CELL_H,
          alive:  true,
          points: ROW_POINTS[r],
          row:    r,
          col:    c,
        });
      }
      this.invaders.push(row);
    }

    // Expose a speed property for back-compat with verification steps.
    this.speed = INV_STEP_PX * speedMultiplier;

    // Movement state
    this.dir = 1; // +1 = right, -1 = left

    /** @type {number} */
    this._stepAccum = 0;

    /**
     * Active explosion effects.
     * @type {Array<{x:number,y:number,w:number,h:number,timer:number}>}
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
   * @param {number} remaining
   * @returns {number} interval in ms
   */
  _stepInterval(remaining) {
    const clamped = Math.max(1, Math.min(remaining, TOTAL_INVADERS));
    return STEP_INTERVAL_MIN_MS + (clamped / TOTAL_INVADERS) * (STEP_INTERVAL_MAX_MS - STEP_INTERVAL_MIN_MS);
  }

  /**
   * Mark an invader as defeated and spawn an explosion at its position.
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
   * @param {number} dt  Delta time in seconds.
   */
  update(dt) {
    // Tick explosions
    for (const exp of this.explosions) exp.timer -= dt * 1000;
    this.explosions = this.explosions.filter(e => e.timer > 0);

    const aliveInvaders = this.invaders.flat().filter(i => i.alive);
    if (aliveInvaders.length === 0) return;

    this._stepAccum += dt * 1000;
    const interval = this._stepInterval(aliveInvaders.length);

    while (this._stepAccum >= interval) {
      this._stepAccum -= interval;
      this._doStep(aliveInvaders);
    }
  }

  /**
   * Execute one discrete movement step.
   * @param {Array} aliveInvaders  Pre-filtered list of alive invader objects.
   */
  _doStep(aliveInvaders) {
    const stepPx = this.speed;

    let minX = Infinity;
    let maxX = -Infinity;
    for (const inv of aliveInvaders) {
      if (inv.x         < minX) minX = inv.x;
      if (inv.x + inv.w > maxX) maxX = inv.x + inv.w;
    }

    const nextMinX = minX + stepPx * this.dir;
    const nextMaxX = maxX + stepPx * this.dir;

    if (nextMinX <= INV_EDGE_PAD || nextMaxX >= CANVAS_WIDTH - INV_EDGE_PAD) {
      this.dir *= -1;
      for (const inv of this.invaders.flat()) inv.y += INV_CELL_H;
    } else {
      for (const inv of this.invaders.flat()) inv.x += stepPx * this.dir;
    }
  }

  /**
   * Returns the Y coordinate of the bottom edge of the lowest alive invader.
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
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();

    ctx.fillStyle = INVADER_COLOUR;
    for (const row of this.invaders) {
      for (const inv of row) {
        if (!inv.alive) continue;
        ctx.fillRect(inv.x, inv.y, inv.w, inv.h);
      }
    }

    for (const exp of this.explosions) {
      const alpha    = Math.max(0, exp.timer / EXPLOSION_DURATION_MS);
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = EXPLOSION_COLOUR;
      const progress  = 1 - alpha;
      const expand    = progress * 8;
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

// ─────────────────────────────────────────────
// SplitInvaderGrid — Level 3 formation split
// ─────────────────────────────────────────────

/**
 * Level 3 invader grid that extends InvaderGrid with:
 *   - kill tracking for the 50% split threshold
 *   - formation split into two independently sweeping halves
 *
 * Usage:
 *   const grid = new SplitInvaderGrid({ speedMultiplier: 1.5 });
 *   // In update loop:
 *   grid.update(dt);
 *   // In collision:
 *   checkBulletInvaderCollisions(bullet, grid);
 *   // Check split:
 *   grid.maybeSplit();
 */
export class SplitInvaderGrid extends InvaderGrid {
  /**
   * @param {object} opts  Same as InvaderGrid opts.
   */
  constructor(opts = {}) {
    super(opts);

    /** Total invaders at the start of this Level 3 session. */
    this._startCount = TOTAL_INVADERS; // 55

    /** How many invaders have been killed since Level 3 start. */
    this._killCount = 0;

    /** Whether the split has already occurred (one-time event). */
    this._hasSplit = false;

    /**
     * After the split, this holds the two halves.
     * @type {{ left: InvaderHalf|null, right: InvaderHalf|null }}
     */
    this._halves = { left: null, right: null };
  }

  // ── Overridden public API ────────────────────────────────────────────────

  /**
   * Returns true when all invaders are destroyed.
   * After the split, both halves must be fully cleared.
   */
  allDefeated() {
    if (this._hasSplit) {
      const { left, right } = this._halves;
      const leftDone  = !left  || left.allDefeated();
      const rightDone = !right || right.allDefeated();
      return leftDone && rightDone;
    }
    return super.allDefeated();
  }

  /**
   * Kill an invader, increment kill counter, then trigger split check.
   * @param {object} inv
   */
  killInvader(inv) {
    if (this._hasSplit) {
      // Delegate to the owning half's explosion list
      inv.alive = false;
      // Find which half owns this invader and add explosion there
      const { left, right } = this._halves;
      const half = (left && left.invaders.includes(inv)) ? left
                 : (right && right.invaders.includes(inv)) ? right
                 : null;
      if (half) {
        half.explosions.push({
          x: inv.x, y: inv.y, w: inv.w, h: inv.h,
          timer: EXPLOSION_DURATION_MS,
        });
      }
      this._killCount++;
      return;
    }
    super.killInvader(inv);
    this._killCount++;
  }

  /**
   * Returns the Y coordinate of the bottom edge of the lowest alive invader
   * across both halves (or the main grid if not yet split).
   */
  bottomY() {
    if (!this._hasSplit) return super.bottomY();
    const { left, right } = this._halves;
    let maxY = -Infinity;
    if (left)  { const y = left.bottomY();  if (y > maxY) maxY = y; }
    if (right) { const y = right.bottomY(); if (y > maxY) maxY = y; }
    return maxY;
  }

  /**
   * Advance the grid by dt seconds.
   * If already split, delegates to each half.
   */
  update(dt) {
    if (this._hasSplit) {
      const { left, right } = this._halves;
      if (left)  left.update(dt);
      if (right) right.update(dt);
      return;
    }
    super.update(dt);
  }

  /**
   * Check and execute the formation split if the 50% threshold has been reached.
   * Call this once per frame after killInvader() may have been called.
   * The split is a one-time event per Level 3 session.
   */
  maybeSplit() {
    if (this._hasSplit) return;

    const threshold = Math.floor(this._startCount / 2); // ⌊55/2⌋ = 27
    if (this._killCount < threshold) return;

    this._executeSplit();
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  /**
   * Perform the formation split.
   * Divides invaders by column index relative to the middle column.
   * Middle column index = Math.floor(COLS / 2) = 5 (for 11 columns).
   * Left half:  col < midCol
   * Right half: col >= midCol
   * Both halves start sweeping in opposite directions.
   */
  _executeSplit() {
    this._hasSplit = true;

    const COLS_COUNT = 11;
    const midCol = Math.floor(COLS_COUNT / 2); // = 5

    const leftInvaders  = [];
    const rightInvaders = [];

    for (const row of this.invaders) {
      for (const inv of row) {
        // Use inv.col if available; otherwise derive from x position
        const col = (inv.col !== undefined) ? inv.col
                  : Math.round((inv.x - INV_EDGE_PAD) / (INV_CELL_W + INV_GAP_X));
        if (col < midCol) {
          leftInvaders.push(inv);
        } else {
          rightInvaders.push(inv);
        }
      }
    }

    // Inherit speed and accumulated step time from main grid
    const speed     = this.speed;
    const stepAccum = this._stepAccum;

    // Starting counts for speed-scaling formula within each half
    const leftStart  = Math.max(1, leftInvaders.length);
    const rightStart = Math.max(1, rightInvaders.length);

    // Left half sweeps left (-1), right half sweeps right (+1)
    this._halves.left  = new InvaderHalf(leftInvaders,  -1, speed, stepAccum, leftStart);
    this._halves.right = new InvaderHalf(rightInvaders, +1, speed, stepAccum, rightStart);
  }

  /**
   * Render the grid (or split halves after split).
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();
    if (this._hasSplit) {
      const { left, right } = this._halves;
      if (left)  left.draw(ctx);
      if (right) right.draw(ctx);
    } else {
      super.draw(ctx);
    }
    ctx.restore();
  }

  /**
   * Returns all alive invaders as a flat array, from both halves or the main grid.
   * Used by collision detection.
   * @returns {object[]}
   */
  aliveInvadersList() {
    if (this._hasSplit) {
      const { left, right } = this._halves;
      const result = [];
      if (left)  result.push(...left.invaders.filter(i => i.alive));
      if (right) result.push(...right.invaders.filter(i => i.alive));
      return result;
    }
    return this.invaders.flat().filter(i => i.alive);
  }
}
