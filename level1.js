// level1.js — Level 1: The Classic Grid
//
// Implements the 11×5 invader formation with timer-based movement,
// edge-detection, descent, life-loss, and level-clear logic.
//
// This module is imported by game.js and drives the SCENE_PLAYING state
// for Level 1.  It does NOT use updateInvaders() from invaders.js because
// Level 1 uses interval-based (timer-driven) steps rather than per-tick px.

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { invaders, INVADER_WIDTH, INVADER_HEIGHT } from './invaders.js';
import { addExplosion } from './explosion.js';

// ---------------------------------------------------------------------------
// Formation constants
// ---------------------------------------------------------------------------
const COLS          = 11;
const ROWS          = 5;
const INVADER_GAP_X = 12;   // horizontal gap between invaders
const INVADER_GAP_Y = 8;    // vertical gap between rows

// Formation dimensions
const FORMATION_WIDTH  = COLS * INVADER_WIDTH  + (COLS - 1) * INVADER_GAP_X;  // 384 px
const FORMATION_HEIGHT = ROWS * INVADER_HEIGHT + (ROWS - 1) * INVADER_GAP_Y;  // 112 px

// Starting position: horizontally centred, top at Y = 48
const START_X = (CANVAS_WIDTH - FORMATION_WIDTH) / 2;  // (768 - 384) / 2 = 192
const START_Y = 48;

// Step size in px
const STEP_X    = 8;    // px per horizontal step
// Drop amount when hitting an edge
const DROP_Y    = INVADER_HEIGHT + INVADER_GAP_Y;  // 24 px (one cell height)

// Interval bounds (ms)
const INTERVAL_MIN  = 100;   // 1 invader alive
const INTERVAL_MAX  = 800;   // 55 invaders alive
const TOTAL_INVADERS = COLS * ROWS;  // 55

// ---------------------------------------------------------------------------
// Level 1 state
// ---------------------------------------------------------------------------
let directionX   = 1;      // +1 = right, -1 = left
let stepTimer    = 0;      // ms elapsed since last step
let currentLevel = 1;

// Callbacks set by initLevel1()
let _onLoseLife  = null;   // () => void  — called when formation reaches player row
let _onGameOver  = null;   // () => void  — called when lives === 0 on reach
let _onLevelClear = null;  // () => void  — called when all invaders destroyed
let _getPlayerY  = null;   // () => number — returns player's current y
let _getLives    = null;   // () => number — returns hudState.lives

/**
 * countAlive — return number of living invaders.
 * @returns {number}
 */
export function countAlive() {
  return invaders.filter(inv => inv.alive).length;
}

/**
 * stepInterval — compute the step interval for the given alive count.
 * Formula: 100 + (alive / 55) * 700 ms, clamped to [100, 800].
 *
 * @param {number} alive
 * @returns {number} ms
 */
export function stepInterval(alive) {
  const raw = INTERVAL_MIN + (alive / TOTAL_INVADERS) * (INTERVAL_MAX - INTERVAL_MIN);
  return Math.max(INTERVAL_MIN, Math.min(INTERVAL_MAX, raw));
}

/**
 * resetFormation — reset all invaders to starting positions and alive = true.
 * Also resets direction and timer.
 */
export function resetFormation() {
  let i = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      invaders[i].x     = START_X + col * (INVADER_WIDTH  + INVADER_GAP_X);
      invaders[i].y     = START_Y + row * (INVADER_HEIGHT + INVADER_GAP_Y);
      invaders[i].alive = true;
      i++;
    }
  }
  directionX = 1;
  stepTimer  = 0;
}

/**
 * initLevel1 — wire up Level 1 with callbacks from game.js.
 *
 * @param {object} opts
 * @param {Function} opts.onLoseLife    - Called when formation reaches player row and lives > 0.
 * @param {Function} opts.onGameOver    - Called when formation reaches player row and lives === 0.
 * @param {Function} opts.onLevelClear  - Called when all 55 invaders are destroyed.
 * @param {Function} opts.getPlayerY    - Returns the player's current y (top-left).
 * @param {Function} opts.getLives      - Returns hudState.lives.
 * @param {number}   opts.level         - Current level number (default 1).
 */
export function initLevel1(opts) {
  _onLoseLife   = opts.onLoseLife;
  _onGameOver   = opts.onGameOver;
  _onLevelClear = opts.onLevelClear;
  _getPlayerY   = opts.getPlayerY;
  _getLives     = opts.getLives;
  currentLevel  = opts.level !== undefined ? opts.level : 1;

  resetFormation();
}

/**
 * getCurrentLevel — returns the level number this module is running.
 * @returns {number}
 */
export function getCurrentLevel() {
  return currentLevel;
}

/**
 * updateLevel1 — advance Level 1 state by dt seconds.
 * Call once per fixed tick from game.js when SCENE_PLAYING.
 *
 * @param {number} dt - Fixed timestep in seconds (1/60).
 */
export function updateLevel1(dt) {
  const alive = countAlive();

  // -----------------------------------------------------------------------
  // 1. Level-clear check
  // -----------------------------------------------------------------------
  if (alive === 0) {
    if (_onLevelClear) _onLevelClear();
    return;
  }

  // -----------------------------------------------------------------------
  // 2. Step timer
  // -----------------------------------------------------------------------
  stepTimer += dt * 1000;  // convert seconds to ms

  const interval = stepInterval(alive);
  if (stepTimer < interval) return;
  stepTimer -= interval;

  // -----------------------------------------------------------------------
  // 3. Determine formation edges among living invaders
  // -----------------------------------------------------------------------
  const living = invaders.filter(inv => inv.alive);
  const rightEdge = Math.max(...living.map(inv => inv.x + INVADER_WIDTH));
  const leftEdge  = Math.min(...living.map(inv => inv.x));
  const bottomEdge = Math.max(...living.map(inv => inv.y + INVADER_HEIGHT));

  // -----------------------------------------------------------------------
  // 4. Edge detection → drop + reverse, or step horizontally
  // -----------------------------------------------------------------------
  const hitRight = directionX > 0 && rightEdge + STEP_X > CANVAS_WIDTH;
  const hitLeft  = directionX < 0 && leftEdge  - STEP_X < 0;

  if (hitRight || hitLeft) {
    // Drop formation by one cell height and reverse.
    for (const inv of invaders) {
      inv.y += DROP_Y;
    }
    directionX = -directionX;
  } else {
    // Horizontal step.
    for (const inv of invaders) {
      inv.x += STEP_X * directionX;
    }
  }

  // -----------------------------------------------------------------------
  // 5. Re-check bottom edge after movement for player-row collision
  // -----------------------------------------------------------------------
  const livingAfterMove = invaders.filter(inv => inv.alive);
  const newBottomEdge   = Math.max(...livingAfterMove.map(inv => inv.y + INVADER_HEIGHT));
  const playerY         = _getPlayerY ? _getPlayerY() : CANVAS_HEIGHT;

  if (newBottomEdge >= playerY) {
    // Formation has reached the player's row.
    const lives = _getLives ? _getLives() : 0;
    if (lives <= 0) {
      if (_onGameOver) _onGameOver();
    } else {
      if (_onLoseLife) _onLoseLife();
    }
  }
}
