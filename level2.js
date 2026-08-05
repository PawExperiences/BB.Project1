// level2.js — Level 2: Faster invader formation + enemy fire + bonus UFO.
// ES module; exports { init, update, render }.

import {
  INVADER_WIDTH,
  INVADER_HEIGHT,
  INVADER_GAP,
  initInvaders,
  getLivingInvaders,
  drawInvaders,
  stepFormation,
  dropFormation,
  killInvader,
  POINTS_PER_KILL,
} from './invaders.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const COLS           = 11;
const ROWS           = 5;
const TOTAL_INVADERS = COLS * ROWS;   // 55
const STEP_X         = 8;            // px per horizontal step (same as Level 1)
const PLAYER_ROW_Y   = 540;          // loss threshold: bottom edge of lowest invader

// Step-interval formula (Level 1 values × 0.67)
const INTERVAL_MIN   = 100 * 0.67;   // ~67 ms  at 1 invader
const INTERVAL_MAX   = 800 * 0.67;   // ~536 ms at 55 invaders

// Enemy fire
const SHOOT_MIN_MS   = 800;   // ms
const SHOOT_MAX_MS   = 2000;  // ms
const ENEMY_BULLET_SPEED = 300; // px/s downward

// UFO
const UFO_INTERVAL_MS = 20_000; // ms between UFO spawns
const UFO_SPEED       = 120;    // px/s
const UFO_WIDTH       = 50;
const UFO_HEIGHT      = 20;
const UFO_Y           = 60;    // vertical position
const UFO_SCORES      = [50, 100, 150, 300];

// Invulnerability
const INVULN_DURATION_MS  = 2000;  // ms
const INVULN_FLASH_PERIOD = 200;   // ms — alternate visible/invisible

// Ship dimensions (mirror player.js)
const SHIP_WIDTH  = 40;
const SHIP_HEIGHT = 32;

// ---------------------------------------------------------------------------
// Module-level state (reset on every init call)
// ---------------------------------------------------------------------------
let _ctx   = null;
let _state = null;   // shared hudState from game.js
let _player = null;  // Player instance

let dirX        = 1;
let stepTimer   = 0;

// Enemy bullets: array of { x, y, active }
let enemyBullets = [];

// Shoot timer
let shootTimer  = 0;
let shootInterval = 0;

// UFO state
let ufoTimer      = 0;
let ufoActive     = false;
let ufo           = null;   // { x, y, dirX }
let ufoSpawnCount = 0;      // how many UFOs have appeared; drives side alternation

// Invulnerability
let invulnTimer   = 0;      // ms remaining
let invulnActive  = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Level 2 step-interval formula: Level 1 curve × 0.67.
 */
function stepInterval(aliveCount) {
  const clamped = Math.max(1, Math.min(TOTAL_INVADERS, aliveCount));
  return INTERVAL_MIN + (clamped / TOTAL_INVADERS) * (INTERVAL_MAX - INTERVAL_MIN);
}

/**
 * Random interval in [SHOOT_MIN_MS, SHOOT_MAX_MS].
 */
function randomShootInterval() {
  return SHOOT_MIN_MS + Math.random() * (SHOOT_MAX_MS - SHOOT_MIN_MS);
}

/**
 * World-space AABB of all living invaders.
 */
function getFormationBounds() {
  const living = getLivingInvaders();
  if (living.length === 0) return null;
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  for (const inv of living) {
    if (inv.x < left)                left   = inv.x;
    if (inv.x + inv.width  > right)  right  = inv.x + inv.width;
    if (inv.y < top)                 top    = inv.y;
    if (inv.y + inv.height > bottom) bottom = inv.y + inv.height;
  }
  return { left, right, top, bottom };
}

/**
 * Simple AABB test.
 */
