// The invader formation: an 11-column x 5-row grid (55 invaders, the
// classic formation) of identical filled rectangles. step() advances the
// march by one discrete increment as a unit, and when the edge-most living
// invader reaches a side edge of the canvas the formation snaps flush to
// that edge, drops by exactly one invader cell height and reverses
// horizontal direction. update(dt) paces step() on a fixed wall-clock
// interval (INVADER_STEP_INTERVAL) via a dt accumulator, so a large dt
// still runs the edge check once per interval crossed rather than skipping
// it — level cards that need a different (e.g. difficulty-ramping) pacing
// call step() directly on their own accumulator instead of using update().
// Added by "Sprite rendering and collision detection".

import {
  CANVAS_WIDTH,
  INVADER_COLS,
  INVADER_ROWS,
  INVADER_WIDTH,
  INVADER_HEIGHT,
  INVADER_H_SPACING,
  INVADER_V_SPACING,
  INVADER_STEP_X,
  INVADER_ROW_DROP,
  INVADER_STEP_INTERVAL,
} from './gameConfig.js';

// Re-exported so the classic 11 x 5 = 55 formation shape stays checkable
// from the outside (README verification, the level cards) without every
// caller reaching into gameConfig.js directly.
export { INVADER_COLS, INVADER_ROWS };

// Every invader is the same filled rectangle in the same single colour — no
// sprite art, no image assets, and no per-row variety (distinct
// types/rows/colours are explicitly out of scope for this card).
const INVADER_COLOR = '#ffffff';

// Cell pitch: the invader plus the gap to its neighbour.
const CELL_WIDTH = INVADER_WIDTH + INVADER_H_SPACING;
const CELL_HEIGHT = INVADER_HEIGHT + INVADER_V_SPACING;

// Home position of the whole grid: horizontally centered, just below the
// HUD band (the Score/Lives text ends at y = 52).
const FORMATION_WIDTH = (INVADER_COLS - 1) * CELL_WIDTH + INVADER_WIDTH; // 516
const START_X = (CANVAS_WIDTH - FORMATION_WIDTH) / 2; // 126
const START_Y = 112;

// March increments: STEP_X px sideways per discrete step, and a downward
// drop of exactly one invader cell height at each edge reversal.
const STEP_X = INVADER_STEP_X;
const DROP_STEP = INVADER_ROW_DROP;

export class InvaderFormation {
  constructor() {
    this.reset();
  }

  // Back to the full starting formation: 55 living invaders in their home
  // position, marching right. The level cards call this when a level
  // (re)starts. Each invader is a plain { x, y, width, height, alive } rect
  // in absolute canvas coordinates (x/y = top-left) — the same shape the
  // shared AABB test in collision.js expects.
  reset() {
    this.invaders = [];
    for (let row = 0; row < INVADER_ROWS; row++) {
      for (let col = 0; col < INVADER_COLS; col++) {
        this.invaders.push({
          x: START_X + col * CELL_WIDTH,
          y: START_Y + row * CELL_HEIGHT,
          width: INVADER_WIDTH,
          height: INVADER_HEIGHT,
          alive: true,
        });
      }
    }
    // +1 = marching right, -1 = marching left.
    this.direction = 1;

    // Seconds accumulated toward the next update()-paced step; see update().
    this.stepAccumulator = 0;
  }

  // Fixed-interval pacing for step(): accumulates dt in seconds and runs
  // step() once per INVADER_STEP_INTERVAL crossed. The while loop (rather
  // than a single if) means a large dt — e.g. a tab resuming after being
  // backgrounded — runs the edge check for every interval it spans instead
  // of skipping straight past a boundary.
  update(dt) {
    this.stepAccumulator += dt;
    while (this.stepAccumulator >= INVADER_STEP_INTERVAL) {
      this.stepAccumulator -= INVADER_STEP_INTERVAL;
      this.step();
    }
  }

  // One discrete march step: every living invader moves STEP_X px in the
  // current direction, as a single unit. Dead invaders are skipped in
  // place, so killing one never alters the position or movement of the
  // rest.
  //
  // Edge check on the edge-most LIVING invader: when this step makes it
  // reach either side edge of the canvas, the whole formation snaps back to
  // exactly touch that edge, reverses horizontal direction and drops by
  // exactly one invader cell height (DROP_STEP === CELL_HEIGHT).
  step() {
    const dx = this.direction * STEP_X;

    let anyAlive = false;
    let leftEdge = Infinity;
    let rightEdge = -Infinity;
    for (const invader of this.invaders) {
      if (!invader.alive) continue;
      anyAlive = true;
      invader.x += dx;
      if (invader.x < leftEdge) leftEdge = invader.x;
      if (invader.x + invader.width > rightEdge) rightEdge = invader.x + invader.width;
    }

    // With none left there is simply nothing to move; the all-clear flow is
    // owned by the level cards.
    if (!anyAlive) return;

    const hitRight = this.direction > 0 && rightEdge >= CANVAS_WIDTH;
    const hitLeft = this.direction < 0 && leftEdge <= 0;
    if (hitRight || hitLeft) {
      // Horizontal correction that puts the edge invader flush with the
      // canvas edge (0 when it landed exactly on it).
      const shift = hitRight ? CANVAS_WIDTH - rightEdge : -leftEdge;
      this.direction = -this.direction;
      for (const invader of this.invaders) {
        if (!invader.alive) continue;
        invader.x += shift;
        invader.y += DROP_STEP;
      }
    }
  }

  // The number of invaders still alive (55 at spawn). The level cards scale
  // the march pace from it.
  aliveCount() {
    let count = 0;
    for (const invader of this.invaders) {
      if (invader.alive) count++;
    }
    return count;
  }

  // The bottom edge of the lowest living invader in canvas coordinates
  // (the largest y + height), or 0 when none are alive. The level cards
  // compare this against the player's row for the breach check.
  lowestBottom() {
    let bottom = 0;
    for (const invader of this.invaders) {
      if (!invader.alive) continue;
      const invaderBottom = invader.y + invader.height;
      if (invaderBottom > bottom) bottom = invaderBottom;
    }
    return bottom;
  }

  draw(ctx) {
    // One colour for all, one plain filled rectangle per living invader.
    ctx.fillStyle = INVADER_COLOR;
    for (const invader of this.invaders) {
      if (!invader.alive) continue;
      ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
    }
  }
}
