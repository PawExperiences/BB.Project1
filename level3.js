// level3.js — Level 3: Shields and Formations.
// ES module; exports { init, update, render }.
// Runs from file:// — no fetch, no npm imports.

import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_SPEED } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const INVADER_W      = 30;
const INVADER_H      = 20;
const INVADER_GAP    = 10;
const INVADER_COLOR  = '#00ccff';
const EXPLOSION_COLOR = '#ff6600';
const EXPLOSION_DURATION = 400; // ms
const POINTS_PER_KILL = 10;

const COLS = 11;
const ROWS = 5;
const TOTAL_INVADERS = COLS * ROWS; // 55

const FORMATION_ORIGIN_X = 50;
const FORMATION_ORIGIN_Y = 80;

const STEP_X = 8;  // px per horizontal step
const DROP_Y = INVADER_H + INVADER_GAP;

const INTERVAL_MIN = 100; // ms at 1 alive
const INTERVAL_MAX = 800; // ms at 55 alive

// Invader bullet constants
const INV_BULLET_SPEED  = 180; // px/sec downward
const INV_BULLET_W      = 4;
const INV_BULLET_H      = 12;
const INV_BULLET_COLOR  = '#ff4444';
const SHOOT_INTERVAL_MIN = 600;  // ms between invader shots (minimum)
const SHOOT_INTERVAL_MAX = 1800; // ms between invader shots (maximum)

// Bunker constants
const BUNKER_CELL_SIZE  = 8;   // px per cell
const BUNKER_COLS       = 4;
const BUNKER_ROWS       = 4;
const BUNKER_COLOR      = '#00FF41';
const BUNKER_COUNT      = 4;
const BUNKER_Y          = Math.round(CANVAS_HEIGHT * 0.80); // ~80% down

// Player bullet rect dimensions (must match player.js)
const PLAYER_BULLET_W = 4;
const PLAYER_BULLET_H = 10;

// Loss threshold: if any invader's bottom edge reaches this Y, player loses a life
const PLAYER_ROW_Y = 800;

// ---------------------------------------------------------------------------
// Module-level state (reset on init)
// ---------------------------------------------------------------------------
let _ctx    = null;
let _state  = null;
let _player = null;

// Bunkers: array of { cells: boolean[][], x, y }
// cells[row][col] = true means cell is alive
let bunkers = [];

// Single unified formation (pre-split)
let formation = null;

// Post-split halves
let leftHalf  = null;
let rightHalf = null;
let splitDone = false;

// Tracking destroyed invaders across both phases
let destroyedCount = 0;
let startingCount  = 0;

// Explosions: { x, y, expireAt }
let explosions = [];

// Invader bullets: { x, y, active }
let invaderBullets = [];

// Shoot timers for each formation (pre-split = formation, post-split = leftHalf + rightHalf)
let shootTimer       = 0;
let shootIntervalMs  = 1200;
let shootTimerL      = 0;
let shootIntervalL   = 1200;
let shootTimerR      = 0;
let shootIntervalR   = 1000;

// ---------------------------------------------------------------------------
// Formation object factory
// ---------------------------------------------------------------------------

/**
 * Creates a formation object holding a flat array of invader objects.
 * Each invader: { col, row, baseX, baseY, alive }
 * The formation also tracks its own offsetX, offsetY, dirX, stepTimer.
 *
 * @param {Array} invaderList - array of { col, row, baseX, baseY }
 * @param {number} dirX - initial horizontal direction (+1 or -1)
 * @returns {object} formation
 */
function makeFormation(invaderList, dirX) {
  return {
    invaders:  invaderList.map(i => ({ col: i.col, row: i.row, baseX: i.baseX, baseY: i.baseY, alive: true })),
    offsetX:   0,
    offsetY:   0,
    dirX:      dirX,
    stepTimer: 0,
  };
}

/**
 * Returns world-space rects for all living invaders in a formation.
 * Each element: { _inv, x, y, width, height }
 */
