import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  INVADER_COLUMNS,
  INVADER_ROWS,
  INVADER_WIDTH,
  INVADER_HEIGHT,
  INVADER_GUTTER_X,
  INVADER_GUTTER_Y,
  INVADER_TOP_MARGIN,
} from './gameConfig.js';
import { Level1 } from './level1.js';
import { aabbOverlap } from './collision.js';

// Same 11x5 grid Level 1 uses -- columns/rows come from gameConfig.js, the
// same source Level 1 reads, rather than being restated here.
const TOTAL_INVADERS = INVADER_COLUMNS * INVADER_ROWS; // 55

// Level 2 marches at every stage of Level 1's own step-interval curve, just
// faster -- this is the only place that picks the multiplier.
const STEP_INTERVAL_MULTIPLIER = 0.67;

// Marching distance/drop reuse Level 1's feel; only the cadence changes.
const STEP_DISTANCE = 8; // px per step
const ROW_DROP = INVADER_HEIGHT;

const INVADER_COLOR = '#39ff14';

const INVADER_FIRE_MIN_DELAY_MS = 800;
const INVADER_FIRE_MAX_DELAY_MS = 2000;
const INVADER_BULLET_SPEED = 300; // px/s
const INVADER_BULLET_WIDTH = 4;
const INVADER_BULLET_HEIGHT = 16;
const INVADER_BULLET_COLOR = '#ff4136';

const UFO_SPAWN_INTERVAL = 20; // seconds of Level 2 play time
const UFO_SPEED = 120; // px/s
const UFO_WIDTH = 48;
const UFO_HEIGHT = 20;
const UFO_Y = 12;
const UFO_COLOR = '#ff00ff';

// cumulativeShotCount % 4 mapped ascending -- index 0 -> 50, ... 3 -> 300.
// No RNG involved: the same shot count always lands on the same tier.
const UFO_SCORE_TIERS = [50, 100, 150, 300];

const FORMATION_WIDTH =
  INVADER_COLUMNS * INVADER_WIDTH + (INVADER_COLUMNS - 1) * INVADER_GUTTER_X;
const FORMATION_START_X = (CANVAS_WIDTH - FORMATION_WIDTH) / 2;

function createFleet() {
  const fleet = [];
  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let col = 0; col < INVADER_COLUMNS; col++) {
      fleet.push({
        x: FORMATION_START_X + col * (INVADER_WIDTH + INVADER_GUTTER_X),
        y: INVADER_TOP_MARGIN + row * (INVADER_HEIGHT + INVADER_GUTTER_Y),
        width: INVADER_WIDTH,
        height: INVADER_HEIGHT,
        alive: true,
      });
    }
  }
  return fleet;
}

function randomFireDelaySeconds() {
  const ms =
    INVADER_FIRE_MIN_DELAY_MS +
    Math.random() * (INVADER_FIRE_MAX_DELAY_MS - INVADER_FIRE_MIN_DELAY_MS);
  return ms / 1000;
}

// Reassigned wholesale by reset(), same reason Level1.fleet is a getter.
let fleet = createFleet();

// 1 steps right, -1 steps left. Flipped by dropAndReverse() whenever the
// living formation's leading edge would cross a canvas wall.
let direction = 1;
let stepTimer = 0;

// A single global fire timer (not one per column) -- counts down from a
// fresh random 800-2000ms delay and fires again on reaching zero.
let fireTimer = randomFireDelaySeconds();

// Invader bullets this level owns, in the same shape boss.js's `bullets`
// uses -- game.js runs it through collision.js's existing
// checkInvaderBulletsVsPlayer(Level2.bullets, Player, hud) instead of a new
// hit-test.
const bullets = [];

// Fires every UFO_SPAWN_INTERVAL seconds of level time regardless of
// whether the previous UFO was hit, missed, or is still on screen.
let ufoTimer = 0;
let ufoSpawnCount = 0;
let ufo = null;

function aliveCount() {
  let count = 0;
  for (const invader of fleet) {
    if (invader.alive) {
      count++;
    }
  }
  return count;
}

function stepIntervalSeconds(n) {
  return Level1.stepIntervalSeconds(n) * STEP_INTERVAL_MULTIPLIER;
}

// Bounding box of the living invaders only, same reasoning as level1.js:
// dead columns must not keep holding the box at its original width.
function livingBounds() {
  let minX = Infinity;
  let maxX = -Infinity;
  for (const invader of fleet) {
    if (!invader.alive) {
      continue;
    }
    minX = Math.min(minX, invader.x);
    maxX = Math.max(maxX, invader.x + invader.width);
  }
  return { minX, maxX };
}

function dropAndReverse() {
  direction *= -1;
  for (const invader of fleet) {
    invader.y += ROW_DROP;
  }
}

function step() {
  const { minX, maxX } = livingBounds();
  if (direction > 0 && maxX + STEP_DISTANCE > CANVAS_WIDTH) {
    dropAndReverse();
    return;
  }
  if (direction < 0 && minX - STEP_DISTANCE < 0) {
    dropAndReverse();
    return;
  }

  const dx = direction * STEP_DISTANCE;
  for (const invader of fleet) {
    invader.x += dx;
  }
}

