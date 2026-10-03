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

// Same 11x5 grid Level 1/Level 2 use -- columns/rows come from
// gameConfig.js, the same source they read, rather than being restated here.
const TOTAL_INVADERS = INVADER_COLUMNS * INVADER_ROWS; // 55

// The split fires the instant at least half the starting 55 are dead (28
// destroyed, 27 left) -- expressed as the alive-count threshold that
// triggers it, since that's what update() can actually observe each tick.
const SPLIT_ALIVE_THRESHOLD = TOTAL_INVADERS - 28; // 27

// Column 6 (1-indexed) joins the LEFT half per spec, i.e. columns 0-5
// (0-indexed) are left and 6-10 are right -- Math.ceil keeps this derived
// from INVADER_COLUMNS instead of a bare literal.
const LEFT_COLUMN_COUNT = Math.ceil(INVADER_COLUMNS / 2); // 6

// Marching distance/drop reuse Level 1/Level 2's feel; only which invaders
// move together (single formation, then two halves) changes.
const STEP_DISTANCE = 8; // px per step
const ROW_DROP = INVADER_HEIGHT;

const INVADER_COLOR = '#39ff14';

// Invader fire is Level 2's behaviour, unchanged -- same delay range, bullet
// shape/speed and colour, duplicated here the same way level2.js duplicated
// level1.js's marching constants rather than importing non-exported values.
const INVADER_FIRE_MIN_DELAY_MS = 800;
const INVADER_FIRE_MAX_DELAY_MS = 2000;
const INVADER_BULLET_SPEED = 300; // px/s
const INVADER_BULLET_WIDTH = 4;
const INVADER_BULLET_HEIGHT = 16;
const INVADER_BULLET_COLOR = '#ff4136';

// Four bunkers, each a 4x4 grid of 8px cells (32x32 overall), tops at ~80%
// of the canvas height -- below the invader field, above the player.
const BUNKER_COUNT = 4;
const BUNKER_GRID_SIZE = 4;
const BUNKER_CELL_SIZE = 8;
const BUNKER_SIZE = BUNKER_GRID_SIZE * BUNKER_CELL_SIZE; // 32
const BUNKER_TOP_Y = Math.round(CANVAS_HEIGHT * 0.8);
const BUNKER_COLOR = '#ffcc00';

// Divides the canvas into BUNKER_COUNT+1 equal gaps (before, between, and
// after the bunkers) so the whole row is evenly spaced and symmetric about
// the canvas centre line -- not just centred gaps between neighbours.
const BUNKER_GAP = (CANVAS_WIDTH - BUNKER_COUNT * BUNKER_SIZE) / (BUNKER_COUNT + 1);

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
        col,
      });
    }
  }
  return fleet;
}

function createBunkers() {
  const bunkers = [];
  for (let i = 0; i < BUNKER_COUNT; i++) {
    const bunkerX = BUNKER_GAP * (i + 1) + BUNKER_SIZE * i;
    const cells = [];
    for (let row = 0; row < BUNKER_GRID_SIZE; row++) {
      for (let col = 0; col < BUNKER_GRID_SIZE; col++) {
        cells.push({
          x: bunkerX + col * BUNKER_CELL_SIZE,
          y: BUNKER_TOP_Y + row * BUNKER_CELL_SIZE,
          width: BUNKER_CELL_SIZE,
          height: BUNKER_CELL_SIZE,
          alive: true,
        });
      }
    }
    bunkers.push({ cells });
  }
  return bunkers;
}

function randomFireDelaySeconds() {
  const ms =
    INVADER_FIRE_MIN_DELAY_MS +
    Math.random() * (INVADER_FIRE_MAX_DELAY_MS - INVADER_FIRE_MIN_DELAY_MS);
  return ms / 1000;
}

// Reassigned wholesale by reset(), same reason Level1.fleet/Level2.fleet are
// getters below instead of plain properties.
let fleet = createFleet();
let bunkers = createBunkers();

// True from the instant the 28th invader dies; before that the whole fleet
// marches as `singleState`, after that `leftState`/`rightState` each track
// their own half independently.
let split = false;
const singleState = { direction: 1, stepTimer: 0 };
const leftState = { direction: 1, stepTimer: 0 };
const rightState = { direction: -1, stepTimer: 0 };

let fireTimer = randomFireDelaySeconds();

// Invader bullets this level owns, same shape as Level2.bullets -- game.js
// runs it through collision.js's existing checkInvaderBulletsVsPlayer
// instead of a new hit-test.
const bullets = [];

function anyColumn() {
  return true;
}

function isLeftColumn(invader) {
  return invader.col < LEFT_COLUMN_COUNT;
}

function isRightColumn(invader) {
  return invader.col >= LEFT_COLUMN_COUNT;
}

function groupAliveCount(predicate) {
  let count = 0;
  for (const invader of fleet) {
    if (invader.alive && predicate(invader)) {
      count++;
    }
  }
  return count;
}

function aliveCount() {
  return groupAliveCount(anyColumn);
}

// Bounding box (x only -- the wall test never needs y) of the living
// invaders that satisfy `predicate`, same reasoning as level1.js/level2.js:
// dead columns must not keep holding the box at its original width.
function groupLivingBounds(predicate) {
  let minX = Infinity;
  let maxX = -Infinity;
  for (const invader of fleet) {
    if (!invader.alive || !predicate(invader)) {
      continue;
    }
    minX = Math.min(minX, invader.x);
    maxX = Math.max(maxX, invader.x + invader.width);
  }
  return { minX, maxX };
}

