// level1.js — Level 1: The Classic Grid
// Card: "Level 1: the classic grid"
//
// ES module exporting { init, update, render } lifecycle hooks.
// Formation data and sprite dimensions are imported from invaders.js.
// Movement uses discrete timed steps with interval scaling.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import {
  invaders,
  stepFormation,
  dropFormation,
  INV_W,
  INV_H,
  CELL_H,
  COLS,
  ROWS,
} from './invaders.js';

// ─── Step size ────────────────────────────────────────────────────────────────
// Each discrete horizontal step moves the formation by one cell-stride unit.
// Classic Space Invaders moves the formation by small fixed increments;
// we use INV_W / 4 (8 px) as a reasonable step unit that scales visually.
const STEP_PX = 8; // pixels per discrete step

// ─── Movement state ───────────────────────────────────────────────────────────
let direction    = 1;      // +1 = right, -1 = left
let stepTimer    = 0;      // seconds accumulated since last step
let levelNumber  = 1;      // for HUD label (always 1 in this module)

// ─── Interval formula ────────────────────────────────────────────────────────
/**
 * Compute the step interval in SECONDS for the current alive count.
 * Formula: interval_ms = 100 + (aliveFraction * 700)
 *   where aliveFraction = (alive - 1) / 54
 * Clamped so 1 alive → 100 ms, 55 alive → 800 ms.
 *
 * @param {number} aliveCount
 * @returns {number} interval in seconds
 */
function stepInterval(aliveCount) {
  const clamped = Math.max(1, Math.min(55, aliveCount));
  const aliveFraction = (clamped - 1) / 54;
  return (100 + aliveFraction * 700) / 1000; // convert ms → seconds
}

// ─── Lifecycle — init ─────────────────────────────────────────────────────────
/**
 * Called when Level 1 starts or restarts.
 * Resets movement state only; formation data is owned by invaders.js
 * (game.js calls resetFormation() when starting a new game).
 *
 * @param {object} gameState  shared mutable state { lives, level, score, ... }
 */
function init(gameState) {
  direction = 1;
  stepTimer = 0;
  // Store reference for update/render to use
  level1.gameState = gameState;
}

// ─── Lifecycle — update ───────────────────────────────────────────────────────
/**
 * Advance level logic for one fixed-timestep tick.
 *
 * @param {number} dt         seconds since last tick
 * @param {object} gameState  shared mutable state { lives, level, score, ... }
 */
function update(dt, gameState) {
  const alive = invaders.filter(i => i.alive);
  const aliveCount = alive.length;

  // ── Win condition: all invaders cleared ────────────────────────────────────
  if (aliveCount === 0) {
    gameState.level = 2;
    return;
  }

  // ── Lose condition: formation reached player row ───────────────────────────
  // Find the maximum y of the bottom of the lowest living invader row.
  let maxBottomY = 0;
  for (const inv of alive) {
    const bottom = inv.y + inv.height;
    if (bottom > maxBottomY) maxBottomY = bottom;
  }

  // Player row y is stored in gameState.playerY (set by game.js).
  // Fall back to a fixed row near the bottom if not provided.
  const playerRowY = (gameState.playerY !== undefined)
    ? gameState.playerY
    : CANVAS_HEIGHT - 80;

  if (maxBottomY >= playerRowY) {
    gameState.lives -= 1;
    init(gameState);
    return;
  }

  // ── Discrete step movement ─────────────────────────────────────────────────
  stepTimer += dt;
  const interval = stepInterval(aliveCount);

  if (stepTimer >= interval) {
    stepTimer -= interval;

    // Compute proposed new leading edge after the step.
    // Leading edge depends on direction:
    //   rightward → rightmost x + width
    //   leftward  → leftmost x
    let leadingEdge;
    if (direction > 0) {
      leadingEdge = Math.max(...alive.map(i => i.x + i.width));
    } else {
      leadingEdge = Math.min(...alive.map(i => i.x));
    }

    const proposedEdge = leadingEdge + direction * STEP_PX;

    if (direction > 0 && proposedEdge > CANVAS_WIDTH) {
      // Would breach right edge — drop and reverse
      dropFormation();
      direction = -1;
    } else if (direction < 0 && proposedEdge < 0) {
      // Would breach left edge — drop and reverse
      dropFormation();
      direction = 1;
    } else {
      // Normal step
      stepFormation(direction * STEP_PX);
    }
  }
}

// ─── Lifecycle — render ───────────────────────────────────────────────────────
/**
 * Draw level-specific HUD elements (level number label).
 * Draws AFTER the main HUD so it does not overwrite score/lives.
 * Positioning: bottom-centre of the HUD row, or a dedicated spot.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} gameState  shared mutable state
 */
function render(ctx, gameState) {
  // Draw level label at top-centre, below the hi-score line,
  // so it does not overwrite score (top-left) or lives (top-right) or hi (top-centre).
  // We place it just below the first HUD row (padding=16, font=20px → row bottom ~36px).
  const padding = 16;
  const hudRowHeight = 20; // font size used in renderHUD
  const levelY = padding + hudRowHeight + 8; // 44 px from top

  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = '16px monospace';
  ctx.fillStyle    = '#aaffaa';
  ctx.fillText('LEVEL ' + levelNumber, CANVAS_WIDTH / 2, levelY);
  ctx.restore();
}

// ─── Module export ────────────────────────────────────────────────────────────
const level1 = { init, update, render };
export default level1;
