// level3.js — Level 3: Shield Bunkers + Formation Split
// ES module. Registers itself with the game loop via registerLevel().

import { registerLevel, transitionTo, hudState, player } from './game.js';
import { checkHit } from './collision.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { triggerExplosion } from './explosion.js';
import { INVADER_HEIGHT } from './invaders.js';

// ---------------------------------------------------------------------------
// Formation constants
// ---------------------------------------------------------------------------
const COLS = 11;
const ROWS = 5;
const TOTAL_INVADERS = COLS * ROWS; // 55
const SPLIT_THRESHOLD = Math.ceil(TOTAL_INVADERS / 2); // 28

const INVADER_WIDTH = 30;
const H_GAP = 10;
const V_GAP = 10;

const FORMATION_WIDTH = COLS * INVADER_WIDTH + (COLS - 1) * H_GAP; // 430
const FORMATION_START_X = Math.round((CANVAS_WIDTH - FORMATION_WIDTH) / 2); // 169
const FORMATION_START_Y = 80;

const STEP_PX = 8;

// Invader shooting
const ENEMY_BULLET_SPEED = 220; // px/s
const ENEMY_FIRE_INTERVAL_MIN = 800;  // ms
const ENEMY_FIRE_INTERVAL_MAX = 2400; // ms
const ENEMY_BULLET_WIDTH  = 4;
const ENEMY_BULLET_HEIGHT = 14;

// ---------------------------------------------------------------------------
// Bunker constants
// ---------------------------------------------------------------------------
const BUNKER_CELL_SIZE = 8;
const BUNKER_COLS_CELLS = 4;
const BUNKER_ROWS_CELLS = 4;
const BUNKER_WIDTH  = BUNKER_COLS_CELLS * BUNKER_CELL_SIZE; // 32
const BUNKER_HEIGHT = BUNKER_ROWS_CELLS * BUNKER_CELL_SIZE; // 32
const BUNKER_COUNT = 4;
const BUNKER_Y = Math.round(CANVAS_HEIGHT * 0.80);

function buildBunkers() {
  const bunkers = [];
  const spacing = CANVAS_WIDTH / (BUNKER_COUNT + 1);
  for (let b = 0; b < BUNKER_COUNT; b++) {
    const bx = Math.round(spacing * (b + 1) - BUNKER_WIDTH / 2);
    const cells = [];
    for (let r = 0; r < BUNKER_ROWS_CELLS; r++) {
      for (let c = 0; c < BUNKER_COLS_CELLS; c++) {
        cells.push({
          x:      bx + c * BUNKER_CELL_SIZE,
          y:      BUNKER_Y + r * BUNKER_CELL_SIZE,
          width:  BUNKER_CELL_SIZE,
          height: BUNKER_CELL_SIZE,
          alive:  true,
        });
      }
    }
    bunkers.push({ x: bx, y: BUNKER_Y, cells });
  }
  return bunkers;
}

// ---------------------------------------------------------------------------
// Formation state
// ---------------------------------------------------------------------------
let invaders = [];
let splitOccurred = false;
let killCount = 0;
let transitionFired = false;

// Pre-split state
let directionX = 1;
let offsetX    = 0;
let offsetY    = 0;
let stepTimer  = 0;

// Post-split halves: each { invaders, dirX, offsetX, offsetY, stepTimer }
let leftHalf  = null;
let rightHalf = null;

// Enemy bullets
let enemyBullets = [];
let nextFireTimer = 0; // ms until next enemy shot

// Bunkers
let bunkers = [];

