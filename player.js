// player.js — Player ship entity
// Card: "Keyboard input and the player ship"

import { CANVAS_WIDTH, PLAYER_SPEED, BULLET_SPEED, STARTING_LIVES } from './gameConfig.js';
import { isKeyHeld } from './input.js';

// Re-export the named speed constants so they are traceable and not magic numbers.
export { PLAYER_SPEED, BULLET_SPEED };

// ─── Ship dimensions (used for clamping and drawing) ──────────────────────────
const SHIP_WIDTH  = 48; // px
const SHIP_HEIGHT = 32; // px

// ─── Bullet dimensions ────────────────────────────────────────────────────────
const BULLET_W = 4;  // px
const BULLET_H = 12; // px

export class Player {
  /**
   * @param {number} startX  Initial centre-x position
   * @param {number} startY  Initial centre-y position
   */
  constructor(startX, startY) {
    // Position tracks the centre of the ship
    this.x = startX;
    this.y = startY;

    // Lives counter — readable/writable by external code (level cards)
    this.lives = STARTING_LIVES;

    // Active player bullet (null when none in flight)
    // { x, y } where x/y is the centre-top of the bullet
    this._bullet = null;
  }

  // ── Public accessor so external code can check bullet state if needed ──────
  get bullet() {
    return this._bullet;
  }

  /**
   * Advance movement and bullet position by dt seconds.
   * @param {number} dt  Delta time in seconds
   */
  update(dt) {
    this._handleMovement(dt);
    this._handleFire();
    this._updateBullet(dt);
  }

  /**
   * Draw the ship and any active bullet onto ctx.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    this._drawShip(ctx);
    if (this._bullet) {
      this._drawBullet(ctx);
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  _handleMovement(dt) {
    let direction = 0;

    if (isKeyHeld('ArrowLeft') || isKeyHeld('a')) {
      direction -= 1;
    }
    if (isKeyHeld('ArrowRight') || isKeyHeld('d')) {
      direction += 1;
    }

    if (direction !== 0) {
      this.x += direction * PLAYER_SPEED * dt;

      // Clamp: left edge >= 0, right edge <= CANVAS_WIDTH
      const halfW = SHIP_WIDTH / 2;
      if (this.x - halfW < 0) {
        this.x = halfW;
      }
      if (this.x + halfW > CANVAS_WIDTH) {
        this.x = CANVAS_WIDTH - halfW;
      }
    }
  }

  _handleFire() {
    // Only fire when no bullet is currently in flight
    if (this._bullet !== null) return;

    if (isKeyHeld(' ')) {
      // Spawn bullet at the nose of the ship (centre-top)
      this._bullet = {
        x: this.x,
        y: this.y - SHIP_HEIGHT / 2,
      };
    }
  }

  _updateBullet(dt) {
    if (!this._bullet) return;

    // Move upward (negative y direction)
    this._bullet.y -= BULLET_SPEED * dt;

    // Remove when the bullet's top edge exits the canvas top
    if (this._bullet.y - BULLET_H < 0) {
      this._bullet = null;
    }
  }

  /**
   * Draw the player ship procedurally:
   * - A rectangular base
   * - An arc (dome/cockpit) on top
   * - Two small "wing" rectangles on each side
   */
  _drawShip(ctx) {
    const cx = this.x;
    const cy = this.y;
    const hw = SHIP_WIDTH / 2;   // half-width
    const hh = SHIP_HEIGHT / 2;  // half-height

    ctx.save();

    // Main body — bright green, classic arcade colour
    ctx.fillStyle = '#00ff00';

    // Base rectangle (lower two-thirds of ship height)
    const bodyTop = cy - hh * 0.4;
    const bodyH   = SHIP_HEIGHT * 0.6;
    ctx.fillRect(cx - hw, bodyTop, SHIP_WIDTH, bodyH);

    // Cockpit dome (arc) centred on the upper portion
    const domeR  = hw * 0.45;
    const domeCY = bodyTop;
    ctx.beginPath();
    ctx.arc(cx, domeCY, domeR, Math.PI, 0); // top semicircle
    ctx.closePath();
    ctx.fill();

    // Left wing tab
    ctx.fillRect(cx - hw - 8, bodyTop + bodyH * 0.4, 10, bodyH * 0.4);
    // Right wing tab
    ctx.fillRect(cx + hw - 2, bodyTop + bodyH * 0.4, 10, bodyH * 0.4);

    // Cannon barrel (thin rectangle sticking up from centre)
    ctx.fillRect(cx - 2, cy - hh - 6, 4, 8);

    ctx.restore();
  }

  /**
   * Draw the player bullet as a small bright filled rectangle.
   */
  _drawBullet(ctx) {
    ctx.save();
    ctx.fillStyle = '#ffff00'; // bright yellow
    ctx.fillRect(
      this._bullet.x - BULLET_W / 2,
      this._bullet.y - BULLET_H,
      BULLET_W,
      BULLET_H
    );
    ctx.restore();
  }
}
