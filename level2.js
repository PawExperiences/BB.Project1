// level2.js — Level 2: They Shoot Back
//
// Implements the level protocol: export default { init(ctx, state), update(dt, state), draw(ctx, state) }
// Loaded by game.js when Level 1 is cleared.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { invaders, INVADER_WIDTH, INVADER_HEIGHT } from './invaders.js';
import { checkCollision, checkInvaderBulletVsPlayer } from './collision.js';
import { addExplosion } from './explosion.js';
import { addScore } from './score.js';
import { stepInterval } from './level1.js';

// ---------------------------------------------------------------------------
// Formation constants (mirrors level1.js)
// ---------------------------------------------------------------------------
const COLS          = 11;
const ROWS          = 5;
const INVADER_GAP_X = 12;
const INVADER_GAP_Y = 8;
const FORMATION_WIDTH  = COLS * INVADER_WIDTH  + (COLS - 1) * INVADER_GAP_X;  // 384 px
const FORMATION_HEIGHT = ROWS * INVADER_HEIGHT + (ROWS - 1) * INVADER_GAP_Y;  // 112 px
const START_X = (CANVAS_WIDTH - FORMATION_WIDTH) / 2;  // 192
const START_Y = 48;
const STEP_X  = 8;
const DROP_Y  = INVADER_HEIGHT + INVADER_GAP_Y;  // 24 px
const TOTAL_INVADERS = COLS * ROWS;  // 55

// Level 2 speed multiplier — every step interval is × 0.67
const SPEED_MULTIPLIER = 0.67;

// ---------------------------------------------------------------------------
// Enemy fire constants
// ---------------------------------------------------------------------------
const ENEMY_BULLET_SPEED  = 300;  // px/s downward
const ENEMY_BULLET_WIDTH  = 4;
const ENEMY_BULLET_HEIGHT = 12;
const FIRE_INTERVAL_MIN   = 800;  // ms
const FIRE_INTERVAL_MAX   = 2000; // ms

// ---------------------------------------------------------------------------
// UFO constants
// ---------------------------------------------------------------------------
const UFO_INTERVAL  = 20000;  // ms between UFO entries
const UFO_SPEED     = 120;    // px/s
const UFO_WIDTH     = 48;
const UFO_HEIGHT    = 20;
const UFO_Y         = 20;     // fixed vertical position near top

// UFO scoring table keyed by totalShotsFired % 4
const UFO_SCORE_TABLE = [50, 100, 150, 300];

// ---------------------------------------------------------------------------
// Player respawn constants
// ---------------------------------------------------------------------------
const PLAYER_START_X  = (CANVAS_WIDTH - 40) / 2;  // 364
const PLAYER_START_Y  = 820;
const INVULN_DURATION = 2000;   // ms
const FLASH_INTERVAL  = 200;    // ms

// ---------------------------------------------------------------------------
// Module-level level state
// ---------------------------------------------------------------------------
let _ctx   = null;
let _state = null;
let _playerRef = null;  // reference to the player object from game.js

// Formation movement
let directionX  = 1;
let stepTimer   = 0;

// Enemy bullets: array of { x, y }
let enemyBullets = [];

// Enemy fire timer
let fireTimer    = 0;
let fireInterval = 0;  // ms, randomised each shot

// UFO state
let ufoTimer     = 0;   // ms since last UFO entry (or level start)
let ufoActive    = false;
let ufo          = null; // { x, y, dirX: +1 or -1 }
let ufoSide      = 0;    // 0 = left→right first, toggles each spawn

// Invulnerability state
let invulnTimer  = 0;    // ms remaining
let flashTimer   = 0;    // ms since last flash toggle
let shipVisible  = true; // controls flashing
let isInvuln     = false;

// Callbacks supplied by game.js via state
let _onLoseLife  = null;
let _onGameOver  = null;
let _onLevelClear = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomFireInterval() {
  return FIRE_INTERVAL_MIN + Math.random() * (FIRE_INTERVAL_MAX - FIRE_INTERVAL_MIN);
}

