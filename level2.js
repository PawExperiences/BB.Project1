// level2.js — Level 2: They Shoot Back
// ES module, no bundler, runs from file:// URL.
//
// Scene API expected by SceneManager:
//   level2Scene.enter()   — called once when the scene becomes active
//   level2Scene.update(dt) — called every fixed timestep (dt in seconds)
//   level2Scene.draw(ctx)  — called every animation frame
//
// External dependencies (must be exported by game.js / their own modules):
//   SceneManager  — { goTo(name) }
//   GameState     — { lives, shotCount, score }  (mutable singleton)
// Both are imported from './game.js'.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { isKeyHeld } from './input.js';
import { addScore } from './collision.js';
import { SceneManager, GameState } from './game.js';

// ---------------------------------------------------------------------------
// Formation constants — must match invaders.js layout exactly
// ---------------------------------------------------------------------------
const INVADER_WIDTH  = 30;
const INVADER_HEIGHT = 20;
const COL_GAP        = 20;
const ROW_GAP        = 20;
const COLS           = 11;
const ROWS           = 5;
const DROP_AMOUNT    = INVADER_HEIGHT + ROW_GAP;
const FORMATION_WIDTH = COLS * INVADER_WIDTH + (COLS - 1) * COL_GAP;
const START_X = Math.floor((CANVAS_WIDTH - FORMATION_WIDTH) / 2);
const START_Y = 60;

// Level 1 base speed (px/s) — Level 2 is 1.5× faster
// Level 1 uses FORMATION_SPEED = 60 px/s from invaders.js.
// We apply the same acceleration shape but at 0.67× the interval,
// which is equivalent to 1/0.67 ≈ 1.493× the speed.
// We implement this as speed = BASE_SPEED / intervalMultiplier where the
// interval multiplier is 0.67 relative to Level 1.
// Concretely: base step speed = 60 / 0.67 ≈ 89.6 px/s at full formation,
// and we apply the same per-kill acceleration as Level 1.
const L1_FORMATION_SPEED = 60;   // px/s — Level 1 base
const SPEED_MULTIPLIER   = 1 / 0.67; // ≈ 1.4925 — 0.67× interval = 1/0.67× speed
const BASE_FORMATION_SPEED = L1_FORMATION_SPEED * SPEED_MULTIPLIER;

// Level 1 acceleration: each invader killed speeds up the formation
// proportionally (same curve shape). Total invaders = 55.
const TOTAL_INVADERS = COLS * ROWS; // 55

// ---------------------------------------------------------------------------
// Ship constants
// ---------------------------------------------------------------------------
const SHIP_WIDTH  = 40;
const SHIP_HEIGHT = 32;
const SHIP_START_X = CANVAS_WIDTH / 2 - SHIP_WIDTH / 2;
const SHIP_START_Y = 820;

// ---------------------------------------------------------------------------
// Player bullet constants
// ---------------------------------------------------------------------------
const PLAYER_BULLET_W = 4;
const PLAYER_BULLET_H = 12;
const PLAYER_BULLET_SPEED = 500; // px/s upward

// ---------------------------------------------------------------------------
// Enemy bullet constants
// ---------------------------------------------------------------------------
const ENEMY_BULLET_W = 4;
const ENEMY_BULLET_H = 14;
const ENEMY_BULLET_SPEED = 300; // px/s downward

// Invulnerability
const INVULN_DURATION  = 2.0;   // seconds
const FLASH_INTERVAL   = 0.2;   // seconds between visible toggles

// UFO
const UFO_WIDTH    = 48;
const UFO_HEIGHT   = 20;
const UFO_Y        = 70;   // fixed vertical position near top
const UFO_SPEED    = 120;  // px/s horizontal
const UFO_INTERVAL = 20;   // seconds between spawns
const UFO_SCORE_TABLE = [50, 100, 150, 300];

// Explosion
const EXPLOSION_DURATION = 300; // ms

// ---------------------------------------------------------------------------
// Module-level state (reset on enter())
// ---------------------------------------------------------------------------
let l2Formation = [];       // array of { x, y, width, height, alive }
let directionX = 1;         // +1 right, -1 left

// Player state
let shipX = SHIP_START_X;
let shipY = SHIP_START_Y;
let playerBullet = null;    // { x, y } or null

// Invulnerability
let invulnTimer  = 0;       // seconds remaining
let flashTimer   = 0;       // seconds until next flash toggle
let shipVisible  = true;    // for flashing

// Enemy bullets
let enemyBullets = [];      // { x, y, active }
let shotTimer    = 0;       // seconds until next enemy shot

// UFO
let ufoTimer     = UFO_INTERVAL; // seconds until next UFO
let ufoFromLeft  = true;         // alternates each spawn
let ufo          = null;         // null or { x, y, active }

