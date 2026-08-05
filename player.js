// player.js — Player ship entity

import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, BULLET_SPEED, STARTING_LIVES } from './gameConfig.js';
import { isKeyHeld } from './input.js';

// Ship dimensions (used for clamping and drawing)
export const SHIP_WIDTH  = 40;
export const SHIP_HEIGHT = 32;

// Bullet dimensions
export const BULLET_WIDTH  = 4;
export const BULLET_HEIGHT = 12;

/**
 * Player class
 *
 * Public API:
 *   update(dt)      — call each fixed-timestep tick (dt in seconds)
 *   draw(ctx)       — call each render frame
 *   lives           — readable integer; initialised from STARTING_LIVES
 *   getBullet()     — returns the current bullet object or null
 *   clearBullet()   — removes the bullet (called by collision system)
 */
export class Player {
  constructor() {
    // Start centred horizontally, near the bottom of the canvas
    this.x = (CANVAS_WIDTH - SHIP_WIDTH) / 2;
    this.y = CANVAS_HEIGHT - SHIP_HEIGHT - 24;

    this.lives = STARTING_LIVES;

    // Bullet state — null means no bullet in flight
    this._bullet = null;
  }

  /**
   * getBullet()
   * Returns the current bullet with normalised width/height fields,
   * or null if no bullet is in flight.
   */
  getBullet() {
    if (this._bullet === null) return null;
    return {
      x:      this._bullet.x,
      y:      this._bullet.y,
      width:  BULLET_WIDTH,
      height: BULLET_HEIGHT,
    };
  }

  /**
   * clearBullet()
   * Deactivates the current bullet (called by the collision system on hit).
   */
  clearBullet() {
    this._bullet = null;
  }

  /**
   * update(dt)
   * @param {number} dt — delta time in seconds (fixed timestep, ~1/60)
   */
  update(dt) {
    // --- Horizontal movement ---
    const movingLeft  = isKeyHeld('ArrowLeft')  || isKeyHeld('KeyA');
    const movingRight = isKeyHeld('ArrowRight') || isKeyHeld('KeyD');

    if (movingLeft)  this.x -= PLAYER_SPEED * dt;
    if (movingRight) this.x += PLAYER_SPEED * dt;

    // Clamp: left edge >= 0, right edge <= CANVAS_WIDTH
    if (this.x < 0)                          this.x = 0;
    if (this.x + SHIP_WIDTH > CANVAS_WIDTH)  this.x = CANVAS_WIDTH - SHIP_WIDTH;

    // --- Bullet update ---
    if (this._bullet !== null) {
      // Move bullet upward
      this._bullet.y -= BULLET_SPEED * dt;

      // Remove bullet once it exits the top of the canvas
      if (this._bullet.y + BULLET_HEIGHT < 0) {
        this._bullet = null;
      }
    }

    // --- Fire ---
    // Only fire if Space is held AND no bullet is currently in flight
    if (isKeyHeld('Space') && this._bullet === null) {
      this._bullet = {
        // Horizontally centred on the ship; starts just above the ship
        x: this.x + (SHIP_WIDTH  - BULLET_WIDTH)  / 2,
        y: this.y - BULLET_HEIGHT,
      };
    }
  }

  /**
   * draw(ctx)
   * Renders the ship procedurally (arcs + rectangles) and the bullet if present.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    // --- Draw the bullet first (behind ship) ---
    if (this._bullet !== null) {
      ctx.fillStyle = '#ff0';
      ctx.fillRect(
        Math.round(this._bullet.x),
        Math.round(this._bullet.y),
        BULLET_WIDTH,
        BULLET_HEIGHT
      );
    }

    // --- Draw the ship ---
    const sx = Math.round(this.x);
    const sy = Math.round(this.y);

    ctx.fillStyle = '#0f0';

    // Base rectangle — the main hull
    ctx.fillRect(sx, sy + 12, SHIP_WIDTH, 20);

    // Cockpit — a small arc on top of the hull, centred
    ctx.beginPath();
    ctx.arc(
      sx + SHIP_WIDTH / 2,  // centre x
      sy + 12,              // centre y (top of hull)
      10,                   // radius
      Math.PI,              // start angle (left)
      0,                    // end angle   (right)
      false                 // clockwise
    );
    ctx.fill();

    // Left wing nub
    ctx.fillRect(sx,                    sy + 24, 8,  8);
    // Right wing nub
    ctx.fillRect(sx + SHIP_WIDTH - 8,   sy + 24, 8,  8);
  }
}
