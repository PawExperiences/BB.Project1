// invaders.js
// The invader formation: an 11x5 grid of identical rectangles that marches
// sideways as a single unit and steps down whenever any invader in the
// formation reaches a canvas edge. Owned by this card; game.js only
// imports/instantiates InvaderFormation and calls its per-frame
// update/draw.

import { CANVAS_WIDTH } from './gameConfig.js';

const COLUMNS = 11;
const ROWS = 5;
const INVADER_WIDTH = 32;
const INVADER_HEIGHT = 24;
const H_SPACING = 16;
const V_SPACING = 16;
const GRID_MARGIN_TOP = 60;
const FORMATION_SPEED = 40; // px/sec
const STEP_DOWN = 24; // px, vertical drop when the formation reverses
const INVADER_COLOR = '#ff4444';

function formationWidth() {
  return COLUMNS * INVADER_WIDTH + (COLUMNS - 1) * H_SPACING;
}

export class InvaderFormation {
  constructor() {
    this.invaders = [];
    const startX = (CANVAS_WIDTH - formationWidth()) / 2;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLUMNS; col++) {
        this.invaders.push({
          x: startX + col * (INVADER_WIDTH + H_SPACING),
          y: GRID_MARGIN_TOP + row * (INVADER_HEIGHT + V_SPACING),
          width: INVADER_WIDTH,
          height: INVADER_HEIGHT,
        });
      }
    }
    this.direction = 1; // 1 = moving right, -1 = moving left

    // Invader bullets in flight: always empty in this card, since invaders
    // don't fire yet (that's "Level 2: they shoot back"). Exposed here so
    // collision.js's invader-bullet-vs-player check can run generically off
    // whatever this array holds, without this card inventing invader fire.
    this.bullets = [];
  }

  update(dt) {
    if (this.invaders.length === 0) return;

    const dx = FORMATION_SPEED * this.direction * dt;
    let hitEdge = false;
    for (const invader of this.invaders) {
      const nextX = invader.x + dx;
      if (nextX < 0 || nextX + invader.width > CANVAS_WIDTH) {
        hitEdge = true;
        break;
      }
    }

    if (hitEdge) {
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