// Explosions
let explosions   = [];      // { x, y, width, height, remaining (ms) }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw &&
         ax + aw > bx &&
         ay < by + bh &&
         ay + ah > by;
}

function randomShotDelay() {
  // Uniform [800, 2000] ms, returned in seconds
  return (800 + Math.random() * 1200) / 1000;
}

function buildFormation() {
  const arr = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      arr.push({
        x:      START_X + col * (INVADER_WIDTH + COL_GAP),
        y:      START_Y + row * (INVADER_HEIGHT + ROW_GAP),
        width:  INVADER_WIDTH,
        height: INVADER_HEIGHT,
        alive:  true,
        col:    col,
        row:    row
      });
    }
  }
  return arr;
}

/** Return count of alive invaders */
function aliveCount() {
  let n = 0;
  for (const inv of l2Formation) { if (inv.alive) n++; }
  return n;
}

/**
 * Return the lowest (highest y) alive invader in a given column,
 * or null if the column is empty.
 */
function lowestInColumn(col) {
  let lowest = null;
  for (const inv of l2Formation) {
    if (!inv.alive || inv.col !== col) continue;
    if (lowest === null || inv.y > lowest.y) lowest = inv;
  }
  return lowest;
}

/** Columns that still have at least one alive invader */
function columnsWithInvaders() {
  const cols = new Set();
  for (const inv of l2Formation) {
    if (inv.alive) cols.add(inv.col);
  }
  return [...cols];
}

/** Current formation speed based on how many invaders remain (same curve shape as L1, but faster) */
function currentSpeed() {
  const alive = aliveCount();
  // As invaders are killed the formation accelerates.
  // Fraction remaining drives the speed: speed = BASE / fraction.
  // At full formation (55/55) speed = BASE_FORMATION_SPEED.
  // At 1/55 it would be 55× base — cap at a reasonable maximum.
  const fraction = Math.max(alive / TOTAL_INVADERS, 1 / TOTAL_INVADERS);
  return Math.min(BASE_FORMATION_SPEED / fraction, BASE_FORMATION_SPEED * TOTAL_INVADERS);
}

// ---------------------------------------------------------------------------
// Respawn player ship
// ---------------------------------------------------------------------------
function respawnPlayer() {
  shipX = SHIP_START_X;
  shipY = SHIP_START_Y;
  playerBullet = null;
  invulnTimer  = INVULN_DURATION;
  flashTimer   = FLASH_INTERVAL;
  shipVisible  = true;
}

// ---------------------------------------------------------------------------
// Scene entry point
// ---------------------------------------------------------------------------
function enter() {
  // Build a fresh Level 2 formation
  l2Formation = buildFormation();
  directionX  = 1;

  // Reset ship to bottom-centre (lives and shotCount are NOT reset)
  shipX = SHIP_START_X;
  shipY = SHIP_START_Y;
  playerBullet = null;
  shipVisible  = true;
  invulnTimer  = 0;
  flashTimer   = 0;

  // Enemy bullets
  enemyBullets = [];
  shotTimer    = randomShotDelay();

  // UFO — start timer fresh, alternate side persists across re-entries
  ufoTimer = UFO_INTERVAL;
  ufo = null;

  // Explosions
  explosions = [];
}

