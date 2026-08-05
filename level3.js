// level3.js — Level 3: Shields and Splitting Formation
//
// ES module imported by game.js, which calls initLevel3(), updateLevel3(dt),
// and renderLevel3(ctx). Registers itself implicitly through the import.
//
// Features:
//  • Four destructible shield bunkers at ~80 % canvas height.
//  • Standard 11×5 invader grid that splits into two independent sub-formations
//    once half the invaders are destroyed.
//  • Invader shooting (same pattern as Level 2: lowest invader per column,
//    random 0.8–2.0 s interval).

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { INVADER_W, INVADER_H, GAP }   from './invaders.js';
import { Player }                        from './player.js';
import { ExplosionPool }                 from './explosions.js';
import { hudState, transitionTo }        from './game.js';
import { computeStepInterval }           from './level1.js';

// ============================================================
// Constants
// ============================================================

// Formation geometry — mirrors the private constants in invaders.js
const COLS         = 11;
const ROWS         = 5;
const TOTAL        = COLS * ROWS;                                   // 55
const FORMATION_W  = COLS * INVADER_W + (COLS - 1) * GAP;          // 344 px
const INV_START_X  = Math.round((CANVAS_WIDTH - FORMATION_W) / 2); // 212 px
const INV_START_Y  = 80;                                            // px from top
const INITIAL_OFFSET_Y = 48 - INV_START_Y;  // −32 → formation top at y = 48

// Movement parameters (same as InvaderGrid internals)
const STEP_PX          = 8;
const DROP_PX          = 16;
const SPEED_MULTIPLIER = 0.67; // same as Level 2

// Split fires when destroyed-count ≥ ⌊TOTAL / 2⌋
const SPLIT_AT = Math.floor(TOTAL / 2); // 27

// Shield bunkers
const CELL_SIZE    = 8;   // px per cell
const CELLS_WIDE   = 4;
const CELLS_TALL   = 4;
const BUNKER_W     = CELLS_WIDE * CELL_SIZE;              // 32 px
const BUNKER_Y     = Math.round(CANVAS_HEIGHT * 0.80);    // 717 px ≈ 80 %
const BUNKER_COUNT = 4;

// Invader bullets
const INV_BULLET_W     = 3;
const INV_BULLET_H     = 12;
const INV_BULLET_SPEED = 220;  // px / s
const MAX_INV_BULLETS  = 3;

// Shooting timing
const SHOOT_MIN = 0.8;  // seconds
const SHOOT_MAX = 2.0;  // seconds

// Player invulnerability after being hit
const INVULN_DURATION = 2.0;   // seconds total
const FLASH_HALF      = 0.1;   // seconds per visibility half-cycle

// ============================================================
// Module-level state (reset by initLevel3)
// ============================================================

/** @type {Player|null} */
let player = null;

/** @type {ExplosionPool|null} */
let explosions = null;

// Invader objects — all 55, shared across pre- and post-split phases.
/** @type {Array<{row:number, col:number, alive:boolean}>} */
let invaders = [];

// Pre-split formation state
let formOffsetX = 0;
let formOffsetY = 0;
let formDir     = 1;   // 1 = right, −1 = left
let formTimer   = 0;   // accumulated ms

// Post-split sub-formations
let hasSplit = false;
/** @type {SubFormation|null} */ let leftForm  = null;
/** @type {SubFormation|null} */ let rightForm = null;

// Pre-split shot timer (seconds countdown)
let preShotTimer = 0;

// Invader bullet pool (shared across phases)
/** @type {Array<{x:number, y:number}>} */
let invBullets = [];

// Shield bunkers
/** @type {Array<{x:number, y:number, cells:boolean[][]}>} */
let bunkers = [];

// Player invulnerability
let invulnTimer   = 0;
let flashTimer    = 0;
let playerVisible = true;

// Set to true once the level ends to stop further updates
let levelCleared = false;

// ============================================================
// SubFormation class
// ============================================================

class SubFormation {
  /**
   * @param {Array<{row,col,alive}>} invList   Subset of the shared invaders array.
   * @param {number} offsetX  Inherited from pre-split formation at split time.
   * @param {number} offsetY  Inherited from pre-split formation at split time.
   * @param {number} direction  +1 (right) or −1 (left) — opposite for the two halves.
   */
  constructor(invList, offsetX, offsetY, direction) {
    this.invaders  = invList;
    this.offsetX   = offsetX;
    this.offsetY   = offsetY;
    this.direction = direction;
    this.stepTimer = 0;             // ms accumulated
    this.shotTimer = _randShot();   // seconds until next shot
  }

  liveInvaders() {
    return this.invaders.filter(inv => inv.alive);
  }