/**
 * level2StepInterval — Level 1 interval × 0.67.
 * @param {number} alive
 * @returns {number} ms
 */
function level2StepInterval(alive) {
  return stepInterval(alive) * SPEED_MULTIPLIER;
}

/**
 * getBottomInvaderPerColumn — returns one invader per column (the lowest alive).
 * Returns an array of invader objects (one per column that has any alive invader).
 */
function getBottomInvaderPerColumn() {
  const bottomMap = new Map(); // col → invader
  for (let i = 0; i < invaders.length; i++) {
    const inv = invaders[i];
    if (!inv.alive) continue;
    const col = i % COLS;
    // The lowest invader in a column has the highest y value.
    if (!bottomMap.has(col) || inv.y > bottomMap.get(col).y) {
      bottomMap.set(col, inv);
    }
  }
  return Array.from(bottomMap.values());
}

/**
 * resetFormationLevel2 — reset invader grid to starting positions.
 */
function resetFormationLevel2() {
  let i = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      invaders[i].x     = START_X + col * (INVADER_WIDTH  + INVADER_GAP_X);
      invaders[i].y     = START_Y + row * (INVADER_HEIGHT + INVADER_GAP_Y);
      invaders[i].alive = true;
      i++;
    }
  }
  directionX = 1;
  stepTimer  = 0;
}

/**
 * spawnUFO — create a new UFO entering from the correct side.
 */
function spawnUFO() {
  const goingRight = (ufoSide % 2 === 0);
  ufo = {
    x:    goingRight ? -UFO_WIDTH : CANVAS_WIDTH,
    y:    UFO_Y,
    dirX: goingRight ? 1 : -1,
  };
  ufoActive = true;
  ufoSide++;
}

/**
 * handlePlayerHit — called when an invader bullet hits the player.
 */
function handlePlayerHit() {
  if (isInvuln) return;  // ignore during invulnerability window

  _state.lives -= 1;

  if (_state.lives <= 0) {
    // Game over
    if (_onGameOver) _onGameOver();
    return;
  }

  // Respawn player at default start position
  if (_playerRef) {
    _playerRef.x = PLAYER_START_X;
    _playerRef.y = PLAYER_START_Y;
    _playerRef.bullet = null;
  }

  // Clear enemy bullets to give the player a fair start
  enemyBullets = [];

  // Begin 2-second invulnerability
  isInvuln    = true;
  invulnTimer = INVULN_DURATION;
  flashTimer  = 0;
  shipVisible = true;
}

// ---------------------------------------------------------------------------
// Level protocol implementation
// ---------------------------------------------------------------------------

