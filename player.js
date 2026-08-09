// player.js — Player ship entity: movement, shooting, drawing, lives
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, BULLET_SPEED, STARTING_LIVES } from './gameConfig.js';
import { isKeyHeld } from './input.js';

// Ship dimensions (px)
const SHIP_WIDTH  = 40;
const SHIP_HEIGHT = 32;

// Bullet dimensions (px)
const BULLET_WIDTH  = 4;
const BULLET_HEIGHT = 12;

// Fixed Y position near the bottom of the canvas
const SHIP_Y = CANVAS_HEIGHT - 60;

export class Player {
  constructor() {
    // Horizontal centre: position tracks the centre-x of the ship
    this.x = CANVAS_WIDTH / 2;  // centre-x
    this.y = SHIP_Y;            // top-y of ship bounding box

    this.lives = STARTING_LIVES;

    // Active bullet state (null = no bullet in flight)
    // bullet.x is centre-x; bullet.y is top-y of bullet rectangle
    this._bullet = null;
  }

  /**
   * Update ship position, bullet travel, and handle shooting.
   * @param {number} dt — delta time in seconds
   */
  update(dt) {
    // --- Movement ---
    if (isKeyHeld('ArrowLeft') || isKeyHeld('a') || isKeyHeld('A')) {
      this.x -= PLAYER_SPEED * dt;
    }
    if (isKeyHeld('ArrowRight') || isKeyHeld('d') || isKeyHeld('D')) {
      this.x += PLAYER_SPEED * dt;
    }

    // --- Clamping: left edge >= 0, right edge <= CANVAS_WIDTH ---
    const halfW = SHIP_WIDTH / 2;
    if (this.x - halfW < 0) {
      this.x = halfW;
    }
    if (this.x + halfW > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - halfW;
    }

    // --- Bullet travel ---
    if (this._bullet !== null) {
      this._bullet.y -= BULLET_SPEED * dt;

      // Remove bullet once its top edge exits above y = 0
      if (this._bullet.y + BULLET_HEIGHT < 0) {
        this._bullet = null;
      }
    }

    // --- Shooting: only if no bullet currently in flight ---
    if (this._bullet === null && isKeyHeld(' ')) {
      this._bullet = {
        x: this.x,                       // centre-x matches ship centre
        y: this.y - BULLET_HEIGHT,       // top of bullet sits at top of ship
      };
    }
  }

  /**
   * Draw the ship and any active bullet.
   * Ship is drawn procedurally within a 40 × 32 px bounding box.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    // Compute top-left corner of the 40x32 bounding box
    const left = this.x - SHIP_WIDTH / 2;
    const top  = this.y;

    ctx.fillStyle = '#00ff00';

    // --- Procedural ship shape (Space Invaders-style cannon) ---
    // Base rectangle: full width, lower portion
    // base: x=left, y=top+16, w=40, h=16
    ctx.fillRect(left, top + 16, 40, 16);

    // Middle body: slightly narrower
    // mid: x=left+6, y=top+8, w=28, h=10
    ctx.fillRect(left + 6, top + 8, 28, 10);

    // Cannon barrel: narrow rectangle at the top centre
    // barrel: x=left+16, y=top, w=8, h=10
    ctx.fillRect(left + 16, top, 8, 10);

    // Optional dome detail: a small arc over the barrel to suggest a cockpit
    ctx.beginPath();
    ctx.arc(this.x, top + 10, 6, Math.PI, 2 * Math.PI);
    ctx.fill();

    // --- Active bullet ---
    if (this._bullet !== null) {
      ctx.fillStyle = '#ffffff';
      // Centre the bullet rect on bullet.x
      ctx.fillRect(
        this._bullet.x - BULLET_WIDTH / 2,
        this._bullet.y,
        BULLET_WIDTH,
        BULLET_HEIGHT
      );
    }
  }

  /**
   * Decrement lives by 1 when the ship is hit.
   * Collision detection (sibling card) calls this method.
   */
  loseLife() {
    this.lives -= 1;
  }

  /**
   * Returns the active bullet object (or null) for use by collision detection.
   * Shape: { x: centreX, y: topY }
   */
  get bullet() {
    return this._bullet;
  }

  /**
   * Called by collision detection when the player bullet has hit a target,
   * so the bullet is cleared immediately (not just on canvas exit).
   */
  clearBullet() {
    this._bullet = null;
  }
}