// ---------------------------------------------------------------------------
// Update — called each fixed timestep (dt seconds)
// ---------------------------------------------------------------------------
function update(dt) {
  // ---- Player movement -----------------------------------------------------
  const movingLeft  = isKeyHeld('ArrowLeft')  || isKeyHeld('KeyA');
  const movingRight = isKeyHeld('ArrowRight') || isKeyHeld('KeyD');
  if (movingLeft)  shipX -= 200 * dt;
  if (movingRight) shipX += 200 * dt;
  if (shipX < 0) shipX = 0;
  if (shipX + SHIP_WIDTH > CANVAS_WIDTH) shipX = CANVAS_WIDTH - SHIP_WIDTH;

  // ---- Player firing -------------------------------------------------------
  if (isKeyHeld('Space') && playerBullet === null) {
    playerBullet = {
      x: shipX + SHIP_WIDTH / 2 - PLAYER_BULLET_W / 2,
      y: shipY - PLAYER_BULLET_H
    };
    GameState.shotCount++;
  }

  // ---- Player bullet movement ----------------------------------------------
  if (playerBullet !== null) {
    playerBullet.y -= PLAYER_BULLET_SPEED * dt;
    if (playerBullet.y + PLAYER_BULLET_H < 0) {
      playerBullet = null;
    }
  }

  // ---- Invulnerability / flash ---------------------------------------------
  if (invulnTimer > 0) {
    invulnTimer -= dt;
    flashTimer  -= dt;
    if (flashTimer <= 0) {
      shipVisible  = !shipVisible;
      flashTimer  += FLASH_INTERVAL;
    }
    if (invulnTimer <= 0) {
      invulnTimer = 0;
      shipVisible = true;
    }
  }

  // ---- Invader formation movement ------------------------------------------
  const speed = currentSpeed();
  const dx = speed * directionX * dt;

  let wouldHitRight = false;
  let wouldHitLeft  = false;
  for (const inv of l2Formation) {
    if (!inv.alive) continue;
    const nextX = inv.x + dx;
    if (nextX + inv.width >= CANVAS_WIDTH) wouldHitRight = true;
    if (nextX <= 0)                        wouldHitLeft  = true;
  }

  if (wouldHitRight || wouldHitLeft) {
    for (const inv of l2Formation) inv.y += DROP_AMOUNT;
    directionX = -directionX;
  } else {
    for (const inv of l2Formation) inv.x += dx;
  }

  // ---- Player bullet vs invaders -------------------------------------------
  if (playerBullet !== null) {
    const pb = playerBullet;
    for (const inv of l2Formation) {
      if (!inv.alive) continue;
      if (aabbOverlap(pb.x, pb.y, PLAYER_BULLET_W, PLAYER_BULLET_H,
                      inv.x, inv.y, inv.width, inv.height)) {
        inv.alive = false;
        playerBullet = null;
        addScore(10);
        explosions.push({
          x: inv.x, y: inv.y,
          width: inv.width, height: inv.height,
          remaining: EXPLOSION_DURATION
        });
        break;
      }
    }
  }

  // ---- Player bullet vs UFO ------------------------------------------------
  if (playerBullet !== null && ufo !== null && ufo.active) {
    if (aabbOverlap(playerBullet.x, playerBullet.y, PLAYER_BULLET_W, PLAYER_BULLET_H,
                    ufo.x, ufo.y, UFO_WIDTH, UFO_HEIGHT)) {
      const tier = GameState.shotCount % 4;
      addScore(UFO_SCORE_TABLE[tier]);
      explosions.push({
        x: ufo.x, y: ufo.y,
        width: UFO_WIDTH, height: UFO_HEIGHT,
        remaining: EXPLOSION_DURATION
      });
      ufo.active = false;
      playerBullet = null;
    }
  }

  // ---- Enemy shot timer ----------------------------------------------------
  shotTimer -= dt;
  if (shotTimer <= 0) {
    const activeCols = columnsWithInvaders();
    if (activeCols.length > 0) {
      const randCol = activeCols[Math.floor(Math.random() * activeCols.length)];
      const shooter = lowestInColumn(randCol);
      if (shooter !== null) {
        enemyBullets.push({
          x: shooter.x + shooter.width  / 2 - ENEMY_BULLET_W / 2,
          y: shooter.y + shooter.height,
          active: true
        });
      }
    }
    shotTimer = randomShotDelay();
  }

  // ---- Enemy bullets movement and collision with player --------------------
  for (const eb of enemyBullets) {
    if (!eb.active) continue;
    eb.y += ENEMY_BULLET_SPEED * dt;
    // Off-screen
    if (eb.y > CANVAS_HEIGHT) {
      eb.active = false;
      continue;
    }
    // Hit player?
    if (invulnTimer <= 0) {
      if (aabbOverlap(eb.x, eb.y, ENEMY_BULLET_W, ENEMY_BULLET_H,
                      shipX, shipY, SHIP_WIDTH, SHIP_HEIGHT)) {
        eb.active = false;
        GameState.lives--;
        if (GameState.lives <= 0) {
          SceneManager.goTo('gameOver');
          return;
        }
        respawnPlayer();
      }
    }
  }

  // Prune inactive enemy bullets
  enemyBullets = enemyBullets.filter(eb => eb.active);

  // ---- UFO timer -----------------------------------------------------------
  ufoTimer -= dt;
  if (ufoTimer <= 0) {
    ufoTimer = UFO_INTERVAL;
    // Spawn UFO
    const startX = ufoFromLeft ? -UFO_WIDTH : CANVAS_WIDTH;
    ufo = { x: startX, y: UFO_Y, active: true, fromLeft: ufoFromLeft };
    ufoFromLeft = !ufoFromLeft; // alternate for next time
  }

  // ---- UFO movement --------------------------------------------------------
  if (ufo !== null && ufo.active) {
    if (ufo.fromLeft) {
      ufo.x += UFO_SPEED * dt;
      if (ufo.x > CANVAS_WIDTH) ufo.active = false;
    } else {
      ufo.x -= UFO_SPEED * dt;
      if (ufo.x + UFO_WIDTH < 0) ufo.active = false;
    }
  }

  // ---- Explosions ----------------------------------------------------------
  const dtMs = dt * 1000;
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].remaining -= dtMs;
    if (explosions[i].remaining <= 0) explosions.splice(i, 1);
  }

  // ---- Win condition -------------------------------------------------------
  if (aliveCount() === 0) {
    SceneManager.goTo('level3');
    return;
  }
}