  /** Canvas-space bounding rect for one invader. */
  invaderRect(inv) {
    return {
      x: INV_START_X + inv.col * (INVADER_W + GAP) + this.offsetX,
      y: INV_START_Y + inv.row * (INVADER_H + GAP) + this.offsetY,
      w: INVADER_W,
      h: INVADER_H,
    };
  }

  /** Attempt one step; drop and reverse on edge contact. */
  _step() {
    const live = this.liveInvaders();
    if (live.length === 0) return;

    const nextX = this.offsetX + this.direction * STEP_PX;
    let minLeft = Infinity, maxRight = -Infinity;
    for (const inv of live) {
      const x = INV_START_X + inv.col * (INVADER_W + GAP) + nextX;
      if (x < minLeft)              minLeft  = x;
      if (x + INVADER_W > maxRight) maxRight = x + INVADER_W;
    }

    if (maxRight >= CANVAS_WIDTH || minLeft <= 0) {
      this.offsetY   += DROP_PX;
      this.direction *= -1;
    } else {
      this.offsetX = nextX;
    }
  }

  /**
   * Advance movement timer; step when the dynamic interval elapses.
   * @param {number} dt         Seconds this frame.
   * @param {number} totalLive  Combined live-invader count across both formations.
   */
  update(dt, totalLive) {
    this.stepTimer += dt * 1000;
    const interval = computeStepInterval(Math.max(totalLive, 1)) * SPEED_MULTIPLIER;
    while (this.stepTimer >= interval) {
      this.stepTimer -= interval;
      this._step();
    }
  }

  /** Maybe fire from the bottom-most invader of a random live column. */
  tryShoot(dt) {
    this.shotTimer -= dt;
    if (this.shotTimer > 0) return;
    this.shotTimer = _randShot();

    if (invBullets.length >= MAX_INV_BULLETS) return;
    const live = this.liveInvaders();
    if (live.length === 0) return;

    const cols    = [...new Set(live.map(inv => inv.col))];
    const col     = cols[Math.floor(Math.random() * cols.length)];
    const colInvs = live.filter(inv => inv.col === col);
    colInvs.sort((a, b) => b.row - a.row); // bottom-most first
    _spawnInvBullet(colInvs[0], this.offsetX, this.offsetY);
  }

  draw(ctx) {
    ctx.fillStyle = '#00FF00';
    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      const { x, y, w, h } = this.invaderRect(inv);
      ctx.fillRect(Math.round(x), Math.round(y), w, h);
    }
  }
}

// ============================================================
// Private helpers
// ============================================================

function _randShot() {
  return SHOOT_MIN + Math.random() * (SHOOT_MAX - SHOOT_MIN);
}

function _aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/** Spawn an invader bullet from below the given invader. */
function _spawnInvBullet(inv, offsetX, offsetY) {
  invBullets.push({
    x: INV_START_X + inv.col * (INVADER_W + GAP) + offsetX + INVADER_W / 2 - INV_BULLET_W / 2,
    y: INV_START_Y + inv.row * (INVADER_H + GAP) + offsetY + INVADER_H,
  });
}

/**
 * Check whether a rect overlaps any live bunker cell.
 * Returns { bi, r, c } (indices) or null.
 */
function _checkBunkerHit(rx, ry, rw, rh) {
  for (let bi = 0; bi < bunkers.length; bi++) {
    const b = bunkers[bi];
    for (let r = 0; r < CELLS_TALL; r++) {
      for (let c = 0; c < CELLS_WIDE; c++) {
        if (!b.cells[r][c]) continue;
        const cx = b.x + c * CELL_SIZE;
        const cy = b.y + r * CELL_SIZE;
        if (rx < cx + CELL_SIZE && rx + rw > cx &&
            ry < cy + CELL_SIZE && ry + rh > cy) {
          return { bi, r, c };
        }
      }
    }
  }
  return null;
}

/** Build the full 55-invader array (all alive). */
function _buildInvaders() {
  const arr = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      arr.push({ row, col, alive: true });
    }
  }
  return arr;
}

/** Build four evenly-spaced bunkers. */
function _buildBunkers() {
  const result = [];
  for (let i = 0; i < BUNKER_COUNT; i++) {
    const bx = Math.round(CANVAS_WIDTH * (i + 1) / (BUNKER_COUNT + 1) - BUNKER_W / 2);
    const cells = Array.from({ length: CELLS_TALL }, () =>
      Array.from({ length: CELLS_WIDE }, () => true)
    );
    result.push({ x: bx, y: BUNKER_Y, cells });
  }
  return result;
}

/** All live invaders (pre-split phase). */
function _globalLive() {
  return invaders.filter(inv => inv.alive);
}

/** True when every invader in both phases is dead. */
function _allDead() {
  if (!hasSplit) return _globalLive().length === 0;
  return leftForm.liveInvaders().length === 0 &&
         rightForm.liveInvaders().length === 0;
}

