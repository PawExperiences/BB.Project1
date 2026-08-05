// player.js — Player ship: movement, firing, and drawing.
// Position convention: (x, y) is the TOP-LEFT corner of the ship's bounding box.
// Ship dimensions: SHIP_WIDTH × SHIP_HEIGHT pixels.

import { CANVAS_WIDTH, PLAYER_SPEED, BULLET_SPEED, STARTING_LIVES } from './gameConfig.js';
import { isKeyHeld } from './input.js';

// Ship visual dimensions (pixels)
const SHIP_WIDTH  = 40;
const SHIP_HEIGHT = 32;

// Bullet visual dimensions (pixels)
const BULLET_WIDTH  = 4;
const BULLET_HEIGHT = 10;

export class Player {
  /**
   * @param {number} [startX] — initial left-edge x; defaults to horizontally centred
   * @param {number} [startY] — initial top-edge y; defaults to near the bottom of the canvas
   */
  constructor(startX, startY) {
    // Default starting position: centred horizontally, near the bottom
    this.x = (startX !== undefined) ? startX : (CANVAS_WIDTH / 2 - SHIP_WIDTH / 2);
    this.y = (startY !== undefined) ? startY : (800);  // near the bottom of the 896px canvas

    /** Number of lives remaining — publicly accessible for level cards to decrement. */
    this.lives = STARTING_LIVES;

    /**
     * Single in-flight bullet, or null when none exists.
     * Shape: { x, y, active }
     * x/y is the TOP-LEFT of the bullet rectangle.
     */
    this.bullet = null;
  }

  /**
   * Advances player state by one frame.
   * @param {number} dt — delta-time in seconds
   */
  update(dt) {
    // ── Movement ──────────────────────────────────────────────────────────────
    const movingLeft  = isKeyHeld('ArrowLeft') || isKeyHeld('a') || isKeyHeld('A');
    const movingRight = isKeyHeld('ArrowRight') || isKeyHeld('d') || isKeyHeld('D');

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

    // ── Firing ────────────────────────────────────────────────────────────────
    const bulletActive = this.bullet !== null && this.bullet.active;

    if (isKeyHeld(' ') && !bulletActive) {
      // Spawn bullet at the ship's centre-top
      const bulletX = this.x + SHIP_WIDTH / 2 - BULLET_WIDTH / 2;
      const bulletY = this.y;  // top edge of ship
      this.bullet = { x: bulletX, y: bulletY, active: true };
    }

    // ── Bullet movement ───────────────────────────────────────────────────────
    if (this.bullet !== null && this.bullet.active) {
      this.bullet.y -= BULLET_SPEED * dt;

      // Deactivate once the bullet's top edge passes y < 0
      if (this.bullet.y < 0) {
        this.bullet.active = false;
      }
    }
  }

  /**
   * Draws the player ship and (if active) its bullet onto the provided context.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    // ── Ship body ─────────────────────────────────────────────────────────────
    // Colour scheme: bright green, classic arcade style.
    ctx.fillStyle = '#00ff00';

    // --- Hull: a wide flat rectangle at the bottom of the ship ---
    // Hull: full width × bottom 14 px of the bounding box
    const hullHeight = 14;
    const hullY = this.y + SHIP_HEIGHT - hullHeight;
    ctx.fillRect(this.x, hullY, SHIP_WIDTH, hullHeight);

    // --- Mid-section: narrower rectangle above the hull ---
    const midWidth  = SHIP_WIDTH * 0.6;   // 24 px
    const midHeight = 10;
    const midX = this.x + (SHIP_WIDTH - midWidth) / 2;
    const midY = hullY - midHeight;
    ctx.fillRect(midX, midY, midWidth, midHeight);

    // --- Cockpit: a rounded dome (arc) at the very top ---
    // arc centred at the horizontal mid-point, sitting on top of the mid-section.
    const cockpitCX = this.x + SHIP_WIDTH / 2;
    const cockpitCY = midY;                  // arc base aligns with mid-section top
    const cockpitR  = midWidth / 2;          // 12 px radius

    ctx.beginPath();
    ctx.arc(cockpitCX, cockpitCY, cockpitR, Math.PI, 0, false); // upper semicircle
    ctx.fill();

    // --- Wing arcs: decorative curves sweeping out from the hull sides ---
    ctx.beginPath();
    // Left wing arc — sweeps from hull left-edge upward
    ctx.arc(this.x, hullY, 12, (3 * Math.PI) / 2, Math.PI, true);
    ctx.fill();

    ctx.beginPath();
    // Right wing arc — sweeps from hull right-edge upward
    ctx.arc(this.x + SHIP_WIDTH, hullY, 12, (3 * Math.PI) / 2, 0, false);
    ctx.fill();

    // ── Bullet ────────────────────────────────────────────────────────────────
    if (this.bullet !== null && this.bullet.active) {
      ctx.fillStyle = '#ffff00';  // bright yellow bullet
      ctx.fillRect(
        Math.round(this.bullet.x),
        Math.round(this.bullet.y),
        BULLET_WIDTH,
        BULLET_HEIGHT
      );
    }
  }
}
