// invaders.js — InvaderGrid class for Space Invaders
// 11-column × 5-row formation, step-and-drop movement, per-invader alive state

import { CANVAS_WIDTH } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Named constants — no magic numbers inline
// ---------------------------------------------------------------------------
const INVADER_WIDTH    = 32;  // px
const INVADER_HEIGHT   = 24;  // px
const INVADER_GAP_X    = 8;   // px horizontal gap between invaders
const INVADER_GAP_Y    = 8;   // px vertical gap between invaders
const COLS             = 11;
const ROWS             = 5;
const MOVE_SPEED       = 60;  // px per second (horizontal)
const DROP_DISTANCE    = 24;  // px dropped vertically on direction reversal
const INVADER_COLOR    = '#6f6';  // uniform green for all invaders
const FORMATION_TOP    = 80;  // px from top of canvas where formation starts

// Total cell width including gap
const CELL_W = INVADER_WIDTH  + INVADER_GAP_X;
const CELL_H = INVADER_HEIGHT + INVADER_GAP_Y;

// Formation pixel width (used for centering and boundary checks)
const FORMATION_WIDTH  = COLS * CELL_W - INVADER_GAP_X;
const FORMATION_HEIGHT = ROWS * CELL_H - INVADER_GAP_Y;

export class InvaderGrid {
  /**
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  constructor(canvasWidth, canvasHeight) {
    this._canvasWidth  = canvasWidth;
    this._canvasHeight = canvasHeight;

    // Formation origin — top-left corner of the bounding box of the whole grid
    this._originX = Math.round((canvasWidth - FORMATION_WIDTH) / 2);
    this._originY = FORMATION_TOP;

    // Horizontal direction: +1 = right, -1 = left
    this._dirX = 1;

    // Build flat array of invader objects
    this._invaders = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        this._invaders.push({
          // x/y are local offsets from formation origin; absolute position is
          // computed in draw() / getBounds() to avoid updating every invader every tick.
          _col:   col,
          _row:   row,
          width:  INVADER_WIDTH,
          height: INVADER_HEIGHT,
          alive:  true,
          // Convenience getters are added below via prototype
        });
      }
    }

    // Attach getBounds to each invader via a closure over `this` (the grid)
    // so bounds always reflect the current formation origin.
    const grid = this;
    for (const inv of this._invaders) {
      inv.getBounds = function () {
        return {
          x:      grid._originX + inv._col * CELL_W,
          y:      grid._originY + inv._row * CELL_H,
          width:  inv.width,
          height: inv.height,
        };
      };
    }
  }

  /**
   * Step the formation: move horizontally, detect boundary and drop+reverse.
   * @param {number} dt — delta time in seconds
   */
  update(dt) {
    // Move the formation
    this._originX += this._dirX * MOVE_SPEED * dt;

    // Compute the current left and right extents of the alive formation
    let minCol = COLS;
    let maxCol = -1;
    for (const inv of this._invaders) {
      if (!inv.alive) continue;
      if (inv._col < minCol) minCol = inv._col;
      if (inv._col > maxCol) maxCol = inv._col;
    }

    if (minCol > maxCol) return; // all dead

    const leftEdge  = this._originX + minCol * CELL_W;
    const rightEdge = this._originX + maxCol * CELL_W + INVADER_WIDTH;

    // Boundary check — reverse and drop when leading edge reaches canvas edge
    if (this._dirX === 1 && rightEdge >= this._canvasWidth) {
      // Clamp so right edge is exactly at canvas edge
      this._originX = this._canvasWidth - (maxCol * CELL_W + INVADER_WIDTH);
      this._originY += DROP_DISTANCE;
      this._dirX = -1;
    } else if (this._dirX === -1 && leftEdge <= 0) {
      // Clamp so left edge is exactly at canvas left
      this._originX = -(minCol * CELL_W);
      this._originY += DROP_DISTANCE;
      this._dirX = 1;
    }
  }

  /**
   * Render alive invaders only.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = INVADER_COLOR;
    for (const inv of this._invaders) {
      if (!inv.alive) continue;
      const b = inv.getBounds();
      ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    ctx.restore();
  }

  /**
   * Returns the flat array of all invader objects (alive and dead).
   * Callers should check inv.alive before acting.
   * @returns {Array}
   */
  getInvaders() {
    return this._invaders;
  }

  /**
   * Returns true when every invader is dead.
   * @returns {boolean}
   */
  allDead() {
    return this._invaders.every(inv => !inv.alive);
  }
}
