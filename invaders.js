// The invader formation: an 11-column x 5-row grid (55 invaders, the
// classic formation) of identical filled rectangles that marches sideways
// as a single unit, reversing direction and dropping one fixed step
// whenever its edge-most invader reaches a side edge of the canvas.
// Added by "Sprite rendering and collision detection".

import { CANVAS_WIDTH } from './gameConfig.js';

// Grid shape — exported so the classic 11 x 5 = 55 formation is checkable
// from the outside (README verification, later level cards).
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

// Sideways drift speed in px/s (dt-scaled, like the player ship) and the
// fixed downward step taken at each edge reversal.
const FORMATION_SPEED = 40;
const DROP_STEP = 24;

export class InvaderFormation {
  constructor() {
    this.reset();
  }

  // Back to the full starting formation: 55 living invaders in their home
  // position, marching right. game.js calls this at the start of every
  // game. Each invader is a plain { x, y, width, height, alive } rect in
  // absolute canvas coordinates (x/y = top-left) — the same shape the
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

  update(dt) {
    // The formation moves as a single unit: every living invader gets the
    // same dx this step. Dead invaders are skipped in place, so killing one
    // never alters the position or movement of the rest.
    const dx = this.direction * FORMATION_SPEED * dt;

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

    // All-clear (every invader destroyed) is a level/game-flow concern and
    // out of scope for this card: with none left there is simply nothing to
    // move.
    if (!anyAlive) return;

    // Edge check on the edge-most LIVING invader: when it reaches either
    // side edge of the canvas, the whole formation snaps back to exactly
    // touch that edge, reverses horizontal direction and drops one fixed
    // step downward as a unit.
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

  draw(ctx) {
    // One colour for all, one plain filled rectangle per living invader.
    ctx.fillStyle = INVADER_COLOR;
    for (const invader of this.invaders) {
      if (!invader.alive) continue;
      ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
    }
  }
}
