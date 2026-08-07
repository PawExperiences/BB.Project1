// player.js — Player ship entity for Space Invaders

import { CANVAS_WIDTH, PLAYER_SPEED, BULLET_SPEED, PLAYER_LIVES } from './gameConfig.js';
import { isKeyHeld } from './input.js';
import { state } from './state.js';

// Ship visual dimensions
const SHIP_WIDTH  = 48; // px
const SHIP_HEIGHT = 32; // px

// Bullet visual dimensions
const BULLET_WIDTH  = 4;  // px
const BULLET_HEIGHT = 10; // px

// Invulnerability duration after respawn (seconds)
const INVULN_DURATION = 2.0;
// Flash period (seconds) — ship alternates visible/hidden at this half-period
const FLASH_PERIOD = 0.1;

export class Player {
  /**
   * @param {number} canvasHeight — height of the canvas in pixels (for vertical positioning)
   */
  constructor(canvasHeight) {
    this._canvasHeight = canvasHeight;

    // Horizontally centred; near the bottom of the canvas
    this.x = (CANVAS_WIDTH - SHIP_WIDTH) / 2; // left edge of ship
    this.y = canvasHeight - SHIP_HEIGHT - 24;  // top edge of ship, 24 px from bottom

    // Canonical bottom-centre spawn position (used for respawn)
    this._spawnX = (CANVAS_WIDTH - SHIP_WIDTH) / 2;
    this._spawnY = canvasHeight - SHIP_HEIGHT - 24;

    // Lives — initialised from shared state (or config if state not yet set)
    this.lives = PLAYER_LIVES;

    // Bullet state
    this._bullet = null; // null when no bullet in flight
    // _bullet shape: { x: centreX, y: topEdgeY }

    // Hit flag — set by CollisionSystem when an invader bullet hits the player
    this.hit = false;

    // Invulnerability timer (seconds remaining); 0 = not invulnerable
    this._invulnTimer = 0;
  }

  /**
   * Returns true if the player is currently invulnerable (post-respawn window).
   * @returns {boolean}
   */
  get isInvulnerable() {
    return this._invulnTimer > 0;
  }

  /**
   * Called by CollisionSystem (or level logic) when an invader bullet hits the player.
   * Respects invulnerability window.
   */
  onHit() {
    if (this._invulnTimer > 0) return; // invulnerable — ignore hit
    this.lives -= 1;
    this._respawn();
  }

  /**
   * Respawn the player at the bottom-centre start position with invulnerability.
   * @private
   */
  _respawn() {
    this.x = this._spawnX;
    this.y = this._spawnY;
    this._bullet = null; // clear any in-flight bullet
    this._invulnTimer = INVULN_DURATION;
  }

  /**
   * Returns the axis-aligned bounding box of the player ship.
   * Used by CollisionSystem for invader-bullet-vs-player detection.
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  getBounds() {
    return {
      x:      this.x,
      y:      this.y,
      width:  SHIP_WIDTH,
      height: SHIP_HEIGHT,
    };
  }

  /**
   * Update ship and bullet state.
   * @param {number} dt — delta time in seconds
   */
  update(dt) {
    // -----------------------------------------------------------------------
    // Invulnerability timer
    // -----------------------------------------------------------------------
    if (this._invulnTimer > 0) {
      this._invulnTimer -= dt;
      if (this._invulnTimer < 0) this._invulnTimer = 0;
    }

    // -----------------------------------------------------------------------
    // Movement
    // -----------------------------------------------------------------------
    const movingLeft  = isKeyHeld('ArrowLeft')  || isKeyHeld('KeyA');
    const movingRight = isKeyHeld('ArrowRight') || isKeyHeld('KeyD');

    if (movingLeft && !movingRight) {
      this.x -= PLAYER_SPEED * dt;
    } else if (movingRight && !movingLeft) {
      this.x += PLAYER_SPEED * dt;
    }
    // Both held simultaneously → no net movement (handled by the above)

    // Clamp: left edge ≥ 0, right edge ≤ CANVAS_WIDTH
    if (this.x < 0) {
      this.x = 0;
    }
    if (this.x + SHIP_WIDTH > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - SHIP_WIDTH;
    }

    // -----------------------------------------------------------------------
    // Shooting
    // -----------------------------------------------------------------------
    if (isKeyHeld('Space') && this._bullet === null) {
      // Spawn bullet at the ship's horizontal centre, just above the ship's top edge
      this._bullet = {
        x: this.x + SHIP_WIDTH / 2, // horizontal centre of ship
        y: this.y - BULLET_HEIGHT,  // just above the top of the ship
      };
      // Increment cumulative shot count in shared state
      state.sessionShotCount += 1;
    }

    // -----------------------------------------------------------------------
    // Bullet movement
    // -----------------------------------------------------------------------
    if (this._bullet !== null) {
      this._bullet.y -= BULLET_SPEED * dt;

      // Remove bullet when its top edge exits the canvas (y ≤ 0)
      if (this._bullet.y <= 0) {
        this._bullet = null;
      }
    }
  }

  /**
   * Draw the ship and, if in flight, the bullet.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    // -----------------------------------------------------------------------
    // Draw bullet (behind ship)
    // -----------------------------------------------------------------------
    if (this._bullet !== null) {
      ctx.save();
      ctx.fillStyle = '#ff0'; // bright yellow bullet
      ctx.fillRect(
        Math.round(this._bullet.x - BULLET_WIDTH / 2),
        Math.round(this._bullet.y),
        BULLET_WIDTH,
        BULLET_HEIGHT
      );
      ctx.restore();
    }

    // -----------------------------------------------------------------------
    // Invulnerability flash — skip drawing on alternate FLASH_PERIOD windows
    // -----------------------------------------------------------------------
    if (this._invulnTimer > 0) {
      // Flash: visible when floor(invulnTimer / FLASH_PERIOD) is even
      const flashPhase = Math.floor(this._invulnTimer / FLASH_PERIOD);
      if (flashPhase % 2 === 0) return; // hidden this frame
    }

    // -----------------------------------------------------------------------
    // Draw ship (procedural — arcs + rectangles, ~48 × 32 px)
    // -----------------------------------------------------------------------
    ctx.save();

    const sx = this.x; // left edge of ship bounding box
    const sy = this.y; // top edge of ship bounding box
    const cx = sx + SHIP_WIDTH / 2; // horizontal centre

    // Cannon (top centre)
    ctx.fillStyle = '#0f0';
    ctx.fillRect(cx - 2, sy, 4, 10);

    // Cockpit dome — semicircle
    ctx.beginPath();
    ctx.arc(cx, sy + 16, 10, Math.PI, 0); // upper half-circle
    ctx.fillStyle = '#4af';
    ctx.fill();

    // Main body — wide rectangle
    ctx.fillStyle = '#0f0';
    ctx.fillRect(sx, sy + 16, SHIP_WIDTH, 12);

    // Wing nubs — small rectangles protruding from each side
    ctx.fillStyle = '#0a0';
    ctx.fillRect(sx - 4, sy + 22, 8, 6);                  // left wing nub
    ctx.fillRect(sx + SHIP_WIDTH - 4, sy + 22, 8, 6);     // right wing nub

    ctx.restore();
  }

  /**
   * Expose bullet for collision detection by later modules.
   * Returns the bullet object {x, y} or null.
   */
  get bullet() {
    return this._bullet;
  }

  /**
   * Clear the bullet (called by collision detection when it hits an invader).
   */
  clearBullet() {
    this._bullet = null;
  }
}
