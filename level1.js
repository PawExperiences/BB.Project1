// level1.js — Level 1: The Classic Grid
// ES module that drives the first playable level of Space Invaders.
// Exposes initLevel1(), updateLevel1(dt), renderLevel1(ctx).
//
// Integration: imported by game.js; hooks called from updatePlaying / renderPlaying.

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { InvaderGrid, INVADER_W, INVADER_H, GAP } from './invaders.js';
import { Player } from './player.js';
import { ExplosionPool } from './explosions.js';
import { collide } from './collisions.js';
import { hudState, transitionTo } from './game.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// The task requires the top edge of the formation at y = 48 px.
// InvaderGrid internally starts at START_Y = 80. We compensate via offsetY.
const GRID_TARGET_TOP_Y = 48;
const GRID_INTERNAL_START_Y = 80; // matches START_Y in invaders.js
const INITIAL_OFFSET_Y = GRID_TARGET_TOP_Y - GRID_INTERNAL_START_Y; // -32

// Total invader count for a full 11×5 grid
const TOTAL_INVADERS = 55;

// Step interval formula: interval = 100 + (liveCount / 55) * 700 ms
const INTERVAL_MIN_MS = 100;
const INTERVAL_MAX_MS = 800;

// Player row: where the player lives (top edge of player ship)
// From player.js: y = CANVAS_HEIGHT - SHIP_HEIGHT - 24 = 896 - 32 - 24 = 840
// Player bottom = 840 + 32 = 872
// We detect breach when the bottom edge of the live formation reaches player.y
const SHIP_HEIGHT = 32; // must match player.js SHIP_HEIGHT
const FLOOR_MARGIN = 24; // must match player.js hardcoded margin
const PLAYER_ROW_Y = CANVAS_HEIGHT - SHIP_HEIGHT - FLOOR_MARGIN; // 840

// The invader cell height (for drop reference in comments)
const CELL_H = INVADER_H + GAP; // 24 px — InvaderGrid drops 16 px internally

// ---------------------------------------------------------------------------
// Module-level state — no globals; all encapsulated here
// ---------------------------------------------------------------------------

/** @type {Player|null} */
let player = null;

/** @type {InvaderGrid|null} */
let invaderGrid = null;

/** @type {ExplosionPool|null} */
let explosions = null;

// Step timer (milliseconds accumulated)
let stepTimer = 0;

// Whether the level has been won (prevents further updating)
let levelCleared = false;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Compute the current step interval in milliseconds based on live invader count.
 * @returns {number} interval in ms
 */
function currentStepInterval() {
  const liveCount = invaderGrid.liveInvaders().length;
  return INTERVAL_MIN_MS + (liveCount / TOTAL_INVADERS) * (INTERVAL_MAX_MS - INTERVAL_MIN_MS);
}

/**
 * Compute the canvas-space bottom edge of the lowest live invader.
 * Returns -Infinity if no live invaders.
 */
function formationBottomY() {
  const live = invaderGrid.liveInvaders();
  if (live.length === 0) return -Infinity;

  let maxBottom = -Infinity;
  for (const inv of live) {
    const { y, h } = invaderGrid.invaderRect(inv);
    const bottom = y + h;
    if (bottom > maxBottom) maxBottom = bottom;
  }
  return maxBottom;
}

/**
 * Reset the formation to the initial state for a level restart.
 * Rebuilds InvaderGrid (resets all invaders to alive) and repositions it.
 */
function resetFormation() {
  invaderGrid = new InvaderGrid();
  invaderGrid.offsetY = INITIAL_OFFSET_Y;
  stepTimer = 0;
  levelCleared = false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise Level 1. Creates fresh Player, InvaderGrid, and ExplosionPool.
 * Call once when the playing scene starts (or when restarting Level 1).
 */
export function initLevel1() {
  player = new Player(CANVAS_WIDTH / 2, null);
  explosions = new ExplosionPool();

  // Set up HUD for level 1
  hudState.level = 1;
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;

  resetFormation();
}

/**
 * Update Level 1 for one fixed-timestep tick.
 * @param {number} dt  Delta time in seconds.
 */
export function updateLevel1(dt) {
  if (levelCleared) return;

  // --- Player update ---
  player.update(dt);

  // --- Level-controlled step timing ---
  // We accumulate real time and only call invaderGrid.update() when the
  // dynamic interval has elapsed. This replaces InvaderGrid's internal
  // 30-tick counter; we still call update() to trigger InvaderGrid's
  // step logic (including edge detection and drop).
  stepTimer += dt * 1000; // convert seconds to ms
  const interval = currentStepInterval();
  if (stepTimer >= interval) {
    stepTimer -= interval;
    // Drain InvaderGrid's internal tick counter so that calling update() once
    // here triggers exactly one step. InvaderGrid.update() advances _tickCount
    // and only steps when _tickCount >= STEP_INTERVAL (30). We force it by
    // setting _tickCount to STEP_INTERVAL - 1 before calling update().
    invaderGrid._tickCount = 29; // 30 - 1; next update() call will step
    invaderGrid.update();
  } else {
    // Advance tick count without stepping (so InvaderGrid internal counter
    // does not accidentally fire on its own 30-tick schedule).
    // We cap at 28 so InvaderGrid's internal check (>= 30) never triggers.
    if (invaderGrid._tickCount < 28) {
      invaderGrid._tickCount++;
    }
  }

  // --- Collision pass (MUST run before draw) ---
  collide(player, invaderGrid, explosions, hudState);

  // --- Explosion tick ---
  explosions.tick();

  // --- Win condition: all invaders destroyed ---
  if (invaderGrid.liveInvaders().length === 0) {
    levelCleared = true;
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    transitionTo('level2');
    return;
  }

  // --- Lose condition: formation bottom reaches player row ---
  const bottomY = formationBottomY();
  if (bottomY >= PLAYER_ROW_Y) {
    // Decrement life
    player.lives--;
    hudState.lives = player.lives;

    if (hudState.lives <= 0) {
      // No lives left — game over
      if (hudState.score > hudState.hiScore) {
        hudState.hiScore = hudState.score;
      }
      transitionTo('gameover');
      return;
    }

    // Restart: reset formation, keep score and remaining lives
    const savedScore = hudState.score;
    const savedLives = hudState.lives;
    resetFormation();
    hudState.score = savedScore;
    hudState.lives = savedLives;
    // Sync player lives with hudState
    player.lives = savedLives;
  }
}

/**
 * Render Level 1 entities.
 * Draw order: invader formation, explosions, player ship.
 * The HUD is drawn by game.js before this is called.
 * @param {CanvasRenderingContext2D} ctx
 */
export function renderLevel1(ctx) {
  invaderGrid.draw(ctx);
  explosions.draw(ctx);
  player.draw(ctx);
}

/**
 * Expose the player instance so game.js can pass it to collision etc. if needed.
 * Level1 owns the player but game.js may need a reference.
 */
export function getLevel1Player() {
  return player;
}
