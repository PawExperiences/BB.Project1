// player.js — Player ship with keyboard movement, single-bullet mechanic,
// and a lives counter.
//
// Imports all tuneable constants from gameConfig.js — no magic numbers.
// Imports isKeyHeld from input.js for held-key polling.

import {
  PLAYER_SPEED,
  BULLET_SPEED,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STARTING_LIVES,
} from './gameConfig.js';
import { isKeyHeld } from './input.js';

// Ship bounding box dimensions (px).
const SHIP_W = 40;
const SHIP_H = 24;

// Bullet dimensions (px).
const BULLET_W = 4;
const BULLET_H = 12;

/**
 * Player — owns the ship position, the single in-flight bullet, and lives.
 *
 * Usage:
 *   const player = new Player();
 *   // each frame:
 *   player.update(dt);
 *   player.draw(ctx);
 */
export class Player {
  constructor() {
    // Spawn ship horizontally centred, near the bottom of the canvas.
    this.x = (CANVAS_WIDTH - SHIP_W) / 2;
    this.y = CANVAS_HEIGHT - 48;

    // Bounding-box dimensions (read-only convention; do not reassign).
    this.width  = SHIP_W;
    this.height = SHIP_H;

    // Lives counter — publicly readable and writable.
    this.lives = STARTING_LIVES;

    // Bullet state.  null means no bullet is in flight.
    // When active: { x, y } where (x, y) is the top-left of the bullet rect.
    this._bullet = null;
  }

  // -------------------------------------------------------------------------
  // update(dt) — called every frame with delta-time in seconds.
  // -------------------------------------------------------------------------
  update(dt) {
    // --- Movement -----------------------------------------------------------
    let dx = 0;
    if (isKeyHeld('ArrowLeft')  || isKeyHeld('a')) dx -= PLAYER_SPEED;
    if (isKeyHeld('ArrowRight') || isKeyHeld('d')) dx += PLAYER_SPEED;

    this.x += dx * dt;

    // Clamp so the ship stays fully within the canvas.
    if (this.x < 0)                        this.x = 0;
    if (this.x + SHIP_W > CANVAS_WIDTH)    this.x = CANVAS_WIDTH - SHIP_W;

    // --- Shooting -----------------------------------------------------------
    if (isKeyHeld(' ') && this._bullet === null) {
      // Spawn bullet centred on the ship, at the ship's top edge.
      this._bullet = {
        x: this.x + (SHIP_W - BULLET_W) / 2,
        y: this.y,                              // top edge of ship
      };
    }

    // --- Bullet movement ----------------------------------------------------
    if (this._bullet !== null) {
      this._bullet.y -= BULLET_SPEED * dt;

      // Once the bullet's top edge exits the top of the canvas, discard it.
      if (this._bullet.y + BULLET_H < 0) {
        this._bullet = null;
      }
    }
  }

