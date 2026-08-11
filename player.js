// player.js
// The player's ship: dt-based movement with edge clamping, procedural
// rendering, single-shot bullet firing, and the lives counter later cards
// (collision) will decrement on enemy hits.

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SPEED,
  BULLET_SPEED,
  STARTING_LIVES,
} from './gameConfig.js';
import { isKeyHeld } from './input.js';

const SHIP_WIDTH = 48;
const SHIP_HEIGHT = 32;
const SHIP_MARGIN_BOTTOM = 24;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 16;

export class Player {
  constructor() {
    this.width = SHIP_WIDTH;
    this.height = SHIP_HEIGHT;
    this.x = (CANVAS_WIDTH - this.width) / 2;
    this.y = CANVAS_HEIGHT - this.height - SHIP_MARGIN_BOTTOM;
    this.lives = STARTING_LIVES;
    this.bullet = null; // { x, y } while a shot is in flight, else null
  }

  loseLife() {
    if (this.lives > 0) {
      this.lives -= 1;
    }
  }

  update(dt) {
    if (isKeyHeld('ArrowLeft') || isKeyHeld('a')) {
      this.x -= PLAYER_SPEED * dt;
    }
    if (isKeyHeld('ArrowRight') || isKeyHeld('d')) {
      this.x += PLAYER_SPEED * dt;
    }
    this.x = Math.max(0, Math.min(this.x, CANVAS_WIDTH - this.width));

    if (this.bullet) {
      this.bullet.y -= BULLET_SPEED * dt;
      if (this.bullet.y < 0) {
        this.bullet = null;
      }
    } else if (isKeyHeld(' ')) {
      this.bullet = {
        x: this.x + this.width / 2 - BULLET_WIDTH / 2,
        y: this.y,
      };
    }
  }

  draw(ctx) {
    this.drawShip(ctx);
    if (this.bullet) {
      this.drawBullet(ctx);
    }
  }

  drawShip(ctx) {
    const { x, y, width, height } = this;
    const centerX = x + width / 2;

    ctx.fillStyle = '#3cff6e';

    // Hull: a triangular body over a low rectangular base.
    ctx.beginPath();
    ctx.moveTo(centerX, y);
    ctx.lineTo(x + width, y + height * 0.75);
    ctx.lineTo(x, y + height * 0.75);
    ctx.closePath();
    ctx.fill();

    ctx.fillRect(x + width * 0.15, y + height * 0.75, width * 0.7, height * 0.25);

    // Cockpit dome.
    ctx.beginPath();
    ctx.arc(centerX, y + height * 0.6, width * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();
  }

  drawBullet(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.bullet.x, this.bullet.y, BULLET_WIDTH, BULLET_HEIGHT);
  }
}
