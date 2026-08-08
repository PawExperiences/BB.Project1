// level3.js — Level 3: Shields and Formations
//
// New mechanics:
//   1. Four destructible bunkers at 80% canvas height (4×4 grid of 8px cells)
//   2. Formation split at 50% casualties into two independent halves
//
// Reuses: Invader class from invaders.js, addScore/runCollisionPass helpers
// from collision.js, Player from player.js, gameConfig constants.

import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_SPEED } from './gameConfig.js';
import { Invader } from './invaders.js';
import { addScore, updateExplosions, drawExplosions } from './collision.js';
import { isKeyHeld } from './input.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const INVADER_WIDTH   = 30;
const INVADER_HEIGHT  = 20;
const COL_GAP         = 20;
const ROW_GAP         = 20;
const COLS            = 11;
const ROWS            = 5;
const TOTAL_INVADERS  = COLS * ROWS; // 55
const SPLIT_THRESHOLD = Math.floor(TOTAL_INVADERS / 2); // 27 remaining → split

const DROP_AMOUNT     = INVADER_HEIGHT + ROW_GAP;
const BASE_SPEED      = 60;   // px/s for a full formation
const MAX_SPEED       = 300;  // px/s when only 1 invader remains

// Bunker geometry
const CELL_SIZE       = 8;    // px per cell
const BUNKER_COLS     = 4;
const BUNKER_ROWS     = 4;
const BUNKER_W        = CELL_SIZE * BUNKER_COLS;  // 32 px
const BUNKER_Y        = CANVAS_HEIGHT * 0.80;
const NUM_BUNKERS     = 4;

// Invader bullet dimensions (same as player bullet)
const INV_BULLET_W    = 4;
const INV_BULLET_H    = 12;
const INV_BULLET_SPEED = 220; // px/s

// Player bullet dimensions (must match player.js)
const PLAYER_BULLET_W = 4;
const PLAYER_BULLET_H = 12;

// Points per kill
const POINTS_PER_KILL = 10;

// ---------------------------------------------------------------------------
// AABB overlap helper
// ---------------------------------------------------------------------------
function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw &&
         ax + aw > bx &&
         ay < by + bh &&
         ay + ah > by;
}

// ---------------------------------------------------------------------------
// Bunker — four destructible bunkers, each a 4×4 grid of cells
// ---------------------------------------------------------------------------
function makeBunkers() {
  // Evenly space NUM_BUNKERS bunkers across the canvas width
  const totalBunkersWidth = NUM_BUNKERS * BUNKER_W;
  const spacing = (CANVAS_WIDTH - totalBunkersWidth) / (NUM_BUNKERS + 1);

  const bunkers = [];
  for (let b = 0; b < NUM_BUNKERS; b++) {
    const bx = spacing + b * (BUNKER_W + spacing);
    const by = BUNKER_Y;

    // cells[row][col] = true means the cell is alive
    const cells = [];
    for (let r = 0; r < BUNKER_ROWS; r++) {
      const row = [];
      for (let c = 0; c < BUNKER_COLS; c++) {
        row.push(true);
      }
      cells.push(row);
    }
    bunkers.push({ x: bx, y: by, cells });
  }
  return bunkers;
}

// Check if a bunker has any living cells
function bunkerAlive(bunker) {
  for (const row of bunker.cells) {
    for (const cell of row) {
      if (cell) return true;
    }
  }
  return false;
}

// Test a rectangle against a bunker's cells; destroy hit cells.
// Returns true if at least one cell was destroyed.
function bunkerCollide(bunker, rx, ry, rw, rh) {
  if (!bunkerAlive(bunker)) return false;
  let hit = false;
  for (let r = 0; r < BUNKER_ROWS; r++) {
    for (let c = 0; c < BUNKER_COLS; c++) {
      if (!bunker.cells[r][c]) continue;
      const cx = bunker.x + c * CELL_SIZE;
      const cy = bunker.y + r * CELL_SIZE;
      if (aabb(rx, ry, rw, rh, cx, cy, CELL_SIZE, CELL_SIZE)) {
        bunker.cells[r][c] = false;
        hit = true;
      }
    }
  }
  return hit;
}

