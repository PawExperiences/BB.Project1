// level1.js — Level 1: the classic invader grid
// Owned by card: "Level 1: the classic grid"

import {
  initInvaders,
  updateInvaders,
  invaders,
  INVADER_HEIGHT,
  INVADER_ROWS,
  INVADER_COLS,
} from './invaders.js';
import { hudState } from './game.js';
import { CANVAS_HEIGHT } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOTAL_INVADERS   = INVADER_ROWS * INVADER_COLS;  // 55
const INTERVAL_MAX_MS  = 800;   // ms when all 55 alive
const INTERVAL_MIN_MS  = 100;   // ms when 1 alive

// The player ship's top-edge Y — matches Player constructor in player.js
const PLAYER_ROW_Y = CANVAS_HEIGHT - 60;

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------
let _hud         = null;   // hud object passed into start()
let _marchTimer  = null;   // setTimeout handle
let _running     = false;
let _aliveCount  = 0;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Calculate the step interval in ms for the current alive count. */
function stepInterval(aliveCount) {
  return INTERVAL_MIN_MS + (aliveCount / TOTAL_INVADERS) * (INTERVAL_MAX_MS - INTERVAL_MIN_MS);
}

/** Count live invaders. */
function countAlive() {
  let n = 0;
  for (const inv of invaders) {
    if (inv.alive) n++;
  }
  return n;
}

/**
 * Find the bottommost Y of any live invader (bottom edge of its bounding box).
 * Returns -Infinity if no invaders alive.
 */
function bottomMostY() {
  let maxY = -Infinity;
  for (const inv of invaders) {
    if (!inv.alive) continue;
    const bottom = inv.y + INVADER_HEIGHT;
    if (bottom > maxY) maxY = bottom;
  }
  return maxY;
}

// ---------------------------------------------------------------------------
// March step — called on each timer tick
// ---------------------------------------------------------------------------
function marchStep() {
  if (!_running) return;

  // Re-read aliveCount (may have changed between ticks due to player kills)
  _aliveCount = countAlive();

  // --- Level clear ---
  if (_aliveCount === 0) {
    _running = false;
    window.dispatchEvent(new CustomEvent('levelComplete', { detail: { nextLevel: 2 } }));
    return;
  }

  // --- Breach check ---
  if (bottomMostY() >= PLAYER_ROW_Y) {
    // Deduct one life via the shared hudState
    hudState.lives -= 1;
    // Restart the level (reset formation to start, do NOT check for game-over here)
    _restart();
    return;
  }

  // --- Schedule next step with CURRENT interval ---
  // (Interval recalculates now, reflecting any invaders killed since last tick)
  const interval = stepInterval(_aliveCount);
  _marchTimer = setTimeout(marchStep, interval);
}

// ---------------------------------------------------------------------------
// Internal restart — resets formation, keeps running
// ---------------------------------------------------------------------------
function _restart() {
  // Cancel any pending timer
  if (_marchTimer !== null) {
    clearTimeout(_marchTimer);
    _marchTimer = null;
  }

  // Reset invader formation to starting position and direction
  initInvaders();
  _aliveCount = TOTAL_INVADERS;

  // Update HUD level indicator
  if (_hud && typeof _hud.set === 'function') {
    _hud.set('level', 1);
  }

  // Schedule first march step
  const interval = stepInterval(_aliveCount);
  _marchTimer = setTimeout(marchStep, interval);
}

// ---------------------------------------------------------------------------
// notifyKill()
// Called by game.js each time the player destroys an invader, so the
// interval recalculates immediately rather than waiting for the next tick.
// game.js cancels the pending timer and calls marchStep() right away via
// this indirection, OR we can simply re-schedule from here.
//
// Implementation: we reschedule from the moment of the kill with the new
// (shorter) interval.  The pending setTimeout will fire but _running check
// inside marchStep guards against double-advancing.
// ---------------------------------------------------------------------------
export function notifyKill() {
  if (!_running) return;

  // Cancel the currently pending march tick
  if (_marchTimer !== null) {
    clearTimeout(_marchTimer);
    _marchTimer = null;
  }

  // Decrement live count immediately
  _aliveCount = countAlive();

  if (_aliveCount === 0) {
    // Level cleared on this kill
    _running = false;
    window.dispatchEvent(new CustomEvent('levelComplete', { detail: { nextLevel: 2 } }));
    return;
  }

  // Reschedule with the new (faster) interval
  const interval = stepInterval(_aliveCount);
  _marchTimer = setTimeout(marchStep, interval);
}

// ---------------------------------------------------------------------------
// stop() — halt the march loop (called by game.js on scene change)
// ---------------------------------------------------------------------------
export function stop() {
  _running = false;
  if (_marchTimer !== null) {
    clearTimeout(_marchTimer);
    _marchTimer = null;
  }
}

// ---------------------------------------------------------------------------
// start(ctx, hud)
// Entry point called by game.js when the 'playing' scene begins.
// ctx  — CanvasRenderingContext2D (not used directly here; invaders.js owns draw)
// hud  — object with set(key, value) method
// ---------------------------------------------------------------------------
export function start(ctx, hud) {
  // Stop any previously running instance
  stop();

  _hud     = hud;
  _running = true;

  // Announce level in HUD
  if (_hud && typeof _hud.set === 'function') {
    _hud.set('level', 1);
  }

  // initInvaders() is called by game.js transitionTo('playing') already,
  // but we call it here too to own the reset contract.
  initInvaders();
  _aliveCount = TOTAL_INVADERS;

  // Kick off the march
  const interval = stepInterval(_aliveCount);
  _marchTimer = setTimeout(marchStep, interval);
}
