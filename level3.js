/**
 * level3.js — Level 3: Shields and Formations
 *
 * Introduces:
 *  - Four destructible shield bunkers (4×4 grid of 8×8 px cells each)
 *  - 11×5 invader starting grid with standard left-right sweep
 *  - Formation split at ≥28 kills: left half (cols 1-6) and right half (cols 7-11)
 *    diverge as independent sweeping formations
 *  - Win condition: all invaders dead → transition to Boss Level
 *
 * Exported API (consistent with sibling level modules):
 *   initLevel3(canvas, ctx, gameState)  → void
 *   updateLevel3(dt, gameState)          → void
 *   drawLevel3(ctx, gameState)           → void
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INVADER_COLS         = 11;
const INVADER_ROWS         = 5;
const INVADER_TOTAL        = INVADER_COLS * INVADER_ROWS; // 55
const SPLIT_THRESHOLD      = 28; // ≥28 dead triggers split

const INVADER_W            = 36; // px — invader cell width
const INVADER_H            = 24; // px — invader cell height
const INVADER_COL_GAP      = 16; // px — horizontal gap between invaders
const INVADER_ROW_GAP      = 16; // px — vertical gap between invaders
const INVADER_GRID_TOP     = 80; // px — top of first row

const FORMATION_SPEED_INIT = 60;  // px/sec
const DROP_AMOUNT          = 24;  // px — how far down on edge-hit

// Left-half: columns 0-5 (0-indexed), Right-half: columns 6-10
const LEFT_COLS_MAX        = 6;   // cols 0..5 → "columns 1-6" in spec

// Bunker constants
const BUNKER_COUNT         = 4;
const BUNKER_CELL_SIZE     = 8;   // px
const BUNKER_COLS_PER      = 4;
const BUNKER_ROWS_PER      = 4;
const BUNKER_W             = BUNKER_CELL_SIZE * BUNKER_COLS_PER; // 32
const BUNKER_H             = BUNKER_CELL_SIZE * BUNKER_ROWS_PER; // 32
const BUNKER_Y_FRAC        = 0.80;
const BUNKER_COLOR         = '#3f3';  // classic green

// Invader colours per row (classic arcade palette approximation)
const ROW_COLORS = ['#f0f', '#f0f', '#0ff', '#0ff', '#fff'];

// ---------------------------------------------------------------------------
// Module-level state (reset on each initLevel3 call)
// ---------------------------------------------------------------------------

let _canvas    = null;
let _ctx       = null;
let _state     = null; // reference to gameState object owned by game.js

// Invader grid — array of invader objects before split
// { col, row, x, y, alive }
let _invaders  = [];

// Formation sweep (pre-split)
let _fmDir     = 1;   // 1 = right, -1 = left
let _fmSpeed   = FORMATION_SPEED_INIT;
let _splitDone = false;
let _deadCount = 0;

// Post-split halves
// Each half: { invaders: [...], dir, speed, dropped }
let _leftHalf  = null;
let _rightHalf = null;

// Bunkers — array of bunker objects
// bunker: { cells: Set<string> ("row,col" keys present), x, y }
let _bunkers   = [];

// Level bullets (player bullets managed by game.js via gameState;
// we read gameState.bullets for player bullets)
// Invader bullets (if level2 shooting interface exists) are in gameState.invaderBullets

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the initial 11×5 invader grid.
 * Grid is centred horizontally.
 */
function buildInvaderGrid() {
  const gridW = INVADER_COLS * INVADER_W + (INVADER_COLS - 1) * INVADER_COL_GAP;
  const startX = Math.round((CANVAS_WIDTH - gridW) / 2);

  const invaders = [];
  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let col = 0; col < INVADER_COLS; col++) {
      invaders.push({
        col,
        row,
        x: startX + col * (INVADER_W + INVADER_COL_GAP),
        y: INVADER_GRID_TOP + row * (INVADER_H + INVADER_ROW_GAP),
        alive: true,
      });
    }
  }
  return invaders;
}

/**
 * Build four bunkers evenly spaced horizontally at ~80% canvas height.
 */
function buildBunkers() {
  const totalBunkerW = BUNKER_COUNT * BUNKER_W;
  const spacing = (CANVAS_WIDTH - totalBunkerW) / (BUNKER_COUNT + 1);
  const bunkerY  = Math.round(CANVAS_HEIGHT * BUNKER_Y_FRAC);
  const bunkers  = [];

  for (let i = 0; i < BUNKER_COUNT; i++) {
    const bx = Math.round(spacing + i * (BUNKER_W + spacing));
    // cells stored as a Set of "r,c" strings for O(1) lookup / deletion
    const cells = new Set();
    for (let r = 0; r < BUNKER_ROWS_PER; r++) {
      for (let c = 0; c < BUNKER_COLS_PER; c++) {
        cells.add(`${r},${c}`);
      }
    }
    bunkers.push({ x: bx, y: bunkerY, cells });
  }
  return bunkers;
}

