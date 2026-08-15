// The invader swarm: an 11x5 grid of identical flat-colored rectangles that
// steps sideways as one unit, dropping and reversing direction at the canvas
// edges. Also owns the (currently always-empty) collection of invader-fired
// bullets that a later card ("Level 2: they shoot back") will populate;
// collision.js reads/writes this array generically, but no spawning or
// shooting AI is implemented here.

import { CANVAS_WIDTH } from './gameConfig.js';

const INVADER_COLS = 11;
const INVADER_ROWS = 5;
const INVADER_WIDTH = 32;
const INVADER_HEIGHT = 24;
const INVADER_H_SPACING = 48;
const INVADER_V_SPACING = 40;
const INVADER_START_X = (CANVAS_WIDTH - ((INVADER_COLS - 1) * INVADER_H_SPACING + INVADER_WIDTH)) / 2;
const INVADER_START_Y = 80;

const STEP_INTERVAL = 0.5; // seconds between formation steps
const H_STEP = 12; // pixels moved sideways per step
const DROP_STEP = 24; // pixels dropped when the formation hits an edge and reverses

const EXPLOSION_DURATION = 0.2; // seconds an explosion is shown before the invader is fully gone

const INVADER_COLOR = '#ff3b3b';
const EXPLOSION_COLOR = '#ffcc00';

export class Invaders {
  constructor() {
    this.invaders = [];
    for (let row = 0; row < INVADER_ROWS; row++) {
      for (let col = 0; col < INVADER_COLS; col++) {
        this.invaders.push({ col, row, alive: true, exploding: false, explodeTimer: 0 });
      }
    }

    // Invader-owned bullets: { x, y, width, height }. Stays empty in this
    // card; a later card is responsible for pushing bullets into it.
    this.bullets = [];

    this.offsetX = 0;
    this.offsetY = 0;
    this.direction = 1;
    this.stepTimer = 0;
  }

  getAliveInvaders() {
    return this.invaders.filter((inv) => inv.alive);
  }

  getBounds(inv) {
    return {
      x: INVADER_START_X + this.offsetX + inv.col * INVADER_H_SPACING,
      y: INVADER_START_Y + this.offsetY + inv.row * INVADER_V_SPACING,
      width: INVADER_WIDTH,
      height: INVADER_HEIGHT,
    };
  }

  kill(inv) {
    inv.alive = false;
    inv.exploding = true;
    inv.explodeTimer = EXPLOSION_DURATION;
  }

  update(dt) {
    for (const inv of this.invaders) {
      if (!inv.exploding) continue;
      inv.explodeTimer -= dt;
      if (inv.explodeTimer <= 0) {
        inv.exploding = false;
      }
    }

    this.stepTimer += dt;
    if (this.stepTimer >= STEP_INTERVAL) {
      this.stepTimer -= STEP_INTERVAL;
      this._step();
    }
  }

  _step() {
    const bounds = this._aliveHorizontalBounds();
    if (bounds === null) return;

    const nextLeft = bounds.left + this.direction * H_STEP;
    const nextRight = bounds.right + this.direction * H_STEP;

    if (nextLeft < 0 || nextRight > CANVAS_WIDTH) {
      this.offsetY += DROP_STEP;
      this.direction *= -1;
    } else {
      this.offsetX += this.direction * H_STEP;
    }
  }

  _aliveHorizontalBounds() {
    let minCol = null;
    let maxCol = null;
    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      if (minCol === null || inv.col < minCol) minCol = inv.col;
      if (maxCol === null || inv.col > maxCol) maxCol = inv.col;
    }
    if (minCol === null) return null;

    return {
      left: INVADER_START_X + this.offsetX + minCol * INVADER_H_SPACING,
      right: INVADER_START_X + this.offsetX + maxCol * INVADER_H_SPACING + INVADER_WIDTH,
    };
  }

  draw(ctx) {
    ctx.fillStyle = INVADER_COLOR;
    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      const b = this.getBounds(inv);
      ctx.fillRect(b.x, b.y, b.width, b.height);
    }

    ctx.fillStyle = EXPLOSION_COLOR;
    for (const inv of this.invaders) {
      if (!inv.exploding) continue;
      const b = this.getBounds(inv);
      ctx.fillRect(b.x, b.y, b.width, b.height);
    }
  }
}