// ============================================================
// Pre-split formation step
// ============================================================

function _preStep(live) {
  const nextX = formOffsetX + formDir * STEP_PX;
  let minLeft = Infinity, maxRight = -Infinity;
  for (const inv of live) {
    const x = INV_START_X + inv.col * (INVADER_W + GAP) + nextX;
    if (x < minLeft)              minLeft  = x;
    if (x + INVADER_W > maxRight) maxRight = x + INVADER_W;
  }
  if (maxRight >= CANVAS_WIDTH || minLeft <= 0) {
    formOffsetY += DROP_PX;
    formDir     *= -1;
  } else {
    formOffsetX = nextX;
  }
}

// ============================================================
// Split
// ============================================================

function _performSplit() {
  const halfCol   = Math.floor(COLS / 2); // 5 → left = 0..4, right = 5..10
  const leftInvs  = invaders.filter(inv => inv.col < halfCol);
  const rightInvs = invaders.filter(inv => inv.col >= halfCol);

  // Left diverges left (−1), right diverges right (+1)
  leftForm  = new SubFormation(leftInvs,  formOffsetX, formOffsetY, -1);
  rightForm = new SubFormation(rightInvs, formOffsetX, formOffsetY,  1);
  hasSplit  = true;
}

// ============================================================
// Player-hit handler
// ============================================================

function _playerHit() {
  hudState.lives--;
  if (hudState.score > hudState.hiScore) hudState.hiScore = hudState.score;

  if (hudState.lives <= 0) {
    levelCleared = true;
    transitionTo('gameover');
    return;
  }

  // Respawn at bottom-centre with invulnerability flash
  player.x       = CANVAS_WIDTH / 2 - player.width / 2;
  player._bullet = null;
  invulnTimer    = INVULN_DURATION;
  flashTimer     = FLASH_HALF;
  playerVisible  = false;
}

// ============================================================
// Public API — called by game.js
// ============================================================

export function initLevel3() {
  player     = new Player(CANVAS_WIDTH / 2, null);
  explosions = new ExplosionPool();

  hudState.level = 3;

  invaders    = _buildInvaders();
  formOffsetX = 0;
  formOffsetY = INITIAL_OFFSET_Y;
  formDir     = 1;
  formTimer   = 0;

  hasSplit  = false;
  leftForm  = null;
  rightForm = null;

  invBullets   = [];
  bunkers      = _buildBunkers();

  invulnTimer   = 0;
  flashTimer    = 0;
  playerVisible = true;
  levelCleared  = false;

  preShotTimer = _randShot();
}