// ---------------------------------------------------------------------------
// Formation builder — creates an 11×5 grid of Invader instances
// ---------------------------------------------------------------------------
function makeFormation() {
  const FORMATION_WIDTH = COLS * INVADER_WIDTH + (COLS - 1) * COL_GAP;
  const START_X = Math.floor((CANVAS_WIDTH - FORMATION_WIDTH) / 2);
  const START_Y = 60;

  const grid = []; // grid[row][col]
  for (let row = 0; row < ROWS; row++) {
    const rowArr = [];
    for (let col = 0; col < COLS; col++) {
      rowArr.push(new Invader(
        START_X + col * (INVADER_WIDTH + COL_GAP),
        START_Y + row * (INVADER_HEIGHT + ROW_GAP)
      ));
    }
    grid.push(rowArr);
  }
  return grid;
}

// ---------------------------------------------------------------------------
// HalfFormation — manages one independent half after the split
// ---------------------------------------------------------------------------
class HalfFormation {
  /**
   * @param {Invader[][]} grid     - full 5×11 grid (rows×cols)
   * @param {number[]}    colRange - array of column indices belonging to this half
   * @param {number}      dir      - initial direction: +1 (right) or -1 (left)
   */
  constructor(grid, colRange, dir) {
    // Flat list of invaders belonging to this half
    this.invaders = [];
    for (let row = 0; row < ROWS; row++) {
      for (const col of colRange) {
        this.invaders.push(grid[row][col]);
      }
    }
    this.dir = dir;
  }

  aliveCount() {
    return this.invaders.filter(i => i.alive).length;
  }

  speed() {
    const alive = this.aliveCount();
    const total = this.invaders.length;
    if (total === 0 || alive === 0) return BASE_SPEED;
    // Linear interpolation: full formation → BASE_SPEED, 1 remaining → MAX_SPEED
    const t = 1 - alive / total;
    return BASE_SPEED + t * (MAX_SPEED - BASE_SPEED);
  }

  update(dt) {
    if (this.aliveCount() === 0) return;

    const dx = this.speed() * this.dir * dt;

    let wouldHitRight = false;
    let wouldHitLeft  = false;

    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      const nx = inv.x + dx;
      if (nx + inv.width >= CANVAS_WIDTH) wouldHitRight = true;
      if (nx <= 0)                        wouldHitLeft  = true;
    }

    if (wouldHitRight || wouldHitLeft) {
      for (const inv of this.invaders) {
        inv.y += DROP_AMOUNT;
      }
      this.dir = -this.dir;
    } else {
      for (const inv of this.invaders) {
        inv.x += dx;
      }
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#00ff00';
    for (const inv of this.invaders) {
      if (inv.alive) {
        ctx.fillRect(inv.x, inv.y, inv.width, inv.height);
      }
    }
  }

  // Returns flat array of alive invaders (for collision use)
  livingInvaders() {
    return this.invaders.filter(i => i.alive);
  }
}

// ---------------------------------------------------------------------------
// SingleFormation — the unified 55-invader grid before the split
// ---------------------------------------------------------------------------
class SingleFormation {
  constructor(grid) {
    this.grid = grid; // 5 rows × 11 cols
    this.dir  = 1;    // start moving right

    // Flat list for convenience
    this.allInvaders = [];
    for (const row of grid) {
      for (const inv of row) {
        this.allInvaders.push(inv);
      }
    }
  }

  aliveCount() {
    return this.allInvaders.filter(i => i.alive).length;
  }

  speed() {
    const alive = this.aliveCount();
    if (alive === 0) return BASE_SPEED;
    const t = 1 - alive / TOTAL_INVADERS;
    return BASE_SPEED + t * (MAX_SPEED - BASE_SPEED);
  }

