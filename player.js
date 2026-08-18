// The player ship: movement, clamping, procedural drawing, single-bullet
// management and the lives counter.
// Added by "Keyboard input and the player ship"; the position-only
// resetPosition() was added by "Level 1: the classic grid"; the session
// shot counter and the post-respawn invulnerability window (flashing +
// hit immunity) were added by "Level 2: they shoot back".

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SPEED,
  BULLET_SPEED,
  STARTING_LIVES,
} from './gameConfig.js';
import { isKeyHeld } from './input.js';

// Ship/bullet geometry in px. Only the speeds and the starting lives are
// shared constants (gameConfig.js); the shapes are local to this module.
const SHIP_WIDTH = 44;
const SHIP_HEIGHT = 24;
const SHIP_BOTTOM_MARGIN = 32;
const SHIP_COLOR = '#33ff66';

const BASE_HEIGHT = 8;
const CANNON_WIDTH = 4;
const DOME_RADIUS = 12;

const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 14;
const BULLET_COLOR = '#ffffff';

// Invulnerability flash rate: while the window runs, the ship toggles
// between visible and hidden every ~100 ms.
const FLASH_HZ = 10;

export class Player {
  constructor() {
    this.width = SHIP_WIDTH;
    this.height = SHIP_HEIGHT;
    this.reset();
  }

  // Back to the starting state: centered at the bottom, no bullet in
  // flight, lives restored. game.js calls this at the start of every game.
  reset() {
    this.resetPosition();

    // Lives counter, initialised from STARTING_LIVES (gameConfig.js).
    // Decrement interface for the level cards: call loseLife() when the
    // ship is hit or a level breach costs a life (this.lives may also be
    // assigned directly). What happens when lives reach 0 — game over —
    // is owned by game.js, not by this class.
    this.lives = STARTING_LIVES;

    // Session shot counter ("Level 2: they shoot back"): incremented once
    // per shot fired. Zeroed only here, at the start of a game — the
    // level transition never calls reset(), so the count accumulates
    // across Level 1 and Level 2 and drives the UFO bonus tiers.
    this.shotsFired = 0;

    // Post-respawn invulnerability window in seconds ("Level 2: they
    // shoot back"): while > 0 the ship visibly flashes and loseLife() is
    // a no-op. Granted via grantInvulnerability(); zeroed for a fresh
    // game.
    this.invulnerable = 0;
  }

  // Position-only reset for the level cards: the ship returns to its start
  // position and any in-flight bullet is gone, while the lives counter is
  // left untouched. Level restarts (e.g. Level 1's player-row breach) use
  // this so the deducted life is neither refunded nor doubled.
  resetPosition() {
    // Top-left corner of the ship in canvas coordinates; this.x is the
    // ship's left edge, this.x + this.width its right edge.
    this.x = (CANVAS_WIDTH - this.width) / 2;
    this.y = CANVAS_HEIGHT - SHIP_BOTTOM_MARGIN - this.height;

    // The in-flight player bullet, or null when none. A plain
    // { x, y, width, height } rect in canvas coordinates (x/y = top-left),
    // exposed for the collision and level cards: they read player.bullet
    // to test hits against invaders, shields and the boss.
    this.bullet = null;
  }

  // Documented decrement interface for the level cards: reduces the lives
  // counter by 1 (never below 0) and returns the remaining lives. While
  // the invulnerability window runs, a hit deducts nothing.
  loseLife() {
    if (this.invulnerable > 0) return this.lives;
    if (this.lives > 0) this.lives -= 1;
    return this.lives;
  }

  // Interface for the level cards ("Level 2: they shoot back"): start an
  // invulnerability window of the given length in seconds. The ship keeps
  // moving and firing normally; it flashes and cannot lose a life.
  grantInvulnerability(seconds) {
    this.invulnerable = seconds;
  }

  update(dt) {
    // Run the invulnerability window down on the same fixed timestep as
    // the rest of the world.
    if (this.invulnerable > 0) {
      this.invulnerable = Math.max(0, this.invulnerable - dt);
    }

    // Horizontal movement while ArrowLeft/ArrowRight or A/D is held. Speed
    // is PLAYER_SPEED px/s scaled by dt, so it is framerate-independent:
    // update(0.5) moves the ship exactly 100 px. Holding both directions
    // cancels out.
    let direction = 0;
    if (isKeyHeld('ArrowLeft') || isKeyHeld('a')) direction -= 1;
    if (isKeyHeld('ArrowRight') || isKeyHeld('d')) direction += 1;
    this.x += direction * PLAYER_SPEED * dt;

    // Clamp to the canvas: the left edge never goes below x = 0 and the
    // right edge never passes CANVAS_WIDTH, no matter how long a direction
    // is held or how large dt is.
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;

    // Bullet flight: straight up at BULLET_SPEED px/s (dt-scaled). The
    // moment the bullet has fully left the top of the canvas it is
    // removed...
    if (this.bullet !== null) {
      this.bullet.y -= BULLET_SPEED * dt;
      if (this.bullet.y + this.bullet.height <= 0) this.bullet = null;
    }

    // ...and firing is allowed again immediately — including in this same
    // update if Space is still held. Classic one-bullet rule: at most one
    // player bullet is in flight at any time; while one is on screen,
    // pressing or holding Space spawns nothing.
    if (this.bullet === null && isKeyHeld(' ')) {
      this.bullet = {
        x: this.x + this.width / 2 - BULLET_WIDTH / 2,
        y: this.y - BULLET_HEIGHT,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
      };
      // One more shot in the session counter — Level 2's UFO tiers read
      // it mod 4.
      this.shotsFired += 1;
    }
  }

  draw(ctx) {
    // The bullet is a small filled rectangle.
    if (this.bullet !== null) {
      ctx.fillStyle = BULLET_COLOR;
      ctx.fillRect(this.bullet.x, this.bullet.y, this.bullet.width, this.bullet.height);
    }

    // While the invulnerability window runs the ship flashes: it is
    // skipped (invisible) on alternating ~100 ms phases of the remaining
    // time, and drawn normally otherwise.
    const flashHidden =
      this.invulnerable > 0 &&
      Math.floor(this.invulnerable * FLASH_HZ) % 2 === 1;

    if (flashHidden) return;

    // The ship is drawn procedurally from canvas rectangles and an arc —
    // no image assets are loaded.
    const centerX = this.x + this.width / 2;
    const baseY = this.y + this.height - BASE_HEIGHT;

    ctx.fillStyle = SHIP_COLOR;
    // Cannon at the nose.
    ctx.fillRect(centerX - CANNON_WIDTH / 2, this.y, CANNON_WIDTH, this.height - BASE_HEIGHT);
    // Hull.
    ctx.fillRect(this.x, baseY, this.width, BASE_HEIGHT);
    // Dome: a semicircular arc on top of the hull.
    ctx.beginPath();
    ctx.arc(centerX, baseY, DOME_RADIUS, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }
}
