// level2.js — Level 2: They Shoot Back
//
// New mechanics layered on top of the Level 1 baseline:
//   1. Invader return fire — bottom-row-only shooters, randomised interval
//   2. Faster formation   — LEVEL2_SPEED_MULTIPLIER × Level 1 step interval
//   3. Bonus UFO          — periodic horizontal crossing, score = UFO_SCORE_TABLE[shotCount % 4]
//   4. Invulnerability    — managed in game.js / player.js; this module only
//                           owns the invader bullet array that game.js checks
//
// Exports:
//   startLevel2()                        — initialise / reset all Level-2 state
//   updateLevel2(dt, player, hudState)   — tick; returns null | 'lose'
//   getInvaderBullets()                  — live array for game.js collision check
//   getUFOState()                        — snapshot for game.js renderer

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  INVADER_COLS,
  INVADER_WIDTH,
  INVADER_HEIGHT,
  INVADER_BULLET_SPEED,
  INVADER_BULLET_WIDTH,
  INVADER_BULLET_HEIGHT,
  INVADER_FIRE_INTERVAL_MIN,
  INVADER_FIRE_INTERVAL_MAX,
  LEVEL2_SPEED_MULTIPLIER,
  UFO_SPEED,
  UFO_WIDTH,
  UFO_HEIGHT,
  UFO_SPAWN_INTERVAL,
  UFO_Y,
  UFO_SCORE_TABLE,
} from './gameConfig.js';

import {
  initInvaders,
  updateInvaders,
  stepFormation,
  getLivingCount,
  getInvaders,
} from './invaders.js';

import { aabbOverlap } from './collision.js';

// ---------------------------------------------------------------------------
// Module-level state — reset by startLevel2()
// ---------------------------------------------------------------------------

let stepAccumulator  = 0;    // ms accumulated since last formation step
let invaderBullets   = [];   // active invader bullet objects
let fireTimer        = 0;    // ms since last invader shot
let nextFireInterval = 1000; // ms until next shot (randomised)

// UFO state
const ufo = { active: false, x: 0, y: UFO_Y, direction: 1 };
let ufoSpawnTimer = 0;    // ms until next UFO spawns
let ufoFromLeft   = true; // spawn direction alternates each appearance

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Pick a random fire delay within [MIN, MAX]. */
function randomFireInterval() {
  return INVADER_FIRE_INTERVAL_MIN +
    Math.random() * (INVADER_FIRE_INTERVAL_MAX - INVADER_FIRE_INTERVAL_MIN);
}

/**
 * Level-2 formation step interval.
 * Uses the same scaling formula as Level 1 but divided by the speed multiplier,
 * so the formation marches measurably faster.
 * @param {number} aliveCount
 * @returns {number} ms between formation steps
 */
function getStepInterval(aliveCount) {
  if (aliveCount <= 0) return 100 / LEVEL2_SPEED_MULTIPLIER;
  const raw            = 100 + (aliveCount - 1) * (700 / 54);
  const level1Interval = Math.min(800, Math.max(100, raw));
  return level1Interval / LEVEL2_SPEED_MULTIPLIER;
}

/**
 * Find the bottom-most living invader in each non-empty column.
 * Per classic Space Invaders rules, only these invaders may fire.
 * @returns {Array} array of invader objects
 */
function getBottomRowShooters() {
  const shooters = [];
  for (let col = 0; col < INVADER_COLS; col++) {
    const colInvaders = getInvaders().filter(inv => inv.alive && inv.col === col);
    if (colInvaders.length === 0) continue;
    const bottom = colInvaders.reduce(
      (deepest, inv) => (inv.row > deepest.row ? inv : deepest)
    );
    shooters.push(bottom);
  }
  return shooters;
}

// ---------------------------------------------------------------------------
// Sub-updates
// ---------------------------------------------------------------------------

/** Tick the firing timer; spawn an invader bullet when it elapses. */
function updateInvaderFiring(dt) {
  fireTimer += dt;
  if (fireTimer < nextFireInterval) return;

  fireTimer       -= nextFireInterval;
  nextFireInterval = randomFireInterval();

  const shooters = getBottomRowShooters();
  if (shooters.length === 0) return;

  const shooter = shooters[Math.floor(Math.random() * shooters.length)];
  invaderBullets.push({
    x:          shooter.x + (INVADER_WIDTH - INVADER_BULLET_WIDTH) / 2,
    y:          shooter.y + INVADER_HEIGHT,
    width:      INVADER_BULLET_WIDTH,
    height:     INVADER_BULLET_HEIGHT,
    active:     true,
    fromPlayer: false,
  });
}

/** Move all active invader bullets downward; cull off-screen ones. */
function updateInvaderBulletPositions(dt) {
  for (const b of invaderBullets) {
    if (!b.active) continue;
    b.y += INVADER_BULLET_SPEED * (dt / 1000);
    if (b.y > CANVAS_HEIGHT) b.active = false;
  }
  invaderBullets = invaderBullets.filter(b => b.active);
}