// ---------------------------------------------------------------------------
// Build formation
// ---------------------------------------------------------------------------
function buildFormation() {
  invaders = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const baseX = FORMATION_START_X + col * (INVADER_WIDTH + H_GAP);
      const baseY = FORMATION_START_Y + row * (INVADER_HEIGHT + V_GAP);
      invaders.push({
        col,
        row,
        alive: true,
        baseX,
        baseY,
        x: baseX,
        y: baseY,
        width:  INVADER_WIDTH,
        height: INVADER_HEIGHT,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Reset level
// ---------------------------------------------------------------------------
function resetLevel() {
  directionX = 1;
  offsetX    = 0;
  offsetY    = 0;
  stepTimer  = 0;
  splitOccurred = false;
  killCount  = 0;
  transitionFired = false;
  leftHalf  = null;
  rightHalf = null;
  enemyBullets = [];
  nextFireTimer = randomFireInterval();
  bunkers = buildBunkers();
  buildFormation();
  hudState.level = 3;
}

function randomFireInterval() {
  return ENEMY_FIRE_INTERVAL_MIN + Math.random() * (ENEMY_FIRE_INTERVAL_MAX - ENEMY_FIRE_INTERVAL_MIN);
}

// ---------------------------------------------------------------------------
// Formation step helpers
// ---------------------------------------------------------------------------
function getAliveFrom(arr) {
  return arr.filter(inv => inv.alive);
}

function stepHalf(half) {
  const alive = getAliveFrom(half.invaders);
  if (alive.length === 0) return;

  let minX = Infinity, maxX = -Infinity;
  for (const inv of alive) {
    if (inv.x < minX) minX = inv.x;
    if (inv.x + INVADER_WIDTH > maxX) maxX = inv.x + INVADER_WIDTH;
  }

  const nextMin = minX + half.dirX * STEP_PX;
  const nextMax = maxX + half.dirX * STEP_PX;

  if (nextMin < 0 || nextMax > CANVAS_WIDTH) {
    half.dirX *= -1;
    half.offsetY += INVADER_HEIGHT;
  } else {
    half.offsetX += half.dirX * STEP_PX;
  }

  for (const inv of half.invaders) {
    inv.x = inv.baseX + half.offsetX;
    inv.y = inv.baseY + half.offsetY;
  }
}

function stepPreSplit() {
  const alive = getAliveFrom(invaders);
  if (alive.length === 0) return;

  let minX = Infinity, maxX = -Infinity;
  for (const inv of alive) {
    if (inv.x < minX) minX = inv.x;
    if (inv.x + INVADER_WIDTH > maxX) maxX = inv.x + INVADER_WIDTH;
  }

  const nextMin = minX + directionX * STEP_PX;
  const nextMax = maxX + directionX * STEP_PX;

  if (nextMin < 0 || nextMax > CANVAS_WIDTH) {
    directionX *= -1;
    offsetY += INVADER_HEIGHT;
  } else {
    offsetX += directionX * STEP_PX;
  }

  for (const inv of invaders) {
    inv.x = inv.baseX + offsetX;
    inv.y = inv.baseY + offsetY;
  }
}

// ---------------------------------------------------------------------------
// Split into halves
// ---------------------------------------------------------------------------
function triggerSplit() {
  splitOccurred = true;

  const leftInvaders  = invaders.filter(inv => inv.col <= 4);
  const rightInvaders = invaders.filter(inv => inv.col >= 5);

  leftHalf = {
    invaders: leftInvaders,
    dirX:    -1,
    offsetX: offsetX,
    offsetY: offsetY,
    stepTimer: 0,
  };

  rightHalf = {
    invaders: rightInvaders,
    dirX:    +1,
    offsetX: offsetX,
    offsetY: offsetY,
    stepTimer: 0,
  };
}

// ---------------------------------------------------------------------------
// Collision helpers
// ---------------------------------------------------------------------------
function collideBulletWithBunkers(bullet, consumeBullet) {
  for (const bunker of bunkers) {
    for (const cell of bunker.cells) {
      if (!cell.alive) continue;
      if (checkHit(bullet, cell)) {
        cell.alive = false;
        consumeBullet();
        return true;
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// update(dt)
// ---------------------------------------------------------------------------
function update(dt) {
  const dtMs = dt * 1000;

  // -------------------------------------------------------------------------
  // Determine all live invaders (from both halves or pre-split)
  // -------------------------------------------------------------------------
  let allAlive;
  if (splitOccurred) {
    allAlive = [
      ...getAliveFrom(leftHalf.invaders),
      ...getAliveFrom(rightHalf.invaders),
    ];
  } else {
    allAlive = getAliveFrom(invaders);
  }

  // Win condition
  if (allAlive.length === 0 && !transitionFired) {
    transitionFired = true;
    transitionTo('level4');
    return;
  }

  // -------------------------------------------------------------------------
  // Formation movement
  // -------------------------------------------------------------------------
  const STEP_INTERVAL = 600; // ms per step

  if (!splitOccurred) {
    stepTimer += dtMs;
    if (stepTimer >= STEP_INTERVAL) {
      stepTimer -= STEP_INTERVAL;
      stepPreSplit();
    }
  } else {
    leftHalf.stepTimer += dtMs;
    if (leftHalf.stepTimer >= STEP_INTERVAL) {
      leftHalf.stepTimer -= STEP_INTERVAL;
      stepHalf(leftHalf);
    }
    rightHalf.stepTimer += dtMs;
    if (rightHalf.stepTimer >= STEP_INTERVAL) {
      rightHalf.stepTimer -= STEP_INTERVAL;
      stepHalf(rightHalf);
    }
  }

  // -------------------------------------------------------------------------
  // Enemy firing
  // -------------------------------------------------------------------------
  nextFireTimer -= dtMs;
  if (nextFireTimer <= 0 && allAlive.length > 0) {
    nextFireTimer = randomFireInterval();
    const shooter = allAlive[Math.floor(Math.random() * allAlive.length)];
    enemyBullets.push({
      x:      shooter.x + Math.round((INVADER_WIDTH - ENEMY_BULLET_WIDTH) / 2),
      y:      shooter.y + INVADER_HEIGHT,
      width:  ENEMY_BULLET_WIDTH,
      height: ENEMY_BULLET_HEIGHT,
    });
  }

  // Move enemy bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    enemyBullets[i].y += ENEMY_BULLET_SPEED * dt;
    if (enemyBullets[i].y > CANVAS_HEIGHT) {
      enemyBullets.splice(i, 1);
    }
  }

  // -------------------------------------------------------------------------
  // Collision: player bullet vs bunkers
  // -------------------------------------------------------------------------
  const currentPlayer = player;
  if (currentPlayer) {
    const bullet = currentPlayer.getBullet();
    if (bullet) {
      collideBulletWithBunkers(bullet, () => currentPlayer.clearBullet());
    }
  }

  // -------------------------------------------------------------------------
  // Collision: enemy bullets vs bunkers
  // -------------------------------------------------------------------------
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    if (collideBulletWithBunkers(enemyBullets[i], () => { enemyBullets.splice(i, 1); })) {
      // bullet was consumed inside the callback
    }
  }

  // -------------------------------------------------------------------------
  // Collision: player bullet vs invaders
  // -------------------------------------------------------------------------
  if (currentPlayer) {
    const bullet = currentPlayer.getBullet();
    if (bullet) {
      const pool = splitOccurred
        ? [...leftHalf.invaders, ...rightHalf.invaders]
        : invaders;
      for (const inv of pool) {
        if (!inv.alive) continue;
        if (checkHit(bullet, inv)) {
          inv.alive = false;
          currentPlayer.clearBullet();
          triggerExplosion(inv.x, inv.y);
          hudState.score += 10;
          killCount += 1;

          // Check split trigger
          if (!splitOccurred && killCount >= SPLIT_THRESHOLD) {
            triggerSplit();
          }
          break;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Collision: enemy bullets vs player — lose a life
  // -------------------------------------------------------------------------
  if (currentPlayer) {
    const playerRect = {
      x:      currentPlayer.x,
      y:      currentPlayer.y,
      width:  40,
      height: 32,
    };
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      if (checkHit(enemyBullets[i], playerRect)) {
        enemyBullets.splice(i, 1);
        currentPlayer.lives -= 1;
        hudState.lives = currentPlayer.lives;
        if (currentPlayer.lives <= 0) {
          transitionTo('gameover');
          return;
        }
        // Reset level on life loss
        resetLevel();
        return;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Loss condition: invader reaches player Y
  // -------------------------------------------------------------------------
  if (currentPlayer) {
    for (const inv of allAlive) {
      if (inv.y + inv.height >= currentPlayer.y) {
        currentPlayer.lives -= 1;
        hudState.lives = currentPlayer.lives;
        resetLevel();
        return;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// render(ctx)
// ---------------------------------------------------------------------------
function render(ctx) {
  // Draw bunkers
  ctx.fillStyle = '#00aa00';
  for (const bunker of bunkers) {
    for (const cell of bunker.cells) {
      if (cell.alive) {
        ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
      }
    }
  }

  // Draw invaders
  ctx.fillStyle = '#00FF00';
  const pool = splitOccurred
    ? [...leftHalf.invaders, ...rightHalf.invaders]
    : invaders;
  for (const inv of pool) {
    if (inv.alive) {
      ctx.fillRect(Math.round(inv.x), Math.round(inv.y), INVADER_WIDTH, INVADER_HEIGHT);
    }
  }

  // Draw enemy bullets
  ctx.fillStyle = '#ff4444';
  for (const b of enemyBullets) {
    ctx.fillRect(Math.round(b.x), Math.round(b.y), b.width, b.height);
  }
}

// ---------------------------------------------------------------------------
// Initialise and register
// ---------------------------------------------------------------------------
resetLevel();
registerLevel({ update, render });
