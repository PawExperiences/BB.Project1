// level2.js — Level 2: They Shoot Back
// ES module driving Level 2 of Space Invaders.
// Exposes initLevel2(), updateLevel2(dt), renderLevel2(ctx).
//
// Design decisions:
//   - UFO first enters from the LEFT side. Subsequent UFOs alternate sides.
//   - Formation speed = Level 1 interval × 0.67 (1.5× faster).
//   - totalShotsFired is carried over from Level 1 and accumulated here.

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { InvaderGrid, INVADER_W, INVADER_H, GAP } from './invaders.js';
import { Player } from './player.js';
import { ExplosionPool } from './explosions.js';
import { collide } from './collisions.js';
import { hudState, transitionTo } from './game.js';
import { computeStepInterval, getTotalShotsFired } from './level1.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Formation speed multiplier vs Level 1
const SPEED_MULTIPLIER = 0.67;

// Formation initial offset (same as Level 1)
const GRID_TARGET_TOP_Y      = 48;
const GRID_INTERNAL_START_Y  = 80;
const INITIAL_OFFSET_Y       = GRID_TARGET_TOP_Y - GRID_INTERNAL_START_Y; // -32

// Enemy bullet
const ENEMY_BULLET_SPEED  = 300; // px/s downward
const ENEMY_BULLET_W      = 3;
const ENEMY_BULLET_H      = 12;

// Enemy shoot timer bounds (ms)
const SHOOT_TIMER_MIN = 800;
const SHOOT_TIMER_MAX = 2000;

// UFO
const UFO_SPAWN_INTERVAL = 20000; // ms — fixed 20-second cycle
const UFO_SPEED          = 120;   // px/s
const UFO_W              = 48;
const UFO_H              = 20;
// First UFO enters from LEFT (documented choice).
const UFO_FIRST_SIDE = 'left';

// UFO score tiers indexed by totalShotsFired % 4
const UFO_SCORE_TIERS = [50, 100, 150, 300];

// Player respawn constants (must match player.js)
const SHIP_WIDTH   = 40;
const SHIP_HEIGHT  = 32;
const FLOOR_MARGIN = 24;
const PLAYER_START_X = CANVAS_WIDTH / 2;     // centre-x
const PLAYER_START_Y = CANVAS_HEIGHT - SHIP_HEIGHT - FLOOR_MARGIN; // 840 — top edge

// Invulnerability window after respawn
const INVULN_DURATION = 2.0; // seconds
const FLASH_PERIOD    = 0.15; // seconds per flash half-cycle

// Lose condition: formation bottom reaches player row
const PLAYER_ROW_Y = CANVAS_HEIGHT - SHIP_HEIGHT - FLOOR_MARGIN; // 840

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/** @type {Player|null} */
let player = null;

/** @type {InvaderGrid|null} */
let invaderGrid = null;

/** @type {ExplosionPool|null} */
let explosions = null;

// Formation step timer (ms)
let stepTimer = 0;

// Whether Level 2 is cleared
let levelCleared = false;

// Cumulative shots fired (carried over from Level 1 + accumulated in Level 2)
let totalShotsFired = 0;

// Track previous player bullet state for shot counting
let _prevBulletActive = false;

// ----- Enemy bullets -----
// Array of { x, y } objects representing enemy bullets in flight
/** @type {Array<{x: number, y: number}>} */
let enemyBullets = [];

// Enemy shoot timer (ms remaining until next shot)
let shootTimer = 0;

// ----- UFO state -----
/** @type {{ x: number, y: number, direction: number } | null} */
let ufo = null;

// Accumulated time since Level 2 start (ms) for fixed UFO spawn cycle
let ufoSpawnAccum = 0;

// Which spawn index we're on (0 = first spawn). Used to determine side.
let ufoSpawnCount = 0;

// ----- Invulnerability -----
let invulnTimer = 0;   // seconds remaining; 0 = not invulnerable
let flashTimer  = 0;   // for flashing effect
let shipVisible = true;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Randomise the enemy shoot timer to a value in [SHOOT_TIMER_MIN, SHOOT_TIMER_MAX] ms.
 */
function randomiseShootTimer() {
  shootTimer = SHOOT_TIMER_MIN + Math.random() * (SHOOT_TIMER_MAX - SHOOT_TIMER_MIN);
}

/**
 * Return the lowest-in-column live invader for each column that has any.
 * "Lowest" means largest y (furthest down the canvas).
 * @returns {Array<object>} one invader per column that has live invaders
 */
function lowestInvadersPerColumn() {
  const byCol = {};
  for (const inv of invaderGrid.liveInvaders()) {
    const existing = byCol[inv.col];
    if (!existing || inv.row > existing.row) {
      byCol[inv.col] = inv;
    }
  }
  return Object.values(byCol);
}

/**
 * Spawn a UFO from the appropriate side based on spawn index.
 * Even index → left (first, third, …); odd index → right.
 */