/** Position the UFO at the appropriate canvas edge and activate it. */
function spawnUFO() {
  if (ufoFromLeft) {
    ufo.x         = -UFO_WIDTH; // start just off the left edge
    ufo.direction = 1;           // travel right
  } else {
    ufo.x         = CANVAS_WIDTH; // start just off the right edge
    ufo.direction = -1;           // travel left
  }
  ufo.y      = UFO_Y;
  ufo.active = true;
  ufoFromLeft = !ufoFromLeft;
}

/**
 * Move the UFO; check spawn timer; detect player-bullet hit.
 * On hit: award points based on playerShotCount % 4 and deactivate both
 * the UFO and the player bullet.
 */
function updateUFO(dt, player, hudState) {
  if (!ufo.active) {
    ufoSpawnTimer -= dt;
    if (ufoSpawnTimer <= 0) {
      spawnUFO();
      ufoSpawnTimer = UFO_SPAWN_INTERVAL;
    }
    return;
  }

  // Move UFO
  ufo.x += UFO_SPEED * ufo.direction * (dt / 1000);

  // Exit check — no score change if un-shot
  if (ufo.direction ===  1 && ufo.x > CANVAS_WIDTH)    { ufo.active = false; return; }
  if (ufo.direction === -1 && ufo.x + UFO_WIDTH < 0)   { ufo.active = false; return; }

  // Player-bullet collision check
  // bullet.active may be undefined on a freshly fired bullet (set later by
  // getPlayerBullets); treat undefined as truthy (active).
  const bullet = player.bullet;
  if (bullet !== null && bullet.active !== false) {
    const bRect = {
      x: bullet.x,        y: bullet.y,
      width:  bullet.width  || 4,
      height: bullet.height || 12,
    };
    const uRect = { x: ufo.x, y: ufo.y, width: UFO_WIDTH, height: UFO_HEIGHT };

    if (aabbOverlap(bRect, uRect)) {
      const points       = UFO_SCORE_TABLE[player.shotCount % 4];
      hudState.score    += points;
      bullet.active      = false; // deactivate player bullet
      ufo.active         = false;
      console.info(`[Level 2] UFO shot! shotCount=${player.shotCount} → +${points} pts`);
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise (or reset) all Level-2 state.
 * Does NOT touch hudState.lives, .score, or .hiScore.
 */
export function startLevel2() {
  initInvaders();
  stepAccumulator  = 0;
  invaderBullets   = [];
  fireTimer        = 0;
  nextFireInterval = randomFireInterval();
  ufo.active       = false;
  ufoSpawnTimer    = UFO_SPAWN_INTERVAL / 2; // first UFO arrives sooner
  ufoFromLeft      = true;

  const fullGridInterval    = Math.round(800 / LEVEL2_SPEED_MULTIPLIER);
  console.info(
    `[Level 2] Formation speed ×${LEVEL2_SPEED_MULTIPLIER} vs Level 1.` +
    ` Step interval at full grid: ~${fullGridInterval} ms (Level 1: ~800 ms).`
  );
}

/**
 * Per-tick Level-2 update.  Call once per fixed-timestep frame while PLAYING.
 *
 * Order of operations:
 *   1. Tick explosion visual timers
 *   2. Step formation at Level-2 speed
 *   3. Fire invader bullets on timer
 *   4. Move existing invader bullets
 *   5. Update UFO (spawn timer / movement / hit detection)
 *   6. Check lose condition
 *
 * @param {number} dt                   Fixed step in ms (~16.67)
 * @param {Player} player               Player ship (bullet and shotCount read here)
 * @param {{ score:number }} hudState   Mutated to add UFO score
 * @returns {'lose' | null}
 */
export function updateLevel2(dt, player, hudState) {
  // 1. Explosion timers
  updateInvaders(dt);

  const alive = getLivingCount();
  if (alive === 0) return null; // win detected by game.js after the collision pass

  // 2. Formation stepping at Level-2 speed
  stepAccumulator += dt;
  const interval   = getStepInterval(alive);
  if (stepAccumulator >= interval) {
    stepAccumulator -= interval;
    stepFormation();
  }

  // 3. Invader return fire
  updateInvaderFiring(dt);

  // 4. Move invader bullets
  updateInvaderBulletPositions(dt);

  // 5. UFO
  updateUFO(dt, player, hudState);

  // 6. Lose condition: any living invader has reached the player's row
  const playerTopY = player.y;
  for (const inv of getInvaders()) {
    if (inv.alive && inv.y >= playerTopY) return 'lose';
  }

  return null;
}

/**
 * Return the live array of invader bullet objects.
 * game.js iterates this every tick for player-collision detection.
 * @returns {Array<{x,y,width,height,active,fromPlayer}>}
 */
export function getInvaderBullets() {
  return invaderBullets;
}

/**
 * Return a snapshot of the UFO state for the renderer.
 * @returns {{ active:boolean, x:number, y:number, direction:number }}
 */
export function getUFOState() {
  return { active: ufo.active, x: ufo.x, y: ufo.y, direction: ufo.direction };
}