  update(dt) {
    if (this.aliveCount() === 0) return;

    const dx = this.speed() * this.dir * dt;

    let wouldHitRight = false;
    let wouldHitLeft  = false;

    for (const inv of this.allInvaders) {
      if (!inv.alive) continue;
      const nx = inv.x + dx;
      if (nx + inv.width >= CANVAS_WIDTH) wouldHitRight = true;
      if (nx <= 0)                        wouldHitLeft  = true;
    }

    if (wouldHitRight || wouldHitLeft) {
      for (const inv of this.allInvaders) {
        inv.y += DROP_AMOUNT;
      }
      this.dir = -this.dir;
    } else {
      for (const inv of this.allInvaders) {
        inv.x += dx;
      }
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#00ff00';
    for (const inv of this.allInvaders) {
      if (inv.alive) {
        ctx.fillRect(inv.x, inv.y, inv.width, inv.height);
      }
    }
  }

  livingInvaders() {
    return this.allInvaders.filter(i => i.alive);
  }
}

// ---------------------------------------------------------------------------
// Level3 — exported class that owns all level-3 state
// ---------------------------------------------------------------------------
export class Level3 {
  constructor() {
    this.done    = false;   // set to true when all invaders dead → game loop transitions
    this.split   = false;   // has the formation split occurred?

    // Build the 5×11 grid
    this._grid   = makeFormation();

    // Start as a unified formation
    this._single = new SingleFormation(this._grid);
    this._left   = null; // HalfFormation after split
    this._right  = null; // HalfFormation after split

    // Bunkers
    this._bunkers = makeBunkers();

    // Invader bullets
    this._invBullets = [];

    // Fire timer (seconds between invader shots)
    this._fireTimer    = 0;
    this._fireInterval = 1.2; // seconds between volleys
  }

  // -------------------------------------------------------------------------
  // Public API: update(dt, player)
  // dt     — elapsed seconds (fixed timestep)
  // player — Player instance
  // Returns true when the level is complete.
  // -------------------------------------------------------------------------
  update(dt, player) {
    if (this.done) return true;

    // -- Check for split ----------------------------------------------------
    if (!this.split) {
      const alive = this._single.aliveCount();
      // Split when ≥28 dead (≤27 remaining) — i.e. alive <= TOTAL_INVADERS - SPLIT_THRESHOLD
      // SPLIT_THRESHOLD = 27, so split when alive <= 27
      if (alive <= SPLIT_THRESHOLD) {
        this._doSplit();
      }
    }

    // -- Update formation(s) ------------------------------------------------
    if (!this.split) {
      this._single.update(dt);
    } else {
      this._left.update(dt);
      this._right.update(dt);
    }

    // -- Invader bullets: fire ----------------------------------------------
    this._fireTimer -= dt;
    if (this._fireTimer <= 0) {
      this._fireTimer = this._fireInterval;
      this._tryFireInvaderBullet();
    }

    // -- Update invader bullets ---------------------------------------------
    for (const b of this._invBullets) {
      if (!b.active) continue;
      b.y += INV_BULLET_SPEED * dt;
      if (b.y > CANVAS_HEIGHT) b.active = false;
    }
    // Clean up
    this._invBullets = this._invBullets.filter(b => b.active);

    // -- Collision: invaders pass through bunkers (destroy cells) -----------
    const allLiving = this._livingInvaders();
    for (const inv of allLiving) {
      for (const bunker of this._bunkers) {
        bunkerCollide(bunker, inv.x, inv.y, inv.width, inv.height);
      }
    }

    // -- Collision: player bullet vs invaders -------------------------------
    if (player.bullet !== null) {
      const pb = player.bullet;
      let hit = false;

      for (const inv of allLiving) {
        if (aabb(pb.x, pb.y, PLAYER_BULLET_W, PLAYER_BULLET_H,
                 inv.x, inv.y, inv.width, inv.height)) {
          inv.alive = false;
          player.bullet = null;
          addScore(POINTS_PER_KILL);
          hit = true;
          break;
        }
      }

      // Player bullet vs bunkers
      if (!hit && player.bullet !== null) {
        for (const bunker of this._bunkers) {
          if (bunkerCollide(bunker, pb.x, pb.y, PLAYER_BULLET_W, PLAYER_BULLET_H)) {
            player.bullet = null;
            break;
          }
        }
      }
    }

    // -- Collision: invader bullets vs player -------------------------------
    for (const b of this._invBullets) {
      if (!b.active) continue;
      const pw = typeof player.width  !== 'undefined' ? player.width  : 40;
      const ph = typeof player.height !== 'undefined' ? player.height : 32;
      if (aabb(b.x, b.y, b.width, b.height, player.x, player.y, pw, ph)) {
        b.active = false;
        // Signal hit — game.js convention: decrement lives externally
        // We expose a playerHit flag that the game loop can read
        this.playerHit = true;
      }
    }

    // -- Collision: invader bullets vs bunkers ------------------------------
    for (const b of this._invBullets) {
      if (!b.active) continue;
      for (const bunker of this._bunkers) {
        if (bunkerCollide(bunker, b.x, b.y, b.width, b.height)) {
          b.active = false;
          break;
        }
      }
    }

    // -- Update explosion effects -------------------------------------------
    updateExplosions(dt);

    // -- Check level complete -----------------------------------------------
    const totalAlive = this._totalAlive();
    if (totalAlive === 0) {
      this.done = true;
      return true;
    }

    return false;
  }

