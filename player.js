// player.js — Player ship implementation.
// Exports the Player class and shared constants.

import { STARTING_LIVES } from './gameConfig.js';
import { isKeyHeld } from './input.js';

// ─────────────────────────────────────────────
// Exported constants
// ─────────────────────────────────────────────

/** Canvas width in pixels — other modules (levels, collision) import from here. */
export const CANVAS_WIDTH  = 768;

/** Player ship speed in pixels per second. */
export const PLAYER_SPEED  = 200;

/** Bullet travel speed in pixels per second (upward). */
export const BULLET_SPEED  = 500;

// ─────────────────────────────────────────────
// Player class
// ─────────────────────────────────────────────

/** Width of the ship sprite in pixels. */
const SHIP_W = 50;
/** Height of the ship sprite in pixels. */
const SHIP_H = 30;

/** Bullet dimensions. */
const BULLET_W = 4;
const BULLET_H = 14;

/** Canvas height — needed for initial Y position. */
const CANVAS_HEIGHT = 896;

export class Player {
  constructor() {
    // Starting lives from gameConfig
    this.lives = STARTING_LIVES;

    // Ship position (top-left corner)
    this.x = CANVAS_WIDTH / 2 - SHIP_W / 2;
    this.y = CANVAS_HEIGHT - 60 - SHIP_H;

    // Bullet state: null means no bullet in flight
    // { x, y } when a bullet is active
    this.bullet = null;
  }

  /**
   * Update ship position and bullet for one fixed timestep.
   * @param {number} dt  Delta time in seconds
   */
  update(dt) {
    // ── Movement ──
    let dx = 0;
    if (isKeyHeld('ArrowLeft')  || isKeyHeld('a')) dx -= PLAYER_SPEED * dt;
    if (isKeyHeld('ArrowRight') || isKeyHeld('d')) dx += PLAYER_SPEED * dt;

    this.x += dx;

    // Clamp: left edge ≥ 0, right edge ≤ CANVAS_WIDTH
    if (this.x < 0)                       this.x = 0;
    if (this.x + SHIP_W > CANVAS_WIDTH)   this.x = CANVAS_WIDTH - SHIP_W;

    // ── Bullet ──
    if (this.bullet !== null) {
      // Move bullet upward
      this.bullet.y -= BULLET_SPEED * dt;

      // Clear bullet once it exits the top of the canvas
      if (this.bullet.y + BULLET_H < 0) {
        this.bullet = null;
      }
    }

    // Fire a new bullet only when none is in flight
    if (this.bullet === null && isKeyHeld(' ')) {
      this.bullet = {
        x: this.x + SHIP_W / 2 - BULLET_W / 2,
        y: this.y - BULLET_H,
      };
    }
  }

  /**
   * Draw the ship and (if in flight) the bullet.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();

    // ── Ship body ──
    ctx.fillStyle = '#00ff00';

    // Main fuselage rectangle
    const fuselageX = this.x + SHIP_W * 0.2;
    const fuselageY = this.y + SHIP_H * 0.35;
    const fuselageW = SHIP_W * 0.6;
    const fuselageH = SHIP_H * 0.65;
    ctx.fillRect(fuselageX, fuselageY, fuselageW, fuselageH);

    // Wings (left and right rectangles)
    ctx.fillRect(this.x,                     this.y + SHIP_H * 0.55,  SHIP_W * 0.25, SHIP_H * 0.45);
    ctx.fillRect(this.x + SHIP_W * 0.75,     this.y + SHIP_H * 0.55,  SHIP_W * 0.25, SHIP_H * 0.45);

    // Nose cone (arc at the top-centre of the ship)
    ctx.beginPath();
    ctx.arc(
      this.x + SHIP_W / 2,          // cx
      this.y + SHIP_H * 0.4,        // cy
      SHIP_W * 0.15,                // radius
      Math.PI,                      // startAngle  (left)
      0,                            // endAngle    (right)
      false                         // anti-clockwise = false → top semicircle
    );
    ctx.fill();

    // ── Bullet ──
    if (this.bullet !== null) {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(this.bullet.x, this.bullet.y, BULLET_W, BULLET_H);
    }

    ctx.restore();
  }
}
