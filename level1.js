/**
 * level1.js — Level 1: the classic 11×5 invader grid.
 * ES module; file:// compatible — no fetch, no bundler, no npm.
 *
 * Exports:
 *   LEVEL_NUMBER                  — constant 1, read by game.js for the HUD
 *   initLevel1(player, callbacks) — (re)initialise formation and state
 *   updateLevel1(dt)              — call each fixed-timestep frame
 *
 * Drop distance on each edge-hit = INVADER_DROP from invaders.js
 * (INVADER_HEIGHT + INVADER_V_GAP = 24 px), applied inside stepInvaders().
 */

import {
  initInvaders,
  stepInvaders,
  getAliveCount,
  getFormationBottom,
} from './invaders.js';

// ---------------------------------------------------------------------------
// Public constant
// ---------------------------------------------------------------------------

/** Level number — exported for the HUD label in game.js. */
export const LEVEL_NUMBER = 1;

// ---------------------------------------------------------------------------
// Private constants
// ---------------------------------------------------------------------------

/** Total invaders in a fresh 11 × 5 formation. */
const TOTAL_INVADERS = 55;

/**
 * Pixels the formation moves horizontally per step.
 * 8 px gives a clearly visible march at the intervals this level uses.
 */
const STEP_PX = 8;

// ---------------------------------------------------------------------------
// Private state (all reset by initLevel1)
// ---------------------------------------------------------------------------

let _player          = null;  // Player instance — .y is the breach threshold
let _onPlayerReached = null;  // () => void
let _onLevelComplete = null;  // (nextLevel: number) => void

let stepTimer   = 0;      // seconds since the last formation step
let levelDone   = false;  // true after onLevelComplete has been called
let breachFired = false;  // true after onPlayerReached has fired for this descent

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * (Re)initialise Level 1.
 *
 * Resets the invader formation to a fresh 11×5 grid and clears all
 * internal timers and flags.  Must be called both on first level start
 * and on restart after the game loop grants a new life.
 *
 * @param {object} player
 *   The Player instance.  player.y is used as the breach Y threshold.
 * @param {object} callbacks
 * @param {Function} callbacks.onPlayerReached
 *   Invoked exactly once per breach event when formationBottom >= player.y.
 *   MUST NOT modify lives or restart the level itself.
 * @param {Function} callbacks.onLevelComplete
 *   Invoked with argument 2 when all 55 invaders are destroyed.
 */
export function initLevel1(player, { onPlayerReached, onLevelComplete }) {
  _player          = player;
  _onPlayerReached = onPlayerReached;
  _onLevelComplete = onLevelComplete;

  stepTimer   = 0;
  levelDone   = false;
  breachFired = false;

  initInvaders();
}

/**
 * Update Level 1 logic for one fixed-timestep frame.
 *
 * Advances the step timer, fires formation steps at the scaled interval,
 * and checks for level-complete and player-breach events.
 *
 * @param {number} dt  Fixed timestep in seconds (typically 1/60).
 */
export function updateLevel1(dt) {
  if (levelDone) return;

  const alive = getAliveCount();

  // ── Level-complete ──────────────────────────────────────────────────────
  if (alive === 0) {
    levelDone = true;
    _onLevelComplete(2);
    return;  // stop all further logic this frame
  }

  // ── Step-interval scaling ────────────────────────────────────────────────
  //
  //   interval (ms) = 100 + (aliveCount / 55) × 700
  //
  //   55 alive → 800 ms   (spec target 800 ± 50)  ✓
  //    1 alive → 112.7 ms (spec target 100 ± 50)  ✓
  //   28 alive → 456.4 ms (spec target 450 ± 75)  ✓
  //
  const intervalMs = 100 + (alive / TOTAL_INVADERS) * 700;
  const intervalS  = intervalMs / 1000;

  stepTimer += dt;
  if (stepTimer >= intervalS) {
    stepTimer -= intervalS;   // carry remainder forward — prevents accumulated drift
    stepInvaders(STEP_PX);    // edge-detection + INVADER_DROP descent handled internally
  }

  // ── Breach detection ─────────────────────────────────────────────────────
  //
  // Fire exactly once per breach event.  breachFired is reset to false by
  // initLevel1(), so a game-loop restart re-arms detection for the new formation.
  //
  if (!breachFired && _player !== null) {
    const bottom = getFormationBottom();
    if (bottom >= _player.y) {
      breachFired = true;
      _onPlayerReached();
      // If the callback calls initLevel1() (new life), breachFired is reset
      // inside initLevel1() immediately — correct behaviour for the new wave.
    }
  }
}
