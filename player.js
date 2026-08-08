// player.js — Player ship entity: movement, single-bullet mechanic, drawing
// ES module; depends on input.js and gameConfig.js only.

import { isKeyHeld } from './input.js';
import {
  CANVAS_WIDTH,
  PLAYER_SPEED,
  BULLET_SPEED,
  STARTING_LIVES,
} from './gameConfig.js';

// Ship visual dimensions (used for clamping and drawing)
const SHIP_WIDTH  = 40;  // total width of the ship sprite
const SHIP_HEIGHT = 32;  // total height of the ship sprite

// Bullet visual dimensions
const BULLET_W = 3;
const BULLET_H = 10;

export class Player {
  /**
   * @param {number} x  – horizontal centre of the ship
   * @param {number} y  – vertical centre of the ship
   */
  constructor(x, y) {
    this.x = x;  // centre-x
    this.y = y;  // centre-y

    // AC10: lives initialised from gameConfig
    this.lives = STARTING_LIVES;

    // Bullet state
    this._bulletActive = false;
    this._bulletX      = 0;
    this._bulletY      = 0;
  }

  // -------------------------------------------------------------------------
  // update — called each frame with delta-time in seconds
  // -------------------------------------------------------------------------
  update(dt) {
    // --- Horizontal movement (AC4) ---
    const movingLeft  = isKeyHeld('ArrowLeft')  || isKeyHeld('KeyA');
    const movingRight = isKeyHeld('ArrowRight') || isKeyHeld('KeyD');

    if (movingLeft)  this.x -= PLAYER_SPEED * dt;
    if (movingRight) this.x += PLAYER_SPEED * dt;

    // --- Boundary clamping (AC5) ---
    // Left edge = this.x - SHIP_WIDTH/2  must be >= 0
    // Right edge = this.x + SHIP_WIDTH/2 must be <= CANVAS_WIDTH
    const halfW = SHIP_WIDTH / 2;
    if (this.x - halfW < 0)            this.x = halfW;
    if (this.x + halfW > CANVAS_WIDTH) this.x = CANVAS_WIDTH - halfW;

    // --- Bullet firing (AC6, AC7) ---
    if (isKeyHeld('Space') && !this._bulletActive) {
      this._bulletActive = true;
      this._bulletX      = this.x;              // centre of ship
      this._bulletY      = this.y - SHIP_HEIGHT / 2;  // top of ship
    }

    // --- Bullet travel (AC8) ---
    if (this._bulletActive) {
      this._bulletY -= BULLET_SPEED * dt;

      // Off the top of the canvas — deactivate
      if (this._bulletY + BULLET_H < 0) {
        this._bulletActive = false;
      }
    }
  }

  // -------------------------------------------------------------------------
  // draw — renders ship body and active bullet (AC9)
  // -------------------------------------------------------------------------
  draw(ctx) {
    // --- Draw bullet first (behind ship) ---
    if (this._bulletActive) {
      ctx.fillStyle = '#ff0';
      ctx.fillRect(
        Math.round(this._bulletX - BULLET_W / 2),
        Math.round(this._bulletY),
        BULLET_W,
        BULLET_H,
      );
    }

    // --- Draw ship body procedurally (arc + fillRect, no images) ---
    const cx = Math.round(this.x);
    const cy = Math.round(this.y);

    ctx.save();

    // Base / hull — wide flat rectangle
    ctx.fillStyle = '#0af';
    ctx.fillRect(cx - 20, cy + 4, 40, 12);

    // Mid body — narrower rectangle
    ctx.fillRect(cx - 12, cy - 4, 24, 10);

    // Cannon tip — small rectangle at the top centre
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 3, cy - 16, 6, 14);

    // Cockpit dome — arc drawn as a filled semicircle
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 8, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Convenience accessor: is a bullet currently in flight?
  // (Other modules — e.g. collision — can read this.)
  // -------------------------------------------------------------------------
  get bulletActive() { return this._bulletActive; }
  get bulletX()      { return this._bulletX; }
  get bulletY()      { return this._bulletY; }

  /**
   * Called by collision / level logic when a bullet hits something.
   * Deactivates the bullet so Space can fire again.
   */
  clearBullet() {
    this._bulletActive = false;
  }
}
