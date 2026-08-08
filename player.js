// player.js — Player ship entity for Space Invaders
// Imports all numeric constants from gameConfig.js; none are redeclared here.

import {
  PLAYER_SPEED,
  BULLET_SPEED,
  CANVAS_WIDTH,
  STARTING_LIVES
} from './gameConfig.js';

import { isKeyHeld } from './input.js';

// ---------------------------------------------------------------------------
// Ship visual dimensions (used for clamping and drawing)
// ---------------------------------------------------------------------------
const SHIP_WIDTH  = 40; // px — total drawn width
const SHIP_HEIGHT = 32; // px — total drawn height

// Bullet visual dimensions
const BULLET_WIDTH  = 4;  // px
const BULLET_HEIGHT = 12; // px

// ---------------------------------------------------------------------------
// Player class
// ---------------------------------------------------------------------------
export class Player {
  constructor() {
    // Horizontally centred on the canvas
    this.x = CANVAS_WIDTH / 2 - SHIP_WIDTH / 2;
    // Near the bottom of the 896-px canvas (HUD occupies top 40 px)
    this.y = 560;

    // Lives — publicly readable; decremented externally by level cards
    this.lives = STARTING_LIVES;

    // Single-bullet state: null = no bullet in flight
    this.bullet = null;
  }

  // -------------------------------------------------------------------------
  // update(dt)
  // dt — elapsed time in seconds (fixed timestep, typically 1/60)
  // -------------------------------------------------------------------------
  update(dt) {
    // --- Movement -----------------------------------------------------------
    const movingLeft  = isKeyHeld('ArrowLeft')  || isKeyHeld('KeyA');
    const movingRight = isKeyHeld('ArrowRight') || isKeyHeld('KeyD');

    if (movingLeft)  this.x -= PLAYER_SPEED * dt;
    if (movingRight) this.x += PLAYER_SPEED * dt;

    // --- Clamping -----------------------------------------------------------
    // Left edge must stay >= 0; right edge must stay <= CANVAS_WIDTH
    if (this.x < 0) {
      this.x = 0;
    }
    if (this.x + SHIP_WIDTH > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - SHIP_WIDTH;
    }

    // --- Firing -------------------------------------------------------------
    // Only fire when no bullet is already in flight
    if (isKeyHeld('Space') && this.bullet === null) {
      this.bullet = {
        // Centre-top of the ship
        x: this.x + SHIP_WIDTH  / 2 - BULLET_WIDTH / 2,
        y: this.y - BULLET_HEIGHT
      };
    }

    // --- Bullet movement ----------------------------------------------------
    if (this.bullet !== null) {
      this.bullet.y -= BULLET_SPEED * dt;

      // Remove when the bullet exits the top of the canvas
      if (this.bullet.y + BULLET_HEIGHT < 0) {
        this.bullet = null;
      }
    }
  }

  // -------------------------------------------------------------------------
  // draw(ctx)
  // Renders the ship using only arc and rect primitives (no image assets).
  // -------------------------------------------------------------------------
  draw(ctx) {
    // --- Ship body ----------------------------------------------------------
    // The ship is drawn relative to (this.x, this.y).
    // Layout (all px, origin = top-left corner of ship bounding box):
    //
    //        [cockpit arc]       <- centred, top portion
    //   [===  body rect  ===]   <- wider, lower portion
    //  [=  left wing  =][= right wing =]  <- bottom flanges
    //
    // We use a single fillStyle for the whole ship for simplicity.

    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = '#00e5ff'; // cyan — classic Space-Invaders-player colour

    // Main fuselage rectangle (full width, bottom 60 % of bounding box)
    const bodyTop    = SHIP_HEIGHT * 0.4;
    const bodyHeight = SHIP_HEIGHT * 0.6;
    ctx.fillRect(4, bodyTop, SHIP_WIDTH - 8, bodyHeight);

    // Wing flanges (left and right, at the very bottom)
    const flangeH = SHIP_HEIGHT * 0.25;
    ctx.fillRect(0,              SHIP_HEIGHT - flangeH, 12, flangeH); // left
    ctx.fillRect(SHIP_WIDTH - 12, SHIP_HEIGHT - flangeH, 12, flangeH); // right

    // Cockpit / nose — a semicircle arc on top of the fuselage
    const cockpitCX = SHIP_WIDTH / 2;
    const cockpitCY = bodyTop;
    const cockpitR  = SHIP_WIDTH * 0.22;
    ctx.beginPath();
    ctx.arc(cockpitCX, cockpitCY, cockpitR, Math.PI, 0); // top semicircle
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // --- Bullet -------------------------------------------------------------
    if (this.bullet !== null) {
      ctx.fillStyle = '#ffff00'; // bright yellow bullet
      ctx.fillRect(
        this.bullet.x,
        this.bullet.y,
        BULLET_WIDTH,
        BULLET_HEIGHT
      );
    }
  }
}