function spawnUFO() {
  const fromLeft = (ufoSpawnCount % 2 === 0); // left on even (0, 2, 4, …)
  const direction = fromLeft ? 1 : -1;
  const startX    = fromLeft ? -UFO_W : CANVAS_WIDTH;
  ufo = {
    x: startX,
    y: 30,         // just below HUD
    direction,
  };
  ufoSpawnCount++;
}

/**
 * AABB overlap test.
 * @param {{x:number,y:number,w:number,h:number}} a
 * @param {{x:number,y:number,w:number,h:number}} b
 * @returns {boolean}
 */
function aabb(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

/**
 * Reset player to fixed start position (bottom-centre) and grant invulnerability.
 */
function respawnPlayer() {
  player.x = PLAYER_START_X - SHIP_WIDTH / 2;
  player.y = PLAYER_START_Y;
  invulnTimer = INVULN_DURATION;
  flashTimer  = 0;
  shipVisible = true;
}

/**
 * Compute formation bottom edge (canvas-space).
 * Returns -Infinity if no live invaders.
 */
function formationBottomY() {
  const live = invaderGrid.liveInvaders();
  if (live.length === 0) return -Infinity;
  let maxBottom = -Infinity;
  for (const inv of live) {
    const { y, h } = invaderGrid.invaderRect(inv);
    const bottom = y + h;
    if (bottom > maxBottom) maxBottom = bottom;
  }
  return maxBottom;
}

/**
 * Reset the formation for Level 2 (all invaders alive, same start position).
 */
function resetFormation() {
  invaderGrid = new InvaderGrid();
  invaderGrid.offsetY = INITIAL_OFFSET_Y;
  stepTimer = 0;
  levelCleared = false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise Level 2.
 * Called by game.js when transitioning from Level 1.
 * Lives and cumulative shot counter are carried over — do NOT reset them here.
 */
export function initLevel2() {
  // Carry over cumulative shots from Level 1
  totalShotsFired  = getTotalShotsFired();
  _prevBulletActive = false;

  // Create player at fixed start position (lives already set in hudState)
  player = new Player(PLAYER_START_X, null);
  // Sync lives from hudState (carried over from Level 1)
  player.lives = hudState.lives;

  explosions = new ExplosionPool();

  hudState.level = 2;
  // score and lives are NOT reset — they carry over

  // Formation
  resetFormation();

  // Enemy fire
  enemyBullets = [];
  randomiseShootTimer();

  // UFO
  ufo           = null;
  ufoSpawnAccum = 0;
  ufoSpawnCount = 0;

  // Invulnerability
  invulnTimer = 0;
  flashTimer  = 0;
  shipVisible = true;
}

/**
 * Update Level 2 for one fixed-timestep tick.
 * @param {number} dt  Delta time in seconds.
 */
export function updateLevel2(dt) {
  if (levelCleared) return;

  const dtMs = dt * 1000;

  // --- Player update ---
  player.update(dt);

  // --- Track shots fired (Level 2 contribution) ---
  const bulletNow = player.bulletActive;
  if (bulletNow && !_prevBulletActive) {
    totalShotsFired++;
  }
  _prevBulletActive = bulletNow;

  // --- Formation step timing (Level 1 curve × 0.67) ---
  stepTimer += dtMs;
  const liveCount = invaderGrid.liveInvaders().length;
  const interval  = computeStepInterval(liveCount) * SPEED_MULTIPLIER;
  if (stepTimer >= interval) {
    stepTimer -= interval;
    invaderGrid._tickCount = 29;
    invaderGrid.update();
  } else {
    if (invaderGrid._tickCount < 28) {
      invaderGrid._tickCount++;
    }
  }

  // --- Player bullet vs invader collision (re-use shared collide pass) ---
  collide(player, invaderGrid, explosions, hudState);

  // --- Explosion tick ---
  explosions.tick();

  // --- Enemy shoot timer ---
  if (liveCount > 0) {
    shootTimer -= dtMs;
    if (shootTimer <= 0) {
      // Find eligible shooters (lowest per column) and pick one at random
      const shooters = lowestInvadersPerColumn();
      if (shooters.length > 0) {
        const chosen = shooters[Math.floor(Math.random() * shooters.length)];
        const rect   = invaderGrid.invaderRect(chosen);
        // Spawn bullet at bottom-centre of the chosen invader
        enemyBullets.push({
          x: rect.x + INVADER_W / 2 - ENEMY_BULLET_W / 2,
          y: rect.y + INVADER_H,
        });
      }
      randomiseShootTimer();
    }
  }

  // --- Move enemy bullets ---
  for (const eb of enemyBullets) {
    eb.y += ENEMY_BULLET_SPEED * dt;
  }
  // Silently remove bullets that exit the bottom of the canvas
  enemyBullets = enemyBullets.filter(eb => eb.y < CANVAS_HEIGHT);

  // --- Enemy bullet vs player collision ---
  // Only check if not currently invulnerable
  if (invulnTimer <= 0) {
    const playerRect = {
      x: player.x,
      y: player.y,
      w: player.width,
      h: player.height,
    };
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const eb = enemyBullets[i];
      const ebRect = { x: eb.x, y: eb.y, w: ENEMY_BULLET_W, h: ENEMY_BULLET_H };
      if (aabb(ebRect, playerRect)) {
        // Hit — consume bullet, lose a life, respawn
        enemyBullets.splice(i, 1);
        hudState.lives--;
        player.lives = hudState.lives;

        if (hudState.lives <= 0) {
          if (hudState.score > hudState.hiScore) {
            hudState.hiScore = hudState.score;
          }
          transitionTo('gameover');
          return;
        }

        // Respawn with invulnerability
        respawnPlayer();
        break; // only one hit per tick
      }
    }
  }

  // --- Invulnerability / flashing countdown ---
  if (invulnTimer > 0) {
    invulnTimer -= dt;
    flashTimer  += dt;
    // Toggle visibility every FLASH_PERIOD seconds
    shipVisible = Math.floor(flashTimer / FLASH_PERIOD) % 2 === 0;
    if (invulnTimer <= 0) {
      invulnTimer = 0;
      shipVisible = true; // ensure ship is visible when window ends
    }
  }

  // --- UFO spawn cycle (fixed 20-second interval from Level 2 start) ---
  ufoSpawnAccum += dtMs;
  if (ufoSpawnAccum >= UFO_SPAWN_INTERVAL) {
    ufoSpawnAccum -= UFO_SPAWN_INTERVAL;
    if (ufo === null) {
      spawnUFO();
    } else {
      // Previous UFO still on screen — spawn next one anyway (spec: fixed interval)
      // But to avoid two simultaneous UFOs we skip this spawn tick.
      // The fixed interval keeps ticking regardless of UFO state.
      spawnUFO();
    }
  }

  // --- UFO movement ---
  if (ufo !== null) {
    ufo.x += UFO_SPEED * ufo.direction * dt;

    // Check if fully off-screen
    const offLeft  = ufo.direction === -1 && ufo.x + UFO_W < 0;
    const offRight = ufo.direction ===  1 && ufo.x > CANVAS_WIDTH;
    if (offLeft || offRight) {
      // No points — UFO escaped
      ufo = null;
    }
  }

  // --- Player bullet vs UFO collision ---
  if (ufo !== null) {
    const bulletSnapshot = player.bullet;
    if (bulletSnapshot !== null) {
      const bRect   = { x: bulletSnapshot.x, y: bulletSnapshot.y, w: bulletSnapshot.width, h: bulletSnapshot.height };
      const ufoRect = { x: ufo.x, y: ufo.y, w: UFO_W, h: UFO_H };
      if (aabb(bRect, ufoRect)) {
        // Award points based on totalShotsFired % 4
        const tier  = totalShotsFired % 4;
        const score = UFO_SCORE_TIERS[tier];
        hudState.score += score;
        if (hudState.score > hudState.hiScore) {
          hudState.hiScore = hudState.score;
        }
        // Destroy UFO and consume bullet
        ufo = null;
        player._bullet = null;
        // Spawn explosion roughly where the UFO was
        explosions.spawn(bRect.x - INVADER_W / 2, bRect.y);
      }
    }
  }

  // --- Win condition: all invaders destroyed ---
  if (invaderGrid.liveInvaders().length === 0) {
    levelCleared = true;
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    // Future: transitionTo('level3'). For now, game over with win state.
    transitionTo('gameover');
    return;
  }

  // --- Lose condition: formation bottom reaches player row ---
  const bottomY = formationBottomY();
  if (bottomY >= PLAYER_ROW_Y) {
    hudState.lives--;
    player.lives = hudState.lives;
    if (hudState.lives <= 0) {
      if (hudState.score > hudState.hiScore) {
        hudState.hiScore = hudState.score;
      }
      transitionTo('gameover');
      return;
    }
    // Respawn, reset formation
    const savedScore = hudState.score;
    const savedLives = hudState.lives;
    resetFormation();
    enemyBullets = [];
    hudState.score = savedScore;
    hudState.lives = savedLives;
    player.lives   = savedLives;
    respawnPlayer();
  }
}

/**
 * Render Level 2 entities.
 * Draw order: UFO, invader formation, explosions, enemy bullets, player ship.
 * @param {CanvasRenderingContext2D} ctx
 */
export function renderLevel2(ctx) {
  // UFO
  if (ufo !== null) {
    ctx.fillStyle = '#f0f'; // magenta
    ctx.fillRect(Math.round(ufo.x), Math.round(ufo.y), UFO_W, UFO_H);
    // Dome on top
    ctx.beginPath();
    ctx.arc(Math.round(ufo.x) + UFO_W / 2, Math.round(ufo.y), UFO_W / 4, Math.PI, 0, false);
    ctx.fill();
  }

  // Invader formation
  invaderGrid.draw(ctx);

  // Explosions
  explosions.draw(ctx);

  // Enemy bullets
  ctx.fillStyle = '#f88'; // light red
  for (const eb of enemyBullets) {
    ctx.fillRect(Math.round(eb.x), Math.round(eb.y), ENEMY_BULLET_W, ENEMY_BULLET_H);
  }

  // Player ship (respects flashing during invulnerability)
  if (shipVisible) {
    player.draw(ctx);
  }
}