function aabbIntersects(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// ---------------------------------------------------------------------------
// UFO helpers
// ---------------------------------------------------------------------------

function spawnUFO() {
  // Alternate side: even spawns from left, odd from right
  const fromLeft = (ufoSpawnCount % 2) === 0;
  const startX   = fromLeft ? -UFO_WIDTH : CANVAS_WIDTH;
  const ufoDirX  = fromLeft ? 1 : -1;
  ufo = { x: startX, y: UFO_Y, dirX: ufoDirX };
  ufoActive     = true;
  ufoSpawnCount += 1;
}

function updateUFO(dtMs) {
  if (!ufoActive || !ufo) return;
  const dtS = dtMs / 1000;
  ufo.x += ufo.dirX * UFO_SPEED * dtS;

  // Remove when past the opposite edge
  if (ufo.dirX === 1  && ufo.x > CANVAS_WIDTH)  { ufoActive = false; ufo = null; }
  if (ufo.dirX === -1 && ufo.x + UFO_WIDTH < 0) { ufoActive = false; ufo = null; }
}

function ufoRect() {
  if (!ufoActive || !ufo) return null;
  return { x: ufo.x, y: ufo.y, width: UFO_WIDTH, height: UFO_HEIGHT };
}

function drawUFO(ctx) {
  if (!ufoActive || !ufo) return;
  // Body
  ctx.fillStyle = '#ff00ff';
  ctx.fillRect(Math.round(ufo.x), Math.round(ufo.y), UFO_WIDTH, UFO_HEIGHT);
  // Dome highlight
  ctx.fillStyle = '#ffaaff';
  ctx.fillRect(Math.round(ufo.x + 10), Math.round(ufo.y), 30, 8);
  // Score label
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', Math.round(ufo.x + UFO_WIDTH / 2), Math.round(ufo.y + UFO_HEIGHT / 2));
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Enemy fire helpers
// ---------------------------------------------------------------------------

/**
 * Fires one bullet from the lowest living invader in a random non-empty column.
 */
function fireEnemyBullet() {
  const living = getLivingInvaders();
  if (living.length === 0) return;

  // Build column map: col -> array of invaders sorted by y descending (lowest first)
  const colMap = new Map();
  for (const inv of living) {
    if (!colMap.has(inv._ref.col)) colMap.set(inv._ref.col, []);
    colMap.get(inv._ref.col).push(inv);
  }

  const nonEmptyCols = Array.from(colMap.keys());
  const chosenCol    = nonEmptyCols[Math.floor(Math.random() * nonEmptyCols.length)];
  const colInvaders  = colMap.get(chosenCol);

  // Find the lowest (highest y) invader in that column
  let lowest = colInvaders[0];
  for (const inv of colInvaders) {
    if (inv.y > lowest.y) lowest = inv;
  }

  // Spawn bullet at the bottom-centre of that invader
  const bulletX = lowest.x + INVADER_WIDTH / 2 - 2; // 2 = half of bullet width 4
  const bulletY = lowest.y + INVADER_HEIGHT;
  enemyBullets.push({ x: bulletX, y: bulletY, active: true });
}

function updateEnemyBullets(dtMs) {
  const dtS = dtMs / 1000;

  // Player bounding rect
  const playerRect = _player
    ? { x: _player.x, y: _player.y, width: SHIP_WIDTH, height: SHIP_HEIGHT }
    : null;

  for (const b of enemyBullets) {
    if (!b.active) continue;

    b.y += ENEMY_BULLET_SPEED * dtS;

    // Remove if past bottom
    if (b.y > CANVAS_HEIGHT) {
      b.active = false;
      continue;
    }

    // Check player collision
    if (playerRect) {
      const bulletRect = { x: b.x, y: b.y, width: 4, height: 10 };
      if (aabbIntersects(bulletRect, playerRect)) {
        b.active = false;
        if (!invulnActive) {
          handlePlayerHit();
        }
        // If invulnActive, bullet passes through — already deactivated above
        // (per spec the bullet is "ignored" but we still remove it on contact;
        //  the effect is ignored, not the physical bullet.)
      }
    }
  }

  // Compact the array periodically
  enemyBullets = enemyBullets.filter(b => b.active);
}

function drawEnemyBullets(ctx) {
  ctx.fillStyle = '#ff4444';
  for (const b of enemyBullets) {
    if (!b.active) continue;
    ctx.fillRect(Math.round(b.x), Math.round(b.y), 4, 10);
  }
}

// ---------------------------------------------------------------------------
// Player hit / respawn
// ---------------------------------------------------------------------------

function handlePlayerHit() {
  if (!_player || !_state) return;

  // Deduct one life from shared state
  _state.lives -= 1;

  if (_state.lives <= 0) {
    // Game-over flow is handled by game.js which watches _state.lives.
    // level2.js does nothing further.
    return;
  }

  // Respawn at same X position (player.y stays as-is — same horizontal pos)
  // player.x is already the position at time of hit; just activate invuln.
  invulnTimer  = INVULN_DURATION_MS;
  invulnActive = true;
}

// ---------------------------------------------------------------------------
// Exported lifecycle
// ---------------------------------------------------------------------------

/**
 * Called by advanceLevel(state) in game.js when Level 1 is cleared.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state  — shared hudState ({ score, lives, level, playerTotalShotCount, … })
 * @param {Player}  player — the live Player instance (lives unchanged from Level 1)
 */
export function init(ctx, state, player) {
  _ctx    = ctx;
  _state  = state;
  _player = player;

  // Formation: fresh 55-invader grid, direction reset
  dirX      = 1;
  stepTimer = 0;
  initInvaders();

  // Enemy fire
  enemyBullets  = [];
  shootTimer    = 0;
  shootInterval = randomShootInterval();

  // UFO
  ufoTimer      = 0;
  ufoActive     = false;
  ufo           = null;
  ufoSpawnCount = 0;

  // Invulnerability
  invulnTimer  = 0;
  invulnActive = false;
}

/**
 * Called every frame with elapsed time in milliseconds.
 * @param {number} dt — delta-time in ms
 */
export function update(dt) {
  if (!_state || !_player) return;

  const living     = getLivingInvaders();
  const aliveCount = living.length;

  // ── Level-clear condition ────────────────────────────────────────────────
  if (aliveCount === 0) {
    _state.level = 3;  // Signal game controller to advance
    return;
  }

  // ── Formation step-marching ──────────────────────────────────────────────
  stepTimer += dt;
  const interval = stepInterval(aliveCount);

  if (stepTimer >= interval) {
    stepTimer -= interval;

    const bounds = getFormationBounds();
    if (bounds) {
      const nextLeft  = bounds.left  + dirX * STEP_X;
      const nextRight = bounds.right + dirX * STEP_X;

      if (nextRight > CANVAS_WIDTH || nextLeft < 0) {
        dropFormation();
        dirX *= -1;

        // Loss condition: formation reached player row
        const newBounds = getFormationBounds();
        if (newBounds && newBounds.bottom >= PLAYER_ROW_Y) {
          _state.lives -= 1;
          if (_state.lives > 0) {
            dirX      = 1;
            stepTimer = 0;
            initInvaders();
          }
          // If lives <= 0, game.js will catch it
        }
      } else {
        stepFormation(dirX * STEP_X);
      }
    }
  }

  // ── Enemy shoot timer ────────────────────────────────────────────────────
  shootTimer += dt;
  if (shootTimer >= shootInterval) {
    shootTimer   -= shootInterval;
    shootInterval = randomShootInterval();
    fireEnemyBullet();
  }

  // ── UFO timer ────────────────────────────────────────────────────────────
  ufoTimer += dt;
  if (ufoTimer >= UFO_INTERVAL_MS) {
    ufoTimer -= UFO_INTERVAL_MS;
    if (!ufoActive) spawnUFO();
  }
  updateUFO(dt);

  // ── UFO hit by player bullet ─────────────────────────────────────────────
  if (ufoActive && ufo && _player.bullet && _player.bullet.active) {
    const bulletRect = {
      x:      _player.bullet.x,
      y:      _player.bullet.y,
      width:  4,
      height: 10,
    };
    const ufoBounds = ufoRect();
    if (ufoBounds && aabbIntersects(bulletRect, ufoBounds)) {
      // Deactivate player bullet
      _player.bullet.active = false;

      // Compute score from shot count
      const shotCount = (_state.playerTotalShotCount !== undefined)
        ? _state.playerTotalShotCount
        : 0;
      const scoreIdx  = shotCount % 4;
      _state.score   += UFO_SCORES[scoreIdx];

      // Remove UFO
      ufoActive = false;
      ufo       = null;
    }
  }

  // ── Player bullet vs invaders (collision already handled by collision.js
  //    which is called from game.js; but that file still calls level1's
  //    update. When Level 2 is active, game.js calls level2Update instead,
  //    and collision.js is invoked separately by game.js for the player bullet.
  //    Nothing extra needed here.) ─────────────────────────────────────────

  // ── Enemy bullets ────────────────────────────────────────────────────────
  updateEnemyBullets(dt);

  // ── Invulnerability countdown ─────────────────────────────────────────────
  if (invulnActive) {
    invulnTimer -= dt;
    if (invulnTimer <= 0) {
      invulnTimer  = 0;
      invulnActive = false;
    }
  }
}

/**
 * Called every frame to draw the level.
 * @param {CanvasRenderingContext2D} ctx
 */
export function render(ctx) {
  // Invader formation + explosions
  drawInvaders(ctx);

  // UFO
  drawUFO(ctx);

  // Enemy bullets
  drawEnemyBullets(ctx);

  // Player ship — drawn here with invulnerability flash support.
  // game.js also calls player.draw(ctx) from renderPlaying(); when Level 2 is
  // active game.js will call level2Render which draws the (possibly flashing)
  // player, so we must suppress the double-draw.  The chosen pattern is:
  // level2Render handles the player draw (with flash) and game.js's own
  // player.draw call is guarded by the "if (player)" check.  Since we cannot
  // remove that call from game.js without modifying it, we draw here AND rely
  // on game.js calling player.draw normally when NOT in Level 2.  When Level 2
  // IS active the renderPlaying() in game.js calls level2Render (not
  // level1Render), and we draw the ship here with flash; the redundant
  // player.draw in game.js will also run UNLESS game.js is updated.  See note
  // in the summary about the required game.js patch.
  if (_player) {
    const now = performance.now();
    if (invulnActive) {
      // Flash: visible during even 200 ms windows, invisible during odd ones
      const flashPhase = Math.floor((INVULN_DURATION_MS - invulnTimer) / INVULN_FLASH_PERIOD);
      if (flashPhase % 2 === 0) {
        _player.draw(ctx);
      }
      // Odd phase: skip drawing (invisible)
    } else {
      _player.draw(ctx);
    }
  }

  // HUD: level number
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
