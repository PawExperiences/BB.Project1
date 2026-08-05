// player.js — Player ship module
// Exports: Player class

import { CANVAS_WIDTH, PLAYER_SPEED, BULLET_SPEED, STARTING_LIVES, BLINK_INTERVAL } from './gameConfig.js';
import { isKeyHeld } from './input.js';

// Ship visual dimensions (procedural drawing, no sprites)
const SHIP_WIDTH  = 40;
const SHIP_HEIGHT = 30;

// Bullet visual dimensions
const BULLET_WIDTH  = 4;
const BULLET_HEIGHT = 12;

export class Player {
  /**
   * @param {number} x - Starting x position (left edge of ship)
   * @param {number} y - Starting y position (top edge of ship)
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.lives = STARTING_LIVES;

    // Single in-flight bullet; null when no bullet is active
    this._bullet = null;

    // Total shots fired — used by Level 2 UFO score formula
    this.shotCount = 0;

    // Post-respawn invulnerability state (Level 2)
    this.isInvulnerable        = false;
    this._invulnerabilityTimer = 0;    // ms remaining in window
    this._blinkTimer           = 0;    // ms into the current blink half-cycle
    this._blinkVisible         = true; // whether ship is drawn this blink phase
  }

  /**
   * Update ship position, bullet state, and invulnerability timer.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // --- Horizontal movement ---
    if (isKeyHeld('ArrowLeft') || isKeyHeld('a')) {
      this.x -= PLAYER_SPEED * dt;
    }
    if (isKeyHeld('ArrowRight') || isKeyHeld('d')) {
      this.x += PLAYER_SPEED * dt;
    }

    // --- Clamp to canvas bounds ---
    if (this.x < 0)                         this.x = 0;
    if (this.x + SHIP_WIDTH > CANVAS_WIDTH)  this.x = CANVAS_WIDTH - SHIP_WIDTH;

    // --- Bullet logic ---
    if (this._bullet !== null) {
      // Move bullet upward
      this._bullet.y -= BULLET_SPEED * dt;

      // Remove bullet once it leaves the top of the canvas
      if (this._bullet.y + BULLET_HEIGHT <= 0) {
        this._bullet = null;
      }
    } else {
      // Fire a new bullet if Space is held
      if (isKeyHeld(' ')) {
        this._bullet = {
          x: this.x + (SHIP_WIDTH  - BULLET_WIDTH)  / 2,
          y: this.y - BULLET_HEIGHT,
        };
        this.shotCount += 1;
      }
    }

    // --- Invulnerability / blink countdown ---
    if (this.isInvulnerable) {
      const dtMs = dt * 1000; // convert seconds → ms
      this._invulnerabilityTimer -= dtMs;
      this._blinkTimer           += dtMs;

      if (this._blinkTimer >= BLINK_INTERVAL) {
        this._blinkTimer  -= BLINK_INTERVAL;
        this._blinkVisible = !this._blinkVisible;
      }

      if (this._invulnerabilityTimer <= 0) {
        this.isInvulnerable        = false;
        this._invulnerabilityTimer = 0;
        this._blinkTimer           = 0;
        this._blinkVisible         = true;
      }
    }
  }

  /**
   * Draw the ship and its active bullet procedurally.
   * During invulnerability the ship sprite blinks; the bullet is always drawn.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();

    // --- Bullet — always drawn when in flight ---
    if (this._bullet !== null) {
      ctx.fillStyle = '#ff0';
      ctx.fillRect(
        Math.round(this._bullet.x),
        Math.round(this._bullet.y),
        BULLET_WIDTH,
        BULLET_HEIGHT
      );
    }

    // --- Skip ship drawing during the invisible blink phase ---
    if (this.isInvulnerable && !this._blinkVisible) {
      ctx.restore();
      return;
    }

    // --- Draw ship procedurally ---
    const sx = Math.round(this.x);
    const sy = Math.round(this.y);

    ctx.fillStyle = '#0f0';

    // Main body — wide rectangle at the base
    ctx.fillRect(sx, sy + SHIP_HEIGHT * 0.4, SHIP_WIDTH, SHIP_HEIGHT * 0.6);

    // Cockpit — semicircle dome
    const cockpitCentreX = sx + SHIP_WIDTH / 2;
    const cockpitBaseY   = sy + SHIP_HEIGHT * 0.4;
    const cockpitRadius  = SHIP_WIDTH * 0.22;

    ctx.beginPath();
    ctx.arc(
      cockpitCentreX,
      cockpitBaseY,
      cockpitRadius,
      Math.PI,
      0,
      false
    );
    ctx.closePath();
    ctx.fill();

    // Left cannon nub
    ctx.fillRect(sx, sy + SHIP_HEIGHT * 0.4, SHIP_WIDTH * 0.15, -SHIP_HEIGHT * 0.3);
    // Right cannon nub
    ctx.fillRect(
      sx + SHIP_WIDTH * 0.85,
      sy + SHIP_HEIGHT * 0.4,
      SHIP_WIDTH * 0.15,
      -SHIP_HEIGHT * 0.3
    );

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Level 2 helpers
  // ---------------------------------------------------------------------------

  /**
   * Teleport the ship back to the default spawn X (used after a bullet hit).
   * @param {number} defaultX
   */
  respawn(defaultX) {
    this.x = defaultX;
  }

  /**
   * Start the invulnerability window with blinking visual.
   * @param {number} durationMs
   */
  startInvulnerability(durationMs) {
    this.isInvulnerable        = true;
    this._invulnerabilityTimer = durationMs;
    this._blinkTimer           = 0;
    this._blinkVisible         = true;
  }

  /**
   * Reset position and cancel any active invulnerability.
   * Called on level transition to ensure a clean slate.
   * @param {number} defaultX
   */
  resetForLevel(defaultX) {
    this.x                     = defaultX;
    this.isInvulnerable        = false;
    this._invulnerabilityTimer = 0;
    this._blinkTimer           = 0;
    this._blinkVisible         = true;
  }

  // ---------------------------------------------------------------------------
  // Read-only accessors used by collision detection
  // ---------------------------------------------------------------------------

  /** Ship width in px */
  get width()  { return SHIP_WIDTH;  }

  /** Ship height in px */
  get height() { return SHIP_HEIGHT; }

  /** The active bullet object {x, y}, or null if none is in flight */
  get bullet() { return this._bullet; }
}