export function updateLevel3(dt) {
  if (levelCleared) return;

  // ── 1. Player movement & bullet ───────────────────────────
  player.update(dt);

  // ── 2. Invulnerability tick ───────────────────────────────
  if (invulnTimer > 0) {
    invulnTimer -= dt;
    flashTimer  -= dt;
    if (flashTimer <= 0) {
      flashTimer   += FLASH_HALF;
      playerVisible = !playerVisible;
    }
    if (invulnTimer <= 0) {
      invulnTimer   = 0;
      playerVisible = true;
    }
  }

  // ── 3. Formation movement & shooting ─────────────────────
  if (!hasSplit) {
    // Pre-split: time-based step using same interval formula as Level 2
    const live = _globalLive();
    if (live.length > 0) {
      formTimer += dt * 1000; // seconds → ms
      const interval = computeStepInterval(live.length) * SPEED_MULTIPLIER;
      while (formTimer >= interval) {
        formTimer -= interval;
        _preStep(live);
      }
    }

    // Pre-split shooting
    preShotTimer -= dt;
    if (preShotTimer <= 0) {
      preShotTimer = _randShot();
      const live2 = _globalLive();
      if (live2.length > 0 && invBullets.length < MAX_INV_BULLETS) {
        const cols    = [...new Set(live2.map(inv => inv.col))];
        const col     = cols[Math.floor(Math.random() * cols.length)];
        const colInvs = live2.filter(inv => inv.col === col);
        colInvs.sort((a, b) => b.row - a.row);
        _spawnInvBullet(colInvs[0], formOffsetX, formOffsetY);
      }
    }
  } else {
    // Post-split: each sub-formation moves and shoots independently
    const total = leftForm.liveInvaders().length + rightForm.liveInvaders().length;
    if (leftForm.liveInvaders().length > 0) {
      leftForm.update(dt, total);
      leftForm.tryShoot(dt);
    }
    if (rightForm.liveInvaders().length > 0) {
      rightForm.update(dt, total);
      rightForm.tryShoot(dt);
    }
  }

  // ── 4a. Player bullet vs bunker cells (bunkers intercept first) ──
  {
    const pb = player.bullet; // snapshot: {x,y,width,height} or null
    if (pb) {
      const hit = _checkBunkerHit(pb.x, pb.y, pb.width, pb.height);
      if (hit) {
        bunkers[hit.bi].cells[hit.r][hit.c] = false;
        player._bullet = null; // consume bullet
      }
    }
  }

  // ── 4b. Player bullet vs invaders (only if bullet survived bunker) ──
  {
    const pb = player.bullet;
    if (pb) {
      let killed = false;

      const tryKill = (inv, ix, iy) => {
        if (_aabb(pb.x, pb.y, pb.width, pb.height, ix, iy, INVADER_W, INVADER_H)) {
          inv.alive      = false;
          player._bullet = null;
          explosions.spawn(ix, iy);
          hudState.score += 10;
          if (hudState.score > hudState.hiScore) hudState.hiScore = hudState.score;
          return true;
        }
        return false;
      };

      if (!hasSplit) {
        for (const inv of _globalLive()) {
          const ix = INV_START_X + inv.col * (INVADER_W + GAP) + formOffsetX;
          const iy = INV_START_Y + inv.row * (INVADER_H + GAP) + formOffsetY;
          if (tryKill(inv, ix, iy)) { killed = true; break; }
        }
      } else {
        for (const inv of leftForm.liveInvaders()) {
          const { x, y } = leftForm.invaderRect(inv);
          if (tryKill(inv, x, y)) { killed = true; break; }
        }
        if (!killed) {
          for (const inv of rightForm.liveInvaders()) {
            const { x, y } = rightForm.invaderRect(inv);
            if (tryKill(inv, x, y)) break;
          }
        }
      }
    }
  }

  // ── 5. Check split trigger (after kills this frame) ──────
  if (!hasSplit) {
    const destroyed = TOTAL - _globalLive().length;
    if (destroyed >= SPLIT_AT) {
      _performSplit();
    }
  }

  // ── 6. Win check ─────────────────────────────────────────
  if (_allDead()) {
    levelCleared = true;
    if (hudState.score > hudState.hiScore) hudState.hiScore = hudState.score;
    transitionTo('boss');
    return;
  }

  // ── 7. Invader bullets: movement ─────────────────────────
  for (const b of invBullets) {
    b.y += INV_BULLET_SPEED * dt;
  }

  // ── 8. Invader bullets vs bunker cells ───────────────────
  for (let i = invBullets.length - 1; i >= 0; i--) {
    const b   = invBullets[i];
    const hit = _checkBunkerHit(b.x, b.y, INV_BULLET_W, INV_BULLET_H);
    if (hit) {
      bunkers[hit.bi].cells[hit.r][hit.c] = false;
      invBullets.splice(i, 1);
      continue;
    }
    // Remove off-screen bullets
    if (b.y > CANVAS_HEIGHT) {
      invBullets.splice(i, 1);
    }
  }

  // ── 9. Invader bullets vs player (skip during invulnerability) ──
  if (invulnTimer <= 0) {
    for (let i = invBullets.length - 1; i >= 0; i--) {
      const b = invBullets[i];
      if (_aabb(b.x, b.y, INV_BULLET_W, INV_BULLET_H,
                player.x, player.y, player.width, player.height)) {
        invBullets.splice(i, 1);
        _playerHit();
        if (levelCleared) return; // game-over transition was called
        break; // one hit per frame
      }
    }
  }

  // ── 10. Explosion tick ────────────────────────────────────
  explosions.tick();
}

export function renderLevel3(ctx) {
  // --- Bunkers ---
  ctx.fillStyle = '#00FF00';
  for (const b of bunkers) {
    for (let r = 0; r < CELLS_TALL; r++) {
      for (let c = 0; c < CELLS_WIDE; c++) {
        if (!b.cells[r][c]) continue;
        ctx.fillRect(b.x + c * CELL_SIZE, b.y + r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  // --- Invader formation ---
  if (!hasSplit) {
    ctx.fillStyle = '#00FF00';
    for (const inv of invaders) {
      if (!inv.alive) continue;
      ctx.fillRect(
        Math.round(INV_START_X + inv.col * (INVADER_W + GAP) + formOffsetX),
        Math.round(INV_START_Y + inv.row * (INVADER_H + GAP) + formOffsetY),
        INVADER_W, INVADER_H
      );
    }
  } else {
    if (leftForm)  leftForm.draw(ctx);
    if (rightForm) rightForm.draw(ctx);
  }

  // --- Explosions ---
  explosions.draw(ctx);

  // --- Invader bullets (light red to distinguish from player bullet) ---
  ctx.fillStyle = '#FF6666';
  for (const b of invBullets) {
    ctx.fillRect(Math.round(b.x), Math.round(b.y), INV_BULLET_W, INV_BULLET_H);
  }

  // --- Player (skipped during flash-off half-cycles) ---
  if (playerVisible) {
    player.draw(ctx);
  }
}
