// invaders.js — Invader grid: state, movement, drawing
//
// Public API
//   initInvaders()          — reset grid to full 55-invader starting layout
//   updateInvaders(dt)      — tick explosion visual timers only (called every frame)
//   stepFormation()         — advance the formation by one march step (called by level1.js
//                             on the interval timer)
//   drawInvaders(ctx)       — render living invaders + explosion flashes
//   getInvaders()           — return reference to the invaders array (for collision.js)
//   getLivingCount()        — return the number of currently alive invaders
//   triggerExplosion(inv)   — add an explosion flash at the invader's position

import {
  CANVAS_WIDTH,
  INVADER_COLS,
  INVADER_ROWS,
  INVADER_WIDTH,
  INVADER_HEIGHT,
  INVADER_H_GAP,
  INVADER_V_GAP,
  INVADER_STEP_X,
  INVADER_DROP_Y,
  INVADER_TOP_MARGIN,
  EXPLOSION_DURATION,
} from './gameConfig.js';

// ---------------------------------------------------------------------------
// Grid state
// ---------------------------------------------------------------------------

/** Each invader: { col, row, x, y, alive } */
let invaders   = [];

/** Active explosion effects: [{ x, y, timeLeft }] */
let explosions = [];

// Shared cumulative formation offset (all invaders translate by this amount)
let formationX = 0;
let formationY = 0;

// Current horizontal direction: +1 = right, -1 = left
let directionX = 1;

// ---------------------------------------------------------------------------
// Helpers — base (initial) positions before offset is applied
// ---------------------------------------------------------------------------
const CELL_W = INVADER_WIDTH  + INVADER_H_GAP; // 36 + 12 = 48 px
const CELL_H = INVADER_HEIGHT + INVADER_V_GAP; // 24 + 16 = 40 px

function baseX(col) {
  const formationWidth = INVADER_COLS * CELL_W - INVADER_H_GAP;
  const startX = (CANVAS_WIDTH - formationWidth) / 2;
  return startX + col * CELL_W;
}

function baseY(row) {
  return INVADER_TOP_MARGIN + row * CELL_H;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * (Re-)initialise the invader grid. Call at game start / level reset.
 */
export function initInvaders() {
  invaders   = [];
  explosions = [];
  formationX = 0;
  formationY = 0;
  directionX = 1;

  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let col = 0; col < INVADER_COLS; col++) {
      invaders.push({
        col,
        row,
        x: baseX(col),
        y: baseY(row),
        alive: true,
      });
    }
  }
}

/**
 * Tick explosion visual timers. Called every fixed-timestep frame.
 * Does NOT move the formation — formation stepping is done by stepFormation().
 *
 * @param {number} dt - Delta time in milliseconds
 */
export function updateInvaders(dt) {
  for (const exp of explosions) {
    exp.timeLeft -= dt;
  }
  explosions = explosions.filter(exp => exp.timeLeft > 0);
}

/**
 * Advance the formation by exactly one march step.
 * Called by level1.js when the interval-based step timer elapses.
 *
 * Edge detection: when the leading edge of the formation reaches a canvas
 * boundary, the formation drops INVADER_DROP_Y px and reverses direction
 * instead of translating horizontally.
 */
export function stepFormation() {
  const livingInvaders = invaders.filter(inv => inv.alive);
  if (livingInvaders.length === 0) return;

  const step = INVADER_STEP_X * directionX;
  let hitEdge = false;

  if (directionX === 1) {
    // Moving right — check rightmost edge of rightmost living invader
    const maxRight = Math.max(...livingInvaders.map(inv => inv.x + INVADER_WIDTH));
    if (maxRight + step >= CANVAS_WIDTH) {
      hitEdge = true;
    }
  } else {
    // Moving left — check leftmost edge of leftmost living invader
    const minLeft = Math.min(...livingInvaders.map(inv => inv.x));
    if (minLeft + step <= 0) {
      hitEdge = true;
    }
  }

  if (hitEdge) {
    // Drop and reverse
    formationY += INVADER_DROP_Y;
    directionX  = -directionX;
  } else {
    formationX += step;
  }

  // Apply cumulative offset to every invader (alive or dead, so dead ones
  // remain position-accurate for any future reference, though they aren't drawn)
  for (const inv of invaders) {
    inv.x = baseX(inv.col) + formationX;
    inv.y = baseY(inv.row) + formationY;
  }
}

/**
 * Draw all living invaders and active explosion effects.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawInvaders(ctx) {
  // Living invaders
  ctx.fillStyle = '#0cf';
  for (const inv of invaders) {
    if (!inv.alive) continue;
    ctx.fillRect(
      Math.round(inv.x),
      Math.round(inv.y),
      INVADER_WIDTH,
      INVADER_HEIGHT
    );
  }

  // Explosion flashes
  for (const exp of explosions) {
    if (exp.timeLeft <= 0) continue;
    ctx.fillStyle = '#ff0';
    ctx.fillRect(
      Math.round(exp.x),
      Math.round(exp.y),
      INVADER_WIDTH,
      INVADER_HEIGHT
    );
    ctx.strokeStyle = '#f80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.round(exp.x),                 Math.round(exp.y));
    ctx.lineTo(Math.round(exp.x + INVADER_WIDTH), Math.round(exp.y + INVADER_HEIGHT));
    ctx.moveTo(Math.round(exp.x + INVADER_WIDTH), Math.round(exp.y));
    ctx.lineTo(Math.round(exp.x),                 Math.round(exp.y + INVADER_HEIGHT));
    ctx.stroke();
  }
}

/**
 * Return a reference to the internal invaders array.
 * Used by collision.js to iterate living invaders.
 * @returns {Array<{col:number, row:number, x:number, y:number, alive:boolean}>}
 */
export function getInvaders() {
  return invaders;
}

/**
 * Return the count of currently alive invaders.
 * @returns {number}
 */
export function getLivingCount() {
  return invaders.filter(inv => inv.alive).length;
}

/**
 * Trigger an explosion visual at the given invader's position.
 * Called by collision.js after marking the invader dead.
 * @param {{ x: number, y: number }} invader
 */
export function triggerExplosion(invader) {
  explosions.push({
    x:        invader.x,
    y:        invader.y,
    timeLeft: EXPLOSION_DURATION,
  });
}
