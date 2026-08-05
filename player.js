// player.js — Player ship: movement, single-bullet mechanic, procedural drawing.
//
// Coordinate convention:
//   player.x, player.y refer to the TOP-LEFT corner of the ship bounding box.
//   SHIP_WIDTH  = 40 px
//   SHIP_HEIGHT = 32 px
//
// The ship is clamped so that:
//   left edge  (x)               >= 0
//   right edge (x + SHIP_WIDTH)  <= CANVAS_WIDTH

import { isKeyHeld } from './input.js';
import {
  PLAYER_SPEED,
  BULLET_SPEED,
  CANVAS_WIDTH,
  PLAYER_LIVES,
} from './gameConfig.js';

// ---------------------------------------------------------------------------
// Internal ship dimensions (not exported — drawing detail only)
// ---------------------------------------------------------------------------
const SHIP_WIDTH   = 40;
const SHIP_HEIGHT  = 32;

// Bullet dimensions
const BULLET_WIDTH  = 4;
const BULLET_HEIGHT = 12;

/**
 * Player — controllable spaceship.
 *
 * Position (x, y) is the TOP-LEFT corner of the ship's bounding box.
 *
 * @example
 *   const player = new Player();
 *   // in the game loop:
 *   player.update(dt);
 *   player.draw(ctx);
 */
export class Player {
  constructor() {
    // Start horizontally centred, near the bottom of the canvas.
    // y is fixed; movement is left/right only.
    this.x = (CANVAS_WIDTH - SHIP_WIDTH) / 2;
    this.y = 820;  // top-left y; ship sits near the bottom of the 896-px canvas

    /** Number of lives remaining. */
    this.lives = PLAYER_LIVES;

    /**
     * Active bullet, or null.
     * When non-null: { x, y } where x/y is the top-left of the bullet rect.
     * @type {{ x: number, y: number } | null}
     */
    this.bullet = null;
  }

  /**
   * update — advance player state by dt seconds.
   * Must be called once per fixed tick from the game loop.
   *
   * @param {number} dt - Fixed timestep in seconds (e.g. 1/60).
   */
  update(dt) {
    // ------------------------------------------------------------------
    // 1. Movement
    // ------------------------------------------------------------------
    if (isKeyHeld('ArrowLeft') || isKeyHeld('KeyA')) {
      this.x -= PLAYER_SPEED * dt;
    }
    if (isKeyHeld('ArrowRight') || isKeyHeld('KeyD')) {
      this.x += PLAYER_SPEED * dt;
    }

    // ------------------------------------------------------------------
    // 2. Clamping — left edge >= 0, right edge <= CANVAS_WIDTH
    // ------------------------------------------------------------------
    if (this.x < 0) {
      this.x = 0;
    }
    if (this.x + SHIP_WIDTH > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - SHIP_WIDTH;
    }

    // ------------------------------------------------------------------
    // 3. Firing — only when no bullet is already in flight
    // ------------------------------------------------------------------
    if (isKeyHeld('Space') && this.bullet === null) {
      // Spawn bullet at the cannon tip: horizontally centred on the ship,
      // at the top edge of the ship bounding box.
      this.bullet = {
        x: this.x + (SHIP_WIDTH  - BULLET_WIDTH)  / 2,
        y: this.y - BULLET_HEIGHT,
      };
    }

    // ------------------------------------------------------------------
    // 4. Bullet movement
    // ------------------------------------------------------------------
    if (this.bullet !== null) {
      this.bullet.y -= BULLET_SPEED * dt;

      // Bullet exits top of canvas — reset so the player can fire again.
      if (this.bullet.y + BULLET_HEIGHT < 0) {
        this.bullet = null;
      }
    }
  }

  /**
   * draw — render the ship and (if in flight) the bullet using canvas
   * 2D API primitives only.  No image assets are used.
   *
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    // ------------------------------------------------------------------
    // Draw ship procedurally
    // ------------------------------------------------------------------
    const x = this.x;
    const y = this.y;

    ctx.save();

    // --- Hull body: main rectangle ---
    ctx.fillStyle = '#00e0ff';
    // Centre section of the hull
    ctx.fillRect(x + 8, y + 10, SHIP_WIDTH - 16, SHIP_HEIGHT - 10);

    // --- Cockpit: filled arc (semi-circle top) ---
    ctx.beginPath();
    ctx.arc(
      x + SHIP_WIDTH / 2,   // centre x
      y + 10,               // centre y
      10,                   // radius
      Math.PI,              // start angle (left)
      0,                    // end angle   (right)
      false                 // clockwise
    );
    ctx.fillStyle = '#80ffff';
    ctx.fill();

    // --- Left wing: rectangle ---
    ctx.fillStyle = '#0090c0';
    ctx.fillRect(x, y + 18, 12, 14);

    // --- Right wing: rectangle ---
    ctx.fillRect(x + SHIP_WIDTH - 12, y + 18, 12, 14);

    // --- Engine nozzle: small rectangle at the bottom centre ---
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(x + SHIP_WIDTH / 2 - 4, y + SHIP_HEIGHT - 2, 8, 6);

    ctx.restore();

    // ------------------------------------------------------------------
    // Draw bullet (if in flight)
    // ------------------------------------------------------------------
    if (this.bullet !== null) {
      ctx.save();
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(
        this.bullet.x,
        this.bullet.y,
        BULLET_WIDTH,
        BULLET_HEIGHT
      );
      ctx.restore();
    }
  }
}
