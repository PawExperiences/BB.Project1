// player.js — Player ship: movement, shooting, drawing, and lives.

import {
  PLAYER_SPEED,
  BULLET_SPEED,
  CANVAS_WIDTH,
  STARTING_LIVES,
} from './gameConfig.js';
import { isKeyHeld } from './input.js';

// Ship dimensions (used for clamping and drawing)
const SHIP_WIDTH  = 40;
const SHIP_HEIGHT = 32;

// Bullet dimensions
const BULLET_WIDTH  = 4;
const BULLET_HEIGHT = 14;

export class Player {
  /**
   * @param {number} startX   Initial centre-x of the ship.
   * @param {CanvasRenderingContext2D} ctx
   */
  constructor(startX, ctx) {
    // Store context for draw calls
    this._ctx = ctx;

    // Position tracks the LEFT EDGE of the ship for easy clamping
    this.x = startX - SHIP_WIDTH / 2;
    this.y = 0; // set properly by the game loop / level card if needed;
                // default to bottom of canvas minus a small margin
    // If no external y is set we position near the bottom of the canvas.
    // Callers may assign player.y after construction.
    const CANVAS_HEIGHT_DEFAULT = 896;
    this.y = CANVAS_HEIGHT_DEFAULT - SHIP_HEIGHT - 24;

    // Lives
    this.lives = STARTING_LIVES;

    // Bullet state — null means no bullet in flight
    this._bullet = null; // { x, y } when active
  }

  /**
   * Update movement and bullet each frame.
   * @param {number} dt  Delta time in seconds.
   */
  update(dt) {
    // --- Movement ---
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

      // Remove bullet once its top edge exits the canvas top
      if (this._bullet.y + BULLET_HEIGHT <= 0) {
        this._bullet = null;
      }
    }

    // --- Shooting ---
    // Only fire when Space is held AND no bullet is currently in flight
    if (this._bullet === null && isKeyHeld('Space')) {
      // Spawn bullet centred on ship, at the ship's top edge
      this._bullet = {
        x: this.x + SHIP_WIDTH / 2 - BULLET_WIDTH / 2,
        y: this.y - BULLET_HEIGHT,
      };
    }
  }

  /**
   * Draw the ship and the active bullet (if any).
   * Uses only arcs and rectangles — no image assets.
   */
  draw(ctx) {
    const c = ctx || this._ctx;

    // ---- Draw bullet ----
    if (this._bullet !== null) {
      c.fillStyle = '#ff0';
      c.fillRect(
        Math.round(this._bullet.x),
        Math.round(this._bullet.y),
        BULLET_WIDTH,
        BULLET_HEIGHT
      );
    }

    // ---- Draw ship ----
    // Colour
    c.fillStyle = '#0f0';

    const sx = Math.round(this.x);
    const sy = Math.round(this.y);

    // Base body: wide rectangle
    c.fillRect(sx, sy + 14, SHIP_WIDTH, 18);

    // Cockpit: narrower rectangle in the upper-centre
    c.fillRect(sx + 12, sy + 6, 16, 12);

    // Cannon: thin rectangle at the very top, centred
    c.fillRect(sx + 17, sy, 6, 10);

    // Left fin: small arc / round rectangle (arc used for visual distinction)
    c.beginPath();
    c.arc(sx + 6, sy + 22, 6, Math.PI, 0, false);
    c.fill();

    // Right fin
    c.beginPath();
    c.arc(sx + SHIP_WIDTH - 6, sy + 22, 6, Math.PI, 0, false);
    c.fill();
  }

  /** Expose ship width for external collision / positioning use. */
  get width()  { return SHIP_WIDTH; }
  /** Expose ship height for external use. */
  get height() { return SHIP_HEIGHT; }

  /** True if a bullet is currently in flight. */
  get bulletActive() { return this._bullet !== null; }

  /** Current bullet state (null or {x,y}) — read-only copy for collision cards. */
  get bullet() { return this._bullet ? { ...this._bullet, width: BULLET_WIDTH, height: BULLET_HEIGHT } : null; }
}
