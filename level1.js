// level1.js — Level 1: The Classic Grid
// ES module. Registers itself with the game loop via registerLevel().

import { registerLevel, transitionTo, hudState, player } from './game.js';
import { checkHit } from './collision.js';
import { INVADER_HEIGHT } from './invaders.js';
import { CANVAS_WIDTH } from './gameConfig.js';
import { triggerExplosion } from './explosion.js';

// ---------------------------------------------------------------------------
// Formation constants
// ---------------------------------------------------------------------------
const COLS = 11;
const ROWS = 5;
const TOTAL_INVADERS = COLS * ROWS; // 55

const INVADER_WIDTH = 30;
const H_GAP = 10;
const V_GAP = 10;

// Formation total width: 11*30 + 10*10 = 430
const FORMATION_WIDTH = COLS * INVADER_WIDTH + (COLS - 1) * H_GAP; // 430

// Top-left origin so the grid is centred horizontally, near the top
const FORMATION_START_X = Math.round((CANVAS_WIDTH - FORMATION_WIDTH) / 2); // 169
const FORMATION_START_Y = 80;

// Step-interval anchors (milliseconds)
// ~800 ms when 55 invaders remain, ~100 ms when 1 remains
const INTERVAL_MAX_MS = 800; // at 55 invaders
const INTERVAL_MIN_MS = 100; // at 1 invader

// ---------------------------------------------------------------------------
// Formation state
// ---------------------------------------------------------------------------
let invaders = [];
let directionX = 1;        // +1 = right, -1 = left
let formationOffsetX = 0;
let formationOffsetY = 0;
let stepTimer = 0;         // accumulates ms since last step
let transitionFired = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate step interval (ms) based on current live count.
 * Interpolates linearly between (55, 800ms) and (1, 100ms).
 */
function calcStepInterval(liveCount) {
  // Clamp to valid range
  const n = Math.max(1, Math.min(TOTAL_INVADERS, liveCount));
  // Linear interpolation:
  //   n=55 -> 800ms, n=1 -> 100ms
  //   t = (n - 1) / (55 - 1)  [0..1]
  //   interval = MIN + t * (MAX - MIN)
  const t = (n - 1) / (TOTAL_INVADERS - 1);
  return INTERVAL_MIN_MS + t * (INTERVAL_MAX_MS - INTERVAL_MIN_MS);
}

/**
 * Build the 55-invader grid at initial positions.
 */
function buildFormation() {
  invaders = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const baseX = FORMATION_START_X + col * (INVADER_WIDTH + H_GAP);
      const baseY = FORMATION_START_Y + row * (INVADER_HEIGHT + V_GAP);
      invaders.push({
        col,
        row,
        alive: true,
        baseX,
        baseY,
        x: baseX,
        y: baseY,
        width: INVADER_WIDTH,
        height: INVADER_HEIGHT,
      });
    }
  }
}

/**
 * Reset the level to its initial state (called on life-loss restart).
 */
function resetLevel() {
  directionX = 1;
  formationOffsetX = 0;
  formationOffsetY = 0;
  stepTimer = 0;
  transitionFired = false;
  buildFormation();
  // Ensure HUD level number is correct after restart
  hudState.level = 1;
}

/**
 * Advance the formation by one step:
 * - detect edge contact -> drop + reverse
 * - otherwise move horizontally
 */
function stepFormation() {
  const alive = invaders.filter(inv => inv.alive);
  if (alive.length === 0) return;

  // Current leading edges
  let minX = Infinity;
  let maxX = -Infinity;
  for (const inv of alive) {
    if (inv.x < minX) minX = inv.x;
    if (inv.x + INVADER_WIDTH > maxX) maxX = inv.x + INVADER_WIDTH;
  }

  // How far we'd move this step (1 px per step in original; scale by direction)
  // Using 8px per step to feel more like real Space Invaders at these intervals
  const STEP_PX = 8;

  const nextMinX = minX + directionX * STEP_PX;
  const nextMaxX = maxX + directionX * STEP_PX;

  if (nextMinX < 0 || nextMaxX > CANVAS_WIDTH) {
    // Edge contact — reverse and drop by INVADER_HEIGHT
    directionX *= -1;
    formationOffsetY += INVADER_HEIGHT;
  } else {
    formationOffsetX += directionX * STEP_PX;
  }

  // Apply accumulated offsets to every invader
  for (const inv of invaders) {
    inv.x = inv.baseX + formationOffsetX;
    inv.y = inv.baseY + formationOffsetY;
  }
}

// ---------------------------------------------------------------------------
// update(dt) — called every fixed-timestep tick by the game loop
// dt is in seconds
// ---------------------------------------------------------------------------
function update(dt) {
  const dtMs = dt * 1000;

  const alive = invaders.filter(inv => inv.alive);
  const liveCount = alive.length;

  // Win condition — all invaders destroyed
  if (liveCount === 0 && !transitionFired) {
    transitionFired = true;
    transitionTo('level2');
    return;
  }

  // Accumulate time and step when interval elapses
  stepTimer += dtMs;
  const interval = calcStepInterval(liveCount);
  if (stepTimer >= interval) {
    stepTimer -= interval;
    stepFormation();
  }

  // -------------------------------------------------------------------------
  // Collision: player bullet vs each live invader
  // -------------------------------------------------------------------------
  // We import `player` as a live binding — re-read it each frame
  // because game.js exports it as a let binding.
  // NOTE: ES module live bindings mean `player` here reflects the current
  // value of the exported `player` variable in game.js.
  const currentPlayer = player;
  if (currentPlayer) {
    const bullet = currentPlayer.getBullet();
    if (bullet) {
      for (const inv of invaders) {
        if (!inv.alive) continue;
        const invaderRect = { x: inv.x, y: inv.y, width: inv.width, height: inv.height };
        if (checkHit(invaderRect, bullet)) {
          inv.alive = false;
          currentPlayer.clearBullet();
          triggerExplosion(inv.x, inv.y);
          hudState.score += 10;
          // Step interval recalculates automatically next frame from live count
          break; // bullet consumed
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Loss condition: any invader's bottom edge >= player's top-edge Y
  // -------------------------------------------------------------------------
  if (currentPlayer) {
    // Player top-edge Y read live each frame
    const playerTopY = currentPlayer.y;
    for (const inv of alive) {
      const invaderBottom = inv.y + inv.height;
      if (invaderBottom >= playerTopY) {
        // Player loses a life
        currentPlayer.lives -= 1;
        hudState.lives = currentPlayer.lives;
        // Restart the level (reset formation, not full game)
        resetLevel();
        return;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// render(ctx) — called every animation frame by the game loop
// ---------------------------------------------------------------------------
function render(ctx) {
  ctx.fillStyle = '#00FF00';
  for (const inv of invaders) {
    if (inv.alive) {
      ctx.fillRect(Math.round(inv.x), Math.round(inv.y), INVADER_WIDTH, INVADER_HEIGHT);
    }
  }
}

// ---------------------------------------------------------------------------
// Initialise and register with the game loop
// ---------------------------------------------------------------------------
resetLevel();
registerLevel({ update, render });
