// level1.js — Level 1 scene: passive invader grid
// ES module; runs from file:// with no server, no fetch, no npm deps.
import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_SPEED } from './gameConfig.js';
import { isKeyHeld } from './input.js';
import { aabbOverlap } from './collision.js';

// ---------------------------------------------------------------------------
// Grid configuration
// ---------------------------------------------------------------------------
const COLS           = 11;
const ROWS           = 5;
const INVADER_WIDTH  = 36;
const INVADER_HEIGHT = 24;
const H_GAP          = 16;
const V_GAP          = 16;
const START_X        = 64;
const START_Y        = 80;

const STEP_X         = 4;
const DROP_Y         = INVADER_HEIGHT + V_GAP;

// Baseline step interval (ms). Level 2 uses × 0.67 of this.
const BASE_STEP_MS   = 600;

// Player
const PLAYER_SPEED_PX      = 200;
const PLAYER_BULLET_SPEED  = BULLET_SPEED; // 500 px/s
const PLAYER_BULLET_WIDTH  = 4;
const PLAYER_BULLET_HEIGHT = 12;
const SHIP_WIDTH  = 40;
const SHIP_HEIGHT = 32;
const SHIP_Y      = CANVAS_HEIGHT - 60;

// Score
const POINTS_PER_INVADER = 10;