  // -------------------------------------------------------------------------
  // Public API: draw(ctx)
  // -------------------------------------------------------------------------
  draw(ctx) {
    // Draw bunkers
    ctx.fillStyle = '#00cc44';
    for (const bunker of this._bunkers) {
      if (!bunkerAlive(bunker)) continue;
      for (let r = 0; r < BUNKER_ROWS; r++) {
        for (let c = 0; c < BUNKER_COLS; c++) {
          if (!bunker.cells[r][c]) continue;
          ctx.fillRect(
            bunker.x + c * CELL_SIZE,
            bunker.y + r * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
          );
        }
      }
    }

    // Draw invaders
    if (!this.split) {
      this._single.draw(ctx);
    } else {
      this._left.draw(ctx);
      this._right.draw(ctx);
    }

    // Draw invader bullets
    ctx.fillStyle = '#ff4444';
    for (const b of this._invBullets) {
      if (b.active) {
        ctx.fillRect(b.x, b.y, b.width, b.height);
      }
    }

    // Draw explosion effects
    drawExplosions(ctx);
  }

  // -------------------------------------------------------------------------
  // Internal: split the formation into two halves
  // Left half  = columns 0–5 (indices 0..5, i.e. cols 1–6 in 1-based)
  // Right half = columns 6–10 (indices 6..10, i.e. cols 7–11 in 1-based)
  // After split: left moves left (-1), right moves right (+1)
  // -------------------------------------------------------------------------
  _doSplit() {
    this.split = true;
    const leftCols  = [0, 1, 2, 3, 4, 5]; // columns 1–6 (0-indexed)
    const rightCols = [6, 7, 8, 9, 10];   // columns 7–11 (0-indexed)
    this._left  = new HalfFormation(this._grid, leftCols,  -1); // moves left
    this._right = new HalfFormation(this._grid, rightCols, +1); // moves right
  }

  // -------------------------------------------------------------------------
  // Internal: fire a bullet from a random bottom-row invader
  // -------------------------------------------------------------------------
  _tryFireInvaderBullet() {
    // Collect one random bottom-most living invader per column across all living
    const living = this._livingInvaders();
    if (living.length === 0) return;

    // Pick a random living invader to fire
    const shooter = living[Math.floor(Math.random() * living.length)];
    this._invBullets.push({
      x:      shooter.x + shooter.width / 2 - INV_BULLET_W / 2,
      y:      shooter.y + shooter.height,
      width:  INV_BULLET_W,
      height: INV_BULLET_H,
      active: true
    });
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------
  _livingInvaders() {
    if (!this.split) {
      return this._single.livingInvaders();
    }
    return [
      ...this._left.livingInvaders(),
      ...this._right.livingInvaders()
    ];
  }

  _totalAlive() {
    if (!this.split) {
      return this._single.aliveCount();
    }
    return this._left.aliveCount() + this._right.aliveCount();
  }
}

// ---------------------------------------------------------------------------
// Convenience factory (mirrors level1.js / level2.js pattern if they use one)
// ---------------------------------------------------------------------------
export function createLevel3() {
  return new Level3();
}
