// level3.js — Level 3: Shields and Formations
// ES module; owns the 11×5 invader grid, four destructible shield bunkers,
// and mid-level formation split logic.
//
// Lifecycle contract:
//   export default { init(ctx, gameState), update(dt, input), render(ctx) }
//
// Works under a file:// URL with no bundler or npm dependencies.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const COLS           = 11;
const ROWS           = 5;
const TOTAL_INVADERS = COLS * ROWS; // 55
const SPLIT_TRIGGER  = 28;          // destroyed count that triggers split

// Left half: columns 0–5 (0-indexed), i.e. col indices 0,1,2,3,4,5
// Right half: columns 6–10 (0-indexed), i.e. col indices 6,7,8,9,10
const LEFT_COLS  = 6;  // columns 0..5
// RIGHT_COLS = 5;  // columns 6..10

// Invader cell sizing — matches level1/level2 conventions
const CELL_SIZE    = 48;  // px — each invader occupies a 48×48 cell
const SPRITE_SIZE  = 32;  // px — rendered sprite
const CELL_PADDING = (CELL_SIZE - SPRITE_SIZE) / 2; // 8 px

// Formation placement
const FORMATION_START_X = 64;
const FORMATION_START_Y = 80;

// Step movement
const STEP_DISTANCE = 12; // px per horizontal step
const DROP_STEP     = CELL_SIZE; // px dropped on direction change (48 px)

// Step timing — constant throughout level 3 (no speed scaling)
// Fixed interval: 600 ms per step (moderate challenge, constant speed)
const STEP_INTERVAL = 600; // ms

// Invader drawing colour
const INVADER_COLOUR = '#00ff00';

// ---------------------------------------------------------------------------
// Bunker constants
// ---------------------------------------------------------------------------
const BUNKER_CELL_SIZE = 8;   // px — each cell is 8×8
const BUNKER_COLS      = 4;   // 4 columns per bunker
const BUNKER_ROWS      = 4;   // 4 rows per bunker
const BUNKER_WIDTH     = BUNKER_COLS * BUNKER_CELL_SIZE; // 32 px
const BUNKER_HEIGHT    = BUNKER_ROWS * BUNKER_CELL_SIZE; // 32 px
const BUNKER_Y_FACTOR  = 0.80; // 80% of canvas height
const BUNKER_COUNT     = 4;
const BUNKER_COLOUR    = '#00FF00';

