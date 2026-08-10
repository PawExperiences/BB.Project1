import { CANVAS_WIDTH, PLAYER_SPEED, BULLET_SPEED } from './gameConfig.js';
import { isKeyHeld } from './input.js';

const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 28;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 14;

export class Player {
  // x/y are the ship's center point.
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.bullet = null; // { x, y } of the single in-flight bullet, or null
  }

  update(dt) {
    let dx = 0;
    if (isKeyHeld('ArrowLeft') || isKeyHeld('a') || isKeyHeld('A')) dx -= 1;
    if (isKeyHeld('ArrowRight') || isKeyHeld('d') || isKeyHeld('D')) dx += 1;
    this.x += dx * PLAYER_SPEED * dt;

    const halfWidth = this.width / 2;
    if (this.x - halfWidth < 0) {
      this.x = halfWidth;
    } else if (this.x + halfWidth > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - halfWidth;
    }

    if (this.bullet) {
      this.bullet.y -= BULLET_SPEED * dt;
      if (this.bullet.y + BULLET_HEIGHT < 0) {
        this.bullet = null;
      }
    } else if (isKeyHeld(' ')) {
      this.bullet = { x: this.x, y: this.y - this.height / 2 - BULLET_HEIGHT };
    }
  }

  draw(ctx) {
    const { x, y, width, height } = this;
    const hullTop = y - height / 2 + height * 0.35;

    ctx.fillStyle = '#00e5ff';

    // Hull.
    ctx.fillRect(x - width / 2, hullTop, width, height * 0.65);

    // Cockpit dome.
    ctx.beginPath();
    ctx.arc(x, hullTop, width * 0.28, Math.PI, 0);
    ctx.fill();

    // Cannon nub.
    ctx.fillRect(x - width * 0.06, y - height / 2 - height * 0.15, width * 0.12, height * 0.25);

    if (this.bullet) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.bullet.x - BULLET_WIDTH / 2, this.bullet.y, BULLET_WIDTH, BULLET_HEIGHT);
    }
  }
}
