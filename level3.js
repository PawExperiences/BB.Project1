// level3.js — Level 3: Shields and Formation Split
// ES module. Exports a default class and self-registers with the game loop.

import { registerLevel, transitionTo, enterGameOver, hudState, player } from './game.js';
import { aabbOverlap } from './collision.js';
import { INVADER_HEIGHT } from './invaders.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { triggerExplosion } from './explosion.js';

// ---------------------------------------------------------------------------
// Formation constants
// ---------------------------------------------------------------------------
const COLS = 11;
const ROWS = 5;
const TOTAL_INVADERS = COLS * ROWS; // 55

const INVADER_WIDTH  = 30;
const INVADER_H_GAP  = 10;
const INVADER_V_GAP  = 10;

const FORMATION_WIDTH  = COLS * INVADER_WIDTH + (COLS - 1) * INVADER_H_GAP; // 430
const FORMATION_START_X = Math.round((CANVAS_WIDTH - FORMATION_WIDTH) / 2);  // 169
const FORMATION_START_Y = 80;

// Step-interval anchors (milliseconds)
const INTERVAL_MAX_MS = 800; // at 55 invaders alive
const INTERVAL_MIN_MS = 100; // at 1 invader alive

// Pixels moved per formation step
const STEP_PX = 8;

// Vertical drop per edge-bounce
const DROP_PX = INVADER_HEIGHT;

// ---------------------------------------------------------------------------
// Enemy bullet constants
// ---------------------------------------------------------------------------
const ENEMY_BULLET_SPEED      = 220; // px/s
const ENEMY_BULLET_WIDTH      = 3;
const ENEMY_BULLET_HEIGHT     = 10;
const ENEMY_SHOOT_MIN_MS      = 800;
const ENEMY_SHOOT_MAX_MS      = 2200;

// ---------------------------------------------------------------------------
// Shield / bunker constants
// ---------------------------------------------------------------------------
const CELL_SIZE   = 8;               // px per bunker cell
const BUNKER_COLS = 4;               // cells wide
const BUNKER_ROWS = 4;               // cells tall
const BUNKER_W    = BUNKER_COLS * CELL_SIZE; // 32 px
const NUM_BUNKERS = 4;
const BUNKER_Y    = Math.round(CANVAS_HEIGHT * 0.80); // ~80% canvas height

// Distribute 4 bunkers evenly: gap | bunker | gap | bunker | ... | gap
const BUNKER_H_GAP = Math.round((CANVAS_WIDTH - NUM_BUNKERS * BUNKER_W) / (NUM_BUNKERS + 1));

// ---------------------------------------------------------------------------
// Level3 class — standard level interface
// ---------------------------------------------------------------------------
export default class Level3 {
  constructor() {
    this.done = false;
  }

  /** init(ctx, state) — set up all level state. */
  init(ctx, state) {
    this._initBunkers();
    this._initFormation();
    this._initBullets();
    this.done = false;
    hudState.level = 3;
  }

  // ── Bunker initialisation ──────────────────────────────────────────────────
  _initBunkers() {
    this._bunkers = [];
    for (let b = 0; b < NUM_BUNKERS; b++) {
      const bx = BUNKER_H_GAP + b * (BUNKER_W + BUNKER_H_GAP);
      const cells = [];
      for (let r = 0; r < BUNKER_ROWS; r++) {
        const row = [];
        for (let c = 0; c < BUNKER_COLS; c++) row.push(true);
        cells.push(row);
      }
      this._bunkers.push({ x: bx, y: BUNKER_Y, cells });
    }
  }

