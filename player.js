import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, BULLET_SPEED, STARTING_LIVES } from './gameConfig.js';
import { isKeyHeld } from './input.js';

const SHIP_WIDTH = 40;
const SHIP_HEIGHT = 24;
const SHIP_Y = CANVAS_HEIGHT - 60;
const SHIP_START_X = CANVAS_WIDTH / 2 - SHIP_WIDTH / 2;

// Exported so later cards (e.g. collision.js) can build an AABB for the
// player's bullet without redefining its size.
export const BULLET_WIDTH = 4;
export const BULLET_HEIGHT = 14;

const FLASH_INTERVAL_MS = 150; // ship flicker rate while invulnerable

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class Player {
  constructor() {
    this.x = SHIP_START_X;
    this.y = SHIP_Y;
    this.width = SHIP_WIDTH;
    this.height = SHIP_HEIGHT;
    this.lives = STARTING_LIVES;
    this.bullet = null; // { x, y } while a shot is in flight, else null
    // Total shots fired across the whole session (not reset between
    // levels/restarts within a run) -- consumed by later cards (e.g.
    // "Level 2: they shoot back") for deterministic bonus-UFO scoring.
    this.shotsFired = 0;
    this.invulnerableMs = 0; // remaining post-respawn invulnerability time
  }

  get invulnerable() {
    return this.invulnerableMs > 0;
  }

  // Moves the ship back to its fixed start position and grants temporary
  // invulnerability. Used by levels whose invaders can shoot back (e.g.
  // "Level 2: they shoot back") after the player is hit.
  respawn(invulnerableMs) {
    this.x = SHIP_START_X;
    this.y = SHIP_Y;
    this.invulnerableMs = invulnerableMs;
  }

  update(dt) {
    if (this.invulnerableMs > 0) {
      this.invulnerableMs = Math.max(0, this.invulnerableMs - dt * 1000);
    }

    if (isKeyHeld('ArrowLeft') || isKeyHeld('a') || isKeyHeld('A')) {
      this.x -= PLAYER_SPEED * dt;
    }
    if (isKeyHeld('ArrowRight') || isKeyHeld('d') || isKeyHeld('D')) {
      this.x += PLAYER_SPEED * dt;
    }
    this.x = clamp(this.x, 0, CANVAS_WIDTH - this.width);

    if (this.bullet) {
      this.bullet.y -= BULLET_SPEED * dt;
      if (this.bullet.y <= 0) {
        this.bullet = null;
      }
    } else if (isKeyHeld('Space')) {
      this.bullet = {
        x: this.x + this.width / 2 - BULLET_WIDTH / 2,
        y: this.y - BULLET_HEIGHT,
      };
      this.shotsFired++;
    }
  }

  draw(ctx) {
    // While invulnerable, flicker the ship on/off instead of drawing it
    // solid every frame; the bullet and lives readout are unaffected.
    const hiddenThisFlicker =
      this.invulnerable && Math.floor(this.invulnerableMs / FLASH_INTERVAL_MS) % 2 === 0;
    if (!hiddenThisFlicker) {
      this.drawShip(ctx);
    }

    if (this.bullet) {
      ctx.fillStyle = '#0f0';
      ctx.fillRect(this.bullet.x, this.bullet.y, BULLET_WIDTH, BULLET_HEIGHT);
    }

    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Lives: ${this.lives}`, 16, CANVAS_HEIGHT - 16);
  }

  drawShip(ctx) {
    const centerX = this.x + this.width / 2;

    ctx.fillStyle = '#4caf50';

    // Rounded nose.
    ctx.beginPath();
    ctx.arc(centerX, this.y + this.height * 0.35, this.width * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Hull.
    ctx.fillRect(this.x, this.y + this.height * 0.35, this.width, this.height * 0.65);
  }

  // Called by later cards (collision detection) when the player is hit.
  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
  }
}
