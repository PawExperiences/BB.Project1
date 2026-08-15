// The invader swarm: an 11x5 grid of identical rectangles that moves
// sideways as one rigid formation, stepping down and reversing whenever any
// invader reaches a canvas edge.
//
// Reuses CANVAS_WIDTH from gameConfig.js (owned by "Game loop and canvas
// framework") instead of redefining canvas dimensions here.

import { CANVAS_WIDTH } from './gameConfig.js';

const COLUMNS = 11;
const ROWS = 5;

const INVADER_WIDTH = 32;
const INVADER_HEIGHT = 24;
const H_SPACING = 24; // gap between adjacent invaders, left-right
const V_SPACING = 16; // gap between adjacent invaders, top-bottom
const MARGIN_TOP = 80; // distance from the canvas top to the first row

const EDGE_MARGIN = 20; // how close the formation may get to the canvas edge
const FORMATION_SPEED = 40; // px/sec, sideways
const STEP_DOWN = 24; // px, per edge bounce

const INVADER_COLOR = '#ff5252';

const FORMATION_WIDTH = COLUMNS * INVADER_WIDTH + (COLUMNS - 1) * H_SPACING;
const START_X = (CANVAS_WIDTH - FORMATION_WIDTH) / 2;

export class InvaderFormation {
  constructor() {
    this.invaders = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLUMNS; col++) {
        this.invaders.push({
          x: START_X + col * (INVADER_WIDTH + H_SPACING),
          y: MARGIN_TOP + row * (INVADER_HEIGHT + V_SPACING),
          width: INVADER_WIDTH,
          height: INVADER_HEIGHT,
        });
      }
    }

    this.direction = 1; // 1 = moving right, -1 = moving left

    // Bullets fired by invaders. This card never pushes to this array --
    // invader firing/AI is out of scope here (see "Level 2: they shoot
    // back") -- but it's exposed so that card's bullets can flow straight
    // into the generic invader-bullet-vs-player check in collision.js
    // without collision.js redefining the invader-bullet shape itself.
    this.bullets = [];
  }

  update(dt) {
    if (this.invaders.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    for (const invader of this.invaders) {
      minX = Math.min(minX, invader.x);
      maxX = Math.max(maxX, invader.x + invader.width);
    }

    const dx = FORMATION_SPEED * this.direction * dt;
    const hitsRightEdge = this.direction > 0 && maxX + dx > CANVAS_WIDTH - EDGE_MARGIN;
    const hitsLeftEdge = this.direction < 0 && minX + dx < EDGE_MARGIN;

    if (hitsRightEdge || hitsLeftEdge) {
      // Reverse and step down first; the sideways move resumes next frame
      // in the new direction.
      this.direction *= -1;
      for (const invader of this.invaders) {
        invader.y += STEP_DOWN;
      }
    } else {
      for (const invader of this.invaders) {
        invader.x += dx;
      }
    }
  }

  draw(ctx) {
    ctx.fillStyle = INVADER_COLOR;
    for (const invader of this.invaders) {
      ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
    }
  }
}