// ---------------------------------------------------------------------------
// AABB helper (local copy — no dependency on collision.js internals)
// ---------------------------------------------------------------------------
function aabb(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// ---------------------------------------------------------------------------
// Module-level state (reset on each init() call)
// ---------------------------------------------------------------------------
let _ctx        = null;
let _canvasW    = CANVAS_WIDTH;
let _canvasH    = CANVAS_HEIGHT;

// Invaders — flat array of 55 objects
// { x, y, width, height, alive, col, row }
let _invaders   = [];

// Formation state — pre-split
let _phase      = 1;          // 1 = classic sweep, 2 = split
let _direction  = 1;          // +1 right, -1 left
let _stepTimer  = 0;          // ms accumulator
let _destroyed  = 0;          // count of destroyed invaders

// Phase 2: left and right halves
// Each half: { invaders[], direction, stepTimer }
let _leftHalf   = null;
let _rightHalf  = null;

// Bunkers — array of 4 bunker objects
// Each bunker: { x, y, cells: boolean[][] }  (cells[row][col], true = alive)
let _bunkers    = [];

// ---------------------------------------------------------------------------
// init(ctx, gameState)
// ---------------------------------------------------------------------------
function init(ctx, gameState) {
  _ctx      = ctx;
  _canvasW  = ctx.canvas ? ctx.canvas.width  : CANVAS_WIDTH;
  _canvasH  = ctx.canvas ? ctx.canvas.height : CANVAS_HEIGHT;

  // Reset state
  _phase      = 1;
  _direction  = 1;
  _stepTimer  = 0;
  _destroyed  = 0;
  _leftHalf   = null;
  _rightHalf  = null;

  // Build invader grid
  _invaders = _createFormation();

  // Build bunkers
  _bunkers = _createBunkers();
}

// ---------------------------------------------------------------------------
// update(dt, input)
// dt is in milliseconds (per the lifecycle contract spec: "dt milliseconds")
// Returns 'BOSS' when all invaders are destroyed, undefined otherwise.
// ---------------------------------------------------------------------------
function update(dt, input) {
  // dt is in milliseconds
  const dtMs = dt;

  if (_phase === 1) {
    // ------------------------------------------------------------------
    // Phase 1: single formation sweep
    // ------------------------------------------------------------------

    // Check bullet collisions (player bullets from gameState/input)
    _checkPlayerBulletCollisions(input);
    _checkInvaderBulletCollisions(input);

    // Check win
    if (_allDead(_invaders)) {
      return 'BOSS';
    }

    // Check split trigger
    if (_destroyed >= SPLIT_TRIGGER) {
      _doSplit();
      // Fall through to phase 2 update this same tick
    } else {
      // Advance step timer
      _stepTimer += dtMs;
      if (_stepTimer >= STEP_INTERVAL) {
        _stepTimer -= STEP_INTERVAL;
        _doStep(_invaders, /* dirRef */ null);
      }

      // Invader contact with bunkers
      _checkInvaderBunkerContact(_invaders);

      return undefined;
    }
  }

  if (_phase === 2) {
    // ------------------------------------------------------------------
    // Phase 2: two independent halves
    // ------------------------------------------------------------------

    // Player bullets vs both halves
    _checkPlayerBulletCollisions(input);
    _checkInvaderBulletCollisions(input);

    // Win check
    if (_allDead(_leftHalf.invaders) && _allDead(_rightHalf.invaders)) {
      return 'BOSS';
    }

    // Advance left half
    _leftHalf.stepTimer += dtMs;
    if (_leftHalf.stepTimer >= STEP_INTERVAL) {
      _leftHalf.stepTimer -= STEP_INTERVAL;
      _doStep(_leftHalf.invaders, _leftHalf, 'left');
    }

    // Advance right half
    _rightHalf.stepTimer += dtMs;
    if (_rightHalf.stepTimer >= STEP_INTERVAL) {
      _rightHalf.stepTimer -= STEP_INTERVAL;
      _doStep(_rightHalf.invaders, _rightHalf, 'right');
    }

    // Invader contact with bunkers (both halves)
    _checkInvaderBunkerContact(_leftHalf.invaders);
    _checkInvaderBunkerContact(_rightHalf.invaders);

    return undefined;
  }
}

// ---------------------------------------------------------------------------
// render(ctx)
// ---------------------------------------------------------------------------
function render(ctx) {
  // Draw bunkers
  ctx.fillStyle = BUNKER_COLOUR;
  for (const bunker of _bunkers) {
    for (let r = 0; r < BUNKER_ROWS; r++) {
      for (let c = 0; c < BUNKER_COLS; c++) {
        if (bunker.cells[r][c]) {
          ctx.fillRect(
            Math.round(bunker.x + c * BUNKER_CELL_SIZE),
            Math.round(bunker.y + r * BUNKER_CELL_SIZE),
            BUNKER_CELL_SIZE,
            BUNKER_CELL_SIZE
          );
        }
      }
    }
  }

  // Draw invaders
  ctx.fillStyle = INVADER_COLOUR;

  if (_phase === 1) {
    _drawInvaders(ctx, _invaders);
  } else if (_phase === 2) {
    if (_leftHalf)  _drawInvaders(ctx, _leftHalf.invaders);
    if (_rightHalf) _drawInvaders(ctx, _rightHalf.invaders);
  }

  // HUD
  const hudX = _canvasW / 2;
  const hudY = _canvasH - 8;
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle    = '#aaffaa';
  ctx.font         = '16px monospace';
  ctx.fillText('LEVEL 3', hudX, hudY);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Private — formation creation
// ---------------------------------------------------------------------------
function _createFormation() {
  const invaders = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = FORMATION_START_X + col * CELL_SIZE + CELL_PADDING;
      const y = FORMATION_START_Y + row * CELL_SIZE + CELL_PADDING;
      invaders.push({
        x,
        y,
        width:  SPRITE_SIZE,
        height: SPRITE_SIZE,
        alive:  true,
        col,    // 0-indexed column (0..10)
        row,    // 0-indexed row
      });
    }
  }
  return invaders; // exactly 55
}