// ---------------------------------------------------------------------------
export class Level1Scene {
  /**
   * @param {object} opts
   * @param {number}   opts.lives
   * @param {number}   opts.score
   * @param {number}   opts.sessionShotCount
   * @param {function} opts.onGameOver
   * @param {function} opts.onLevelClear
   */
  constructor({ lives, score, sessionShotCount, onGameOver, onLevelClear }) {
    this.lives            = lives;
    this.score            = score;
    this.sessionShotCount = sessionShotCount;
    this.onGameOver       = onGameOver;
    this.onLevelClear     = onLevelClear;

    // Build grid
    this._invaders = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        this._invaders.push({
          x:      START_X + col * (INVADER_WIDTH  + H_GAP),
          y:      START_Y + row * (INVADER_HEIGHT + V_GAP),
          width:  INVADER_WIDTH,
          height: INVADER_HEIGHT,
          alive:  true,
          col,
          row,
        });
      }
    }

    this._dirX      = 1;
    this._stepTimer = 0;
    this._explosions = [];

    this._playerX      = CANVAS_WIDTH / 2;
    this._playerBullet = null;
    this._spaceWasHeld = false;
    this._done         = false;
  }

  _aliveInvaders() {
    return this._invaders.filter(i => i.alive);
  }

  _stepInterval() {
    const alive    = this._aliveInvaders().length;
    const total    = COLS * ROWS;
    const fraction = alive / total;
    return BASE_STEP_MS * (0.25 + 0.75 * fraction);
  }

  update(dt) {
    if (this._done) return;
    const dtMs = dt * 1000;

    // Step timer
    this._stepTimer += dtMs;
    if (this._stepTimer >= this._stepInterval()) {
      this._stepTimer -= this._stepInterval();
      this._moveFormation();
    }

    // Explosions
    for (let i = this._explosions.length - 1; i >= 0; i--) {
      this._explosions[i].ttl -= dt;
      if (this._explosions[i].ttl <= 0) this._explosions.splice(i, 1);
    }

    // Player movement
    const halfW = SHIP_WIDTH / 2;
    if (isKeyHeld('ArrowLeft') || isKeyHeld('a') || isKeyHeld('A')) {
      this._playerX -= PLAYER_SPEED_PX * dt;
    }
    if (isKeyHeld('ArrowRight') || isKeyHeld('d') || isKeyHeld('D')) {
      this._playerX += PLAYER_SPEED_PX * dt;
    }
    if (this._playerX - halfW < 0)             this._playerX = halfW;
    if (this._playerX + halfW > CANVAS_WIDTH)  this._playerX = CANVAS_WIDTH - halfW;

    // Shooting
    const spaceNow = isKeyHeld(' ');
    if (spaceNow && !this._spaceWasHeld && this._playerBullet === null) {
      this._playerBullet = {
        x:      this._playerX,
        y:      SHIP_Y - PLAYER_BULLET_HEIGHT,
        width:  PLAYER_BULLET_WIDTH,
        height: PLAYER_BULLET_HEIGHT,
        active: true,
      };
      this.sessionShotCount++;
    }
    this._spaceWasHeld = spaceNow;

    // Bullet travel
    if (this._playerBullet !== null) {
      if (!this._playerBullet.active) {
        this._playerBullet = null;
      } else {
        this._playerBullet.y -= PLAYER_BULLET_SPEED * dt;
        if (this._playerBullet.y + PLAYER_BULLET_HEIGHT < 0) {
          this._playerBullet = null;
        }
      }
    }

    // Collision: bullet vs invaders
    if (this._playerBullet !== null && this._playerBullet.active) {
      const br = {
        x:      this._playerBullet.x - PLAYER_BULLET_WIDTH / 2,
        y:      this._playerBullet.y,
        width:  PLAYER_BULLET_WIDTH,
        height: PLAYER_BULLET_HEIGHT,
      };
      for (const inv of this._invaders) {
        if (!inv.alive) continue;
        if (aabbOverlap(br, inv)) {
          this._playerBullet.active = false;
          this._playerBullet        = null;
          inv.alive                 = false;
          this.score               += POINTS_PER_INVADER;
          this._explosions.push({ x: inv.x, y: inv.y, width: inv.width, height: inv.height, ttl: 0.33 });
          break;
        }
      }
    }

    // Level clear
    if (this._aliveInvaders().length === 0 && !this._done) {
      this._done = true;
      this.onLevelClear({
        lives:            this.lives,
        score:            this.score,
        sessionShotCount: this.sessionShotCount,
      });
    }
  }

  _moveFormation() {
    const alive = this._aliveInvaders();
    if (alive.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    for (const inv of alive) {
      if (inv.x < minX)              minX = inv.x;
      if (inv.x + inv.width > maxX)  maxX = inv.x + inv.width;
    }

    const nextMin = minX + this._dirX * STEP_X;
    const nextMax = maxX + this._dirX * STEP_X;

    if (nextMin < 0 || nextMax > CANVAS_WIDTH) {
      this._dirX *= -1;
      for (const inv of this._invaders) {
        if (!inv.alive) continue;
        inv.y += DROP_Y;
      }
    } else {
      for (const inv of this._invaders) {
        if (!inv.alive) continue;
        inv.x += this._dirX * STEP_X;
      }
    }
  }

  draw(ctx) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font      = '20px monospace';
    ctx.fillText(`SCORE  ${this.score}`, 20, 30);
    ctx.fillText(`LIVES  ${this.lives}`, CANVAS_WIDTH - 160, 30);
    ctx.fillText('LEVEL 1', CANVAS_WIDTH / 2 - 40, 30);

    // Invaders
    ctx.fillStyle = '#33ff33';
    for (const inv of this._invaders) {
      if (!inv.alive) continue;
      ctx.fillRect(inv.x, inv.y, inv.width, inv.height);
    }

    // Explosions
    ctx.fillStyle = '#ffaa00';
    for (const exp of this._explosions) {
      ctx.fillRect(exp.x, exp.y, exp.width, exp.height);
    }

    // Player bullet
    if (this._playerBullet !== null && this._playerBullet.active) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(
        this._playerBullet.x - PLAYER_BULLET_WIDTH / 2,
        this._playerBullet.y,
        PLAYER_BULLET_WIDTH,
        PLAYER_BULLET_HEIGHT
      );
    }

    // Player ship
    this._drawShip(ctx);
  }

  _drawShip(ctx) {
    const left = this._playerX - SHIP_WIDTH / 2;
    const top  = SHIP_Y;
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(left, top + 16, 40, 16);
    ctx.fillRect(left + 6, top + 8, 28, 10);
    ctx.fillRect(left + 16, top, 8, 10);
    ctx.beginPath();
    ctx.arc(this._playerX, top + 10, 6, Math.PI, 2 * Math.PI);
    ctx.fill();
  }
}