/**
 * Compute the axis-aligned bounding box of an invader.
 */
function invaderAABB(inv) {
  return { x: inv.x, y: inv.y, w: INVADER_W, h: INVADER_H };
}

/**
 * Return true if two AABBs overlap.
 */
function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Check a bullet {x, y, w, h} against all bunker cells.
 * Destroys the first cell hit and returns true (bullet consumed).
 */
function bulletHitsBunker(bullet) {
  for (const bunker of _bunkers) {
    for (let r = 0; r < BUNKER_ROWS_PER; r++) {
      for (let c = 0; c < BUNKER_COLS_PER; c++) {
        const key = `${r},${c}`;
        if (!bunker.cells.has(key)) continue;
        const cellBox = {
          x: bunker.x + c * BUNKER_CELL_SIZE,
          y: bunker.y + r * BUNKER_CELL_SIZE,
          w: BUNKER_CELL_SIZE,
          h: BUNKER_CELL_SIZE,
        };
        if (aabbOverlap(bullet, cellBox)) {
          bunker.cells.delete(key);
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Erode any bunker cells overlapped by a live invader.
 * The invader is NOT destroyed.
 */
function invaderErodessBunkers(inv) {
  if (!inv.alive) return;
  const box = invaderAABB(inv);
  for (const bunker of _bunkers) {
    for (let r = 0; r < BUNKER_ROWS_PER; r++) {
      for (let c = 0; c < BUNKER_COLS_PER; c++) {
        const key = `${r},${c}`;
        if (!bunker.cells.has(key)) continue;
        const cellBox = {
          x: bunker.x + c * BUNKER_CELL_SIZE,
          y: bunker.y + r * BUNKER_CELL_SIZE,
          w: BUNKER_CELL_SIZE,
          h: BUNKER_CELL_SIZE,
        };
        if (aabbOverlap(box, cellBox)) {
          bunker.cells.delete(key);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Formation movement helpers
// ---------------------------------------------------------------------------

/**
 * Move a list of alive invaders horizontally by dx, vertically by dy.
 */
function shiftInvaders(list, dx, dy) {
  for (const inv of list) {
    if (!inv.alive) continue;
    inv.x += dx;
    inv.y += dy;
  }
}

/**
 * Compute the bounding x-extent (leftmost x, rightmost x+w) of alive invaders.
 * Returns null if none alive.
 */
function formationXExtent(list) {
  let minX = Infinity, maxX = -Infinity;
  for (const inv of list) {
    if (!inv.alive) continue;
    if (inv.x < minX) minX = inv.x;
    if (inv.x + INVADER_W > maxX) maxX = inv.x + INVADER_W;
  }
  if (minX === Infinity) return null;
  return { minX, maxX };
}

/**
 * Update a half-formation (or the full pre-split formation).
 * Mutates: half.dir.
 * @param {{ invaders: Array, dir: number, speed: number }} half
 * @param {number} dt  seconds
 */
function updateHalfFormation(half, dt) {
  const alive = half.invaders.filter(inv => inv.alive);
  if (alive.length === 0) return;

  const dx = half.dir * half.speed * dt;
  shiftInvaders(half.invaders, dx, 0);

  const ext = formationXExtent(half.invaders);
  if (!ext) return;

  if (ext.maxX >= CANVAS_WIDTH && half.dir === 1) {
    // Overshoot correction
    const over = ext.maxX - CANVAS_WIDTH;
    shiftInvaders(half.invaders, -over, DROP_AMOUNT);
    half.dir = -1;
  } else if (ext.minX <= 0 && half.dir === -1) {
    const over = -ext.minX;
    shiftInvaders(half.invaders, over, DROP_AMOUNT);
    half.dir = 1;
  }

  // Erode bunkers on overlap
  for (const inv of alive) {
    invaderErodessBunkers(inv);
  }
}

// ---------------------------------------------------------------------------
// Split logic
// ---------------------------------------------------------------------------

/**
 * Split the pre-split formation into two independent halves.
 * Left half : cols 0-5 (spec cols 1-6), starts moving left.
 * Right half: cols 6-10 (spec cols 7-11), starts moving right.
 */
function doSplit() {
  _splitDone = true;

  const leftInvaders  = _invaders.filter(inv => inv.col < LEFT_COLS_MAX);
  const rightInvaders = _invaders.filter(inv => inv.col >= LEFT_COLS_MAX);

  _leftHalf = {
    invaders: leftInvaders,
    dir:      -1,          // moving left
    speed:    _fmSpeed,
  };

  _rightHalf = {
    invaders: rightInvaders,
    dir:      1,           // moving right
    speed:    _fmSpeed,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise Level 3.
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} gameState  shared mutable game state from game.js
 */
export function initLevel3(canvas, ctx, gameState) {
  _canvas    = canvas;
  _ctx       = ctx;
  _state     = gameState;

  _invaders  = buildInvaderGrid();
  _bunkers   = buildBunkers();

  _fmDir     = 1;
  _fmSpeed   = FORMATION_SPEED_INIT;
  _splitDone = false;
  _deadCount = 0;
  _leftHalf  = null;
  _rightHalf = null;
}

/**
 * Update Level 3 for one frame.
 * @param {number} dt         seconds since last frame
 * @param {object} gameState  shared mutable game state
 */
export function updateLevel3(dt, gameState) {
  _state = gameState;

  // -------------------------------------------------------------------------
  // 1. Update formation movement
  // -------------------------------------------------------------------------
  if (!_splitDone) {
    // Pre-split: treat entire _invaders list as one half-object
    const preSplit = { invaders: _invaders, dir: _fmDir, speed: _fmSpeed };
    updateHalfFormation(preSplit, dt);
    _fmDir   = preSplit.dir;   // reflect any reversal
    _fmSpeed = preSplit.speed;
  } else {
    updateHalfFormation(_leftHalf,  dt);
    updateHalfFormation(_rightHalf, dt);
  }

  // -------------------------------------------------------------------------
  // 2. Player bullet ↔ invader collisions
  // -------------------------------------------------------------------------
  const playerBullets = gameState.bullets || [];
  const allInvaders   = _splitDone
    ? [..._leftHalf.invaders, ..._rightHalf.invaders]
    : _invaders;

  for (let bi = playerBullets.length - 1; bi >= 0; bi--) {
    const b = playerBullets[bi];
    // Bullet bounding box (assume bullet has x, y; width/height default to 4×16)
    const bulletBox = { x: b.x - 2, y: b.y - 8, w: b.w || 4, h: b.h || 16 };

    // Check bunker first
    if (bulletHitsBunker(bulletBox)) {
      playerBullets.splice(bi, 1);
      continue;
    }

    // Check invaders
    let hitInvader = false;
    for (const inv of allInvaders) {
      if (!inv.alive) continue;
      if (aabbOverlap(bulletBox, invaderAABB(inv))) {
        inv.alive = false;
        _deadCount++;
        playerBullets.splice(bi, 1);
        hitInvader = true;

        // Check split threshold
        if (!_splitDone && _deadCount >= SPLIT_THRESHOLD) {
          doSplit();
        }
        break;
      }
    }
    if (hitInvader) continue;
  }

  // -------------------------------------------------------------------------
  // 3. Invader bullet ↔ bunker collisions (if invader bullets exist)
  // -------------------------------------------------------------------------
  const invaderBullets = gameState.invaderBullets || [];
  for (let bi = invaderBullets.length - 1; bi >= 0; bi--) {
    const b = invaderBullets[bi];
    const bulletBox = { x: b.x - 2, y: b.y - 8, w: b.w || 4, h: b.h || 16 };
    if (bulletHitsBunker(bulletBox)) {
      invaderBullets.splice(bi, 1);
    }
  }

  // -------------------------------------------------------------------------
  // 4. Win condition check
  // -------------------------------------------------------------------------
  const liveCount = allInvaders.filter(inv => inv.alive).length;
  if (liveCount === 0) {
    // All invaders dead — transition to Boss Level
    if (typeof gameState.onLevelComplete === 'function') {
      gameState.onLevelComplete('boss');
    } else if (typeof gameState.nextLevel === 'function') {
      gameState.nextLevel('boss');
    } else {
      // Fallback: set a flag the game loop can detect
      gameState.level3Complete = true;
      gameState.pendingScene   = 'boss';
    }
  }
}

/**
 * Draw Level 3 onto the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} gameState  (unused directly, but kept for API symmetry)
 */
export function drawLevel3(ctx, gameState) {
  // -------------------------------------------------------------------------
  // 1. Draw bunkers
  // -------------------------------------------------------------------------
  ctx.fillStyle = BUNKER_COLOR;
  for (const bunker of _bunkers) {
    for (let r = 0; r < BUNKER_ROWS_PER; r++) {
      for (let c = 0; c < BUNKER_COLS_PER; c++) {
        if (bunker.cells.has(`${r},${c}`)) {
          ctx.fillRect(
            bunker.x + c * BUNKER_CELL_SIZE,
            bunker.y + r * BUNKER_CELL_SIZE,
            BUNKER_CELL_SIZE,
            BUNKER_CELL_SIZE,
          );
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 2. Draw invaders
  // -------------------------------------------------------------------------
  const allInvaders = _splitDone
    ? [..._leftHalf.invaders, ..._rightHalf.invaders]
    : _invaders;

  for (const inv of allInvaders) {
    if (!inv.alive) continue;
    ctx.fillStyle = ROW_COLORS[inv.row] || '#fff';
    ctx.fillRect(inv.x, inv.y, INVADER_W, INVADER_H);
  }
}
