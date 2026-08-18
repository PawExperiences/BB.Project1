// The invader formation: an 11-column x 5-row grid (55 invaders, the
// classic formation) of identical filled rectangles. The level cards drive
// the march in discrete steps via step(): each step moves the whole
// formation sideways by one fixed increment as a unit, and when the
// edge-most living invader reaches a side edge of the canvas the formation
// snaps flush to that edge, drops by exactly one invader cell height and
// reverses horizontal direction.
// Added by "Sprite rendering and collision detection"; the discrete-step
// march and the aliveCount()/lowestBottom() lifecycle queries were added by
// "Level 1: the classic grid".

import { CANVAS_WIDTH } from './gameConfig.js';

// Grid shape — exported so the classic 11 x 5 = 55 formation is checkable
// from the outside (README verification, the level cards).
export const INVADER_COLS = 11;
export const INVADER_ROWS = 5;

// Invader geometry in px. Every invader is the same filled rectangle in the
// same single colour — no sprite art, no image assets, and no per-row
// variety (distinct types/rows/colours are explicitly out of scope for this
// card).
const INVADER_WIDTH = 36;
const INVADER_HEIGHT = 24;
const INVADER_COLOR = '#ffffff';

// Cell pitch: the invader plus the gap to its neighbour.
const CELL_WIDTH = 48; // 36 px invader + 12 px horizontal gap
const CELL_HEIGHT = 32; // 24 px invader + 8 px vertical gap

// Home position of the whole grid: horizontally centered, just below the
// HUD band (the Score/Lives text ends at y = 52).
const FORMATION_WIDTH = (INVADER_COLS - 1) * CELL_WIDTH + INVADER_WIDTH; // 516
const START_X = (CANVAS_WIDTH - FORMATION_WIDTH) / 2; // 126
const START_Y = 112;

// March increments: STEP_X px sideways per discrete step (how often step()
// is called — the pacing — is owned by the level cards), and a downward
// drop of exactly one invader cell height at each edge reversal.
const STEP_X = 8;
const DROP_STEP = CELL_HEIGHT;

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
