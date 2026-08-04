// player.js — Player ship implementation.
// Exports the Player class and shared constants.

import {
  STARTING_LIVES,
  CANVAS_WIDTH as CFG_CANVAS_WIDTH,
  CANVAS_HEIGHT as CFG_CANVAS_HEIGHT,
  PLAYER_SPEED as CFG_PLAYER_SPEED,
  BULLET_SPEED as CFG_BULLET_SPEED,
} from './gameConfig.js';
import { isKeyHeld } from './input.js';

// ─────────────────────────────────────────────
// Exported constants (kept for back-compat; invaders.js imports CANVAS_WIDTH from here)
// ─────────────────────────────────────────────

/** Canvas width in pixels — re-exported so other modules can import from here. */
export const CANVAS_WIDTH  = CFG_CANVAS_WIDTH;

/** Player ship speed in pixels per second — imported from gameConfig.js. */
export const PLAYER_SPEED  = CFG_PLAYER_SPEED;

/** Bullet travel speed in pixels per second (upward) — imported from gameConfig.js. */
export const BULLET_SPEED  = CFG_BULLET_SPEED;

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

export class Player {
  constructor() {
    // Starting lives from gameConfig
    this.lives = STARTING_LIVES;

    // Ship position (top-left corner)
    this.x = CFG_CANVAS_WIDTH  / 2 - SHIP_W / 2;
    this.y = CFG_CANVAS_HEIGHT - 60 - SHIP_H;

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
    if (isKeyHeld('ArrowLeft')  || isKeyHeld('a')) dx -= CFG_PLAYER_SPEED * dt;
    if (isKeyHeld('ArrowRight') || isKeyHeld('d')) dx += CFG_PLAYER_SPEED * dt;

    this.x += dx;

    // Clamp: left edge ≥ 0, right edge ≤ CANVAS_WIDTH
    if (this.x < 0)                            this.x = 0;
    if (this.x + SHIP_W > CFG_CANVAS_WIDTH)    this.x = CFG_CANVAS_WIDTH - SHIP_W;

    // ── Bullet ──
    if (this.bullet !== null) {
      // Move bullet upward
      this.bullet.y -= CFG_BULLET_SPEED * dt;

      // Clear bullet once its top edge exits the canvas (y < 0)
      if (this.bullet.y < 0) {
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
      false                         // clockwise = false → upper semicircle
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
