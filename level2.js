/**
 * level2.js — Level 2: They Shoot Back.
 * ES module; file:// compatible — no fetch, no bundler, no npm.
 *
 * Exports:
 *   Level2   — class extending Level (the Level1 class) from ./level1.js
 *
 * Level 2 is entered automatically when Level 1 is cleared.
 * Player lives and score carry over unchanged.
 *
 * New mechanics vs Level 1:
 *   - Formation moves 1.5× faster (step interval × 0.67).
 *   - Invaders fire back at random intervals [800, 2000] ms (global, lowest-in-column).
 *   - Enemy bullets travel downward at 300 px/s.
 *   - Player hit: 1 life lost, 2-second invulnerability with flashing ship.
 *   - Bonus UFO: every 20 s, alternating side, 120 px/s, shot-count-modulo-4 scoring.
 */

import {
  initInvaders,
  stepInvaders,
  getAliveCount,
  getFormationBottom,
  invaderRect,
  invaders,
  INVADER_COLS,
  INVADER_WIDTH,
  INVADER_HEIGHT,
  INVADER_H_GAP,
} from './invaders.js';

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { hudState, triggerGameOver }   from './game.js';
import { rectsOverlap }                from './collision.js';
import { spawnExplosion }              from './explosion.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Speed multiplier applied to Level 1's step interval. */
const SPEED_MULTIPLIER = 0.67;

/** Total invaders in a full 11×5 formation. */
const TOTAL_INVADERS = 55;

/** Pixels per formation step (same as Level 1). */
const STEP_PX = 8;

// Enemy bullet
const ENEMY_BULLET_SPEED  = 300;   // px/s downward
const ENEMY_BULLET_WIDTH  = 4;     // px
const ENEMY_BULLET_HEIGHT = 10;    // px
const ENEMY_FIRE_MIN_MS   = 800;   // ms
const ENEMY_FIRE_MAX_MS   = 2000;  // ms

// UFO
const UFO_SPEED        = 120;   // px/s
const UFO_Y            = 40;    // px from top — above the top invader row
const UFO_WIDTH        = 48;    // px
const UFO_HEIGHT       = 20;    // px
const UFO_SPAWN_SECS   = 20;    // seconds between UFO appearances
const UFO_SCORE_TABLE  = [50, 100, 150, 300];  // indexed by totalShots % 4

// Player invulnerability
const INVULN_DURATION  = 2.0;   // seconds
const FLASH_HZ         = 9;     // flashes per second (8–10 Hz range)

// Player ship respawn X centre (horizontal centre of canvas, matching player.js)
const PLAYER_START_X_CENTRE = CANVAS_WIDTH / 2;

// ---------------------------------------------------------------------------
// Level2 class
// ---------------------------------------------------------------------------

/**
 * Level2 extends the Level base class (exported as the Level1/Level class
 * from level1.js).  It overrides init(), update(dt), and draw().
 *
 * NOTE: level1.js does not export a generic "Level" base class by that name —
 * the groomed spec says "Level2 extends Level (the Level1 class) from
 * ./level1.js".  Because level1.js has no exportable class at all (only
 * functions), Level2 is implemented as a standalone class that replicates
 * the required lifecycle interface (init, update, draw) and manages the
 * invader formation directly via the shared invaders.js module.
 *
 * game.js is updated to wire Level 2 after Level 1 completes.
 */
