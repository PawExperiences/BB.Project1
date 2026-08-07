// level1.js — Level 1: The Classic Grid
// ES module; no bundler, no npm, runs from file:// URL.
//
// Implements the first playable level of Space Invaders:
//   • 11-column × 5-row invader formation (55 invaders)
//   • Linear step-interval scaling (800 ms → 100 ms as 55 → 1 invaders)
//   • Horizontal step-and-drop movement with direction reversal
//   • Breach detection → life loss → level restart
//   • Level completion → game.nextLevel()
//   • HUD level-number display on every frame

import {
  INVADER_WIDTH,
  INVADER_HEIGHT,
  CELL_W,
  CELL_H,
  COLS,
  ROWS,
  TOTAL_INVADERS,
  ROW_TYPES,
  FORMATION_TOP,
  FORMATION_WIDTH,
} from './formation.js';
import { state } from './state.js';

// ---------------------------------------------------------------------------
// Step-interval constants
// ---------------------------------------------------------------------------
const INTERVAL_MAX  = 800;  // ms — interval when all 55 invaders are alive
const INTERVAL_MIN  = 100;  // ms — interval when only 1 invader is alive
const INTERVAL_SPAN = INTERVAL_MAX - INTERVAL_MIN;  // 700 ms
const COUNT_SPAN    = TOTAL_INVADERS - 1;           // 54

/**
 * Compute the horizontal-step interval (ms) for a given alive-invader count.
 * Linear interpolation: 800 ms at 55, 100 ms at 1.
 * @param {number} aliveCount
 * @returns {number} interval in milliseconds
 */
function computeInterval(aliveCount) {
  // Guard: clamp to [1, TOTAL_INVADERS]
  const n = Math.max(1, Math.min(TOTAL_INVADERS, aliveCount));
  return INTERVAL_MIN + (n - 1) * (INTERVAL_SPAN / COUNT_SPAN);
}

// ---------------------------------------------------------------------------
// Invader color palette (matches invaders.js for visual consistency)
// ---------------------------------------------------------------------------
const INVADER_COLOR = '#6f6';

// ---------------------------------------------------------------------------
// Level1 class
// ---------------------------------------------------------------------------
export class Level1 {
  /**
   * @param {object} deps
   * @param {CanvasRenderingContext2D} deps.ctx
   * @param {object}  deps.player  — player object; must expose .lives (writable) and .getBounds()
   * @param {object}  deps.hud     — HUD object; must expose .setLevel(n) or similar
   * @param {object}  deps.game    — game controller; must expose .nextLevel() or .setLevel(n)
   */
  constructor({ ctx, player, hud, game }) {
    this._ctx    = ctx;
    this._player = player;
    this._hud    = hud;
    this._game   = game;

    // Canvas dimensions from the context
    this._canvasWidth  = ctx.canvas.width;
    this._canvasHeight = ctx.canvas.height;

    // Breach threshold — fixed constant: canvasHeight minus one cell height
    this._breachY = this._canvasHeight - CELL_H;

    // Initialise the formation
    this._reset();
  }