// Steps (or wall-bounces + drops) every living invader matching `predicate`
// by `state.direction`. Used both for the single pre-split formation
// (predicate = anyColumn) and for each half after the split.
function stepGroupOnce(state, predicate) {
  const { minX, maxX } = groupLivingBounds(predicate);
  if (state.direction > 0 && maxX + STEP_DISTANCE > CANVAS_WIDTH) {
    state.direction *= -1;
    for (const invader of fleet) {
      if (invader.alive && predicate(invader)) {
        invader.y += ROW_DROP;
      }
    }
    return;
  }
  if (state.direction < 0 && minX - STEP_DISTANCE < 0) {
    state.direction *= -1;
    for (const invader of fleet) {
      if (invader.alive && predicate(invader)) {
        invader.y += ROW_DROP;
      }
    }
    return;
  }

  const dx = state.direction * STEP_DISTANCE;
  for (const invader of fleet) {
    if (invader.alive && predicate(invader)) {
      invader.x += dx;
    }
  }
}

function advanceGroup(state, predicate, dt) {
  let n = groupAliveCount(predicate);
  if (n === 0) {
    return;
  }

  state.stepTimer += dt;
  let interval = Level1.stepIntervalSeconds(n);
  while (state.stepTimer >= interval) {
    state.stepTimer -= interval;
    stepGroupOnce(state, predicate);
    n = groupAliveCount(predicate);
    if (n === 0) {
      return;
    }
    interval = Level1.stepIntervalSeconds(n);
  }
}

// Carries the single formation's current direction/step timer into both
// halves -- per spec both halves resume at the same speed they were moving
// at the instant of the split, with opposite initial directions.
function performSplit() {
  split = true;
  leftState.direction = singleState.direction;
  leftState.stepTimer = singleState.stepTimer;
  rightState.direction = -singleState.direction;
  rightState.stepTimer = singleState.stepTimer;
}

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

// The lowest (highest row index) living invader in a column -- same rule as
// level2.js, unaffected by the split since both halves share one column
// index space.
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

// A descending invader's body grinds through any live bunker cell it
// overlaps: the cell is destroyed, the invader keeps going. Runs every
// update() tick (cheap at this scale) so it catches cells newly exposed by
// this frame's movement.
function erodeBunkersWithInvaders() {
  for (const bunker of bunkers) {
    for (const cell of bunker.cells) {
      if (!cell.alive) {
        continue;
      }
      for (const invader of fleet) {
        if (invader.alive && aabbOverlap(invader, cell)) {
          cell.alive = false;
          break;
        }
      }
    }
  }
}

function findLiveCellHit(bounds) {
  for (const bunker of bunkers) {
    for (const cell of bunker.cells) {
      if (cell.alive && aabbOverlap(bounds, cell)) {
        return cell;
      }
    }
  }
  return null;
}

// Tests the player's in-flight bullet against every live bunker cell. A hit
// destroys exactly that cell and consumes the bullet, the same way
// collision.js's checkPlayerBulletVsInvaders consumes it on an invader hit.
function checkPlayerBulletVsBunkers(player) {
  const bulletBounds = player.getBulletBounds();
  if (!bulletBounds) {
    return;
  }

  const cell = findLiveCellHit(bulletBounds);
  if (cell) {
    cell.alive = false;
    player.deactivateBullet();
  }
}

// Tests every live invader bullet against the bunkers, removing any bullet
// that hits a live cell (and destroying that cell) before
// checkInvaderBulletsVsPlayer ever sees it -- a bunker standing between the
// invaders and the player stops the shots it actually blocks.
function checkInvaderBulletsVsBunkers() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const cell = findLiveCellHit(bullets[i]);
    if (cell) {
      cell.alive = false;
      bullets.splice(i, 1);
    }
  }
}

// True if any living invader's body overlaps `player` -- the same
// descending-invader contact condition level2.js's checkPlayerContact uses.
function checkPlayerContact(player) {
  for (const invader of fleet) {
    if (invader.alive && aabbOverlap(invader, player)) {
      return true;
    }
  }
  return false;
}

function update(dt) {
  if (!split && aliveCount() <= SPLIT_ALIVE_THRESHOLD) {
    performSplit();
  }

  if (!split) {
    advanceGroup(singleState, anyColumn, dt);
  } else {
    advanceGroup(leftState, isLeftColumn, dt);
    advanceGroup(rightState, isRightColumn, dt);
  }

  updateFireTimer(dt);
  updateBullets(dt);
  erodeBunkersWithInvaders();
}

function draw(ctx) {
  ctx.fillStyle = BUNKER_COLOR;
  for (const bunker of bunkers) {
    for (const cell of bunker.cells) {
      if (cell.alive) {
        ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
      }
    }
  }

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
}

// True only once every invader in both halves (or the pre-split single
// formation) is dead -- emptying one half early leaves this false for as
// long as the other half still has survivors.
function isCleared() {
  return aliveCount() === 0;
}

// Rebuilds the fleet, the bunkers and every timer/direction at their start
// state. Called by game.js's startRun() so every fresh run begins Level 3
// clean.
function reset() {
  fleet = createFleet();
  bunkers = createBunkers();
  split = false;
  singleState.direction = 1;
  singleState.stepTimer = 0;
  leftState.direction = 1;
  leftState.stepTimer = 0;
  rightState.direction = -1;
  rightState.stepTimer = 0;
  fireTimer = randomFireDelaySeconds();
  bullets.length = 0;
}

export const Level3 = {
  update,
  draw,
  isCleared,
  reset,
  checkPlayerContact,
  checkPlayerBulletVsBunkers,
  checkInvaderBulletsVsBunkers,
  bullets,
  get fleet() {
    return fleet;
  },
  get bunkers() {
    return bunkers;
  },
};
