// player.js — Player ship module
// Exports: Player class with update(dt), draw(ctx), lives property

import { CANVAS_WIDTH, PLAYER_SPEED, BULLET_SPEED, STARTING_LIVES } from './gameConfig.js';
import { isKeyHeld } from './input.js';

// Ship visual dimensions (procedural drawing, no sprites)
const SHIP_WIDTH  = 40;
const SHIP_HEIGHT = 30;

// Bullet visual dimensions
const BULLET_WIDTH  = 4;
const BULLET_HEIGHT = 12;

export class Player {
  /**
   * @param {number} x - Starting x position (left edge of ship)
   * @param {number} y - Starting y position (top edge of ship)
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.lives = STARTING_LIVES;

    // Single in-flight bullet; null when no bullet is active
    this._bullet = null;
  }

  /**
   * Update ship position and bullet state.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // --- Horizontal movement ---
    if (isKeyHeld('ArrowLeft') || isKeyHeld('a')) {
      this.x -= PLAYER_SPEED * dt;
    }
    if (isKeyHeld('ArrowRight') || isKeyHeld('d')) {
      this.x += PLAYER_SPEED * dt;
    }

    // --- Clamp to canvas bounds ---
    if (this.x < 0) {
      this.x = 0;
    }
    if (this.x + SHIP_WIDTH > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - SHIP_WIDTH;
    }

    // --- Bullet logic ---
    if (this._bullet !== null) {
      // Move bullet upward (negative y direction)
      this._bullet.y -= BULLET_SPEED * dt;

      // Remove bullet once it travels fully off the top of the canvas
      if (this._bullet.y + BULLET_HEIGHT <= 0) {
        this._bullet = null;
      }
    } else {
      // No bullet in flight — fire one if Space is held
      if (isKeyHeld(' ')) {
        this._bullet = {
          // Centre the bullet horizontally on the ship
          x: this.x + (SHIP_WIDTH  - BULLET_WIDTH)  / 2,
          // Spawn just above the ship's top edge
          y: this.y - BULLET_HEIGHT,
        };
      }
    }
  }

  /**
   * Draw the ship and active bullet procedurally.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();

    // --- Draw bullet (small filled rectangle) ---
    if (this._bullet !== null) {
      ctx.fillStyle = '#ff0';
      ctx.fillRect(
        Math.round(this._bullet.x),
        Math.round(this._bullet.y),
        BULLET_WIDTH,
        BULLET_HEIGHT
      );
    }

    // --- Draw ship procedurally using rectangles and an arc ---
    const sx = Math.round(this.x);
    const sy = Math.round(this.y);

    ctx.fillStyle = '#0f0';

    // Main body — wide rectangle at the base
    ctx.fillRect(sx, sy + SHIP_HEIGHT * 0.4, SHIP_WIDTH, SHIP_HEIGHT * 0.6);

    // Cockpit — dome drawn with an arc centred on the ship
    const cockpitCentreX = sx + SHIP_WIDTH / 2;
    const cockpitBaseY   = sy + SHIP_HEIGHT * 0.4;
    const cockpitRadius  = SHIP_WIDTH * 0.22;

    ctx.beginPath();
    ctx.arc(
      cockpitCentreX,
      cockpitBaseY,
      cockpitRadius,
      Math.PI,   // start angle (left side)
      0,         // end angle (right side)
      false      // draw counter-clockwise = upper semicircle
    );
    ctx.closePath();
    ctx.fill();

    // Left cannon nub
    ctx.fillRect(sx, sy + SHIP_HEIGHT * 0.4, SHIP_WIDTH * 0.15, -SHIP_HEIGHT * 0.3);
    // Right cannon nub
    ctx.fillRect(
      sx + SHIP_WIDTH * 0.85,
      sy + SHIP_HEIGHT * 0.4,
      SHIP_WIDTH * 0.15,
      -SHIP_HEIGHT * 0.3
    );

    ctx.restore();
  }

  /** Read-only width for external clamping / collision use */
  get width() {
    return SHIP_WIDTH;
  }

  /** Read-only height for external use */
  get height() {
    return SHIP_HEIGHT;
  }

  /** The active bullet object {x, y}, or null if none is in flight */
  get bullet() {
    return this._bullet;
  }
}