const level2 = {
  /**
   * init — called once when Level 2 starts.
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} state  — shared game state from game.js
   */
  init(ctx, state) {
    _ctx   = ctx;
    _state = state;
    _playerRef = state.player;  // game.js provides player reference via state

    // Grab callbacks from state
    _onLoseLife   = state.onLoseLife   || null;
    _onGameOver   = state.onGameOver   || null;
    _onLevelClear = state.onLevelClear || null;

    // Reset formation for Level 2
    resetFormationLevel2();

    // Reset level-local state
    directionX   = 1;
    stepTimer    = 0;
    enemyBullets = [];
    fireTimer    = 0;
    fireInterval = randomFireInterval();
    ufoTimer     = 0;
    ufoActive    = false;
    ufo          = null;
    ufoSide      = 0;
    invulnTimer  = 0;
    flashTimer   = 0;
    shipVisible  = true;
    isInvuln     = false;
  },

  /**
   * update — called every fixed tick (dt seconds) by the game loop.
   * @param {number} dt  seconds
   * @param {object} state  shared game state
   */
  update(dt, state) {
    _state = state;
    _playerRef = state.player;
    const dtMs = dt * 1000;

    // ------------------------------------------------------------------
    // 0. Sync score from score module into state
    // ------------------------------------------------------------------
    // (game.js does hudState.score = getScore() after update; no action needed here)

    // ------------------------------------------------------------------
    // 1. Level-clear check
    // ------------------------------------------------------------------
    const aliveCount = invaders.filter(inv => inv.alive).length;
    if (aliveCount === 0) {
      if (_onLevelClear) _onLevelClear();
      return;
    }

    // ------------------------------------------------------------------
    // 2. Formation step timer
    // ------------------------------------------------------------------
    stepTimer += dtMs;
    const interval = level2StepInterval(aliveCount);
    if (stepTimer >= interval) {
      stepTimer -= interval;
      _stepFormation();
    }

    // ------------------------------------------------------------------
    // 3. Enemy fire timer
    // ------------------------------------------------------------------
    fireTimer += dtMs;
    if (fireTimer >= fireInterval) {
      fireTimer   -= fireInterval;
      fireInterval = randomFireInterval();
      _fireEnemyBullet();
    }

    // ------------------------------------------------------------------
    // 4. Move enemy bullets
    // ------------------------------------------------------------------
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      enemyBullets[i].y += ENEMY_BULLET_SPEED * dt;
      // Remove if off-screen
      if (enemyBullets[i].y > CANVAS_HEIGHT) {
        enemyBullets.splice(i, 1);
      }
    }

    // ------------------------------------------------------------------
    // 5. Enemy bullet vs. player collision
    // ------------------------------------------------------------------
    if (_playerRef) {
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const eb = enemyBullets[i];
        checkInvaderBulletVsPlayer(
          eb,
          { width: ENEMY_BULLET_WIDTH, height: ENEMY_BULLET_HEIGHT },
          _playerRef,
          () => {
            enemyBullets.splice(i, 1);
            handlePlayerHit();
          }
        );
      }
    }

    // ------------------------------------------------------------------
    // 6. Player bullet vs. invaders (handled by game.js runCollisionPass)
    //    We only need to handle UFO collision here
    // ------------------------------------------------------------------

    // ------------------------------------------------------------------
    // 7. UFO timer
    // ------------------------------------------------------------------
    ufoTimer += dtMs;
    if (!ufoActive && ufoTimer >= UFO_INTERVAL) {
      ufoTimer = 0;
      spawnUFO();
    }

    // ------------------------------------------------------------------
    // 8. UFO movement and collision with player bullet
    // ------------------------------------------------------------------
    if (ufoActive && ufo !== null) {
      ufo.x += UFO_SPEED * ufo.dirX * dt;

      // Check if UFO exited the opposite edge
      const exitedRight = ufo.dirX > 0 && ufo.x > CANVAS_WIDTH;
      const exitedLeft  = ufo.dirX < 0 && ufo.x + UFO_WIDTH < 0;
      if (exitedRight || exitedLeft) {
        ufoActive = false;
        ufo       = null;
        ufoTimer  = 0;  // reset timer for next UFO
      } else {
        // Check player bullet vs UFO
        if (_playerRef && _playerRef.bullet !== null) {
          const bulletRect = {
            x:      _playerRef.bullet.x,
            y:      _playerRef.bullet.y,
            width:  4,
            height: 12,
          };
          const ufoRect = {
            x:      ufo.x,
            y:      ufo.y,
            width:  UFO_WIDTH,
            height: UFO_HEIGHT,
          };
          if (checkCollision(bulletRect, ufoRect)) {
            // Award score based on totalShotsFired % 4
            const tier  = (state.totalShotsFired || 0) % 4;
            const pts   = UFO_SCORE_TABLE[tier];
            addScore(pts);
            state.score = (state.score || 0) + pts;
            // Consume bullet
            _playerRef.bullet = null;
            // Destroy UFO
            addExplosion(ufo.x + UFO_WIDTH / 2, ufo.y + UFO_HEIGHT / 2);
            ufoActive = false;
            ufo       = null;
            ufoTimer  = 0;
          }
        }
      }
    }

    // ------------------------------------------------------------------
    // 9. Invulnerability / flash timer
    // ------------------------------------------------------------------
    if (isInvuln) {
      invulnTimer -= dtMs;
      flashTimer  += dtMs;

      if (flashTimer >= FLASH_INTERVAL) {
        flashTimer  -= FLASH_INTERVAL;
        shipVisible  = !shipVisible;
      }

      if (invulnTimer <= 0) {
        isInvuln    = false;
        shipVisible = true;
        invulnTimer = 0;
        flashTimer  = 0;
      }
    }

    // ------------------------------------------------------------------
    // 10. Formation bottom edge vs. player row
    // ------------------------------------------------------------------
    const living = invaders.filter(inv => inv.alive);
    if (living.length > 0) {
      const bottomEdge = Math.max(...living.map(inv => inv.y + INVADER_HEIGHT));
      const playerY    = _playerRef ? _playerRef.y : CANVAS_HEIGHT;
      if (bottomEdge >= playerY) {
        if (state.lives <= 0) {
          if (_onGameOver) _onGameOver();
        } else {
          if (_onLoseLife) _onLoseLife();
        }
      }
    }
  },

  /**
   * draw — render Level 2 entities.
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} state
   */
  draw(ctx, state) {
    // Draw invaders
    ctx.save();
    ctx.fillStyle = '#00FF00';
    for (const inv of invaders) {
      if (!inv.alive) continue;
      ctx.fillRect(inv.x, inv.y, INVADER_WIDTH, INVADER_HEIGHT);
    }
    ctx.restore();

    // Draw enemy bullets
    ctx.save();
    ctx.fillStyle = '#FF4444';
    for (const eb of enemyBullets) {
      ctx.fillRect(eb.x, eb.y, ENEMY_BULLET_WIDTH, ENEMY_BULLET_HEIGHT);
    }
    ctx.restore();

    // Draw UFO (if active)
    if (ufoActive && ufo !== null) {
      _drawUFO(ctx);
    }

    // Draw player ship (respecting invulnerability flash)
    if (_playerRef && shipVisible) {
      _playerRef.draw(ctx);
    }
  },
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function _stepFormation() {
  const living = invaders.filter(inv => inv.alive);
  if (living.length === 0) return;

  const rightEdge = Math.max(...living.map(inv => inv.x + INVADER_WIDTH));
  const leftEdge  = Math.min(...living.map(inv => inv.x));

  const hitRight = directionX > 0 && rightEdge + STEP_X > CANVAS_WIDTH;
  const hitLeft  = directionX < 0 && leftEdge  - STEP_X < 0;

  if (hitRight || hitLeft) {
    for (const inv of invaders) {
      inv.y += DROP_Y;
    }
    directionX = -directionX;
  } else {
    for (const inv of invaders) {
      inv.x += STEP_X * directionX;
    }
  }
}