function getLiving(formation) {
  return formation.invaders
    .filter(inv => inv.alive)
    .map(inv => ({
      _inv:   inv,
      x:      inv.baseX + formation.offsetX,
      y:      inv.baseY + formation.offsetY,
      width:  INVADER_W,
      height: INVADER_H,
    }));
}

/**
 * Bounding box of living invaders in a formation, or null if empty.
 */
function getBounds(formation) {
  const living = getLiving(formation);
  if (living.length === 0) return null;
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  for (const inv of living) {
    if (inv.x             < left)   left   = inv.x;
    if (inv.x + inv.width > right)  right  = inv.x + inv.width;
    if (inv.y             < top)    top    = inv.y;
    if (inv.y + inv.height > bottom) bottom = inv.y + inv.height;
  }
  return { left, right, top, bottom };
}

/**
 * Step-interval formula: faster when fewer invaders.
 */
function stepInterval(aliveCount, totalForThisFormation) {
  const total   = totalForThisFormation || TOTAL_INVADERS;
  const clamped = Math.max(1, Math.min(total, aliveCount));
  return INTERVAL_MIN + (clamped / total) * (INTERVAL_MAX - INTERVAL_MIN);
}

/**
 * Advances a formation by dt ms. Returns true if the formation caused a loss
 * (reached player row).
 */