  // ── Formation initialisation ───────────────────────────────────────────────
  _initFormation() {
    this._invaders = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const baseX = FORMATION_START_X + col * (INVADER_WIDTH  + INVADER_H_GAP);
        const baseY = FORMATION_START_Y + row * (INVADER_HEIGHT + INVADER_V_GAP);
        this._invaders.push({
          col,
          row,
          alive: true,
          baseX,
          baseY,
          x: baseX,
          y: baseY,
          width:  INVADER_WIDTH,
          height: INVADER_HEIGHT,
        });
      }
    }

    this._destroyed  = 0;
    this._splitDone  = false;

    // Pre-split formation sweep state
    this._dirX       = 1;  // +1 right, -1 left
    this._offsetX    = 0;
    this._offsetY    = 0;
    this._stepTimer  = 0;

    // Post-split halves (populated by _splitFormation)
    this._left  = null;
    this._right = null;
  }

  // ── Bullet state initialisation ────────────────────────────────────────────
  _initBullets() {
    this._enemyBullets = [];
    this._shootTimer   = this._nextShootInterval();
  }

  _nextShootInterval() {
    return ENEMY_SHOOT_MIN_MS + Math.random() * (ENEMY_SHOOT_MAX_MS - ENEMY_SHOOT_MIN_MS);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  _calcStepInterval(liveCount) {
    const n = Math.max(1, Math.min(TOTAL_INVADERS, liveCount));
    const t = (n - 1) / (TOTAL_INVADERS - 1);
    return INTERVAL_MIN_MS + t * (INTERVAL_MAX_MS - INTERVAL_MIN_MS);
  }

  _liveInvaders() {
    return this._invaders.filter(inv => inv.alive);
  }

  // ── Pre-split formation step ───────────────────────────────────────────────
  _stepFormation() {
    const alive = this._liveInvaders();
    if (alive.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    for (const inv of alive) {
      if (inv.x < minX) minX = inv.x;
      if (inv.x + INVADER_WIDTH > maxX) maxX = inv.x + INVADER_WIDTH;
    }

    const nextMinX = minX + this._dirX * STEP_PX;
    const nextMaxX = maxX + this._dirX * STEP_PX;

    if (nextMinX < 0 || nextMaxX > CANVAS_WIDTH) {
      this._dirX   *= -1;
      this._offsetY += DROP_PX;
    } else {
      this._offsetX += this._dirX * STEP_PX;
    }

    for (const inv of this._invaders) {
      inv.x = inv.baseX + this._offsetX;
      inv.y = inv.baseY + this._offsetY;
    }
  }

  // ── Formation split ────────────────────────────────────────────────────────
  _splitFormation() {
    this._splitDone = true;

    // Rebase every invader so current position becomes the new baseX/baseY
    // This lets each half use its own offsetX/offsetY from zero.
    for (const inv of this._invaders) {
      inv.baseX = inv.x;
      inv.baseY = inv.y;
    }

    // Left half: cols 0-4 → initial direction left (-1)
    // Right half: cols 5-10 → initial direction right (+1)
    this._left = {
      invaders:  this._invaders.filter(inv => inv.col <= 4),
      dirX:      -1,
      offsetX:   0,
      offsetY:   0,
      stepTimer: 0,
    };
    this._right = {
      invaders:  this._invaders.filter(inv => inv.col >= 5),
      dirX:      1,
      offsetX:   0,
      offsetY:   0,
      stepTimer: 0,
    };
  }

  // ── Independent half step ──────────────────────────────────────────────────
  _stepHalf(half) {
    const alive = half.invaders.filter(inv => inv.alive);
    if (alive.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    for (const inv of alive) {
      if (inv.x < minX) minX = inv.x;
      if (inv.x + INVADER_WIDTH > maxX) maxX = inv.x + INVADER_WIDTH;
    }

    const nextMinX = minX + half.dirX * STEP_PX;
    const nextMaxX = maxX + half.dirX * STEP_PX;

    if (nextMinX < 0 || nextMaxX > CANVAS_WIDTH) {
      half.dirX   *= -1;
      half.offsetY += DROP_PX;
    } else {
      half.offsetX += half.dirX * STEP_PX;
    }

    for (const inv of half.invaders) {
      inv.x = inv.baseX + half.offsetX;
      inv.y = inv.baseY + half.offsetY;
    }
  }

  // ── Enemy shooting ─────────────────────────────────────────────────────────
  _fireEnemyBullet() {
    const alive = this._liveInvaders();
    if (alive.length === 0) return;

    // Pick the bottom-most invader per column, then choose a random column
    const colMap = new Map();
    for (const inv of alive) {
      if (!colMap.has(inv.col) || inv.y > colMap.get(inv.col).y) {
        colMap.set(inv.col, inv);
      }
    }
    const candidates = Array.from(colMap.values());
    const shooter    = candidates[Math.floor(Math.random() * candidates.length)];

    this._enemyBullets.push({
      x:      shooter.x + (INVADER_WIDTH - ENEMY_BULLET_WIDTH) / 2,
      y:      shooter.y + INVADER_HEIGHT,
      width:  ENEMY_BULLET_WIDTH,
      height: ENEMY_BULLET_HEIGHT,
    });
  }

  // ── Bullet-vs-bunker erosion ────────────────────────────────────────────────
  // Returns true if the bullet hit (and eroded) a cell — bullet is consumed.
  _collideBulletWithBunkers(bulletRect) {
    for (const bunker of this._bunkers) {
      for (let r = 0; r < BUNKER_ROWS; r++) {
        for (let c = 0; c < BUNKER_COLS; c++) {
          if (!bunker.cells[r][c]) continue;
          const cellRect = {
            x:      bunker.x + c * CELL_SIZE,
            y:      bunker.y + r * CELL_SIZE,
            width:  CELL_SIZE,
            height: CELL_SIZE,
          };
          if (aabbOverlap(bulletRect, cellRect)) {
            bunker.cells[r][c] = false;
            return true;
          }
        }
      }
    }
    return false;
  }

  // ── update(dt) ─────────────────────────────────────────────────────────────
  update(dt) {
    if (this.done) return;

    const dtMs         = dt * 1000;
    const currentPlayer = player; // live ES-module binding from game.js

    // Player-death guard
    if (currentPlayer && currentPlayer.lives <= 0) {
      this.done = true;
      enterGameOver();
      return;
    }

    // All-cleared
    if (this._liveInvaders().length === 0) {
      this.done = true;
      // Level 3 is the last numbered level before boss; route to gameover for now
      transitionTo('gameover');
      return;
    }

    // ── Split trigger ────────────────────────────────────────────────────────
    if (!this._splitDone && this._destroyed >= Math.ceil(TOTAL_INVADERS / 2)) {
      this._splitFormation();
    }

    // ── Formation movement ───────────────────────────────────────────────────
    const totalAlive = this._liveInvaders().length;
    const interval   = this._calcStepInterval(Math.max(1, totalAlive));

    if (!this._splitDone) {
      this._stepTimer += dtMs;
      if (this._stepTimer >= interval) {
        this._stepTimer -= interval;
        this._stepFormation();
      }
    } else {
      this._left.stepTimer  += dtMs;
      this._right.stepTimer += dtMs;
      if (this._left.stepTimer >= interval) {
        this._left.stepTimer -= interval;
        this._stepHalf(this._left);
      }
      if (this._right.stepTimer >= interval) {
        this._right.stepTimer -= interval;
        this._stepHalf(this._right);
      }
    }

    // ── Enemy shoot timer ────────────────────────────────────────────────────
    this._shootTimer -= dtMs;
    if (this._shootTimer <= 0) {
      this._fireEnemyBullet();
      this._shootTimer = this._nextShootInterval();
    }

    // ── Move enemy bullets + collisions ──────────────────────────────────────
    for (let i = this._enemyBullets.length - 1; i >= 0; i--) {
      const eb = this._enemyBullets[i];
      eb.y += ENEMY_BULLET_SPEED * dt;

      // Off bottom
      if (eb.y > CANVAS_HEIGHT) {
        this._enemyBullets.splice(i, 1);
        continue;
      }

      // Hits bunker
      if (this._collideBulletWithBunkers(eb)) {
        this._enemyBullets.splice(i, 1);
        continue;
      }

      // Hits player
      if (currentPlayer) {
        const playerRect = {
          x:      currentPlayer.x,
          y:      currentPlayer.y,
          width:  40,  // SHIP_WIDTH
          height: 32,  // SHIP_HEIGHT
        };
        if (aabbOverlap(eb, playerRect)) {
          this._enemyBullets.splice(i, 1);
          currentPlayer.lives -= 1;
          hudState.lives = currentPlayer.lives;
          if (currentPlayer.lives <= 0) {
            this.done = true;
            enterGameOver();
            return;
          }
        }
      }
    }

    // ── Player bullet collisions ──────────────────────────────────────────────
    if (currentPlayer) {
      const bullet = currentPlayer.getBullet();
      if (bullet) {
        // Check bunkers first
        if (this._collideBulletWithBunkers(bullet)) {
          currentPlayer.clearBullet();
        } else {
          // Check invaders
          for (const inv of this._invaders) {
            if (!inv.alive) continue;
            if (aabbOverlap(bullet, inv)) {
              inv.alive = false;
              currentPlayer.clearBullet();
              triggerExplosion(inv.x, inv.y);
              hudState.score += 10;
              this._destroyed += 1;
              break; // bullet consumed
            }
          }
        }
      }
    }

    // ── Invader-reaches-player loss condition ─────────────────────────────────
    // (invader BODIES do not damage bunkers — projectiles only)
    if (currentPlayer) {
      const playerTopY = currentPlayer.y;
      for (const inv of this._liveInvaders()) {
        if (inv.y + inv.height >= playerTopY) {
          currentPlayer.lives -= 1;
          hudState.lives = currentPlayer.lives;
          if (currentPlayer.lives <= 0) {
            this.done = true;
            enterGameOver();
            return;
          }
          // Reset formation and bunkers but keep score
          this._initFormation();
          this._initBunkers();
          this._initBullets();
          hudState.level = 3;
          return;
        }
      }
    }
  }

  // ── render(ctx) ────────────────────────────────────────────────────────────
  render(ctx) {
    // Bunkers — green cells, missing cells not drawn
    ctx.fillStyle = '#00cc00';
    for (const bunker of this._bunkers) {
      for (let r = 0; r < BUNKER_ROWS; r++) {
        for (let c = 0; c < BUNKER_COLS; c++) {
          if (bunker.cells[r][c]) {
            ctx.fillRect(
              Math.round(bunker.x + c * CELL_SIZE),
              Math.round(bunker.y + r * CELL_SIZE),
              CELL_SIZE,
              CELL_SIZE
            );
          }
        }
      }
    }

    // Invaders — lime green rectangles
    ctx.fillStyle = '#00FF00';
    for (const inv of this._invaders) {
      if (inv.alive) {
        ctx.fillRect(Math.round(inv.x), Math.round(inv.y), INVADER_WIDTH, INVADER_HEIGHT);
      }
    }

    // Enemy bullets — red
    ctx.fillStyle = '#ff4444';
    for (const eb of this._enemyBullets) {
      ctx.fillRect(Math.round(eb.x), Math.round(eb.y), ENEMY_BULLET_WIDTH, ENEMY_BULLET_HEIGHT);
    }
  }
}

// ---------------------------------------------------------------------------
// Self-registration — mirrors the pattern used by level1.js / level2.js.
// Instantiate the level, call init, then register update/render hooks.
// ---------------------------------------------------------------------------
const _instance = new Level3();
_instance.init(null, null);
registerLevel({
  update: (dt)  => _instance.update(dt),
  render: (ctx) => _instance.render(ctx),
});
