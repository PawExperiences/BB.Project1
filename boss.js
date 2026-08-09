// boss.js — Level 4 Boss entity (ES module)
// No image assets; drawn entirely with Canvas 2D primitives.
//
// Collision note: the task spec assumed collision.js exports isColliding(rectA, rectB).
// The actual export is aabbOverlap(a, b) with identical semantics (AABB overlap).
// We import and use aabbOverlap; the contract is the same.
import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_SPEED } from './gameConfig.js';
import { isKeyHeld } from './input.js';
import { aabbOverlap } from './collision.js';

// ---------------------------------------------------------------------------
// Boss constants
// ---------------------------------------------------------------------------
const BOSS_WIDTH        = 160;
const BOSS_HEIGHT       = 80;
const BOSS_Y            = 40;          // top edge, fixed
const BOSS_SPEED        = 90;          // px/s horizontal drift
const BOSS_MAX_HP       = 10;

const BULLET_W          = 6;
const BULLET_H          = 14;
const BOSS_BULLET_SPEED = 260;         // px/s downward component
const SPREAD_ANGLE_DEG  = 20;          // degrees from straight-down

const PHASE1_INTERVAL   = 1500;        // ms
const PHASE2_INTERVAL   = 700;         // ms
const PHASE2_HP         = 5;           // threshold

// Player ship constants (mirrored from player.js / level scenes)
const PLAYER_SPEED_PX      = 200;
const PLAYER_BULLET_SPEED  = BULLET_SPEED; // 500 px/s upward
const PLAYER_BULLET_WIDTH  = 4;
const PLAYER_BULLET_HEIGHT = 12;
const SHIP_WIDTH           = 40;
const SHIP_HEIGHT          = 32;
const SHIP_Y               = CANVAS_HEIGHT - 60;

// Fire-rate for player bullets: Level 3 carries over the same weapon.
// Level 3 uses a single-bullet-at-a-time approach (same as levels 1 & 2).
// We replicate that: one bullet in flight at a time, fired on Space press.

// Health bar
const HBAR_HEIGHT = 10; // px

// ---------------------------------------------------------------------------
// Level4Scene
// ---------------------------------------------------------------------------
export class Level4Scene {
  /**
   * @param {object} opts
   * @param {number}   opts.lives
   * @param {number}   opts.score
   * @param {number}   opts.sessionShotCount
   * @param {function} opts.onGameOver   — called with no args to reset to Level 1
   * @param {function} opts.onLevelClear — called when boss is defeated
   */
  constructor({ lives, score, sessionShotCount, onGameOver, onLevelClear }) {
    this.lives            = lives;
    this.score            = score;
    this.sessionShotCount = sessionShotCount;
    this.onGameOver       = onGameOver;
    this.onLevelClear     = onLevelClear;

    // Boss state
    this._bossX    = (CANVAS_WIDTH - BOSS_WIDTH) / 2; // left edge
    this._bossDirX = 1;   // +1 right, -1 left
    this._bossHP   = BOSS_MAX_HP;

    // Fire timer (ms)
    this._fireTimer = 0;

    // Boss bullets: array of { x, y, vx, vy, active }
    this._bossBullets = [];

    // Player state
    this._playerX      = CANVAS_WIDTH / 2; // centre-x
    this._playerBullet = null;             // { x, y, width, height, active } | null
    this._spaceWasHeld = false;

    // Win / over flags
    this._won  = false;
    this._dead = false;

    // Listen for restart key on win screen
    this._onKeyDown = this._handleKey.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
  }

  // -------------------------------------------------------------------------
  // Key handler for win/restart
  // -------------------------------------------------------------------------
  _handleKey(e) {
    if (this._won && (e.key === 'r' || e.key === 'R')) {
      this._cleanup();
      this.onGameOver(); // reuse onGameOver to reset to Level 1
    }
  }

