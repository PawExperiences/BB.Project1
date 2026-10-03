import {
  CANVAS_WIDTH,
  INVADER_COLUMNS,
  INVADER_ROWS,
  INVADER_WIDTH,
  INVADER_HEIGHT,
  INVADER_GUTTER_X,
  INVADER_GUTTER_Y,
  INVADER_TOP_MARGIN,
} from './gameConfig.js';

const TOTAL_INVADERS = INVADER_COLUMNS * INVADER_ROWS; // 55

// Fixed fraction of an invader cell width per marching step -- any fixed
// value reading as classic arcade motion satisfies the spec; this is the
// only place that picks one.
const STEP_DISTANCE = 8; // px per step

// One invader-cell height per wall drop, per spec.
const ROW_DROP = INVADER_HEIGHT;

// Tick interval scales linearly with how many invaders are still alive:
// interval(n) = MIN + (n - 1) * (MAX - MIN) / (TOTAL_INVADERS - 1).
const MIN_STEP_INTERVAL_MS = 100; // at n = 1
const MAX_STEP_INTERVAL_MS = 800; // at n = TOTAL_INVADERS

const INVADER_COLOR = '#39ff14';

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

// Reassigned wholesale by reset() (on an invasion, and by game.js's
// startRun()), so `Level1.fleet` below is a getter, not a plain property --
// a plain property would keep pointing at the array this started with.
let fleet = createFleet();

// 1 steps right, -1 steps left. Flipped by dropAndReverse() whenever the
// *living* formation's leading edge would cross a canvas wall.
let direction = 1;
let stepTimer = 0;

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
  const ms =
    MIN_STEP_INTERVAL_MS +
    ((n - 1) * (MAX_STEP_INTERVAL_MS - MIN_STEP_INTERVAL_MS)) /
      (TOTAL_INVADERS - 1);
  return ms / 1000;
}

// Bounding box of the living invaders only -- dead columns must not keep
// holding the box at its original width, so the block can legitimately
// travel further sideways once outer columns are cleared. Only called while
// at least one invader is alive (update() returns early otherwise).
function livingBounds() {
  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const invader of fleet) {
    if (!invader.alive) {
      continue;
    }
    minX = Math.min(minX, invader.x);
    maxX = Math.max(maxX, invader.x + invader.width);
    maxY = Math.max(maxY, invader.y + invader.height);
  }
  return { minX, maxX, maxY };
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

// Decrements hud.lives and restarts the level in place when the lowest
// living invader reaches the player's row. This is the only life-losing
// path this level owns -- running out of lives entirely is still game.js's
// `hud.lives <= 0` check, same as every other level.
function checkInvasion(player, hud) {
  const { maxY } = livingBounds();
  if (maxY >= player.y) {
    hud.lives -= 1;
    reset();
  }
}

function update(dt, player, hud) {
  const n = aliveCount();
  if (n === 0) {
    return;
  }

  stepTimer += dt;
  const interval = stepIntervalSeconds(n);
  while (stepTimer >= interval) {
    stepTimer -= interval;
    step();
    checkInvasion(player, hud);
    if (aliveCount() === 0) {
      return;
    }
  }
}

function draw(ctx) {
  ctx.fillStyle = INVADER_COLOR;
  for (const invader of fleet) {
    if (invader.alive) {
      ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
    }
  }
}

function isCleared() {
  return aliveCount() === 0;
}

// Rebuilds the fleet at its start position/direction/interval. Called
// internally by checkInvasion() on an invasion, and externally by
// game.js's startRun() so every fresh run begins Level 1 clean.
function reset() {
  fleet = createFleet();
  direction = 1;
  stepTimer = 0;
}

// collision.js reads/writes `alive` on fleet entries directly; it imports
// nothing from here and just gets the array handed to it by game.js.
export const Level1 = {
  update,
  draw,
  isCleared,
  reset,
  // Exposed so level2.js can derive its own (faster) formation cadence by
  // multiplying this curve instead of restating the MIN/MAX interval
  // numbers -- Level 1's own curve is unaffected by anything level2.js does
  // with the result.
  stepIntervalSeconds,
  get fleet() {
    return fleet;
  },
};
