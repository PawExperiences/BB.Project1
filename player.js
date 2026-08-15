// The player ship: movement, edge clamping, procedural drawing, a
// single in-flight bullet, the player's lives counter, the session-wide
// cumulative shot counter (used by level2.js's UFO scoring tiers, so it
// must never reset across a level transition, only on a fresh run), and
// post-respawn invulnerability. Respawn/invulnerability are driven by the
// Level card that detects the hit (currently level2.js); this module only
// owns the resulting position reset, timer and flash rendering.

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SPEED,
  BULLET_SPEED,
  STARTING_LIVES,
} from './gameConfig.js';
import { isKeyHeld } from './input.js';

const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 32;
const PLAYER_Y = CANVAS_HEIGHT - 60;

const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 14;

const RESPAWN_INVULNERABILITY_SECONDS = 2;
const INVULNERABILITY_FLASH_INTERVAL_SECONDS = 0.1;

export class Player {
  constructor() {
    this.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
    this.y = PLAYER_Y;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.bullet = null;
    this.lives = STARTING_LIVES;
    this.shotCount = 0;
    this.invulnerableTimer = 0;
  }

  getLives() {
    return this.lives;
  }

  decrementLives() {
    this.lives = Math.max(0, this.lives - 1);
    return this.lives;
  }

  getShotCount() {
    return this.shotCount;
  }

  // Resets the ship to the fixed bottom-centre start position and grants
  // RESPAWN_INVULNERABILITY_SECONDS of invulnerability. Called by a Level
  // card after it decides a hit costs a life; this method never decides
  // that itself.
  respawn() {
    this.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
    this.y = PLAYER_Y;
    this.invulnerableTimer = RESPAWN_INVULNERABILITY_SECONDS;
  }

  isInvulnerable() {
    return this.invulnerableTimer > 0;
  }

  fire() {
    if (this.bullet) return;
    this.bullet = {
      x: this.x + this.width / 2 - BULLET_WIDTH / 2,
      y: this.y,
    };
    this.shotCount += 1;
  }

  update(dt) {
    if (isKeyHeld('ArrowLeft') || isKeyHeld('a') || isKeyHeld('A')) {
      this.x -= PLAYER_SPEED * dt;
    }
    if (isKeyHeld('ArrowRight') || isKeyHeld('d') || isKeyHeld('D')) {
      this.x += PLAYER_SPEED * dt;
    }

    if (this.x < 0) {
      this.x = 0;
    } else if (this.x + this.width > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.width;
    }

    if (isKeyHeld(' ')) {
      this.fire();
    }

    if (this.bullet) {
      this.bullet.y -= BULLET_SPEED * dt;
      if (this.bullet.y + BULLET_HEIGHT < 0) {
        this.bullet = null;
      }
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }
  }

  draw(ctx) {
    if (!this.isInvulnerable() || this._isFlashVisible()) {
      this._drawShip(ctx);
    }
    this._drawBullet(ctx);
  }

  // Toggles on/off every INVULNERABILITY_FLASH_INTERVAL_SECONDS as
  // invulnerableTimer counts down, producing a blink effect.
  _isFlashVisible() {
    return Math.floor(this.invulnerableTimer / INVULNERABILITY_FLASH_INTERVAL_SECONDS) % 2 === 0;
  }

  _drawShip(ctx) {
    const { x, y, width, height } = this;
    const centerX = x + width / 2;

    ctx.fillStyle = '#0f8';
    ctx.fillRect(x + width * 0.15, y + height * 0.35, width * 0.7, height * 0.65);

    ctx.beginPath();
    ctx.arc(centerX, y + height * 0.35, width * 0.22, Math.PI, 0);
    ctx.fill();

    ctx.fillRect(x, y + height * 0.75, width * 0.18, height * 0.25);
    ctx.fillRect(x + width * 0.82, y + height * 0.75, width * 0.18, height * 0.25);

    ctx.fillStyle = '#053';
    ctx.beginPath();
    ctx.arc(centerX, y + height * 0.6, width * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawBullet(ctx) {
    if (!this.bullet) return;
    ctx.fillStyle = '#ff0';
    ctx.fillRect(this.bullet.x, this.bullet.y, BULLET_WIDTH, BULLET_HEIGHT);
  }
}
