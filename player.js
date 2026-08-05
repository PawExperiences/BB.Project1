/**
 * player.js — Player ship entity for Space Invaders.
 * ES module; exports the Player class.
 *
 * Depends on:
 *   gameConfig.js  — CANVAS_WIDTH, PLAYER_LIVES (alias for STARTING_LIVES)
 *   input.js       — isKeyHeld(code)
 */

import { CANVAS_WIDTH, STARTING_LIVES } from './gameConfig.js';
import { isKeyHeld } from './input.js';

// ---------------------------------------------------------------------------
// Constants defined in this file (per scope notes)
// ---------------------------------------------------------------------------
const PLAYER_SPEED  = 200;   // px/s — horizontal movement speed
const BULLET_SPEED  = 500;   // px/s — bullet travel speed (upward)

// Ship visual dimensions
const SHIP_WIDTH    = 48;    // px
const SHIP_HEIGHT   = 32;    // px

// Bullet visual dimensions
const BULLET_WIDTH  = 4;     // px  (≤6 px per acceptance criteria)
const BULLET_HEIGHT = 10;    // px  (≥8 px per acceptance criteria)

// PLAYER_LIVES sourced from gameConfig.js (exported as STARTING_LIVES)
const PLAYER_LIVES = STARTING_LIVES;

// ---------------------------------------------------------------------------
// Player class
// ---------------------------------------------------------------------------
export class Player {
  constructor() {
    // Horizontally centre the ship on the canvas.
    this.x = (CANVAS_WIDTH - SHIP_WIDTH) / 2;

    // Vertical position: near the bottom of the play area (above HUD).
    // The HUD occupies roughly the bottom 52 px; leave a small margin.
    this.y = 896 - 52 - SHIP_HEIGHT - 16;

    // Lives initialised from gameConfig.js constant.
    this.lives = PLAYER_LIVES;

    // Bullet state: null when no bullet is in flight.
    this.bullet = null;
  }

  /**
   * Update ship position, bullet position, and firing logic.
   * @param {number} dt  Fixed timestep in seconds (1/60).
   */
  update(dt) {
    // ------------------------------------------------------------------
    // Movement
    // ------------------------------------------------------------------
    if (isKeyHeld('ArrowLeft') || isKeyHeld('KeyA')) {
      this.x -= PLAYER_SPEED * dt;
    }
    if (isKeyHeld('ArrowRight') || isKeyHeld('KeyD')) {
      this.x += PLAYER_SPEED * dt;
    }

    // Clamp: left edge ≥ 0, right edge ≤ CANVAS_WIDTH
    if (this.x < 0) {
      this.x = 0;
    }
    if (this.x + SHIP_WIDTH > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - SHIP_WIDTH;
    }

    // ------------------------------------------------------------------
    // Firing
    // ------------------------------------------------------------------
    if (isKeyHeld('Space') && this.bullet === null) {
      // Spawn bullet centred horizontally on ship, at the ship's top edge.
      this.bullet = {
        x: this.x + SHIP_WIDTH / 2,
        y: this.y,
      };
    }

    // Advance bullet
    if (this.bullet !== null) {
      this.bullet.y -= BULLET_SPEED * dt;

      // Expire bullet when its top edge exits the canvas top.
      if (this.bullet.y + BULLET_HEIGHT < 0) {
        this.bullet = null;
      }
    }
  }

  /**
   * Draw the player ship and, if in flight, the bullet.
   * Uses only CanvasRenderingContext2D arcs and rectangles — no images.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);

    // ------------------------------------------------------------------
    // Draw bullet (behind ship)
    // ------------------------------------------------------------------
    if (this.bullet !== null) {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(
        Math.round(this.bullet.x - BULLET_WIDTH / 2),
        Math.round(this.bullet.y),
        BULLET_WIDTH,
        BULLET_HEIGHT
      );
    }

    // ------------------------------------------------------------------
    // Draw ship — Space-Invaders-style procedural shape
    //
    // Layout (all coords relative to ship top-left corner x, y):
    //
    //        [  dome  ]
    //   [  body / hull  ]
    //  [L wing][body][R wing]
    // ------------------------------------------------------------------
    const shipColor  = '#00ff00';  // classic green
    const cockpitColor = '#00ccff'; // blue dome

    // --- Main rectangular body (lower 2/3 of ship height) ---
    const bodyTop    = y + 10;
    const bodyHeight = SHIP_HEIGHT - 10;
    const bodyLeft   = x + 4;
    const bodyWidth  = SHIP_WIDTH - 8;

    ctx.fillStyle = shipColor;
    ctx.fillRect(bodyLeft, bodyTop, bodyWidth, bodyHeight);

    // --- Left wing extension ---
    // Sticks out 4 px to the left and is 12 px tall at the bottom
    ctx.fillStyle = shipColor;
    ctx.fillRect(x, bodyTop + 8, 8, bodyHeight - 8);

    // --- Right wing extension ---
    ctx.fillStyle = shipColor;
    ctx.fillRect(x + SHIP_WIDTH - 8, bodyTop + 8, 8, bodyHeight - 8);

    // --- Central cockpit dome (arc) ---
    // Arc sits atop the body, centred horizontally on the ship.
    const domeX      = x + SHIP_WIDTH / 2;
    const domeY      = bodyTop;           // dome base aligns with body top
    const domeRadius = 10;               // px

    ctx.fillStyle = cockpitColor;
    ctx.beginPath();
    ctx.arc(domeX, domeY, domeRadius, Math.PI, 0); // upper semicircle
    ctx.closePath();
    ctx.fill();

    // --- Engine nozzle hints (two small rectangles at the bottom) ---
    ctx.fillStyle = '#008800';
    ctx.fillRect(bodyLeft + 4, y + SHIP_HEIGHT - 4, 8, 4);
    ctx.fillRect(bodyLeft + bodyWidth - 12, y + SHIP_HEIGHT - 4, 8, 4);
  }
}