// ---------------------------------------------------------------------------
// Draw — called every animation frame
// ---------------------------------------------------------------------------
function draw(ctx) {
  // Clear
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // ---- HUD -----------------------------------------------------------------
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 40);
  ctx.font = '18px monospace';
  ctx.fillStyle = '#fff';
  const displayScore  = typeof GameState.score !== 'undefined' ? GameState.score : 0;
  const displayHi     = typeof GameState.hiScore !== 'undefined' ? GameState.hiScore : 0;
  const displayLives  = typeof GameState.lives  !== 'undefined' ? GameState.lives  : 0;
  ctx.fillText('SCORE: ' + displayScore,  10, 28);
  ctx.textAlign = 'center';
  ctx.fillText('HI: ' + displayHi, CANVAS_WIDTH / 2, 28);
  ctx.textAlign = 'right';
  ctx.fillText('LIVES: ' + displayLives, CANVAS_WIDTH - 10, 28);
  ctx.textAlign = 'left';

  // ---- Invader formation ---------------------------------------------------
  ctx.fillStyle = '#00ff00';
  for (const inv of l2Formation) {
    if (inv.alive) ctx.fillRect(inv.x, inv.y, inv.width, inv.height);
  }

  // ---- Player ship ---------------------------------------------------------
  if (shipVisible) {
    drawShip(ctx);
  }

  // ---- Player bullet -------------------------------------------------------
  if (playerBullet !== null) {
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(playerBullet.x, playerBullet.y, PLAYER_BULLET_W, PLAYER_BULLET_H);
  }

  // ---- Enemy bullets -------------------------------------------------------
  ctx.fillStyle = '#ff4444';
  for (const eb of enemyBullets) {
    if (eb.active) ctx.fillRect(eb.x, eb.y, ENEMY_BULLET_W, ENEMY_BULLET_H);
  }

  // ---- UFO -----------------------------------------------------------------
  if (ufo !== null && ufo.active) {
    drawUfo(ctx, ufo.x, ufo.y);
  }

  // ---- Explosions ----------------------------------------------------------
  for (const ex of explosions) {
    const alpha = Math.max(0, ex.remaining / EXPLOSION_DURATION);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(ex.x, ex.y, ex.width, ex.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      ex.x + ex.width  * 0.25,
      ex.y + ex.height * 0.25,
      ex.width  * 0.5,
      ex.height * 0.5
    );
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Ship drawing helper
// ---------------------------------------------------------------------------
function drawShip(ctx) {
  ctx.save();
  ctx.translate(shipX, shipY);
  ctx.fillStyle = '#00e5ff';
  const bodyTop    = SHIP_HEIGHT * 0.4;
  const bodyHeight = SHIP_HEIGHT * 0.6;
  ctx.fillRect(4, bodyTop, SHIP_WIDTH - 8, bodyHeight);
  const flangeH = SHIP_HEIGHT * 0.25;
  ctx.fillRect(0,               SHIP_HEIGHT - flangeH, 12, flangeH);
  ctx.fillRect(SHIP_WIDTH - 12, SHIP_HEIGHT - flangeH, 12, flangeH);
  const cockpitCX = SHIP_WIDTH / 2;
  const cockpitCY = bodyTop;
  const cockpitR  = SHIP_WIDTH * 0.22;
  ctx.beginPath();
  ctx.arc(cockpitCX, cockpitCY, cockpitR, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// UFO drawing helper
// ---------------------------------------------------------------------------
function drawUfo(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  // Body
  ctx.fillStyle = '#ff0066';
  ctx.fillRect(8, UFO_HEIGHT * 0.4, UFO_WIDTH - 16, UFO_HEIGHT * 0.6);
  // Dome
  ctx.beginPath();
  ctx.arc(UFO_WIDTH / 2, UFO_HEIGHT * 0.4, UFO_WIDTH * 0.28, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  // Windows
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(10, UFO_HEIGHT * 0.5, 6, 6);
  ctx.fillRect(UFO_WIDTH / 2 - 3, UFO_HEIGHT * 0.5, 6, 6);
  ctx.fillRect(UFO_WIDTH - 16, UFO_HEIGHT * 0.5, 6, 6);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Exported scene object
// ---------------------------------------------------------------------------
export const level2Scene = { enter, update, draw };
