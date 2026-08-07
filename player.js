/**
 * player.js — Player ship class.
 *
 * Responsibilities:
 *   - Frame-rate-independent movement via delta-time.
 *   - Single-bullet-in-flight constraint.
 *   - Procedural Canvas 2D drawing (no image assets).
 *   - Exposes this.lives (initialised from gameConfig.js) for external decrement.
 */

import { CANVAS_WIDTH, PLAYER_SPEED, BULLET_SPEED, STARTING_LIVES } from './gameConfig.js';
import { isKeyHeld } from './input.js';

// Ship dimensions (used for clamping and drawing)
const SHIP_WIDTH  = 48;
const SHIP_HEIGHT = 32;

// Bullet dimensions
const BULLET_WIDTH  = 4;
const BULLET_HEIGHT = 12;

export class Player {
  /**
   * @param {number} [startX]  - Initial X position (centre of ship). Defaults to canvas centre.
   * @param {number} [startY]  - Initial Y position (top of ship). Defaults near bottom.
   */
  constructor(startX, startY) {
    // Position refers to the top-left corner of the ship's bounding box.
    this.x = (startX !== undefined ? startX : CANVAS_WIDTH / 2 - SHIP_WIDTH / 2);
    this.y = (startY !== undefined ? startY : 820);

    // Lives — readable by level cards; decrement logic lives in level cards.
    this.lives = STARTING_LIVES;

    // Bullet state
    this._bullet = {
      active: false,
      x: 0,
      y: 0,
    };
  }

  /**
   * Update player position and bullet state.
   * @param {number} dt - Delta time in seconds.
   */
  update(dt) {
    // --- Movement ---
    const movingLeft  = isKeyHeld('ArrowLeft')  || isKeyHeld('a');
    const movingRight = isKeyHeld('ArrowRight') || isKeyHeld('d');

    if (movingLeft) {
      this.x -= PLAYER_SPEED * dt;
    }
    if (movingRight) {
      this.x += PLAYER_SPEED * dt;
    }

    // Clamp: left edge >= 0, right edge <= CANVAS_WIDTH
    if (this.x < 0) {
      this.x = 0;
    }
    if (this.x + SHIP_WIDTH > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - SHIP_WIDTH;
    }

    // --- Shooting ---
    if (isKeyHeld(' ') && !this._bullet.active) {
      // Spawn bullet centred above the ship barrel
      this._bullet.active = true;
      this._bullet.x = this.x + SHIP_WIDTH / 2 - BULLET_WIDTH / 2;
      this._bullet.y = this.y - BULLET_HEIGHT;
    }

    // Advance active bullet
    if (this._bullet.active) {
      this._bullet.y -= BULLET_SPEED * dt;

      // Deactivate once bullet exits top of canvas
      if (this._bullet.y + BULLET_HEIGHT < 0) {
        this._bullet.active = false;
      }
    }
  }

  /**
   * Draw the ship and active bullet using Canvas 2D primitives.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();

    // --- Draw ship ---
    // Colour scheme: green cannon (classic Space Invaders feel)
    ctx.fillStyle = '#00e676';

    // Wide base: a rectangle spanning the full ship width, bottom portion
    const baseHeight = 14;
    const baseY = this.y + SHIP_HEIGHT - baseHeight;
    ctx.fillRect(this.x, baseY, SHIP_WIDTH, baseHeight);

    // Mid body: slightly narrower rectangle
    const midWidth  = Math.round(SHIP_WIDTH * 0.6);
    const midHeight = 10;
    const midX = this.x + (SHIP_WIDTH - midWidth) / 2;
    const midY = baseY - midHeight;
    ctx.fillRect(midX, midY, midWidth, midHeight);

    // Barrel: narrow rectangle at the top-centre
    const barrelWidth  = Math.round(SHIP_WIDTH * 0.2);
    const barrelHeight = 10;
    const barrelX = this.x + (SHIP_WIDTH - barrelWidth) / 2;
    const barrelY = midY - barrelHeight;
    ctx.fillRect(barrelX, barrelY, barrelWidth, barrelHeight);

    // Dome / cockpit: small arc on top of the mid body
    ctx.beginPath();
    ctx.arc(
      this.x + SHIP_WIDTH / 2,  // cx
      midY,                      // cy (top of mid body)
      barrelWidth,               // radius — matches barrel width for a snug dome
      Math.PI,                   // start angle (left side)
      0,                         // end angle   (right side)
      false                      // clockwise = upper half
    );
    ctx.fill();

    // --- Draw bullet ---
    if (this._bullet.active) {
      ctx.fillStyle = '#ffff00'; // bright yellow bullet
      ctx.fillRect(
        this._bullet.x,
        this._bullet.y,
        BULLET_WIDTH,
        BULLET_HEIGHT
      );
    }

    ctx.restore();
  }

  /** Expose bullet state for collision detection by later cards. */
  get bullet() {
    return this._bullet;
  }
}