function updateFormation(fm, dt) {
  const living = getLiving(fm);
  if (living.length === 0) return false;

  fm.stepTimer += dt;
  const interval = stepInterval(living.length, fm.invaders.length);
  if (fm.stepTimer < interval) return false;

  fm.stepTimer -= interval;

  const bounds = getBounds(fm);
  if (!bounds) return false;

  const nextLeft  = bounds.left  + fm.dirX * STEP_X;
  const nextRight = bounds.right + fm.dirX * STEP_X;

  if (nextRight > CANVAS_WIDTH || nextLeft < 0) {
    fm.offsetY += DROP_Y;
    fm.dirX    *= -1;

    // Check loss condition
    const newBounds = getBounds(fm);
    if (newBounds && newBounds.bottom >= PLAYER_ROW_Y) {
      return true; // loss
    }
  } else {
    fm.offsetX += fm.dirX * STEP_X;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Bunker helpers
// ---------------------------------------------------------------------------

/**
 * Creates the four shield bunkers.
 */
function initBunkers() {
  bunkers = [];
  const bunkerTotalW = BUNKER_COLS * BUNKER_CELL_SIZE;
  const spacing      = CANVAS_WIDTH / (BUNKER_COUNT + 1);

  for (let b = 0; b < BUNKER_COUNT; b++) {
    const cx = Math.round(spacing * (b + 1)); // centre x
    const bx = cx - Math.floor(bunkerTotalW / 2);
    const cells = [];
    for (let r = 0; r < BUNKER_ROWS; r++) {
      cells.push(new Array(BUNKER_COLS).fill(true));
    }
    bunkers.push({ cells, x: bx, y: BUNKER_Y });
  }
}

/**
 * AABB intersection test.
 */
function aabb(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Tests a projectile rect against all bunker cells.
 * If a cell is hit, removes it and returns true (projectile should be destroyed).
 * @param {{ x, y, width, height }} projRect
 * @returns {boolean} hit
 */
function checkBunkerCollision(projRect) {
  for (const bunker of bunkers) {
    for (let r = 0; r < BUNKER_ROWS; r++) {
      for (let c = 0; c < BUNKER_COLS; c++) {
        if (!bunker.cells[r][c]) continue;
        const cellRect = {
          x:      bunker.x + c * BUNKER_CELL_SIZE,
          y:      bunker.y + r * BUNKER_CELL_SIZE,
          width:  BUNKER_CELL_SIZE,
          height: BUNKER_CELL_SIZE,
        };
        if (aabb(projRect, cellRect)) {
          bunker.cells[r][c] = false; // destroy cell
          return true;               // projectile destroyed
        }
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Shooting helpers
// ---------------------------------------------------------------------------

/**
 * Picks a random living invader from a formation and fires a bullet from it.
 */
function fireFromFormation(fm) {
  const living = getLiving(fm);
  if (living.length === 0) return;
  const shooter = living[Math.floor(Math.random() * living.length)];
  invaderBullets.push({
    x:      shooter.x + INVADER_W / 2 - INV_BULLET_W / 2,
    y:      shooter.y + INVADER_H,
    active: true,
  });
}

/**
 * Returns a random shoot interval.
 */
function randomShootInterval() {
  return SHOOT_INTERVAL_MIN + Math.random() * (SHOOT_INTERVAL_MAX - SHOOT_INTERVAL_MIN);
}

// ---------------------------------------------------------------------------
// Collision: player bullet vs invaders
// ---------------------------------------------------------------------------

/**
 * Checks player bullet against a formation's living invaders.
 * Returns true if bullet was consumed.
 */
function checkPlayerBulletVsFormation(bullet, fm) {
  if (!bullet || !bullet.active) return false;
  const bulletRect = { x: bullet.x, y: bullet.y, width: PLAYER_BULLET_W, height: PLAYER_BULLET_H };

  const living = getLiving(fm);
  for (const inv of living) {
    if (aabb(bulletRect, inv)) {
      bullet.active    = false;
      inv._inv.alive   = false;
      destroyedCount  += 1;
      _state.score    += POINTS_PER_KILL;
      explosions.push({ x: inv.x, y: inv.y, expireAt: performance.now() + EXPLOSION_DURATION });
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Formation split
// ---------------------------------------------------------------------------

/**
 * Splits the unified formation into left and right halves.
 * Lower-indexed columns → left half, upper-indexed → right half.
 */
function splitFormation() {
  splitDone = true;

  const allInvaders = formation.invaders;

  // Determine the split column index
  // Even split: left gets columns 0..(halfCols-1), right gets halfCols..(COLS-1)
  const halfCols = Math.floor(COLS / 2); // 5 columns each for 11 cols: left=0..4, right=5..10

  const leftInvs = allInvaders
    .filter(inv => inv.col < halfCols)
    .map(inv => ({
      col:   inv.col,
      row:   inv.row,
      baseX: inv.baseX + formation.offsetX,
      baseY: inv.baseY + formation.offsetY,
    }));

  const rightInvs = allInvaders
    .filter(inv => inv.col >= halfCols)
    .map(inv => ({
      col:   inv.col,
      row:   inv.row,
      baseX: inv.baseX + formation.offsetX,
      baseY: inv.baseY + formation.offsetY,
    }));

  // Left half moves left initially, right half moves right initially
  leftHalf  = makeFormation(leftInvs,  -1);
  rightHalf = makeFormation(rightInvs, +1);

  // Nullify the unified formation
  formation = null;

  // Reset shoot timers for the two halves
  shootTimerL    = 0;
  shootIntervalL = randomShootInterval();
  shootTimerR    = 0;
  shootIntervalR = randomShootInterval();
}

// ---------------------------------------------------------------------------
// Exported lifecycle
// ---------------------------------------------------------------------------

/**
 * Called once when entering Level 3.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state  — shared HUD state ({ score, lives, level, ... })
 * @param {Player}  player — the Player instance
 */
export function init(ctx, state, player) {
  _ctx    = ctx;
  _state  = state;
  _player = player;

  // Build invader list
  const invList = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      invList.push({
        col,
        row,
        baseX: FORMATION_ORIGIN_X + col * (INVADER_W + INVADER_GAP),
        baseY: FORMATION_ORIGIN_Y + row * (INVADER_H  + INVADER_GAP),
      });
    }
  }

  formation      = makeFormation(invList, +1);
  leftHalf       = null;
  rightHalf      = null;
  splitDone      = false;
  destroyedCount = 0;
  startingCount  = TOTAL_INVADERS;

  invaderBullets = [];
  explosions     = [];

  shootTimer      = 0;
  shootIntervalMs = randomShootInterval();

  initBunkers();
}

/**
 * Called every frame with dt in milliseconds.
 * @param {number} dt
 */
export function update(dt) {
  if (!_state || !_player) return;

  const dtSec = dt / 1000;

  // ── Expire explosions ────────────────────────────────────────────────────
  const now = performance.now();
  explosions = explosions.filter(e => now < e.expireAt);

  // ── Invader bullet movement & cleanup ────────────────────────────────────
  for (const b of invaderBullets) {
    if (!b.active) continue;
    b.y += INV_BULLET_SPEED * dtSec;
    if (b.y > CANVAS_HEIGHT) b.active = false;
  }
  invaderBullets = invaderBullets.filter(b => b.active);

  // ── Player bullet vs bunkers ─────────────────────────────────────────────
  if (_player.bullet && _player.bullet.active) {
    const bRect = {
      x:      _player.bullet.x,
      y:      _player.bullet.y,
      width:  PLAYER_BULLET_W,
      height: PLAYER_BULLET_H,
    };
    if (checkBunkerCollision(bRect)) {
      _player.bullet.active = false;
    }
  }

  // ── Invader bullets vs bunkers ───────────────────────────────────────────
  for (const b of invaderBullets) {
    if (!b.active) continue;
    const bRect = { x: b.x, y: b.y, width: INV_BULLET_W, height: INV_BULLET_H };
    if (checkBunkerCollision(bRect)) {
      b.active = false;
    }
  }

  // ── Invader bullets vs player ────────────────────────────────────────────
  const playerRect = { x: _player.x, y: _player.y, width: 40, height: 32 };
  for (const b of invaderBullets) {
    if (!b.active) continue;
    const bRect = { x: b.x, y: b.y, width: INV_BULLET_W, height: INV_BULLET_H };
    if (aabb(bRect, playerRect)) {
      b.active       = false;
      _state.lives  -= 1;
      // If lives depleted, game.js will detect it and go to GAME_OVER
      break;
    }
  }

  // ── Pre-split phase ──────────────────────────────────────────────────────
  if (!splitDone && formation !== null) {
    // Player bullet vs formation
    if (_player.bullet && _player.bullet.active) {
      checkPlayerBulletVsFormation(_player.bullet, formation);
    }

    // Check split trigger
    if (!splitDone && destroyedCount >= Math.ceil(startingCount / 2)) {
      splitFormation();
    } else {
      // Update formation movement
      const lost = updateFormation(formation, dt);
      if (lost) {
        _state.lives -= 1;
        // Reset the formation
        const invList = [];
        for (let row = 0; row < ROWS; row++) {
          for (let col = 0; col < COLS; col++) {
            invList.push({
              col,
              row,
              baseX: FORMATION_ORIGIN_X + col * (INVADER_W + INVADER_GAP),
              baseY: FORMATION_ORIGIN_Y + row * (INVADER_H  + INVADER_GAP),
            });
          }
        }
        formation      = makeFormation(invList, +1);
        destroyedCount = 0;
        splitDone      = false;
        shootTimer     = 0;
        shootIntervalMs = randomShootInterval();
        invaderBullets  = [];
        initBunkers();
        return;
      }

      // Shooting for unified formation
      shootTimer += dt;
      if (shootTimer >= shootIntervalMs) {
        shootTimer      = 0;
        shootIntervalMs = randomShootInterval();
        fireFromFormation(formation);
      }

      // Check level clear (all invaders killed)
      const living = getLiving(formation);
      if (living.length === 0) {
        _state.level = 4; // advance to Boss
        return;
      }
    }
  }

  // ── Post-split phase ─────────────────────────────────────────────────────
  if (splitDone) {
    // Player bullet vs left half
    if (_player.bullet && _player.bullet.active) {
      if (!checkPlayerBulletVsFormation(_player.bullet, leftHalf)) {
        checkPlayerBulletVsFormation(_player.bullet, rightHalf);
      }
    }

    // Update left half
    if (leftHalf && getLiving(leftHalf).length > 0) {
      const lost = updateFormation(leftHalf, dt);
      if (lost) {
        _state.lives -= 1;
        leftHalf = makeFormation([], +1); // wipe it to prevent repeated loss
      }
    }

    // Update right half
    if (rightHalf && getLiving(rightHalf).length > 0) {
      const lost = updateFormation(rightHalf, dt);
      if (lost) {
        _state.lives -= 1;
        rightHalf = makeFormation([], -1);
      }
    }

    // Shooting for left half
    shootTimerL += dt;
    if (shootTimerL >= shootIntervalL && leftHalf && getLiving(leftHalf).length > 0) {
      shootTimerL    = 0;
      shootIntervalL = randomShootInterval();
      fireFromFormation(leftHalf);
    }

    // Shooting for right half
    shootTimerR += dt;
    if (shootTimerR >= shootIntervalR && rightHalf && getLiving(rightHalf).length > 0) {
      shootTimerR    = 0;
      shootIntervalR = randomShootInterval();
      fireFromFormation(rightHalf);
    }

    // Win condition: both halves cleared
    const leftCount  = leftHalf  ? getLiving(leftHalf).length  : 0;
    const rightCount = rightHalf ? getLiving(rightHalf).length : 0;
    if (leftCount === 0 && rightCount === 0) {
      _state.level = 4; // advance to Boss
      return;
    }
  }
}

/**
 * Called every frame to draw Level 3.
 * @param {CanvasRenderingContext2D} ctx
 */
export function render(ctx) {
  // ── Bunkers ───────────────────────────────────────────────────────────────
  ctx.fillStyle = BUNKER_COLOR;
  for (const bunker of bunkers) {
    for (let r = 0; r < BUNKER_ROWS; r++) {
      for (let c = 0; c < BUNKER_COLS; c++) {
        if (!bunker.cells[r][c]) continue;
        ctx.fillRect(
          bunker.x + c * BUNKER_CELL_SIZE,
          bunker.y + r * BUNKER_CELL_SIZE,
          BUNKER_CELL_SIZE,
          BUNKER_CELL_SIZE
        );
      }
    }
  }

  // ── Explosions ────────────────────────────────────────────────────────────
  ctx.fillStyle = EXPLOSION_COLOR;
  for (const exp of explosions) {
    ctx.fillRect(Math.round(exp.x), Math.round(exp.y), INVADER_W, INVADER_H);
  }

  // ── Invaders (pre-split) ──────────────────────────────────────────────────
  ctx.fillStyle = INVADER_COLOR;
  if (!splitDone && formation) {
    for (const inv of formation.invaders) {
      if (!inv.alive) continue;
      ctx.fillRect(
        Math.round(inv.baseX + formation.offsetX),
        Math.round(inv.baseY + formation.offsetY),
        INVADER_W,
        INVADER_H
      );
    }
  }

  // ── Invaders (post-split) ─────────────────────────────────────────────────
  if (splitDone) {
    ctx.fillStyle = INVADER_COLOR;
    if (leftHalf) {
      for (const inv of leftHalf.invaders) {
        if (!inv.alive) continue;
        ctx.fillRect(
          Math.round(inv.baseX + leftHalf.offsetX),
          Math.round(inv.baseY + leftHalf.offsetY),
          INVADER_W,
          INVADER_H
        );
      }
    }
    if (rightHalf) {
      for (const inv of rightHalf.invaders) {
        if (!inv.alive) continue;
        ctx.fillRect(
          Math.round(inv.baseX + rightHalf.offsetX),
          Math.round(inv.baseY + rightHalf.offsetY),
          INVADER_W,
          INVADER_H
        );
      }
    }
  }

  // ── Invader bullets ───────────────────────────────────────────────────────
  ctx.fillStyle = INV_BULLET_COLOR;
  for (const b of invaderBullets) {
    if (!b.active) continue;
    ctx.fillRect(Math.round(b.x), Math.round(b.y), INV_BULLET_W, INV_BULLET_H);
  }

  // ── Player ship ───────────────────────────────────────────────────────────
  if (_player) {
    _player.draw(ctx);
  }

  // ── HUD level label ───────────────────────────────────────────────────────
  if (_state) {
    ctx.save();
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'top';
    ctx.font         = '18px monospace';
    ctx.fillStyle    = '#aaaaff';
    ctx.fillText('Level: 3', CANVAS_WIDTH - 16, 52);
    ctx.restore();
  }
}