function _fireEnemyBullet() {
  const eligible = getBottomInvaderPerColumn();
  if (eligible.length === 0) return;

  const shooter = eligible[Math.floor(Math.random() * eligible.length)];
  enemyBullets.push({
    x: shooter.x + INVADER_WIDTH  / 2 - ENEMY_BULLET_WIDTH / 2,
    y: shooter.y + INVADER_HEIGHT,
  });
}

/**
 * _drawUFO — render the UFO using a procedural sprite (the game has no
 * separate sprite sheet; the existing invader rendering is also procedural).
 * The UFO is drawn as a classic saucer shape using canvas arcs and rectangles.
 */
function _drawUFO(ctx) {
  const x = ufo.x;
  const y = ufo.y;
  const w = UFO_WIDTH;
  const h = UFO_HEIGHT;

  ctx.save();

  // Body — lower ellipse / rectangle
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(x + 8, y + 8, w - 16, h - 8);

  // Dome — upper arc
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 10, w / 2 - 4, Math.PI, 0, false);
  ctx.fillStyle = '#FF6666';
  ctx.fill();

  // Lights — three small circles along the belly
  ctx.fillStyle = '#FFFF00';
  const lightY = y + h - 4;
  ctx.beginPath(); ctx.arc(x + w * 0.25, lightY, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w * 0.50, lightY, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w * 0.75, lightY, 3, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

export default level2;
