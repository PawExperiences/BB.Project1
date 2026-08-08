// player.js — Player ship, bullet, and lives counter
// Owned by card: "Keyboard input and the player ship"

import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, BULLET_SPEED, INITIAL_LIVES } from './gameConfig.js';
import { isKeyHeld } from './input.js';

// Ship visual dimensions (fits within ~50 × 40 px bounding box)
const SHIP_WIDTH  = 50;
const SHIP_HEIGHT = 40;

// Bullet visual dimensions
const BULLET_WIDTH  = 4;
const BULLET_HEIGHT = 12;

export class Player {
  constructor() {
    // Spawn horizontally centred, near the bottom of the canvas
    this.x      = (CANVAS_WIDTH  - SHIP_WIDTH)  / 2;  // left edge of bounding box
    this.y      = CANVAS_HEIGHT - 60;                  // top edge of bounding box
    this.width  = SHIP_WIDTH;
    this.height = SHIP_HEIGHT;

    this.lives  = INITIAL_LIVES;
    this.bullet = null;  // { x, y } — null when no bullet is in flight
  }

  /**
   * update(dt)
   * Advance player logic by dt seconds.
   * @param {number} dt — delta time in seconds
   */
  update(dt) {
    // --- Movement ---
    if (isKeyHeld('ArrowLeft') || isKeyHeld('a')) {
      this.x -= PLAYER_SPEED * dt;
    }
    if (isKeyHeld('ArrowRight') || isKeyHeld('d')) {
      this.x += PLAYER_SPEED * dt;
    }

    // Clamp: left edge >= 0, right edge <= CANVAS_WIDTH
    if (this.x < 0) {
      this.x = 0;
    }
    if (this.x + this.width > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.width;
    }

    // --- Shooting ---
    if (isKeyHeld(' ') && this.bullet === null) {
      // Create bullet at the horizontal centre of the ship, just above the top edge
      this.bullet = {
        x: this.x + this.width / 2,   // horizontal centre of ship
        y: this.y - BULLET_HEIGHT,     // just above ship top edge
      };
    }

    // --- Advance bullet ---
    if (this.bullet !== null) {
      this.bullet.y -= BULLET_SPEED * dt;

      // Remove bullet once its top edge exits the top of the canvas
      if (this.bullet.y + BULLET_HEIGHT <= 0) {
        this.bullet = null;
      }
    }
  }

  /**
   * draw(ctx)
   * Render the ship and active bullet onto the canvas context.
   * The ship is drawn entirely procedurally — no image assets.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();

    // --- Draw ship ---
    // All coordinates are relative to this.x / this.y (top-left of bounding box).
    // The ship fits within SHIP_WIDTH (50) × SHIP_HEIGHT (40).

    const sx = this.x;
    const sy = this.y;

    // Body — central rectangle (30 × 22 px), centred horizontally
    ctx.fillStyle = '#00cc44';
    ctx.fillRect(sx + 10, sy + 18, 30, 22);

    // Nose — rounded/arc tip at the top centre
    ctx.beginPath();
    ctx.arc(
      sx + SHIP_WIDTH / 2,   // centre x
      sy + 18,               // centre y (top of body)
      10,                    // radius
      Math.PI,               // start angle (left)
      0,                     // end angle (right)
      false                  // counter-clockwise = upper semicircle
    );
    ctx.fillStyle = '#00ff66';
    ctx.fill();

    // Left wing stub — small rectangle extending left from the body
    ctx.fillStyle = '#009933';
    ctx.fillRect(sx,      sy + 28, 10, 8);

    // Right wing stub — small rectangle extending right from the body
    ctx.fillRect(sx + 40, sy + 28, 10, 8);

    // Cockpit window — small arc on the nose
    ctx.beginPath();
    ctx.arc(
      sx + SHIP_WIDTH / 2,
      sy + 14,
      4,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = '#ccffee';
    ctx.fill();

    // --- Draw bullet ---
    if (this.bullet !== null) {
      ctx.fillStyle = '#ffff00';
      // Bullet is centred on bullet.x; top edge is at bullet.y
      ctx.fillRect(
        this.bullet.x - BULLET_WIDTH / 2,
        this.bullet.y,
        BULLET_WIDTH,
        BULLET_HEIGHT
      );
    }

    ctx.restore();
  }
}
