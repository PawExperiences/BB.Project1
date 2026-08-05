// level1.js — Level 1: The Classic Grid
// Exports: startLevel1(), updateLevel1(dt, player)
//
// Responsibilities:
//   - Initialise / reset the 11×5 invader formation
//   - Drive the interval-based formation stepping with live-count speed scaling
//   - Detect and report the lose condition (invaders reach the player)
//
// The win condition (all 55 destroyed → startLevel(2)) and life management
// are handled by game.js after the collision pass.

import { initInvaders, updateInvaders, stepFormation, getLivingCount, getInvaders } from './invaders.js';

// ---------------------------------------------------------------------------
// Step accumulator
// ---------------------------------------------------------------------------
let stepAccumulator = 0; // ms elapsed since the last formation step

// ---------------------------------------------------------------------------
// Speed-scaling formula
// ---------------------------------------------------------------------------

/**
 * Returns the march-step interval in ms for the given living invader count.
 * Formula: 100 + (aliveCount − 1) × (700 / 54)   clamped to [100, 800].
 * @param {number} aliveCount
 * @returns {number}
 */
function getStepInterval(aliveCount) {
  if (aliveCount <= 0) return 100;
  const raw = 100 + (aliveCount - 1) * (700 / 54);
  return Math.min(800, Math.max(100, raw));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise (or reset) Level 1.
 * Resets the formation to full 55-invader layout at the starting position.
 * Does NOT touch hudState.score, hudState.hiScore, or hudState.lives —
 * those are managed exclusively by game.js.
 */
export function startLevel1() {
  initInvaders();
  stepAccumulator = 0;
}

/**
 * Per-tick Level 1 update. Called by game.js once per fixed-timestep step
 * while the PLAYING scene is active.
 *
 * Order of operations:
 *   1. Tick explosion visual timers (delegates to updateInvaders).
 *   2. Recompute step interval from current living count.
 *   3. Advance accumulator; fire stepFormation() when the interval is reached.
 *   4. Check lose condition: any invader top-edge ≥ player top-edge.
 *
 * The WIN condition (living count drops to 0) is checked by game.js AFTER
 * the collision pass, so it is NOT checked here.
 *
 * @param {number} dt                   - Fixed step in ms (~16.67 ms)
 * @param {{ y: number, height: number }} player - Player ship (read-only)
 * @returns {'lose' | null}             - 'lose' triggers life loss in game.js
 */
export function updateLevel1(dt, player) {
  // 1. Tick explosion timers
  updateInvaders(dt);

  const alive = getLivingCount();
  if (alive === 0) {
    // No invaders left — win is detected by game.js after the collision pass.
    return null;
  }

  // 2 & 3. Accumulate time; step when interval elapses.
  //        Interval is re-evaluated each tick so invader deaths take
  //        effect immediately (acceptance criterion).
  stepAccumulator += dt;
  const interval = getStepInterval(alive);
  if (stepAccumulator >= interval) {
    stepAccumulator -= interval;
    stepFormation();
  }

  // 4. Lose condition
  const playerTopY  = player.y;
  const livingList  = getInvaders().filter(inv => inv.alive);
  for (const inv of livingList) {
    if (inv.y >= playerTopY) {
      return 'lose';
    }
  }

  return null;
}
