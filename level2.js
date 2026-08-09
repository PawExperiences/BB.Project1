// level2.js — Level 2 scene: "They Shoot Back"
// ES module; runs from file:// with no server, no fetch, no npm deps.
import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_SPEED } from './gameConfig.js';
import { isKeyHeld } from './input.js';
import { aabbOverlap } from './collision.js';

// ---------------------------------------------------------------------------
// Grid configuration (identical layout to Level 1)
// ---------------------------------------------------------------------------
const COLS           = 11;
const ROWS           = 5;
const INVADER_WIDTH  = 36;
const INVADER_HEIGHT = 24;
const H_GAP          = 16;
const V_GAP          = 16;
const START_X        = 64;
const START_Y        = 80;

// Movement — Level 2 is 1.5× faster: every interval × 0.67
const STEP_X         = 4;                          // pixels per lateral step
const DROP_Y         = INVADER_HEIGHT + V_GAP;     // pixels dropped on edge hit

// How often the formation takes one lateral step (ms). Level 1 baseline ≈ 600 ms.
// Level 2 multiplies by 0.67.
const BASE_STEP_MS   = 600 * 0.67;  // ≈ 402 ms

// Invader bullet
const INV_BULLET_SPEED  = 300; // px/s downward
const INV_BULLET_WIDTH  = 4;
const INV_BULLET_HEIGHT = 14;
const FIRE_MIN_MS       = 800;
const FIRE_MAX_MS       = 2000;

// Player bullet
const PLAYER_BULLET_SPEED  = BULLET_SPEED; // 500 px/s from gameConfig
const PLAYER_BULLET_WIDTH  = 4;
const PLAYER_BULLET_HEIGHT = 12;
const PLAYER_SPEED_PX      = 200; // px/s

// Ship dimensions
const SHIP_WIDTH  = 40;
const SHIP_HEIGHT = 32;
const SHIP_Y      = CANVAS_HEIGHT - 60;

// Invulnerability after respawn
const INVULN_DURATION = 2.0; // seconds
const FLASH_INTERVAL  = 0.1; // seconds between visible/invisible toggle

// UFO
const UFO_SPAWN_INTERVAL = 20000; // ms
const UFO_SPEED          = 120;   // px/s
const UFO_Y              = 40;    // fixed y near top
const UFO_WIDTH          = 52;
const UFO_HEIGHT         = 20;
const UFO_SCORE_TIERS    = [50, 100, 150, 300];

// Score per invader kill
const POINTS_PER_INVADER = 10;