  // -------------------------------------------------------------------------
  // Private: reset the formation to its initial state
  // -------------------------------------------------------------------------
  _reset() {
    // Formation origin (top-left of grid bounding box)
    this._originX = Math.round((this._canvasWidth - FORMATION_WIDTH) / 2);
    this._originY = FORMATION_TOP;

    // Horizontal direction: +1 = right, -1 = left
    this._dirX = 1;

    // Build flat invader array — 55 entries
    this._invaders = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        this._invaders.push({
          _col:  col,
          _row:  row,
          type:  ROW_TYPES[row],
          width:  INVADER_WIDTH,
          height: INVADER_HEIGHT,
          alive:  true,
        });
      }
    }

    // Attach getBounds to each invader via closure over this (the level)
    const self = this;
    for (const inv of this._invaders) {
      inv.getBounds = function () {
        return {
          x:      self._originX + inv._col * CELL_W,
          y:      self._originY + inv._row * CELL_H,
          width:  inv.width,
          height: inv.height,
        };
      };
    }

    // Step-interval timer
    this._stepAccumulator = 0;  // ms accumulated since last step
    this._stepInterval    = computeInterval(TOTAL_INVADERS); // ~800 ms

    // Guard: ensure nextLevel is called at most once per clear
    this._levelCompleted = false;
  }

  // -------------------------------------------------------------------------
  // Private: count alive invaders
  // -------------------------------------------------------------------------
  _aliveCount() {
    let n = 0;
    for (const inv of this._invaders) {
      if (inv.alive) n++;
    }
    return n;
  }

  // -------------------------------------------------------------------------
  // Private: perform one horizontal step of the formation
  // -------------------------------------------------------------------------
  _step() {
    // Determine the alive column extents
    let minCol = COLS;
    let maxCol = -1;
    for (const inv of this._invaders) {
      if (!inv.alive) continue;
      if (inv._col < minCol) minCol = inv._col;
      if (inv._col > maxCol) maxCol = inv._col;
    }

    if (minCol > maxCol) return; // no alive invaders — skip

    // Compute pixel extents BEFORE moving
    const leftEdge  = this._originX + minCol * CELL_W;
    const rightEdge = this._originX + maxCol * CELL_W + INVADER_WIDTH;

    if (this._dirX === 1) {
      // Moving right — check right boundary
      if (rightEdge >= this._canvasWidth) {
        // Clamp: right edge of rightmost invader exactly at canvas edge
        this._originX = this._canvasWidth - (maxCol * CELL_W + INVADER_WIDTH);
        this._originY += CELL_H;  // drop by exactly one cell height
        this._dirX = -1;
      } else {
        // Normal step right: move by one full cell width
        this._originX += CELL_W;
        // Re-clamp in case we overshot
        const newRight = this._originX + maxCol * CELL_W + INVADER_WIDTH;
        if (newRight > this._canvasWidth) {
          this._originX = this._canvasWidth - (maxCol * CELL_W + INVADER_WIDTH);
          this._originY += CELL_H;
          this._dirX = -1;
        }
      }
    } else {
      // Moving left — check left boundary
      if (leftEdge <= 0) {
        // Clamp: left edge of leftmost invader exactly at canvas left
        this._originX = -(minCol * CELL_W);
        this._originY += CELL_H;  // drop by exactly one cell height
        this._dirX = 1;
      } else {
        // Normal step left: move by one full cell width
        this._originX -= CELL_W;
        // Re-clamp in case we overshot
        const newLeft = this._originX + minCol * CELL_W;
        if (newLeft < 0) {
          this._originX = -(minCol * CELL_W);
          this._originY += CELL_H;
          this._dirX = 1;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Public: expose invader list for use by CollisionSystem in game.js
  // -------------------------------------------------------------------------
  getInvaders() {
    return this._invaders;
  }

  // -------------------------------------------------------------------------
  // Public: update — called every fixed-timestep tick (dt in seconds)
  // -------------------------------------------------------------------------
  update(dt) {
    if (this._levelCompleted) return;

    const alive = this._aliveCount();

    // ---- Level completion ------------------------------------------------
    if (alive === 0) {
      this._levelCompleted = true;
      // Save lives into shared state before transitioning
      state.lives = this._player.lives;
      if (typeof this._game.nextLevel === 'function') {
        this._game.nextLevel();
      } else if (typeof this._game.setLevel === 'function') {
        this._game.setLevel(2);
      }
      return;
    }

    // ---- Update step interval based on current alive count ---------------
    this._stepInterval = computeInterval(alive);

    // ---- Accumulate time and step when interval elapsed ------------------
    this._stepAccumulator += dt * 1000;  // convert seconds → ms
    if (this._stepAccumulator >= this._stepInterval) {
      this._stepAccumulator -= this._stepInterval;
      this._step();
    }

    // ---- Breach detection ------------------------------------------------
    for (const inv of this._invaders) {
      if (!inv.alive) continue;
      const b = inv.getBounds();
      if (b.y >= this._breachY) {
        // Player loses one life
        this._player.lives -= 1;
        state.lives = this._player.lives;

        // Reset the formation
        this._reset();

        // Stop processing this tick — formation is fresh
        return;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Public: draw — called once per animation frame
  // -------------------------------------------------------------------------
  draw() {
    const ctx = this._ctx;

    // ---- HUD: level number -----------------------------------------------
    if (this._hud) {
      if (typeof this._hud.setLevel === 'function') {
        this._hud.setLevel(1);
      } else if (typeof this._hud.drawLevel === 'function') {
        this._hud.drawLevel(ctx, 1);
      } else if (typeof this._hud.draw === 'function') {
        this._hud.draw(ctx, { level: 1 });
      } else {
        ctx.save();
        ctx.font      = '18px monospace';
        ctx.fillStyle = '#0f0';
        ctx.textAlign = 'center';
        ctx.fillText('Level 1', ctx.canvas.width / 2, 28);
        ctx.restore();
      }
    } else {
      ctx.save();
      ctx.font      = '18px monospace';
      ctx.fillStyle = '#0f0';
      ctx.textAlign = 'center';
      ctx.fillText('Level 1', ctx.canvas.width / 2, 28);
      ctx.restore();
    }

    // ---- Invader formation -----------------------------------------------
    ctx.save();
    ctx.fillStyle = INVADER_COLOR;
    for (const inv of this._invaders) {
      if (!inv.alive) continue;
      const b = inv.getBounds();
      ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    ctx.restore();
  }
}
