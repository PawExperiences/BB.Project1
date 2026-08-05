/**
 * level3.js — Level 3: Shields and Formations.
 * ES module; file:// compatible — no fetch, no bundler, no npm.
 *
 * Exports:
 *   start(canvas, ctx, onComplete) — initialises and begins Level 3.
 *
 * Mechanics:
 *   - 5 rows × 11 columns invader grid (standard sweep).
 *   - Four destructible shield bunkers at ~80% canvas height.
 *   - Formation split into two independent groups at 28 kills.
 *   - Invaders fire downward at the player.
 *   - Win:  all invaders destroyed → onComplete().
 *   - Lose: invader reaches bottom OR player ship destroyed.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { hudState, triggerGameOver }   from './game.js';
import { spawnExplosion }              from './explosion.js';
import { SCORE_PER_KILL }              from './collision.js';
import {
  initInvaders,
  invaders,
  INVADER_WIDTH,
  INVADER_HEIGHT,
  INVADER_H_GAP,
  INVADER_V_GAP,
  INVADER_COLS,
  INVADER_ROWS,
  INVADER_DROP,
  INVADER_COLOR,
} from './invaders.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_INVADERS  = 55;   // 5 × 11
const SPLIT_THRESHOLD = 28;   // kills before split
const STEP_PX         = 8;    // px per formation step (same as Level 1)

// Shield bunker constants
const BUNKER_CELL_SIZE = 8;    // px per cell
const BUNKER_COLS      = 4;    // cells wide
const BUNKER_ROWS      = 4;    // cells tall
const BUNKER_COUNT     = 4;
const BUNKER_COLOR     = '#00FF00';
const BUNKER_Y_RATIO   = 0.80; // 80% of canvas height

// Invader bullet constants
const INV_BULLET_WIDTH  = 4;    // px
const INV_BULLET_HEIGHT = 12;   // px
const INV_BULLET_COLOR  = '#FF4444';
const INV_BULLET_SPEED  = 180;  // px/s downward
const INV_FIRE_INTERVAL_MS = 1200; // ms between invader shots (global cooldown)

// Player bullet dimensions (must match player.js)
const PLAYER_BULLET_WIDTH  = 4;
const PLAYER_BULLET_HEIGHT = 10;

// ---------------------------------------------------------------------------
// Module-level state (reset by start())
// ---------------------------------------------------------------------------

let _canvas     = null;
let _ctx        = null;
let _player     = null;
let _onComplete = null;

let levelDone   = false;
let splitDone   = false;
let killCount   = 0;

// Formation movement state (pre-split unified, post-split per-group)
// Pre-split: single unified group
let unifiedOffsetX = 0;
let unifiedOffsetY = 0;
let unifiedDir     = 1;   // +1 right, -1 left
let stepTimer      = 0;   // seconds since last step

// Post-split groups
// Each group: { invaders: [...], offsetX, offsetY, dir }
let leftGroup  = null;
let rightGroup = null;
let leftStepTimer  = 0;
let rightStepTimer = 0;

// Shield bunkers
// Array of bunkers; each bunker = array of { col, row, x, y, alive }
let bunkers = [];

// Invader bullets: array of { x, y, active }
let invaderBullets = [];
let fireTimer = 0; // seconds since last invader shot

// ---------------------------------------------------------------------------
// AABB helper
// ---------------------------------------------------------------------------

function rectsOverlap(a, b) {
  return (
    a.x             < b.x + b.width  &&
    a.x + a.width   > b.x            &&
    a.y             < b.y + b.height &&
    a.y + a.height  > b.y
  );
}

// ---------------------------------------------------------------------------
// Shield bunker initialisation
// ---------------------------------------------------------------------------

function initBunkers() {
  bunkers = [];
  const totalBunkerWidth = BUNKER_COLS * BUNKER_CELL_SIZE;
  const bunkerY = Math.round(CANVAS_HEIGHT * BUNKER_Y_RATIO);

  // Distribute 4 bunkers evenly across canvas width
  // Divide canvas into BUNKER_COUNT segments, centre each bunker in its segment
  const segmentWidth = CANVAS_WIDTH / BUNKER_COUNT;

  for (let b = 0; b < BUNKER_COUNT; b++) {
    const bunkerX = Math.round(b * segmentWidth + (segmentWidth - totalBunkerWidth) / 2);
    const cells = [];
    for (let row = 0; row < BUNKER_ROWS; row++) {
      for (let col = 0; col < BUNKER_COLS; col++) {
        cells.push({
          col,
          row,
          x:     bunkerX + col * BUNKER_CELL_SIZE,
          y:     bunkerY + row * BUNKER_CELL_SIZE,
          alive: true,
        });
      }
    }
    bunkers.push(cells);
  }
}

// ---------------------------------------------------------------------------
// Invader group helpers
// ---------------------------------------------------------------------------

/**
 * Build a group snapshot from the current invaders array, filtered by
 * column range [colMin, colMax] inclusive, alive only.
 * Each group member: { inv (ref), offsetX, offsetY } where inv.baseX/baseY
 * are the original base positions.
 * Returns array of invader refs from the shared `invaders` array.
 */
