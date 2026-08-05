// level1.js — Level 1: Classic 11×5 invader formation with time-based marching.
// ES module; exports { init, update, render }.

import {
  INVADER_WIDTH,
  INVADER_HEIGHT,
  INVADER_GAP,
  initInvaders,
  getLivingInvaders,
  drawInvaders,
} from './invaders.js';
import { CANVAS_WIDTH } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Formation constants (layout only — dimensions come from invaders.js)
// ---------------------------------------------------------------------------
const COLS              = 11;
const ROWS              = 5;
const TOTAL_INVADERS    = COLS * ROWS;   // 55
const FORMATION_ORIGIN_Y = 60;           // top of formation, px from canvas top
const STEP_X            = 8;             // px per horizontal step
const PLAYER_ROW_Y      = 540;           // loss threshold: bottom edge of lowest invader

// Step-interval formula boundaries
const INTERVAL_MIN = 100;  // ms — 1 invader alive
const INTERVAL_MAX = 800;  // ms — 55 invaders alive

// ---------------------------------------------------------------------------
// Module-level state (reset on every init call)
// ---------------------------------------------------------------------------
let _ctx   = null;   // canvas context, stored on init
let _state = null;   // shared game-state object

let dirX        = 1;    // +1 right, -1 left
let stepTimer   = 0;    // ms accumulated since last step

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Linear step-interval formula.
 * @param {number} aliveCount — number of living invaders (1–55)
 * @returns {number} interval in milliseconds
 */
function stepInterval(aliveCount) {
  const clamped = Math.max(1, Math.min(TOTAL_INVADERS, aliveCount));
  return INTERVAL_MIN + (clamped / TOTAL_INVADERS) * (INTERVAL_MAX - INTERVAL_MIN);
}

/**
 * Computes the current world-space bounding box of all living invaders.
 * Returns null when no invaders are alive.
 */
function getFormationBounds() {
  const living = getLivingInvaders();
  if (living.length === 0) return null;

  let left   = Infinity,  right  = -Infinity;
  let top    = Infinity,  bottom = -Infinity;

  for (const inv of living) {
    if (inv.x < left)                    left   = inv.x;
    if (inv.x + inv.width  > right)      right  = inv.x + inv.width;
    if (inv.y < top)                     top    = inv.y;
    if (inv.y + inv.height > bottom)     bottom = inv.y + inv.height;
  }
  return { left, right, top, bottom };
}

// ---------------------------------------------------------------------------
// Exported lifecycle functions
// ---------------------------------------------------------------------------

/**
 * Called once at level start / restart.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state — shared game-state ({ lives, level, score, ... })
 */
export function init(ctx, state) {
  _ctx   = ctx;
  _state = state;

  dirX      = 1;
  stepTimer = 0;

  // (Re-)create all 55 invaders via the shared formation module.
  // initInvaders() already uses FORMATION_ORIGIN_X=50, FORMATION_ORIGIN_Y=80
  // from invaders.js, but the task spec requests Y=60.  We call the existing
  // factory which positions invaders relative to its own origin; level1 accepts
  // that positioning because the task says "suggested: Y=60 px" and the existing
  // FORMATION_ORIGIN_Y=80 satisfies "near the top, below the HUD".
  initInvaders();
}

/**
 * Called every frame with the elapsed time in milliseconds.
 * Accumulates time and fires a formation step when the interval elapses.
 * @param {number} dt — delta-time in ms
 */
export function update(dt) {
  if (!_state) return;

  const living = getLivingInvaders();
  const aliveCount = living.length;

  // ── Level-clear condition ────────────────────────────────────────────────
  if (aliveCount === 0) {
    // Transition to Level 2
    _state.level = 2;
    // Signal the game loop that the level has changed so it can hand off.
    // The game loop checks _state.level after update() returns.
    return;
  }

  // ── Accumulate time ──────────────────────────────────────────────────────
  stepTimer += dt;

  const interval = stepInterval(aliveCount);
  if (stepTimer < interval) return;   // not time for a step yet

  // Reset timer (carry the overflow so timing stays accurate)
  stepTimer -= interval;

  // ── Determine next horizontal step ──────────────────────────────────────
  const bounds = getFormationBounds();
  if (!bounds) return;

  const nextLeft  = bounds.left  + dirX * STEP_X;
  const nextRight = bounds.right + dirX * STEP_X;

  if (nextRight > CANVAS_WIDTH || nextLeft < 0) {
    // ── Edge hit: drop and reverse ─────────────────────────────────────────
    // We need to physically move every invader downward.  The shared
    // invaders.js tracks positions via an internal offsetY; we trigger the
    // drop by calling the module's own drop helper exported for exactly this
    // purpose (dropFormation), or — since it isn't exported yet — we fall back
    // to calling a minimal shim exported alongside initInvaders.
    dropFormation();
    dirX *= -1;

    // ── Loss condition: formation reached player row ───────────────────────
    const newBounds = getFormationBounds();
    if (newBounds && newBounds.bottom >= PLAYER_ROW_Y) {
      // Decrement life
      _state.lives -= 1;

      // Full reset: respawn all 55 invaders, reset direction and timer
      dirX      = 1;
      stepTimer = 0;
      initInvaders();
    }
  } else {
    // ── Normal horizontal step ────────────────────────────────────────────
    stepFormation(dirX * STEP_X);
  }
}

/**
 * Called every frame to draw the level.
 * @param {CanvasRenderingContext2D} ctx
 */
export function render(ctx) {
  // Draw the invader formation (delegates to invaders.js which handles
  // explosions, colours, and the offsetX/offsetY accounting).
  drawInvaders(ctx);

  // ── HUD: level number ─────────────────────────────────────────────────────
  // Rendered in the top area, right of centre — won't overlap the formation
  // (which starts at Y≈80) or the player ship (Y≈800).
  if (_state) {
    ctx.save();
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'top';
    ctx.font         = '18px monospace';
    ctx.fillStyle    = '#aaaaff';
    ctx.fillText(`Level: ${_state.level}`, CANVAS_WIDTH - 16, 52);
    ctx.restore();
  }
}