  _cleanup() {
    window.removeEventListener('keydown', this._onKeyDown);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  _bossRect() {
    return { x: this._bossX, y: BOSS_Y, width: BOSS_WIDTH, height: BOSS_HEIGHT };
  }

  _fireInterval() {
    return this._bossHP <= PHASE2_HP ? PHASE2_INTERVAL : PHASE1_INTERVAL;
  }

  _spawnBullets() {
    // Centre of boss
    const cx = this._bossX + BOSS_WIDTH / 2;
    const cy = BOSS_Y + BOSS_HEIGHT;

    const spreadRad = (SPREAD_ANGLE_DEG * Math.PI) / 180;

    // Three bullets: straight, left-of-down, right-of-down
    const angles = [0, -spreadRad, spreadRad]; // 0 = straight down
    for (const angle of angles) {
      this._bossBullets.push({
        x:      cx,
        y:      cy,
        vx:     Math.sin(angle) * BOSS_BULLET_SPEED,
        vy:     Math.cos(angle) * BOSS_BULLET_SPEED, // cos(0)=1 → full speed down
        active: true,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------------
  update(dt) {
    if (this._won || this._dead) return;

    const dtMs = dt * 1000;

    // --- Boss horizontal movement ---
    this._bossX += this._bossDirX * BOSS_SPEED * dt;
    if (this._bossX <= 0) {
      this._bossX   = 0;
      this._bossDirX = 1;
    }
    if (this._bossX + BOSS_WIDTH >= CANVAS_WIDTH) {
      this._bossX   = CANVAS_WIDTH - BOSS_WIDTH;
      this._bossDirX = -1;
    }

    // --- Boss fire timer ---
    this._fireTimer += dtMs;
    if (this._fireTimer >= this._fireInterval()) {
      this._fireTimer -= this._fireInterval();
      this._spawnBullets();
    }

    // --- Boss bullets travel ---
    for (const b of this._bossBullets) {
      if (!b.active) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y > CANVAS_HEIGHT + BULLET_H) {
        b.active = false;
      }
    }
    // Prune inactive boss bullets
    this._bossBullets = this._bossBullets.filter(b => b.active);

    // --- Player movement ---
    const halfW = SHIP_WIDTH / 2;
    if (isKeyHeld('ArrowLeft') || isKeyHeld('a') || isKeyHeld('A')) {
      this._playerX -= PLAYER_SPEED_PX * dt;
    }
    if (isKeyHeld('ArrowRight') || isKeyHeld('d') || isKeyHeld('D')) {
      this._playerX += PLAYER_SPEED_PX * dt;
    }
    if (this._playerX - halfW < 0)            this._playerX = halfW;
    if (this._playerX + halfW > CANVAS_WIDTH) this._playerX = CANVAS_WIDTH - halfW;

    // --- Player shooting (same as Level 3: one bullet at a time) ---
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

    // --- Player bullet travel ---
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

    // --- Collision: player bullet vs boss ---
    // Uses aabbOverlap from collision.js (same semantics as isColliding)
    if (this._playerBullet !== null && this._playerBullet.active) {
      const bulletRect = {
        x:      this._playerBullet.x - PLAYER_BULLET_WIDTH / 2,
        y:      this._playerBullet.y,
        width:  PLAYER_BULLET_WIDTH,
        height: PLAYER_BULLET_HEIGHT,
      };
      if (aabbOverlap(bulletRect, this._bossRect())) {
        this._playerBullet.active = false;
        this._playerBullet        = null;
        this._bossHP              = Math.max(0, this._bossHP - 1);
        if (this._bossHP === 0) {
          this._won = true;
          this._cleanup();
          // Re-attach for win screen restart
          window.addEventListener('keydown', this._onKeyDown);
          return;
        }
      }
    }

    // --- Collision: boss bullet vs player (sudden death) ---
    // Uses aabbOverlap from collision.js
    const playerRect = {
      x:      this._playerX - SHIP_WIDTH / 2,
      y:      SHIP_Y,
      width:  SHIP_WIDTH,
      height: SHIP_HEIGHT,
    };
    for (const b of this._bossBullets) {
      if (!b.active) continue;
      const bRect = {
        x:      b.x - BULLET_W / 2,
        y:      b.y,
        width:  BULLET_W,
        height: BULLET_H,
      };
      if (aabbOverlap(bRect, playerRect)) {
        // Sudden death: end run, reset to Level 1, score resets
        this._dead = true;
        this._cleanup();
        this.onGameOver();
        return;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Draw
  // -------------------------------------------------------------------------
  draw(ctx) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (this._won) {
      this._drawWinScreen(ctx);
      return;
    }

    // --- HUD ---
    ctx.fillStyle = '#ffffff';
    ctx.font      = '20px monospace';
    ctx.fillText(`SCORE  ${this.score}`, 20, 30);
    ctx.fillText(`LIVES  ${this.lives}`, CANVAS_WIDTH - 160, 30);
    ctx.fillText('LEVEL 4', CANVAS_WIDTH / 2 - 40, 30);

    // --- Health bar (canvas overlay at very top, Y=0, height=HBAR_HEIGHT) ---
    // Background (dark green)
    ctx.fillStyle = '#004400';
    ctx.fillRect(0, 0, CANVAS_WIDTH, HBAR_HEIGHT);
    // Filled portion (green), proportional to current HP
    ctx.fillStyle = '#00ff00';
    const barWidth = (this._bossHP / BOSS_MAX_HP) * CANVAS_WIDTH;
    ctx.fillRect(0, 0, barWidth, HBAR_HEIGHT);

    // --- Boss body ---
    this._drawBoss(ctx);

    // --- Boss bullets ---
    ctx.fillStyle = '#ff4400';
    for (const b of this._bossBullets) {
      if (!b.active) continue;
      ctx.fillRect(b.x - BULLET_W / 2, b.y, BULLET_W, BULLET_H);
    }

    // --- Player bullet ---
    if (this._playerBullet !== null && this._playerBullet.active) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(
        this._playerBullet.x - PLAYER_BULLET_WIDTH / 2,
        this._playerBullet.y,
        PLAYER_BULLET_WIDTH,
        PLAYER_BULLET_HEIGHT
      );
    }

    // --- Player ship ---
    this._drawShip(ctx);
  }

  // -------------------------------------------------------------------------
  // Draw helpers
  // -------------------------------------------------------------------------
  _drawBoss(ctx) {
    const x = this._bossX;
    const y = BOSS_Y;
    const w = BOSS_WIDTH;
    const h = BOSS_HEIGHT;

    // Phase colours
    const phase2    = this._bossHP <= PHASE2_HP;
    const bodyColor = phase2 ? '#ff2200' : '#cc00cc';
    const detailCol = phase2 ? '#ff8800' : '#ff44ff';

    // Main hull
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x + 10, y + 20, w - 20, h - 20); // wide central body
    ctx.fillRect(x + 30, y,      w - 60, 24);      // raised centre dome
    // Side wings
    ctx.fillRect(x,       y + 30, 30, 30);          // left wing
    ctx.fillRect(x + w - 30, y + 30, 30, 30);       // right wing
    // Wing tips
    ctx.fillRect(x,           y + 50, 16, 10);      // left tip
    ctx.fillRect(x + w - 16,  y + 50, 16, 10);      // right tip

    // Detail
    ctx.fillStyle = detailCol;
    // Eye / cannon ports
    ctx.fillRect(x + 40, y + 30, 12, 12);
    ctx.fillRect(x + w - 52, y + 30, 12, 12);
    // Central cannon
    ctx.fillRect(x + w / 2 - 5, y + h - 16, 10, 16);

    // Phase indicator label
    ctx.fillStyle = '#ffffff';
    ctx.font      = '11px monospace';
    const label = phase2 ? 'PHASE 2' : 'PHASE 1';
    ctx.fillText(label, x + w / 2 - 24, y + 14);
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

  _drawWinScreen(ctx) {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';

    // YOU WIN!
    ctx.fillStyle = '#ffff00';
    ctx.font      = 'bold 72px monospace';
    ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

    // Final score
    ctx.fillStyle = '#ffffff';
    ctx.font      = '36px monospace';
    ctx.fillText(`FINAL SCORE: ${this.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    // Restart prompt
    ctx.fillStyle = '#00ff00';
    ctx.font      = '28px monospace';
    ctx.fillText('PRESS R TO PLAY AGAIN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);

    ctx.textAlign = 'left'; // reset
  }
}