// ---------------------------------------------------------------------------
// Level2Scene
// ---------------------------------------------------------------------------
export class Level2Scene {
  /**
   * @param {object} opts
   * @param {number}   opts.lives            — lives carried over from Level 1
   * @param {number}   opts.score            — score carried over from Level 1
   * @param {number}   opts.sessionShotCount — cumulative shots from Level 1
   * @param {function} opts.onGameOver       — callback(score) when lives reach 0
   * @param {function} opts.onLevelClear     — callback({ lives, score, sessionShotCount })
   */
  constructor({ lives, score, sessionShotCount, onGameOver, onLevelClear }) {
    this.lives            = lives;
    this.score            = score;
    this.sessionShotCount = sessionShotCount;
    this.onGameOver       = onGameOver;
    this.onLevelClear     = onLevelClear;

    // ---- Build invader grid ----
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

    // ---- Formation movement ----
    this._dirX         = 1;          // +1 right, -1 left
    this._stepTimer    = 0;          // ms accumulator until next step
    this._stepInterval = BASE_STEP_MS;

    // ---- Explosions ----
    this._explosions = [];

    // ---- Player bullet ----
    this._playerBullet = null; // { x, y, width, height, active }
    this._spaceWasHeld = false;

    // ---- Player state ----
    this._playerX    = CANVAS_WIDTH / 2;
    this._invuln     = false;
    this._invulnTime = 0;
    this._flashOn    = true;
    this._flashTimer = 0;
    this._dead       = false; // transitioning out

    // ---- Invader bullet ----
    this._invBullet     = null;  // { x, y, width, height }
    this._fireTimer     = this._randomFireDelay();

    // ---- UFO ----
    this._ufo           = null;  // null | { x, y, goingRight, active }
    this._ufoTimer      = 0;     // ms since last UFO (or level start)
    this._ufoEntryRight = true;  // first entry is left→right

    // ---- Transition guard ----
    this._done = false;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  _randomFireDelay() {
    return FIRE_MIN_MS + Math.random() * (FIRE_MAX_MS - FIRE_MIN_MS);
  }

  _respawnPlayer() {
    this._playerX    = CANVAS_WIDTH / 2;
    this._invuln     = true;
    this._invulnTime = 0;
    this._flashOn    = true;
    this._flashTimer = 0;
  }

  _aliveInvaders() {
    return this._invaders.filter(inv => inv.alive);
  }

  _stepIntervalForCount() {
    // Compress step interval as invaders die (speed them up further)
    const alive = this._aliveInvaders().length;
    const total = COLS * ROWS;
    // Fraction remaining: 1.0 → 0.0; shorter interval when fewer remain
    const fraction = alive / total;
    // Range: BASE_STEP_MS (full grid) down to BASE_STEP_MS * 0.25 (last few)
    return BASE_STEP_MS * (0.25 + 0.75 * fraction);
  }

  // -------------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------------
  update(dt) {
    if (this._done) return;

    const dtMs = dt * 1000;

    // ---- Invulnerability countdown ----
    if (this._invuln) {
      this._invulnTime += dt;
      this._flashTimer += dt;
      if (this._flashTimer >= FLASH_INTERVAL) {
        this._flashTimer -= FLASH_INTERVAL;
        this._flashOn = !this._flashOn;
      }
      if (this._invulnTime >= INVULN_DURATION) {
        this._invuln  = false;
        this._flashOn = true;
      }
    }

    // ---- Formation step timer ----
    this._stepInterval  = this._stepIntervalForCount();
    this._stepTimer    += dtMs;
    if (this._stepTimer >= this._stepInterval) {
      this._stepTimer -= this._stepInterval;
      this._moveFormation();
    }

    // ---- Explosions ----
    for (let i = this._explosions.length - 1; i >= 0; i--) {
      this._explosions[i].ttl -= dt;
      if (this._explosions[i].ttl <= 0) this._explosions.splice(i, 1);
    }

    // ---- Player movement ----
    const halfW = SHIP_WIDTH / 2;
    if (isKeyHeld('ArrowLeft') || isKeyHeld('a') || isKeyHeld('A')) {
      this._playerX -= PLAYER_SPEED_PX * dt;
    }
    if (isKeyHeld('ArrowRight') || isKeyHeld('d') || isKeyHeld('D')) {
      this._playerX += PLAYER_SPEED_PX * dt;
    }
    if (this._playerX - halfW < 0)              this._playerX = halfW;
    if (this._playerX + halfW > CANVAS_WIDTH)   this._playerX = CANVAS_WIDTH - halfW;

    // ---- Player shooting ----
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

    // ---- Player bullet travel ----
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

    // ---- Invader fire timer (only if no invader bullet in flight) ----
    if (this._invBullet === null) {
      this._fireTimer -= dtMs;
      if (this._fireTimer <= 0) {
        this._tryFireInvader();
        // Next timer starts only after bullet exits or hits player (see below)
      }
    }

    // ---- Invader bullet travel ----
    if (this._invBullet !== null) {
      this._invBullet.y += INV_BULLET_SPEED * dt;
      // Check if off-screen
      if (this._invBullet.y > CANVAS_HEIGHT) {
        this._invBullet  = null;
        this._fireTimer  = this._randomFireDelay();
      }
    }

    // ---- UFO timer ----
    this._ufoTimer += dtMs;
    if (this._ufoTimer >= UFO_SPAWN_INTERVAL && this._ufo === null) {
      this._ufoTimer = 0;
      this._spawnUFO();
    }

    // ---- UFO movement ----
    if (this._ufo !== null) {
      if (this._ufo.goingRight) {
        this._ufo.x += UFO_SPEED * dt;
        if (this._ufo.x > CANVAS_WIDTH + UFO_WIDTH) {
          this._ufo = null; // exited without being hit
        }
      } else {
        this._ufo.x -= UFO_SPEED * dt;
        if (this._ufo.x < -UFO_WIDTH) {
          this._ufo = null; // exited without being hit
        }
      }
    }

    // ---- Collision: player bullet vs invaders ----
    if (this._playerBullet !== null && this._playerBullet.active) {
      const br = this._bulletRect(this._playerBullet);
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

    // ---- Collision: player bullet vs UFO ----
    if (this._ufo !== null && this._playerBullet !== null && this._playerBullet.active) {
      const br   = this._bulletRect(this._playerBullet);
      const ufoR = { x: this._ufo.x, y: this._ufo.y, width: UFO_WIDTH, height: UFO_HEIGHT };
      if (aabbOverlap(br, ufoR)) {
        const tier  = this.sessionShotCount % 4;
        const pts   = UFO_SCORE_TIERS[tier];
        this.score += pts;
        this._explosions.push({ x: this._ufo.x, y: this._ufo.y, width: UFO_WIDTH, height: UFO_HEIGHT, ttl: 0.5 });
        this._ufo                     = null;
        this._playerBullet.active     = false;
        this._playerBullet            = null;
      }
    }

    // ---- Collision: invader bullet vs player ----
    if (this._invBullet !== null && !this._invuln) {
      const ir = this._bulletRect(this._invBullet);
      const pr = {
        x:      this._playerX - SHIP_WIDTH / 2,
        y:      SHIP_Y,
        width:  SHIP_WIDTH,
        height: SHIP_HEIGHT,
      };
      if (aabbOverlap(ir, pr)) {
        this._invBullet  = null;
        this._fireTimer  = this._randomFireDelay();
        this.lives      -= 1;
        if (this.lives <= 0) {
          this._done = true;
          this.onGameOver(this.score);
          return;
        }
        this._respawnPlayer();
      }
    }

    // ---- Check level clear ----
    if (this._aliveInvaders().length === 0 && !this._done) {
      this._done = true;
      this.onLevelClear({
        lives:            this.lives,
        score:            this.score,
        sessionShotCount: this.sessionShotCount,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Formation movement
  // -------------------------------------------------------------------------
  _moveFormation() {
    const alive = this._aliveInvaders();
    if (alive.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    for (const inv of alive) {
      if (inv.x < minX)               minX = inv.x;
      if (inv.x + inv.width > maxX)   maxX = inv.x + inv.width;
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

  // -------------------------------------------------------------------------
  // Invader firing
  // -------------------------------------------------------------------------
  _tryFireInvader() {
    // Find lowest alive invader per column
    const lowestPerCol = new Array(COLS).fill(null);
    for (const inv of this._invaders) {
      if (!inv.alive) continue;
      const c = inv.col;
      if (lowestPerCol[c] === null || inv.row > lowestPerCol[c].row) {
        lowestPerCol[c] = inv;
      }
    }
    const candidates = lowestPerCol.filter(inv => inv !== null);
    if (candidates.length === 0) return;

    const shooter = candidates[Math.floor(Math.random() * candidates.length)];
    this._invBullet = {
      x:      shooter.x + shooter.width / 2,
      y:      shooter.y + shooter.height,
      width:  INV_BULLET_WIDTH,
      height: INV_BULLET_HEIGHT,
    };
    // Do NOT reset fireTimer here — it resets when bullet exits/hits player
  }

  // -------------------------------------------------------------------------
  // UFO spawning
  // -------------------------------------------------------------------------
  _spawnUFO() {
    const goingRight = this._ufoEntryRight;
    this._ufoEntryRight = !this._ufoEntryRight; // alternate for next spawn
    this._ufo = {
      x:          goingRight ? -UFO_WIDTH : CANVAS_WIDTH,
      y:          UFO_Y,
      goingRight,
    };
  }

  // -------------------------------------------------------------------------
  // Bullet AABB rect helper
  // bullet.x is centre-x
  // -------------------------------------------------------------------------
  _bulletRect(bullet) {
    return {
      x:      bullet.x - bullet.width / 2,
      y:      bullet.y,
      width:  bullet.width,
      height: bullet.height,
    };
  }

  // -------------------------------------------------------------------------
  // Draw
  // -------------------------------------------------------------------------
  draw(ctx) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // ---- HUD ----
    ctx.fillStyle = '#ffffff';
    ctx.font      = '20px monospace';
    ctx.fillText(`SCORE  ${this.score}`, 20, 30);
    ctx.fillText(`LIVES  ${this.lives}`, CANVAS_WIDTH - 160, 30);
    ctx.fillText('LEVEL 2', CANVAS_WIDTH / 2 - 40, 30);

    // ---- Invaders ----
    ctx.fillStyle = '#33ff33';
    for (const inv of this._invaders) {
      if (!inv.alive) continue;
      ctx.fillRect(inv.x, inv.y, inv.width, inv.height);
    }

    // ---- Explosions ----
    ctx.fillStyle = '#ffaa00';
    for (const exp of this._explosions) {
      ctx.fillRect(exp.x, exp.y, exp.width, exp.height);
    }

    // ---- Player bullet ----
    if (this._playerBullet !== null && this._playerBullet.active) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(
        this._playerBullet.x - PLAYER_BULLET_WIDTH / 2,
        this._playerBullet.y,
        PLAYER_BULLET_WIDTH,
        PLAYER_BULLET_HEIGHT
      );
    }

    // ---- Invader bullet ----
    if (this._invBullet !== null) {
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(
        this._invBullet.x - INV_BULLET_WIDTH / 2,
        this._invBullet.y,
        INV_BULLET_WIDTH,
        INV_BULLET_HEIGHT
      );
    }

    // ---- UFO ----
    if (this._ufo !== null) {
      ctx.fillStyle = '#ff00ff';
      // Main saucer body
      ctx.fillRect(this._ufo.x, this._ufo.y + 8, UFO_WIDTH, 12);
      // Dome
      ctx.beginPath();
      ctx.ellipse(
        this._ufo.x + UFO_WIDTH / 2,
        this._ufo.y + 8,
        UFO_WIDTH / 3,
        8,
        0, Math.PI, 2 * Math.PI
      );
      ctx.fill();
      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font      = '10px monospace';
      ctx.fillText('UFO', this._ufo.x + 14, this._ufo.y + 17);
    }

    // ---- Player ship ----
    if (this._flashOn) {
      this._drawShip(ctx);
    }
  }

  _drawShip(ctx) {
    const left = this._playerX - SHIP_WIDTH / 2;
    const top  = SHIP_Y;

    ctx.fillStyle = '#00ff00';
    // Base
    ctx.fillRect(left, top + 16, 40, 16);
    // Mid body
    ctx.fillRect(left + 6, top + 8, 28, 10);
    // Cannon barrel
    ctx.fillRect(left + 16, top, 8, 10);
    // Dome
    ctx.beginPath();
    ctx.arc(this._playerX, top + 10, 6, Math.PI, 2 * Math.PI);
    ctx.fill();
  }
}
