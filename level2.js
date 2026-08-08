// level2.js — Level 2: They Shoot Back
// Card: "Level 2: they shoot back"
//
// ES module exporting { init, update, render } lifecycle hooks.
// Builds on interfaces from game.js, gameConfig.js, and invaders.js.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import {
  invaders,
  stepFormation,
  dropFormation,
  INV_W,
  INV_H,
  CELL_H,
  COLS,
  ROWS,
  addScore,
} from './invaders.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const STEP_PX             = 8;      // pixels per discrete step (same as level1)
const LEVEL_NUMBER        = 2;
const UFO_PERIOD_S        = 20;     // seconds between UFO spawns
const UFO_SPEED           = 120;    // px/s
const UFO_Y               = 40;     // y position (top of play area)
const UFO_W               = 48;     // UFO sprite width
const UFO_H               = 20;     // UFO sprite height
const INV_BULLET_SPEED    = 300;    // px/s downward
const INV_BULLET_W        = 4;
const INV_BULLET_H        = 12;
const INV_FIRE_MIN_MS     = 800;
const INV_FIRE_MAX_MS     = 2000;
const INVUL_DURATION_S    = 2.0;    // seconds of invulnerability after respawn
const FLASH_INTERVAL_S    = 0.15;   // toggle visibility every N seconds

// UFO score tiers indexed by sessionShotCount % 4
const UFO_SCORE_TIERS = [50, 100, 150, 300];

// ─── Level-2 interval curve (Level 1 × 0.67) ─────────────────────────────────
/**
 * Level 1 step interval (ms): 100 + (aliveFraction * 700)
 * Level 2: multiply by 0.67
 */
function stepInterval(aliveCount) {
  const clamped = Math.max(1, Math.min(55, aliveCount));
  const aliveFraction = (clamped - 1) / 54;
  const level1Ms = 100 + aliveFraction * 700;
  return (level1Ms * 0.67) / 1000; // convert ms → seconds
}

// ─── Module-level state (reset on init) ──────────────────────────────────────
let direction      = 1;    // +1 = right, -1 = left
let stepTimer      = 0;

let ufoTimer       = 0;    // seconds since last UFO (or level start)
let ufoCount       = 0;    // how many UFOs have spawned (determines side)
let ufo            = null; // null | { x, y, width, height, alive, fromLeft }

let invaderBulletsLocal = []; // local array; game.js passes its own array in
let fireTimer      = 0;    // seconds until next invader shot
let nextFireDelay  = 0;    // current random delay in seconds

let playerRef      = null; // reference set by init
let invBulletsRef  = null; // reference to game.js invaderBullets array
let gameStateRef   = null;

// Respawn / invulnerability state
let invulTimer     = 0;    // seconds remaining of invulnerability (0 = not invulnerable)
let flashTimer     = 0;    // seconds since last flash toggle
let playerVisible  = true; // used during invulnerability flash

// Session-wide shot counter (counts player shots; persists across levels)
// game.js passes this in via hudState.sessionShotCount
let _sessionShotCountRef = null; // pointer-by-reference via hudState

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomFireDelay() {
  return (INV_FIRE_MIN_MS + Math.random() * (INV_FIRE_MAX_MS - INV_FIRE_MIN_MS)) / 1000;
}

function spawnUFO(fromLeft) {
  const startX = fromLeft ? -UFO_W : CANVAS_WIDTH + UFO_W;
  ufo = {
    x:        startX,
    y:        UFO_Y,
    width:    UFO_W,
    height:   UFO_H,
    alive:    true,
    fromLeft: fromLeft,
  };
}

function lowestInvaderInColumn(col) {
  let lowest = null;
  for (const inv of invaders) {
    if (!inv.alive) continue;
    if (inv.col !== col) continue;
    if (lowest === null || inv.y > lowest.y) {
      lowest = inv;
    }
  }
  return lowest;
}

function getLivingColumns() {
  const cols = new Set();
  for (const inv of invaders) {
    if (inv.alive) cols.add(inv.col);
  }
  return Array.from(cols);
}

// ─── Respawn helper ───────────────────────────────────────────────────────────
function respawnPlayer() {
  if (!playerRef) return;
  playerRef.x = CANVAS_WIDTH / 2;
  playerRef.y = CANVAS_HEIGHT - 80;
  playerRef._bullet = null;
  // Start invulnerability
  invulTimer = INVUL_DURATION_S;
  flashTimer = 0;
  playerVisible = true;
}

// ─── Bullet rect helpers ──────────────────────────────────────────────────────
function invBulletRect(b) {
  return {
    x:      b.x - INV_BULLET_W / 2,
    y:      b.y,
    width:  INV_BULLET_W,
    height: INV_BULLET_H,
  };
}

