/**
 * player.js — Player ship entity.
 *
 * Exports the Player class.
 * Handles:
 *  - Horizontal movement (ArrowLeft/a, ArrowRight/d) clamped to canvas bounds.
 *  - Single-bullet firing mechanic (Space).
 *  - Procedural canvas drawing of ship and bullet.
 *  - lives counter initialised from STARTING_LIVES.
 */

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SPEED,
  BULLET_SPEED,
  STARTING_LIVES,
} from './gameConfig.js';
import { isKeyHeld } from './input.js';

// ─── Ship dimensions ─────────────────────────────────────────────────────────
const SHIP_WIDTH  = 40;
const SHIP_HEIGHT = 32;

// ─── Bullet dimensions ───────────────────────────────────────────────────────
const BULLET_W = 4;
const BULLET_H = 12;

// ─── Internal Bullet class ───────────────────────────────────────────────────
class Bullet {
  /**
   * @param {number} x  — horizontal centre of the bullet
   * @param {number} y  — top edge of the bullet at spawn
   */
  constructor(x, y) {
    this.x = x;  // centre
    this.y = y;  // top edge
  }

  /**
   * update — move the bullet upward.
   * @param {number} dt — delta time in seconds
   */
  update(dt) {
    this.y -= BULLET_SPEED * dt;
  }

  /**
   * isOffScreen — returns true when the bullet has exited the top of the canvas.
   */
  isOffScreen() {
    return this.y + BULLET_H < 0;
  }

  /**
   * draw — render the bullet as a bright filled rectangle.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.fillStyle = '#0ff';  // cyan — easy to spot against black
    ctx.fillRect(
      Math.round(this.x - BULLET_W / 2),
      Math.round(this.y),
      BULLET_W,
      BULLET_H,
    );
  }
}

// ─── Player class ────────────────────────────────────────────────────────────
export class Player {
  constructor() {
    // Spawn horizontally centred, near the bottom of the canvas.
    this.x = CANVAS_WIDTH / 2;          // centre x of the ship
    this.y = CANVAS_HEIGHT - 60;        // near the bottom

    this.lives = STARTING_LIVES;

    /** @type {Bullet|null} */
    this.bullet = null;
  }

  /**
   * update — process input and advance state.
   * @param {number} dt — delta time in seconds
   */
  update(dt) {
    // ── Movement ─────────────────────────────────────────────────────────────
    if (isKeyHeld('ArrowLeft') || isKeyHeld('a')) {
      this.x -= PLAYER_SPEED * dt;
    }
    if (isKeyHeld('ArrowRight') || isKeyHeld('d')) {
      this.x += PLAYER_SPEED * dt;
    }

    // Clamp: left edge >= 0, right edge <= CANVAS_WIDTH
    const halfW = SHIP_WIDTH / 2;
    if (this.x - halfW < 0)              this.x = halfW;
    if (this.x + halfW > CANVAS_WIDTH)   this.x = CANVAS_WIDTH - halfW;

    // ── Bullet update ────────────────────────────────────────────────────────
    if (this.bullet !== null) {
      this.bullet.update(dt);

      // Destroy bullet when it exits the top of the canvas
      if (this.bullet.isOffScreen()) {
        this.bullet = null;
      }
    }

    // ── Firing ───────────────────────────────────────────────────────────────
    // Only fire when no bullet is currently in flight.
    if (this.bullet === null && isKeyHeld(' ')) {
      // Spawn bullet centred on ship, just above the ship's top edge.
      this.bullet = new Bullet(this.x, this.y - SHIP_HEIGHT / 2 - BULLET_H);
    }
  }

  /**
   * draw — render ship and active bullet procedurally.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    // Draw bullet first (under the ship if they overlap, which they won't
    // in practice since the bullet spawns above the ship).
    if (this.bullet !== null) {
      this.bullet.draw(ctx);
    }

    // ── Ship body ────────────────────────────────────────────────────────────
    // The ship is drawn in ship-local coordinates then translated.
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));

    // Colour scheme
    const bodyColour   = '#00e676';   // bright green
    const cannonColour = '#ffffff';   // white
    const wingColour   = '#76ff03';   // lime

    const hw = SHIP_WIDTH  / 2;  // half-width  = 20
    const hh = SHIP_HEIGHT / 2;  // half-height = 16

    // --- Main fuselage (rounded rectangle via arcs) ---
    //  A trapezoid shape: wide base, narrowing toward the top.
    ctx.beginPath();
    ctx.moveTo(-hw + 6, hh);          // bottom-left (inset)
    ctx.lineTo( hw - 6, hh);          // bottom-right (inset)
    ctx.lineTo( hw - 2, 0);           // right mid
    ctx.lineTo( hw / 2, -hh + 4);     // upper-right shoulder
    ctx.lineTo(-hw / 2, -hh + 4);     // upper-left shoulder
    ctx.lineTo(-hw + 2, 0);           // left mid
    ctx.closePath();
    ctx.fillStyle = bodyColour;
    ctx.fill();

    // --- Left wing ---
    ctx.beginPath();
    ctx.moveTo(-hw + 2, 0);
    ctx.lineTo(-hw, hh);
    ctx.lineTo(-hw + 6, hh);
    ctx.closePath();
    ctx.fillStyle = wingColour;
    ctx.fill();

    // --- Right wing ---
    ctx.beginPath();
    ctx.moveTo(hw - 2, 0);
    ctx.lineTo(hw, hh);
    ctx.lineTo(hw - 6, hh);
    ctx.closePath();
    ctx.fillStyle = wingColour;
    ctx.fill();

    // --- Cannon (rectangle on top) ---
    ctx.fillStyle = cannonColour;
    ctx.fillRect(-2, -hh - 6, 4, 10);

    // --- Cockpit (arc / ellipse) ---
    ctx.beginPath();
    ctx.ellipse(0, -4, 6, 5, 0, Math.PI, 0);  // top half of ellipse
    ctx.fillStyle = '#80d8ff';  // light blue
    ctx.fill();

    ctx.restore();
  }
}