  // -------------------------------------------------------------------------
  // draw(ctx) — called every frame with a Canvas 2D context.
  // -------------------------------------------------------------------------
  draw(ctx) {
    const x = this.x;
    const y = this.y;

    // ----- Ship body --------------------------------------------------------
    // The ship is drawn within the 40 × 24 px bounding box rooted at (x, y).
    //
    // Layout (all coords relative to bounding-box origin):
    //
    //         [gun]          <- 4 × 6 px barrel centred at top
    //       [fuselage]       <- 16 × 14 px central rectangle
    //   [left]   [right]     <- two arc-swept wing panels
    //
    // Colour scheme: bright green ship, slightly darker wing fill.

    ctx.save();

    // --- Gun barrel (small rectangle at the very top, centred) ---
    ctx.fillStyle = '#00ff88';
    const gunW = 4;
    const gunH = 6;
    const gunX = x + (SHIP_W - gunW) / 2;   // centred horizontally
    const gunY = y;                           // top of bounding box
    ctx.fillRect(gunX, gunY, gunW, gunH);

    // --- Fuselage (central rectangle) ---
    const fuseW = 16;
    const fuseH = 14;
    const fuseX = x + (SHIP_W - fuseW) / 2;
    const fuseY = y + gunH;                  // just below the gun
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(fuseX, fuseY, fuseW, fuseH);

    // --- Wings (arc-based, one on each side of the fuselage) ---
    // Left wing: a filled arc that sweeps from the left edge of the fuselage
    // outward to the left edge of the bounding box.
    const wingY   = fuseY + fuseH / 2;       // vertical centre of the fuselage
    const wingH   = 8;                        // half-height of the wing ellipse

    ctx.fillStyle = '#00cc66';

    // Left wing — ellipse centred at left edge of fuselage, radius spans left.
    ctx.beginPath();
    // We draw a filled half-ellipse by using a full ellipse with clipping.
    // Simpler: draw a rect for the wing base and round the outer corner with arc.
    // We'll use two bezier curves to get a swept wing look.
    //
    // Left wing vertices (clockwise):
    //   top-inner  : (fuseX, fuseY + 2)
    //   top-outer  : (x,     fuseY + fuseH - 2)
    //   bot-outer  : (x,     fuseY + fuseH)
    //   bot-inner  : (fuseX, fuseY + fuseH)
    ctx.moveTo(fuseX,     fuseY + 2);
    ctx.quadraticCurveTo(fuseX - 6, fuseY + fuseH / 2,
                         x,         fuseY + fuseH - 2);
    ctx.lineTo(x,     fuseY + fuseH);
    ctx.lineTo(fuseX, fuseY + fuseH);
    ctx.closePath();
    ctx.fill();

    // Right wing (mirror of left):
    const fuseRight = fuseX + fuseW;
    const boxRight  = x + SHIP_W;
    ctx.beginPath();
    ctx.moveTo(fuseRight,  fuseY + 2);
    ctx.quadraticCurveTo(fuseRight + 6, fuseY + fuseH / 2,
                         boxRight,      fuseY + fuseH - 2);
    ctx.lineTo(boxRight,  fuseY + fuseH);
    ctx.lineTo(fuseRight, fuseY + fuseH);
    ctx.closePath();
    ctx.fill();

    // --- Engine / base (thin rectangle at the very bottom) ---
    const baseH = 4;
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(fuseX, fuseY + fuseH, fuseW, baseH);

    ctx.restore();

    // ----- Bullet -----------------------------------------------------------
    if (this._bullet !== null) {
      ctx.save();
      ctx.fillStyle = '#ffff00';   // bright yellow
      ctx.fillRect(
        this._bullet.x,
        this._bullet.y,
        BULLET_W,
        BULLET_H,
      );
      ctx.restore();
    }
  }

  // -------------------------------------------------------------------------
  // Convenience read-only accessor — lets other modules ask whether a bullet
  // is currently in flight without exposing the internal object directly.
  // -------------------------------------------------------------------------
  get bulletInFlight() {
    return this._bullet !== null;
  }

  /**
   * Returns a plain bounding-box object for the bullet (or null).
   * Useful for collision detection by sibling modules.
   */
  getBulletBounds() {
    if (this._bullet === null) return null;
    return {
      x:      this._bullet.x,
      y:      this._bullet.y,
      width:  BULLET_W,
      height: BULLET_H,
    };
  }

  /**
   * Removes the in-flight bullet (called by the collision module when the
   * bullet hits an invader).
   */
  clearBullet() {
    this._bullet = null;
  }
}

// ---------------------------------------------------------------------------
// Legacy stub exports — kept so that any module that imported the old
// placeholder names does not break immediately.
// These will be removed once sibling cards migrate to the Player class.
// ---------------------------------------------------------------------------
export const playerState = {
  x: 0,
  y: 0,
  width: SHIP_W,
  height: SHIP_H,
  alive: true,
};

export function updatePlayer(dt, input) {
  // Legacy stub — use Player.update(dt) instead.
}

export function renderPlayer(ctx) {
  // Legacy stub — use Player.draw(ctx) instead.
}