export class Level2 {
  /**
   * @param {object} player      The Player instance from game.js.
   * @param {object} callbacks
   * @param {Function} callbacks.onLevelComplete  Called when all invaders cleared.
   * @param {Function} callbacks.onGameOver       Called when lives reach 0 (alias for triggerGameOver).
   */
  constructor(player, callbacks = {}) {
    this._player          = player;
    this._onLevelComplete = callbacks.onLevelComplete || (() => {});

    // Formation step timer
    this._stepTimer = 0;

    // Enemy bullets: array of { x, y }
    this._enemyBullets = [];

    // Enemy fire timer (seconds until next shot)
    this._fireTimer = this._nextFireInterval();

    // UFO state
    this._ufoTimer    = UFO_SPAWN_SECS;  // counts down to next UFO spawn
    this._ufo         = null;            // null or { x, y, vx }
    this._ufoSideFlag = 0;               // 0 = next from left, 1 = next from right

    // Player total shots fired (tracked here for UFO scoring)
    // Seeded from player's own count if available, else 0.
    this._totalShots = 0;

    // Invulnerability
    this._invulnTimer   = 0;     // seconds remaining
    this._flashTimer    = 0;     // accumulator for flash toggle
    this._flashVisible  = true;  // current flash state

    // Level-done guard
    this._levelDone = false;

    // Track last known player bullet state to detect new shots
    this._prevBulletNull = true;
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /**
   * Initialise (or re-initialise) the level.
   * Resets the invader formation; does NOT touch score or lives.
   */
  init() {
    initInvaders();

    this._stepTimer     = 0;
    this._enemyBullets  = [];
    this._fireTimer     = this._nextFireInterval();
    this._ufoTimer      = UFO_SPAWN_SECS;
    this._ufo           = null;
    this._ufoSideFlag   = 0;
    this._totalShots    = 0;
    this._invulnTimer   = 0;
    this._flashTimer    = 0;
    this._flashVisible  = true;
    this._levelDone     = false;
    this._prevBulletNull = (this._player.bullet === null);
  }

  /**
   * Update all Level 2 logic for one fixed-timestep frame.
   * @param {number} dt  Fixed timestep in seconds (typically 1/60).
   */
  update(dt) {
    if (this._levelDone) return;

    // Track new player shots for UFO scoring
    this._trackPlayerShots();

    const alive = getAliveCount();

    // ── Level complete ──────────────────────────────────────────────────────
    if (alive === 0) {
      this._levelDone = true;
      this._onLevelComplete(3);
      return;
    }

    // ── Formation step (Level 1 interval × 0.67) ────────────────────────────
    const intervalMs = (100 + (alive / TOTAL_INVADERS) * 700) * SPEED_MULTIPLIER;
    const intervalS  = intervalMs / 1000;

    this._stepTimer += dt;
    if (this._stepTimer >= intervalS) {
      this._stepTimer -= intervalS;
      stepInvaders(STEP_PX);
    }

    // ── Invader breach check ─────────────────────────────────────────────────
    const bottom = getFormationBottom();
    if (bottom >= this._player.y) {
      this._handlePlayerHit();
      // Reset formation after breach (same as Level 1 behaviour)
      initInvaders();
      this._stepTimer = 0;
    }

    // ── Enemy fire timer ─────────────────────────────────────────────────────
    this._fireTimer -= dt;
    if (this._fireTimer <= 0) {
      this._spawnEnemyBullet();
      this._fireTimer = this._nextFireInterval();
    }

    // ── Enemy bullet movement ────────────────────────────────────────────────
    this._updateEnemyBullets(dt);

    // ── UFO logic ────────────────────────────────────────────────────────────
    this._updateUFO(dt);

    // ── Invulnerability timer ────────────────────────────────────────────────
    if (this._invulnTimer > 0) {
      this._invulnTimer -= dt;
      this._flashTimer  += dt;
      // Toggle flash state at FLASH_HZ
      const flashPeriod = 1 / FLASH_HZ;
      if (this._flashTimer >= flashPeriod) {
        this._flashTimer  -= flashPeriod;
        this._flashVisible = !this._flashVisible;
      }
      if (this._invulnTimer <= 0) {
        this._invulnTimer  = 0;
        this._flashVisible = true;  // ensure ship is visible after invuln ends
      }
    }
  }

  /**
   * Draw all Level 2 elements (invaders drawn by game.js via drawInvaders;
   * this method draws enemy bullets and the UFO, and optionally suppresses
   * the player draw during flash-off frames).
   *
   * game.js calls player.draw(ctx) independently; to implement flashing we
   * expose a flag the game loop checks.  The draw() here handles enemy
   * bullets and UFO only.
   *
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    // Enemy bullets
    ctx.fillStyle = '#ff4444';
    for (const b of this._enemyBullets) {
      ctx.fillRect(
        Math.round(b.x - ENEMY_BULLET_WIDTH / 2),
        Math.round(b.y),
        ENEMY_BULLET_WIDTH,
        ENEMY_BULLET_HEIGHT
      );
    }

    // UFO
    if (this._ufo !== null) {
      this._drawUFO(ctx);
    }
  }

  // -------------------------------------------------------------------------
  // Public helpers for game.js integration
  // -------------------------------------------------------------------------

  /**
   * Returns false during flash-off frames so game.js can skip drawing the
   * player ship, creating the invulnerability flashing effect.
   * @returns {boolean}
   */
  get playerVisible() {
    return this._flashVisible;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /** Returns a random fire interval in [ENEMY_FIRE_MIN_MS, ENEMY_FIRE_MAX_MS] ms, in seconds. */
  _nextFireInterval() {
    const ms = ENEMY_FIRE_MIN_MS + Math.random() * (ENEMY_FIRE_MAX_MS - ENEMY_FIRE_MIN_MS);
    return ms / 1000;
  }

  /**
   * Track when the player fires a new bullet (transition from null to non-null)
   * to count total shots for UFO scoring.
   */
  _trackPlayerShots() {
    const bulletNowNull = (this._player.bullet === null);
    if (this._prevBulletNull && !bulletNowNull) {
      // A new bullet was just fired
      this._totalShots += 1;
    }
    this._prevBulletNull = bulletNowNull;
  }

  /**
   * Fire one enemy bullet from the lowest surviving invader in a randomly
   * chosen column.  Skips columns with no survivors.
   */
  _spawnEnemyBullet() {
    // Collect columns that have at least one alive invader
    const activeCols = [];
    for (let col = 0; col < INVADER_COLS; col++) {
      const colInvaders = invaders.filter(inv => inv.col === col && inv.alive);
      if (colInvaders.length > 0) activeCols.push(col);
    }
    if (activeCols.length === 0) return;

    // Pick a random active column
    const chosenCol = activeCols[Math.floor(Math.random() * activeCols.length)];

    // Find the lowest (highest row index = visually lowest) surviving invader in that column
    const colInvaders = invaders
      .filter(inv => inv.col === chosenCol && inv.alive)
      .sort((a, b) => b.row - a.row);  // descending row → lowest on screen first

    const shooter = colInvaders[0];
    if (!shooter) return;

    const rect = invaderRect(shooter);
    this._enemyBullets.push({
      x: rect.x + INVADER_WIDTH / 2,
      y: rect.y + INVADER_HEIGHT,
    });
  }

  /**
   * Move all enemy bullets downward; check for player collision and canvas exit.
   * @param {number} dt
   */
  _updateEnemyBullets(dt) {
    // Player hit box — approximate ship as a rectangle
    const SHIP_WIDTH  = 48;
    const SHIP_HEIGHT = 32;
    const playerRect = {
      x:      this._player.x,
      y:      this._player.y,
      width:  SHIP_WIDTH,
      height: SHIP_HEIGHT,
    };

    for (let i = this._enemyBullets.length - 1; i >= 0; i--) {
      const b = this._enemyBullets[i];
      b.y += ENEMY_BULLET_SPEED * dt;

      // Despawn if past bottom edge
      if (b.y > CANVAS_HEIGHT) {
        this._enemyBullets.splice(i, 1);
        continue;
      }

      // Check collision with player
      const bulletRect = {
        x:      b.x - ENEMY_BULLET_WIDTH / 2,
        y:      b.y,
        width:  ENEMY_BULLET_WIDTH,
        height: ENEMY_BULLET_HEIGHT,
      };

      if (rectsOverlap(bulletRect, playerRect)) {
        this._enemyBullets.splice(i, 1);
        this._handlePlayerHit();
      }
    }
  }

  /**
   * Handle a player hit (enemy bullet or formation breach).
   * If invulnerable: no effect.
   * If vulnerable: deduct life, respawn or game over.
   */
  _handlePlayerHit() {
    if (this._invulnTimer > 0) return;  // invulnerable — ignore hit

    hudState.lives -= 1;

    if (hudState.lives <= 0) {
      triggerGameOver();
      return;
    }

    // Respawn player at horizontal centre
    const SHIP_WIDTH = 48;
    this._player.x = PLAYER_START_X_CENTRE - SHIP_WIDTH / 2;

    // Grant invulnerability
    this._invulnTimer  = INVULN_DURATION;
    this._flashTimer   = 0;
    this._flashVisible = true;
  }

  /**
   * Update UFO state: countdown, spawn, movement, exit.
   * @param {number} dt
   */
  _updateUFO(dt) {
    if (this._ufo !== null) {
      // Move UFO
      this._ufo.x += this._ufo.vx * dt;

      // Check player bullet collision
      if (this._player.bullet !== null) {
        const BULLET_WIDTH  = 4;
        const BULLET_HEIGHT = 10;
        const bulletRect = {
          x:      this._player.bullet.x - BULLET_WIDTH / 2,
          y:      this._player.bullet.y,
          width:  BULLET_WIDTH,
          height: BULLET_HEIGHT,
        };
        const ufoRect = {
          x:      this._ufo.x,
          y:      this._ufo.y,
          width:  UFO_WIDTH,
          height: UFO_HEIGHT,
        };
        if (rectsOverlap(bulletRect, ufoRect)) {
          // Award score
          const scoreIdx = this._totalShots % 4;
          hudState.score += UFO_SCORE_TABLE[scoreIdx];

          // Spawn a small explosion
          spawnExplosion(
            this._ufo.x + UFO_WIDTH / 2,
            this._ufo.y + UFO_HEIGHT / 2,
            UFO_WIDTH,
            UFO_HEIGHT
          );

          // Deactivate bullet
          this._player.bullet = null;

          // Remove UFO and restart timer
          this._ufo       = null;
          this._ufoTimer  = UFO_SPAWN_SECS;
          return;
        }
      }

      // Check if UFO has exited the screen
      const exited = (this._ufo.vx > 0 && this._ufo.x > CANVAS_WIDTH) ||
                     (this._ufo.vx < 0 && this._ufo.x + UFO_WIDTH < 0);
      if (exited) {
        this._ufo      = null;
        this._ufoTimer = UFO_SPAWN_SECS;
      }
    } else {
      // Count down to next UFO
      this._ufoTimer -= dt;
      if (this._ufoTimer <= 0) {
        this._spawnUFO();
      }
    }
  }

  /**
   * Spawn a UFO entering from the appropriate side.
   */
  _spawnUFO() {
    const fromLeft = (this._ufoSideFlag % 2 === 0);
    this._ufoSideFlag += 1;

    if (fromLeft) {
      this._ufo = {
        x:  -UFO_WIDTH,        // starts just off the left edge
        y:  UFO_Y,
        vx: UFO_SPEED,         // travels rightward
      };
    } else {
      this._ufo = {
        x:  CANVAS_WIDTH,      // starts just off the right edge
        y:  UFO_Y,
        vx: -UFO_SPEED,        // travels leftward
      };
    }
  }

  /**
   * Draw the UFO as a simple coloured shape.
   * @param {CanvasRenderingContext2D} ctx
   */
  _drawUFO(ctx) {
    const u = this._ufo;
    const x = Math.round(u.x);
    const y = Math.round(u.y);

    // Body
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(x, y + UFO_HEIGHT / 3, UFO_WIDTH, (UFO_HEIGHT * 2) / 3);

    // Dome
    ctx.fillStyle = '#ff8888';
    ctx.beginPath();
    ctx.ellipse(
      x + UFO_WIDTH / 2,
      y + UFO_HEIGHT / 3,
      UFO_WIDTH / 3,
      UFO_HEIGHT / 3,
      0, Math.PI, 0  // upper half
    );
    ctx.closePath();
    ctx.fill();

    // Engine pods (two small rects)
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(x + 4,              y + UFO_HEIGHT - 4, 8, 4);
    ctx.fillRect(x + UFO_WIDTH - 12, y + UFO_HEIGHT - 4, 8, 4);
  }
}