// Columns (by index) that still have at least one living invader -- only
// these can be chosen as the next shooter.
function livingColumns() {
  const columns = [];
  for (let col = 0; col < INVADER_COLUMNS; col++) {
    for (let row = 0; row < INVADER_ROWS; row++) {
      if (fleet[row * INVADER_COLUMNS + col].alive) {
        columns.push(col);
        break;
      }
    }
  }
  return columns;
}

// The lowest (highest row index) living invader in a column -- rows are
// stored top-to-bottom, so the last alive entry found while scanning
// downward is the front rank for that column.
function lowestAliveInColumn(col) {
  let lowest = null;
  for (let row = 0; row < INVADER_ROWS; row++) {
    const invader = fleet[row * INVADER_COLUMNS + col];
    if (invader.alive) {
      lowest = invader;
    }
  }
  return lowest;
}

function fireInvaderBullet() {
  const columns = livingColumns();
  if (columns.length === 0) {
    return;
  }

  const col = columns[Math.floor(Math.random() * columns.length)];
  const shooter = lowestAliveInColumn(col);

  bullets.push({
    x: shooter.x + shooter.width / 2 - INVADER_BULLET_WIDTH / 2,
    y: shooter.y + shooter.height,
    width: INVADER_BULLET_WIDTH,
    height: INVADER_BULLET_HEIGHT,
  });
}

function updateFireTimer(dt) {
  if (aliveCount() === 0) {
    return;
  }

  fireTimer -= dt;
  while (fireTimer <= 0) {
    fireInvaderBullet();
    fireTimer += randomFireDelaySeconds();
  }
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.y += INVADER_BULLET_SPEED * dt;
    if (bullet.y > CANVAS_HEIGHT) {
      bullets.splice(i, 1);
    }
  }
}

function spawnUfo() {
  const enterFromLeft = ufoSpawnCount % 2 === 0;
  ufoSpawnCount += 1;

  ufo = enterFromLeft
    ? { x: -UFO_WIDTH, y: UFO_Y, width: UFO_WIDTH, height: UFO_HEIGHT, vx: UFO_SPEED }
    : { x: CANVAS_WIDTH, y: UFO_Y, width: UFO_WIDTH, height: UFO_HEIGHT, vx: -UFO_SPEED };
}

function updateUfo(dt) {
  ufoTimer += dt;
  while (ufoTimer >= UFO_SPAWN_INTERVAL) {
    ufoTimer -= UFO_SPAWN_INTERVAL;
    spawnUfo();
  }

  if (!ufo) {
    return;
  }

  ufo.x += ufo.vx * dt;
  const exitedRight = ufo.vx > 0 && ufo.x > CANVAS_WIDTH;
  const exitedLeft = ufo.vx < 0 && ufo.x + ufo.width < 0;
  if (exitedRight || exitedLeft) {
    ufo = null;
  }
}

function update(dt) {
  const n = aliveCount();
  if (n > 0) {
    stepTimer += dt;
    const interval = stepIntervalSeconds(n);
    while (stepTimer >= interval) {
      stepTimer -= interval;
      step();
      if (aliveCount() === 0) {
        break;
      }
    }
  }

  updateFireTimer(dt);
  updateBullets(dt);
  updateUfo(dt);
}

// Tests the player's in-flight bullet against the live UFO (if any) using
// collision.js's shared aabbOverlap -- no second overlap implementation
// here. The score tier is read from player.shotCount, which already
// includes the shot that just landed, per spec.
function checkUfoHit(player, hud) {
  if (!ufo) {
    return;
  }

  const bulletBounds = player.getBulletBounds();
  if (!bulletBounds || !aabbOverlap(bulletBounds, ufo)) {
    return;
  }

  player.deactivateBullet();
  hud.score += UFO_SCORE_TIERS[player.shotCount % 4];
  ufo = null;
}

// True when any living invader's body overlaps the player -- the
// "descending invader" contact death condition, distinct from Level 1's
// invasion-reset mechanic.
function checkPlayerContact(player) {
  for (const invader of fleet) {
    if (invader.alive && aabbOverlap(invader, player)) {
      return true;
    }
  }
  return false;
}

function draw(ctx) {
  ctx.fillStyle = INVADER_COLOR;
  for (const invader of fleet) {
    if (invader.alive) {
      ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
    }
  }

  ctx.fillStyle = INVADER_BULLET_COLOR;
  for (const bullet of bullets) {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }

  if (ufo) {
    ctx.fillStyle = UFO_COLOR;
    ctx.fillRect(ufo.x, ufo.y, ufo.width, ufo.height);
  }
}

function isCleared() {
  return aliveCount() === 0;
}

// Rebuilds the fleet and every timer at their start state. Called by
// game.js's startRun() so every fresh run begins Level 2 clean even if the
// previous run left it mid-fight.
function reset() {
  fleet = createFleet();
  direction = 1;
  stepTimer = 0;
  fireTimer = randomFireDelaySeconds();
  bullets.length = 0;
  ufoTimer = 0;
  ufoSpawnCount = 0;
  ufo = null;
}

export const Level2 = {
  update,
  draw,
  isCleared,
  reset,
  checkUfoHit,
  checkPlayerContact,
  bullets,
  get fleet() {
    return fleet;
  },
};