// ---------------------------------------------------------------------------
// Private — bunker creation
// ---------------------------------------------------------------------------
function _createBunkers() {
  const bunkers = [];
  const bunkerY = Math.round(_canvasH * BUNKER_Y_FACTOR);

  // Evenly space 4 bunkers horizontally across the canvas.
  // Spacing: divide canvas width into (BUNKER_COUNT + 1) equal segments.
  const spacing = _canvasW / (BUNKER_COUNT + 1);

  for (let i = 0; i < BUNKER_COUNT; i++) {
    const centreX = Math.round(spacing * (i + 1));
    const bunkerX = centreX - Math.round(BUNKER_WIDTH / 2);

    // cells[row][col] — true means the cell is alive
    const cells = [];
    for (let r = 0; r < BUNKER_ROWS; r++) {
      cells.push(new Array(BUNKER_COLS).fill(true));
    }

    bunkers.push({
      x: bunkerX,
      y: bunkerY,
      cells,
    });
  }
  return bunkers;
}

// ---------------------------------------------------------------------------
// Private — step logic
// ---------------------------------------------------------------------------

/**
 * _doStep — moves a set of invaders one step.
 * For phase 1, mutates _direction.
 * For phase 2, mutates half.direction via the half object.
 *
 * @param {object[]} invaders
 * @param {object|null} half   — null for phase 1; { direction, stepTimer } for phase 2
 * @param {string|null} side   — 'left' | 'right' | null  (for phase 2 boundary clamping)
 */
function _doStep(invaders, half, side) {
  const dir = half ? half.direction : _direction;
  const dx  = STEP_DISTANCE * dir;

  // Tentatively move
  for (const inv of invaders) {
    if (inv.alive) inv.x += dx;
  }

  // Check boundary breach
  let hitWall = false;
  for (const inv of invaders) {
    if (!inv.alive) continue;
    if (inv.x < 0 || inv.x + inv.width > _canvasW) {
      hitWall = true;
      break;
    }
  }

  if (hitWall) {
    // Undo move, drop, reverse
    for (const inv of invaders) {
      if (inv.alive) {
        inv.x -= dx;
        inv.y += DROP_STEP;
      }
    }
    if (half) {
      half.direction *= -1;
    } else {
      _direction *= -1;
    }
  }
}

// ---------------------------------------------------------------------------
// Private — split
// ---------------------------------------------------------------------------
function _doSplit() {
  _phase = 2;

  // Left half: columns 0–5 (indices 0..5 → col < LEFT_COLS)
  const leftInvaders  = _invaders.filter(inv => inv.col < LEFT_COLS);
  // Right half: columns 6–10 (indices 6..10 → col >= LEFT_COLS)
  const rightInvaders = _invaders.filter(inv => inv.col >= LEFT_COLS);

  // Left half initially moves left (direction = -1)
  // Right half initially moves right (direction = +1)
  _leftHalf = {
    invaders:  leftInvaders,
    direction: -1,
    stepTimer: 0,
  };

  _rightHalf = {
    invaders:  rightInvaders,
    direction: 1,
    stepTimer: 0,
  };
}

// ---------------------------------------------------------------------------
// Private — collision helpers
// ---------------------------------------------------------------------------

/**
 * _checkPlayerBulletCollisions — tests player bullets against all live invaders
 * and alive bunker cells.  Mutates in place.
 *
 * input may have:
 *   input.playerBullets — array of { x, y, width, height, ... }
 */