function buildGroup(colMin, colMax) {
  const members = [];
  for (const inv of invaders) {
    if (!inv.alive) continue;
    if (inv.col >= colMin && inv.col <= colMax) {
      members.push(inv);
    }
  }
  return members;
}

/**
 * Compute the current screen rect for an invader in a group.
 * Pre-split: uses unifiedOffsetX/Y.
 * Post-split: uses group.offsetX/Y.
 */
function invaderScreenRect(inv, offsetX, offsetY) {
  return {
    x:      inv.baseX + offsetX,
    y:      inv.baseY + offsetY,
    width:  INVADER_WIDTH,
    height: INVADER_HEIGHT,
  };
}

/**
 * Perform one discrete step for a group.
 * @param {object} group  { members, offsetX, offsetY, dir }
 * @param {number} px     Step size in pixels.
 * Returns updated group (mutates in place).
 */
function stepGroup(group, px) {
  group.offsetX += px * group.dir;

  let minX = Infinity;
  let maxX = -Infinity;

  for (const inv of group.members) {
    if (!inv.alive) continue;
    const r = invaderScreenRect(inv, group.offsetX, group.offsetY);
    if (r.x < minX)           minX = r.x;
    if (r.x + r.width > maxX) maxX = r.x + r.width;
  }

  if (minX === Infinity) return; // no survivors in group

  if (group.dir === 1 && maxX >= CANVAS_WIDTH) {
    group.offsetX -= (maxX - CANVAS_WIDTH);
    group.offsetY += INVADER_DROP;
    group.dir = -1;
  } else if (group.dir === -1 && minX <= 0) {
    group.offsetX -= minX;
    group.offsetY += INVADER_DROP;
    group.dir = 1;
  }
}

// ---------------------------------------------------------------------------
// Step-interval scaling (same formula as Level 1)
// ---------------------------------------------------------------------------

function stepIntervalSeconds(aliveCount) {
  const intervalMs = 100 + (aliveCount / TOTAL_INVADERS) * 700;
  return intervalMs / 1000;
}

// ---------------------------------------------------------------------------
// Formation bottom check (for lose condition)
// ---------------------------------------------------------------------------

function getFormationBottomL3() {
  const bunkerY = CANVAS_HEIGHT * BUNKER_Y_RATIO;
  if (!splitDone) {
    let maxB = 0;
    for (const inv of invaders) {
      if (!inv.alive) continue;
      const r = invaderScreenRect(inv, unifiedOffsetX, unifiedOffsetY);
      const b = r.y + r.height;
      if (b > maxB) maxB = b;
    }
    return maxB;
  } else {
    let maxB = 0;
    for (const grp of [leftGroup, rightGroup]) {
      if (!grp) continue;
      for (const inv of grp.members) {
        if (!inv.alive) continue;
        const r = invaderScreenRect(inv, grp.offsetX, grp.offsetY);
        const b = r.y + r.height;
        if (b > maxB) maxB = b;
      }
    }
    return maxB;
  }
}

// ---------------------------------------------------------------------------
// Invader firing
// ---------------------------------------------------------------------------

