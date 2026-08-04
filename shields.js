// shields.js — Destructible shield bunker implementation for Level 3.
// Exported class: ShieldManager

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BUNKER_COUNT,
  BUNKER_COLS,
  BUNKER_ROWS,
  BUNKER_CELL_SIZE,
  BUNKER_Y_FRACTION,
  BUNKER_COLOUR,
} from './gameConfig.js';

/**
 * ShieldManager
 *
 * Manages four destructible shield bunkers placed at ~80% of canvas height.
 * Each bunker is a 4×4 grid of ~8 px cells.
 * Individual cells are removed on bullet contact (by collision.js).
 */
export class ShieldManager {
  constructor() {
    this.bunkers = [];
    this._init();
  }

  /**
   * (Re-)initialise all bunkers to their full 4×4 state.
   * Call this at the start of Level 3.
   */
  _init() {
    this.bunkers = [];

    // Bunker Y: top of the cell grid, at ~80% canvas height
    const bunkerH  = BUNKER_ROWS * BUNKER_CELL_SIZE;
    const bunkerY  = Math.floor(CANVAS_HEIGHT * BUNKER_Y_FRACTION) - bunkerH;
    const bunkerW  = BUNKER_COLS * BUNKER_CELL_SIZE;

    // Distribute four bunkers evenly across the canvas width
    // Total space divided into (BUNKER_COUNT + 1) segments for even spacing
    const segmentW = CANVAS_WIDTH / (BUNKER_COUNT + 1);

    for (let bi = 0; bi < BUNKER_COUNT; bi++) {
      const bunkerX = Math.floor(segmentW * (bi + 1) - bunkerW / 2);

      const cells = [];
      for (let r = 0; r < BUNKER_ROWS; r++) {
        const row = [];
        for (let c = 0; c < BUNKER_COLS; c++) {
          row.push({
            x:    bunkerX + c * BUNKER_CELL_SIZE,
            y:    bunkerY + r * BUNKER_CELL_SIZE,
            size: BUNKER_CELL_SIZE,
            alive: true,
          });
        }
        cells.push(row);
      }

      this.bunkers.push({ cells, x: bunkerX, y: bunkerY, w: bunkerW, h: bunkerH });
    }
  }

  /**
   * Reset all bunkers to full health.
   * Call at the start of each Level 3 session.
   */
  reset() {
    this._init();
  }

  /**
   * Returns true when a bunker has no alive cells remaining.
   * @param {number} bi  Bunker index.
   * @returns {boolean}
   */
  isBunkerDestroyed(bi) {
    return this.bunkers[bi].cells.every(row => row.every(cell => !cell.alive));
  }

  /**
   * Render all bunkers.
   * Cells that are not alive are simply not drawn.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = BUNKER_COLOUR;
    for (const bunker of this.bunkers) {
      for (const row of bunker.cells) {
        for (const cell of row) {
          if (!cell.alive) continue;
          ctx.fillRect(cell.x, cell.y, cell.size, cell.size);
        }
      }
    }
    ctx.restore();
  }
}