function _checkPlayerBulletCollisions(input) {
  if (!input || !input.playerBullets) return;
  const bullets = input.playerBullets;

  const allInvaders = _getActiveInvaders();

  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const bullet = bullets[bi];
    let hit = false;

    // vs invaders
    for (const inv of allInvaders) {
      if (!inv.alive) continue;
      if (aabb(bullet, inv)) {
        inv.alive = false;
        _destroyed++;
        hit = true;
        break;
      }
    }

    if (hit) {
      bullets.splice(bi, 1);
      continue;
    }

    // vs bunker cells
    if (_bulletHitsBunker(bullet)) {
      bullets.splice(bi, 1);
    }
  }
}

/**
 * _checkInvaderBulletCollisions — tests invader bullets against alive bunker
 * cells (and optionally the player, but player collision is handled by
 * collision.js / game.js — we only handle bunker interaction here).
 *
 * input may have:
 *   input.invaderBullets — array of { x, y, width, height, ... }
 */
function _checkInvaderBulletCollisions(input) {
  if (!input || !input.invaderBullets) return;
  const bullets = input.invaderBullets;

  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const bullet = bullets[bi];
    if (_bulletHitsBunker(bullet)) {
      bullets.splice(bi, 1);
    }
  }
}

/**
 * _bulletHitsBunker — tests a bullet rect against all alive bunker cells.
 * Destroys the first cell hit and returns true.
 * @param {{x,y,width,height}} bullet
 * @returns {boolean}
 */
function _bulletHitsBunker(bullet) {
  for (const bunker of _bunkers) {
    for (let r = 0; r < BUNKER_ROWS; r++) {
      for (let c = 0; c < BUNKER_COLS; c++) {
        if (!bunker.cells[r][c]) continue;
        const cellRect = {
          x:      bunker.x + c * BUNKER_CELL_SIZE,
          y:      bunker.y + r * BUNKER_CELL_SIZE,
          width:  BUNKER_CELL_SIZE,
          height: BUNKER_CELL_SIZE,
        };
        if (aabb(bullet, cellRect)) {
          bunker.cells[r][c] = false; // destroy cell
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * _checkInvaderBunkerContact — destroys any bunker cell that overlaps a live
 * invader's bounding box.  The invader is NOT destroyed or stopped.
 * @param {object[]} invaders
 */
function _checkInvaderBunkerContact(invaders) {
  for (const inv of invaders) {
    if (!inv.alive) continue;
    for (const bunker of _bunkers) {
      for (let r = 0; r < BUNKER_ROWS; r++) {
        for (let c = 0; c < BUNKER_COLS; c++) {
          if (!bunker.cells[r][c]) continue;
          const cellRect = {
            x:      bunker.x + c * BUNKER_CELL_SIZE,
            y:      bunker.y + r * BUNKER_CELL_SIZE,
            width:  BUNKER_CELL_SIZE,
            height: BUNKER_CELL_SIZE,
          };
          if (aabb(inv, cellRect)) {
            bunker.cells[r][c] = false;
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Private — utility
// ---------------------------------------------------------------------------

function _allDead(invaders) {
  for (const inv of invaders) {
    if (inv.alive) return false;
  }
  return true;
}

function _getActiveInvaders() {
  if (_phase === 1) return _invaders;
  const arr = [];
  if (_leftHalf)  for (const inv of _leftHalf.invaders)  arr.push(inv);
  if (_rightHalf) for (const inv of _rightHalf.invaders) arr.push(inv);
  return arr;
}

function _drawInvaders(ctx, invaders) {
  ctx.fillStyle = INVADER_COLOUR;
  for (const inv of invaders) {
    if (inv.alive) {
      ctx.fillRect(Math.round(inv.x), Math.round(inv.y), inv.width, inv.height);
    }
  }
}

// ---------------------------------------------------------------------------
// Default export — standard level lifecycle contract
// ---------------------------------------------------------------------------
export default { init, update, render };
