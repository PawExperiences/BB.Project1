// Level 1: the classic grid. Owns the 11x5/55-invader formation's starting
// layout, the step-speed-vs-alive-count scaling formula, loss detection
// (formation reaches the player's row -> lose a life, restart the level) and
// win detection (formation cleared -> advance to Level 2). Invader sprite
// rendering, per-invader explosion state and per-kill scoring are owned by
// invaders.js / collision.js; this module only drives the Invaders instance
// it creates (formation pace, position, restarts) and reads its alive count.

import { Invaders } from './invaders.js';

export const LEVEL_NUMBER = 1;
export const NEXT_LEVEL_NUMBER = 2;

const GRID_COLS = 11;
const GRID_ROWS = 5;
const INVADER_COUNT = GRID_COLS * GRID_ROWS; // 55

// intervalMs = 100 + (aliveCount - 1) * (700 / 54): ~800ms at 55 alive,
// ~100ms at 1 alive, scaling linearly in between.
const MIN_STEP_INTERVAL_MS = 100;
const STEP_INTERVAL_RANGE_MS = 700;

function stepIntervalForAliveCount(aliveCount) {
  return MIN_STEP_INTERVAL_MS + (aliveCount - 1) * (STEP_INTERVAL_RANGE_MS / (INVADER_COUNT - 1));
}

export class Level1 {
  constructor() {
    this.invaders = new Invaders();
    this.completed = false;
    this._lastAliveCount = null;
    this._syncStepInterval();
  }

  _syncStepInterval() {
    const aliveCount = this.invaders.getAliveInvaders().length;
    if (aliveCount !== this._lastAliveCount) {
      this._lastAliveCount = aliveCount;
      if (aliveCount > 0) {
        this.invaders.stepIntervalMs = stepIntervalForAliveCount(aliveCount);
      }
    }
    return aliveCount;
  }

  // The formation is rigid, so the front (bottom) row's nominal position is
  // always grid row GRID_ROWS - 1, whether or not the invaders occupying it
  // are still alive.
  _frontRowReachesPlayer(player) {
    const frontRowInvader = this.invaders.invaders.find((inv) => inv.row === GRID_ROWS - 1);
    const bounds = this.invaders.getBounds(frontRowInvader);
    return bounds.y + bounds.height >= player.y;
  }

  restart() {
    this.invaders.reset();
    this._lastAliveCount = null;
    this._syncStepInterval();
  }

  update(dt, player, hudState) {
    if (this.completed) return;

    const aliveCount = this._syncStepInterval();

    if (aliveCount === 0) {
      this.completed = true;
      hudState.level = NEXT_LEVEL_NUMBER;
      return;
    }

    this.invaders.update(dt);

    if (this._frontRowReachesPlayer(player)) {
      hudState.lives = Math.max(0, hudState.lives - 1);
      this.restart();
    }
  }

  draw(ctx) {
    this.invaders.draw(ctx);
  }
}