function fireInvaderBullet() {
  // Collect all alive invaders (across both groups or unified)
  const candidates = [];

  if (!splitDone) {
    for (const inv of invaders) {
      if (!inv.alive) continue;
      // Pick bottom-most in each column (most likely to have clear shot)
      candidates.push({
        inv,
        rect: invaderScreenRect(inv, unifiedOffsetX, unifiedOffsetY),
      });
    }
  } else {
    for (const grp of [leftGroup, rightGroup]) {
      if (!grp) continue;
      for (const inv of grp.members) {
        if (!inv.alive) continue;
        candidates.push({
          inv,
          rect: invaderScreenRect(inv, grp.offsetX, grp.offsetY),
        });
      }
    }
  }

  if (candidates.length === 0) return;

  // Pick a random shooter
  const shooter = candidates[Math.floor(Math.random() * candidates.length)];
  const r = shooter.rect;
  invaderBullets.push({
    x:      r.x + r.width / 2 - INV_BULLET_WIDTH / 2,
    y:      r.y + r.height,
    active: true,
  });
}

// ---------------------------------------------------------------------------
// Collision detection
// ---------------------------------------------------------------------------

/**
 * Check player bullet against bunker cells.
 * Returns true if bullet was consumed.
 */
function checkPlayerBulletVsBunkers(player) {
  if (player.bullet === null) return false;
  const bRect = {
    x:      player.bullet.x - PLAYER_BULLET_WIDTH / 2,
    y:      player.bullet.y,
    width:  PLAYER_BULLET_WIDTH,
    height: PLAYER_BULLET_HEIGHT,
  };
  for (const bunker of bunkers) {
    for (const cell of bunker) {
      if (!cell.alive) continue;
      const cRect = { x: cell.x, y: cell.y, width: BUNKER_CELL_SIZE, height: BUNKER_CELL_SIZE };
      if (rectsOverlap(bRect, cRect)) {
        cell.alive = false;
        player.bullet = null;
        return true;
      }
    }
  }
  return false;
}

/**
 * Check player bullet against all alive invaders.
 * Returns true if bullet was consumed.
 */
function checkPlayerBulletVsInvaders(player) {
  if (player.bullet === null) return false;
  const bRect = {
    x:      player.bullet.x - PLAYER_BULLET_WIDTH / 2,
    y:      player.bullet.y,
    width:  PLAYER_BULLET_WIDTH,
    height: PLAYER_BULLET_HEIGHT,
  };

  const groups = splitDone
    ? [leftGroup, rightGroup]
    : [{ members: invaders, offsetX: unifiedOffsetX, offsetY: unifiedOffsetY }];

  for (const grp of groups) {
    if (!grp) continue;
    const offsetX = grp.offsetX !== undefined ? grp.offsetX : 0;
    const offsetY = grp.offsetY !== undefined ? grp.offsetY : 0;
    const members = grp.members !== undefined ? grp.members : grp;

    for (const inv of members) {
      if (!inv.alive) continue;
      const iRect = invaderScreenRect(inv, offsetX, offsetY);
      if (rectsOverlap(bRect, iRect)) {
        inv.alive = false;
        player.bullet = null;
        spawnExplosion(
          iRect.x + INVADER_WIDTH  / 2,
          iRect.y + INVADER_HEIGHT / 2,
          INVADER_WIDTH,
          INVADER_HEIGHT
        );
        hudState.score += SCORE_PER_KILL;
        killCount += 1;
        return true;
      }
    }
  }
  return false;
}

/**
 * Check invader bullets against bunker cells and player.
 */