const SHIP_W = 48;
const SHIP_H = 32;
function playerRect(p) {
  return {
    x:      p.x - SHIP_W / 2,
    y:      p.y - SHIP_H / 2,
    width:  SHIP_W,
    height: SHIP_H,
  };
}

function aabb(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// UFO rect helper
function ufoRect() {
  return {
    x:      ufo.x - UFO_W / 2,
    y:      ufo.y - UFO_H / 2,
    width:  UFO_W,
    height: UFO_H,
  };
}

// Player bullet rect (same dimensions used in collision.js)
const PBULLET_W = 4;
const PBULLET_H = 12;
function playerBulletRect(b) {
  return {
    x:      b.x - PBULLET_W / 2,
    y:      b.y - PBULLET_H,
    width:  PBULLET_W,
    height: PBULLET_H,
  };
}

// ─── Lifecycle — init ─────────────────────────────────────────────────────────
/**
 * Called when Level 2 starts.
 * Lives are NOT reset here — they carry over from Level 1.
 * The formation has already been reset by game.js (resetFormation()).
 *
 * @param {object} gameState  shared mutable state { lives, level, score, sessionShotCount, ... }
 * @param {object} player     Player instance
 * @param {Array}  invBullets Reference to game.js invaderBullets array
 */
function init(gameState, player, invBullets) {
  direction      = 1;
  stepTimer      = 0;
  ufoTimer       = 0;
  ufoCount       = 0;
  ufo            = null;
  fireTimer      = 0;
  nextFireDelay  = randomFireDelay();
  invulTimer     = 0;
  flashTimer     = 0;
  playerVisible  = true;

  playerRef      = player;
  invBulletsRef  = invBullets;
  gameStateRef   = gameState;

  // Ensure sessionShotCount exists on gameState
  if (gameState.sessionShotCount === undefined) {
    gameState.sessionShotCount = 0;
  }

  level2.gameState = gameState;
}

// ─── Lifecycle — update ───────────────────────────────────────────────────────
/**
 * @param {number} dt         seconds since last tick
 * @param {object} gameState  shared mutable state
 */
function update(dt, gameState) {
  const alive = invaders.filter(i => i.alive);
  const aliveCount = alive.length;

  // ── Win condition: all invaders cleared → Level 3 (or title as placeholder) ─
  if (aliveCount === 0) {
    // Signal completion; game.js can handle transition
    gameState.level = 3;
    return;
  }

  // ── Lose condition: formation reached player row ───────────────────────────
  let maxBottomY = 0;
  for (const inv of alive) {
    const bottom = inv.y + inv.height;
    if (bottom > maxBottomY) maxBottomY = bottom;
  }
  const playerRowY = (gameState.playerY !== undefined)
    ? gameState.playerY
    : CANVAS_HEIGHT - 80;

  if (maxBottomY >= playerRowY) {
    gameState.lives -= 1;
    if (gameState.lives <= 0) {
      // game.js will detect lives <= 0 and call triggerGameOver()
      return;
    }
    init(gameState, playerRef, invBulletsRef);
    return;
  }

  // ── Invulnerability timer ──────────────────────────────────────────────────
  if (invulTimer > 0) {
    invulTimer -= dt;
    flashTimer += dt;
    if (flashTimer >= FLASH_INTERVAL_S) {
      flashTimer -= FLASH_INTERVAL_S;
      playerVisible = !playerVisible;
    }
    if (invulTimer <= 0) {
      invulTimer = 0;
      playerVisible = true;
    }
  }

  // ── Discrete step movement ─────────────────────────────────────────────────
  stepTimer += dt;
  const interval = stepInterval(aliveCount);

  if (stepTimer >= interval) {
    stepTimer -= interval;

    let leadingEdge;
    if (direction > 0) {
      leadingEdge = Math.max(...alive.map(i => i.x + i.width));
    } else {
      leadingEdge = Math.min(...alive.map(i => i.x));
    }

    const proposedEdge = leadingEdge + direction * STEP_PX;

    if (direction > 0 && proposedEdge > CANVAS_WIDTH) {
      dropFormation();
      direction = -1;
    } else if (direction < 0 && proposedEdge < 0) {
      dropFormation();
      direction = 1;
    } else {
      stepFormation(direction * STEP_PX);
    }
  }

  // ── Invader fire timer ────────────────────────────────────────────────────
  fireTimer += dt;
  if (fireTimer >= nextFireDelay) {
    fireTimer -= nextFireDelay;
    nextFireDelay = randomFireDelay();

    const liveCols = getLivingColumns();
    if (liveCols.length > 0 && invBulletsRef) {
      const col = liveCols[Math.floor(Math.random() * liveCols.length)];
      const shooter = lowestInvaderInColumn(col);
      if (shooter) {
        // Bullet spawns at the bottom-centre of the invader
        invBulletsRef.push({
          x: shooter.x + shooter.width / 2,
          y: shooter.y + shooter.height,
        });
      }
    }
  }

  // ── Update invader bullets ─────────────────────────────────────────────────
  if (invBulletsRef) {
    for (let i = invBulletsRef.length - 1; i >= 0; i--) {
      invBulletsRef[i].y += INV_BULLET_SPEED * dt;
      // Remove if off-screen
      if (invBulletsRef[i].y > CANVAS_HEIGHT) {
        invBulletsRef.splice(i, 1);
      }
    }

    // ── Invader bullet vs. player collision ────────────────────────────────
    if (playerRef) {
      const pRect = playerRect(playerRef);
      for (let i = invBulletsRef.length - 1; i >= 0; i--) {
        const bRect = invBulletRect(invBulletsRef[i]);
        if (aabb(bRect, pRect)) {
          invBulletsRef.splice(i, 1);
          if (invulTimer <= 0) {
            // Not invulnerable — take damage
            gameState.lives -= 1;
            if (gameState.lives <= 0) {
              // game.js detects this and calls triggerGameOver()
              return;
            }
            respawnPlayer();
          }
          // If invulnerable, bullet is consumed but no damage
        }
      }
    }
  }

  // ── UFO timer & movement ──────────────────────────────────────────────────
  ufoTimer += dt;

  if (!ufo && ufoTimer >= UFO_PERIOD_S) {
    ufoTimer -= UFO_PERIOD_S;
    const fromLeft = (ufoCount % 2 === 0);
    spawnUFO(fromLeft);
    ufoCount++;
  }

  if (ufo && ufo.alive) {
    const vel = ufo.fromLeft ? UFO_SPEED : -UFO_SPEED;
    ufo.x += vel * dt;

    // Check if UFO has exited the screen
    if (ufo.fromLeft && ufo.x > CANVAS_WIDTH + UFO_W) {
      ufo = null; // exited right side, no points
    } else if (!ufo.fromLeft && ufo.x < -UFO_W) {
      ufo = null; // exited left side, no points
    }
  }

  // ── Player bullet vs. UFO collision ───────────────────────────────────────
  if (ufo && ufo.alive && playerRef && playerRef.bullet) {
    const bRect = playerBulletRect(playerRef.bullet);
    const uRect = ufoRect();
    if (aabb(bRect, uRect)) {
      // Award score based on sessionShotCount tier
      const shotCount = gameState.sessionShotCount || 0;
      const tier = shotCount % 4;
      const points = UFO_SCORE_TIERS[tier];
      addScore(points);
      gameState.score += points;

      // Destroy UFO and bullet
      ufo = null;
      playerRef._bullet = null;
    }
  }
}

// ─── Lifecycle — render ───────────────────────────────────────────────────────
/**
 * Draw level-specific elements: level label, UFO, invader bullets, player flash.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} gameState
 */
function render(ctx, gameState) {
  // ── Level label ────────────────────────────────────────────────────────────
  const padding = 16;
  const hudRowHeight = 20;
  const levelY = padding + hudRowHeight + 8; // 44 px from top

  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = '16px monospace';
  ctx.fillStyle    = '#aaffaa';
  ctx.fillText('LEVEL ' + LEVEL_NUMBER, CANVAS_WIDTH / 2, levelY);
  ctx.restore();

  // ── Invader bullets ────────────────────────────────────────────────────────
  if (invBulletsRef) {
    ctx.save();
    ctx.fillStyle = '#ff4444';
    for (const b of invBulletsRef) {
      ctx.fillRect(
        b.x - INV_BULLET_W / 2,
        b.y,
        INV_BULLET_W,
        INV_BULLET_H
      );
    }
    ctx.restore();
  }

  // ── UFO ────────────────────────────────────────────────────────────────────
  if (ufo && ufo.alive) {
    ctx.save();
    // Draw a simple UFO shape: red ellipse-ish body
    const ux = ufo.x;
    const uy = ufo.y;

    // Body rectangle
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(ux - UFO_W / 2, uy - UFO_H / 2, UFO_W, UFO_H);

    // Dome on top
    ctx.fillStyle = '#ff6666';
    ctx.beginPath();
    ctx.ellipse(ux, uy - UFO_H / 2, UFO_W * 0.35, UFO_H * 0.5, 0, Math.PI, 0);
    ctx.fill();

    // Label "UFO"
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('UFO', ux, uy);

    ctx.restore();
  }

  // ── Player flash during invulnerability ───────────────────────────────────
  // We signal to the caller whether the player should be hidden.
  // Since we cannot intercept player.draw() directly, we store the flag
  // on the module export so game.js can query it.
  level2.playerVisible = playerVisible;
}

// ─── Module export ────────────────────────────────────────────────────────────
const level2 = { init, update, render, playerVisible: true };
export default level2;