function checkInvaderBulletsVsBunkersAndPlayer(player) {
  for (const bullet of invaderBullets) {
    if (!bullet.active) continue;
    const bRect = {
      x:      bullet.x,
      y:      bullet.y,
      width:  INV_BULLET_WIDTH,
      height: INV_BULLET_HEIGHT,
    };

    // vs bunker cells
    let hitBunker = false;
    for (const bunker of bunkers) {
      if (hitBunker) break;
      for (const cell of bunker) {
        if (!cell.alive) continue;
        const cRect = { x: cell.x, y: cell.y, width: BUNKER_CELL_SIZE, height: BUNKER_CELL_SIZE };
        if (rectsOverlap(bRect, cRect)) {
          cell.alive = false;
          bullet.active = false;
          hitBunker = true;
          break;
        }
      }
    }
    if (hitBunker) continue;

    // vs player ship
    const playerRect = {
      x:      player.x,
      y:      player.y,
      width:  48,   // SHIP_WIDTH from player.js
      height: 32,   // SHIP_HEIGHT from player.js
    };
    if (rectsOverlap(bRect, playerRect)) {
      bullet.active = false;
      // Player hit — lose a life
      hudState.lives -= 1;
      if (hudState.lives <= 0) {
        if (!levelDone) {
          levelDone = true;
          triggerGameOver();
        }
      } else {
        // Restart the level (same as Level 1/2 lose convention: reinit)
        start(_canvas, _ctx, _onComplete, player);
      }
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// Trigger formation split
// ---------------------------------------------------------------------------

function triggerSplit() {
  splitDone = true;

  leftGroup = {
    members: buildGroup(0, 5),
    offsetX: unifiedOffsetX,
    offsetY: unifiedOffsetY,
    dir:     -1,   // starts sweeping left
  };
  rightGroup = {
    members: buildGroup(6, 10),
    offsetX: unifiedOffsetX,
    offsetY: unifiedOffsetY,
    dir:     1,    // starts sweeping right
  };

  leftStepTimer  = 0;
  rightStepTimer = 0;
}

// ---------------------------------------------------------------------------
// Total alive count (level-wide)
// ---------------------------------------------------------------------------

function totalAlive() {
  let n = 0;
  for (const inv of invaders) {
    if (inv.alive) n += 1;
  }
  return n;
}

// ---------------------------------------------------------------------------
// start() — exported entry point
// ---------------------------------------------------------------------------

/**
 * Initialise and begin Level 3.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {Function} onComplete  Called exactly once when all invaders are cleared.
 * @param {object} [playerRef]   Internal: reuse existing player on life-loss restart.
 */
export function start(canvas, ctx, onComplete, playerRef) {
  _canvas     = canvas;
  _ctx        = ctx;
  _onComplete = onComplete;

  levelDone  = false;
  splitDone  = false;
  killCount  = 0;
  stepTimer  = 0;

  unifiedOffsetX = 0;
  unifiedOffsetY = 0;
  unifiedDir     = 1;

  leftGroup  = null;
  rightGroup = null;
  leftStepTimer  = 0;
  rightStepTimer = 0;

  invaderBullets = [];
  fireTimer = 0;

  initInvaders();
  initBunkers();

  // Store player reference — provided externally by game.js
  // (playerRef param used on life-loss restart; game.js passes it on first call)
  if (playerRef !== undefined) {
    _player = playerRef;
  }
  // Note: game.js will call setPlayer() or pass player via start(); see game.js integration.
}

/**
 * Set the player reference (called by game.js after constructing Level 3).
 * @param {object} player
 */
export function setPlayer(player) {
  _player = player;
}

// ---------------------------------------------------------------------------
// update() — called each fixed-timestep frame by game.js
// ---------------------------------------------------------------------------

/**
 * Update Level 3 for one fixed-timestep frame.
 * @param {number} dt  Fixed timestep in seconds (typically 1/60).
 */
export function updateLevel3(dt) {
  if (levelDone || _player === null) return;

  const alive = totalAlive();

  // ── Win condition ──────────────────────────────────────────────────────
  if (alive === 0) {
    levelDone = true;
    _onComplete();
    return;
  }

  // ── Formation split check ──────────────────────────────────────────────
  if (!splitDone && killCount >= SPLIT_THRESHOLD) {
    triggerSplit();
  }

  // ── Formation movement ────────────────────────────────────────────────
  if (!splitDone) {
    const intervalS = stepIntervalSeconds(alive);
    stepTimer += dt;
    if (stepTimer >= intervalS) {
      stepTimer -= intervalS;
      // Manual step for unified group (mirrors stepInvaders but uses local offsets)
      unifiedOffsetX += STEP_PX * unifiedDir;

      let minX = Infinity;
      let maxX = -Infinity;
      for (const inv of invaders) {
        if (!inv.alive) continue;
        const r = invaderScreenRect(inv, unifiedOffsetX, unifiedOffsetY);
        if (r.x < minX)           minX = r.x;
        if (r.x + r.width > maxX) maxX = r.x + r.width;
      }
      if (minX !== Infinity) {
        if (unifiedDir === 1 && maxX >= CANVAS_WIDTH) {
          unifiedOffsetX -= (maxX - CANVAS_WIDTH);
          unifiedOffsetY += INVADER_DROP;
          unifiedDir = -1;
        } else if (unifiedDir === -1 && minX <= 0) {
          unifiedOffsetX -= minX;
          unifiedOffsetY += INVADER_DROP;
          unifiedDir = 1;
        }
      }
    }
  } else {
    // Post-split: step each group independently
    const leftAlive  = leftGroup  ? leftGroup.members.filter(i  => i.alive).length  : 0;
    const rightAlive = rightGroup ? rightGroup.members.filter(i => i.alive).length : 0;

    if (leftGroup && leftAlive > 0) {
      const intervalS = stepIntervalSeconds(leftAlive);
      leftStepTimer += dt;
      if (leftStepTimer >= intervalS) {
        leftStepTimer -= intervalS;
        stepGroup(leftGroup, STEP_PX);
      }
    }

    if (rightGroup && rightAlive > 0) {
      const intervalS = stepIntervalSeconds(rightAlive);
      rightStepTimer += dt;
      if (rightStepTimer >= intervalS) {
        rightStepTimer -= intervalS;
        stepGroup(rightGroup, STEP_PX);
      }
    }
  }

  // ── Invader firing ────────────────────────────────────────────────────
  fireTimer += dt;
  const fireIntervalS = INV_FIRE_INTERVAL_MS / 1000;
  if (fireTimer >= fireIntervalS) {
    fireTimer -= fireIntervalS;
    fireInvaderBullet();
  }

  // ── Update invader bullets ────────────────────────────────────────────
  for (const bullet of invaderBullets) {
    if (!bullet.active) continue;
    bullet.y += INV_BULLET_SPEED * dt;
    if (bullet.y > CANVAS_HEIGHT) {
      bullet.active = false;
    }
  }
  // Prune inactive bullets
  invaderBullets = invaderBullets.filter(b => b.active);

  // ── Collision: player bullet vs bunkers ───────────────────────────────
  checkPlayerBulletVsBunkers(_player);

  // ── Collision: player bullet vs invaders ──────────────────────────────
  checkPlayerBulletVsInvaders(_player);

  // ── Collision: invader bullets vs bunkers and player ─────────────────
  checkInvaderBulletsVsBunkersAndPlayer(_player);

  // ── Lose condition: formation breach ─────────────────────────────────
  if (!levelDone) {
    const bottom = getFormationBottomL3();
    const bunkerY = CANVAS_HEIGHT * BUNKER_Y_RATIO;
    if (bottom >= bunkerY) {
      levelDone = true;
      triggerGameOver();
    }
  }
}

// ---------------------------------------------------------------------------
// draw() — called each render frame by game.js
// ---------------------------------------------------------------------------

/**
 * Draw all Level 3 elements: invaders, bunkers, invader bullets.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawLevel3(ctx) {
  // Draw invaders
  ctx.fillStyle = INVADER_COLOR;
  if (!splitDone) {
    for (const inv of invaders) {
      if (!inv.alive) continue;
      const r = invaderScreenRect(inv, unifiedOffsetX, unifiedOffsetY);
      ctx.fillRect(Math.round(r.x), Math.round(r.y), r.width, r.height);
    }
  } else {
    for (const grp of [leftGroup, rightGroup]) {
      if (!grp) continue;
      for (const inv of grp.members) {
        if (!inv.alive) continue;
        const r = invaderScreenRect(inv, grp.offsetX, grp.offsetY);
        ctx.fillRect(Math.round(r.x), Math.round(r.y), r.width, r.height);
      }
    }
  }

  // Draw bunker cells
  ctx.fillStyle = BUNKER_COLOR;
  for (const bunker of bunkers) {
    for (const cell of bunker) {
      if (!cell.alive) continue;
      ctx.fillRect(cell.x, cell.y, BUNKER_CELL_SIZE, BUNKER_CELL_SIZE);
    }
  }

  // Draw invader bullets
  ctx.fillStyle = INV_BULLET_COLOR;
  for (const bullet of invaderBullets) {
    if (!bullet.active) continue;
    ctx.fillRect(
      Math.round(bullet.x),
      Math.round(bullet.y),
      INV_BULLET_WIDTH,
      INV_BULLET_HEIGHT
    );
  }
}
