// level2.js — Level 2: They Shoot Back
// ES module. Registers itself with the game loop via registerLevel().

import { registerLevel, transitionTo, hudState, player, enterGameOver } from './game.js';
import { checkHit } from './collision.js';
import { INVADER_HEIGHT } from './invaders.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { triggerExplosion } from './explosion.js';
import { SHIP_WIDTH, SHIP_HEIGHT } from './player.js';

// ---------------------------------------------------------------------------
// Formation constants (same layout as Level 1)
// ---------------------------------------------------------------------------
const COLS = 11;
const ROWS = 5;
const TOTAL_INVADERS = COLS * ROWS; // 55

const INVADER_WIDTH = 30;
const H_GAP = 10;
const V_GAP = 10;

const FORMATION_WIDTH = COLS * INVADER_WIDTH + (COLS - 1) * H_GAP; // 430
const FORMATION_START_X = Math.round((CANVAS_WIDTH - FORMATION_WIDTH) / 2); // 169
const FORMATION_START_Y = 80;

// Level 1 speed curve anchors (ms) — Level 2 applies 0.67× multiplier
const L1_INTERVAL_MAX_MS = 800; // at 55 invaders
const L1_INTERVAL_MIN_MS = 100; // at 1 invader
const SPEED_MULTIPLIER = 0.67;  // 1.5× faster

// Step pixel distance (same as Level 1)
const STEP_PX = 8;

// ---------------------------------------------------------------------------
// Enemy bullet constants
// ---------------------------------------------------------------------------
const ENEMY_BULLET_SPEED = 300;  // px/s downward
const ENEMY_BULLET_WIDTH = 4;
const ENEMY_BULLET_HEIGHT = 12;
const SHOOT_INTERVAL_MIN_MS = 800;
const SHOOT_INTERVAL_MAX_MS = 2000;

// ---------------------------------------------------------------------------
// UFO constants
// ---------------------------------------------------------------------------
const UFO_SPEED = 120;           // px/s
const UFO_SPAWN_INTERVAL_MS = 20000; // 20 seconds
const UFO_Y = 40;                // Y position across top of field
const UFO_WIDTH = 50;
const UFO_HEIGHT = 20;
// Score tiers: cumulativeShotCount % 4 -> score
// 0->100, 1->50, 2->150, 3->300
const UFO_SCORE_TIERS = [100, 50, 150, 300];

// ---------------------------------------------------------------------------
// Respawn / invulnerability constants
// ---------------------------------------------------------------------------
const INVULNERABILITY_DURATION_MS = 2000; // 2 seconds
const FLASH_HZ = 8;                       // alternating rate in Hz
const FLASH_PERIOD_MS = 1000 / FLASH_HZ;  // 125 ms per phase

// Player spawn position (bottom-centre)
const SPAWN_X = (CANVAS_WIDTH - 40) / 2;  // SHIP_WIDTH = 40
const SPAWN_Y = CANVAS_HEIGHT - 32 - 24;  // SHIP_HEIGHT = 32

// ---------------------------------------------------------------------------
// Level state
// ---------------------------------------------------------------------------
let invaders = [];
let directionX = 1;
let formationOffsetX = 0;
let formationOffsetY = 0;
let stepTimer = 0;
let transitionFired = false;

// Enemy bullets array
let enemyBullets = [];

// Shooting timer
let shootTimer = 0;
let shootInterval = randomShootInterval();

// UFO state
let ufo = null;            // null when not active
let ufoTimer = 0;          // ms since level start or last UFO entry
let ufoFromLeft = true;    // alternating side flag

// Invulnerability state
let invulnerable = false;
let invulnerabilityTimer = 0;
let flashTimer = 0;
let flashVisible = true;

// Cumulative shot count (session-wide, carried via module-level variable)
// We initialise to 0 here; level1.js does not track this, so we track from
// level2 start. If a shared session counter were available we would import it.
// Per the spec: never reset between levels.
let cumulativeShotCount = 0;

// Flag to detect when we entered game-over to avoid double-calling
let gameOverFired = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomShootInterval() {
  return SHOOT_INTERVAL_MIN_MS +
    Math.random() * (SHOOT_INTERVAL_MAX_MS - SHOOT_INTERVAL_MIN_MS);
}

/**
 * Calculate step interval (ms) for Level 2.
 * Takes the Level 1 linear curve and multiplies by SPEED_MULTIPLIER (0.67).
 */
function calcStepInterval(liveCount) {
  const n = Math.max(1, Math.min(TOTAL_INVADERS, liveCount));
  const t = (n - 1) / (TOTAL_INVADERS - 1);
  const l1Interval = L1_INTERVAL_MIN_MS + t * (L1_INTERVAL_MAX_MS - L1_INTERVAL_MIN_MS);
  return l1Interval * SPEED_MULTIPLIER;
}

/**
 * Build the 55-invader grid at initial positions.
 */
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
        width: INVADER_WIDTH,
        height: INVADER_HEIGHT,
      });
    }
  }
}

/**
 * Advance the formation by one step.
 */
function stepFormation() {
  const alive = invaders.filter(inv => inv.alive);
  if (alive.length === 0) return;

  let minX = Infinity;
  let maxX = -Infinity;
  for (const inv of alive) {
    if (inv.x < minX) minX = inv.x;
    if (inv.x + INVADER_WIDTH > maxX) maxX = inv.x + INVADER_WIDTH;
  }

  const nextMinX = minX + directionX * STEP_PX;
  const nextMaxX = maxX + directionX * STEP_PX;

  if (nextMinX < 0 || nextMaxX > CANVAS_WIDTH) {
    directionX *= -1;
    formationOffsetY += INVADER_HEIGHT;
  } else {
    formationOffsetX += directionX * STEP_PX;
  }

  for (const inv of invaders) {
    inv.x = inv.baseX + formationOffsetX;
    inv.y = inv.baseY + formationOffsetY;
  }
}

/**
 * Respawn the player at the fixed bottom-centre start position
 * and grant 2 seconds of invulnerability.
 */
function respawnPlayer() {
  const currentPlayer = player;
  if (!currentPlayer) return;
  currentPlayer.x = SPAWN_X;
  currentPlayer.y = SPAWN_Y;
  currentPlayer.clearBullet();
  invulnerable = true;
  invulnerabilityTimer = 0;
  flashTimer = 0;
  flashVisible = true;
}

/**
 * Trigger UFO spawn.
 */
function spawnUfo() {
  const fromLeft = ufoFromLeft;
  ufoFromLeft = !ufoFromLeft; // alternate for next time
  ufo = {
    x: fromLeft ? -UFO_WIDTH : CANVAS_WIDTH,
    y: UFO_Y,
    dx: fromLeft ? UFO_SPEED : -UFO_SPEED,
    width: UFO_WIDTH,
    height: UFO_HEIGHT,
  };
}

/**
 * Fire an enemy bullet from the lowest living invader in a random column.
 */
function fireEnemyBullet() {
  // Gather columns that have at least one living invader
  const liveCols = [];
  for (let col = 0; col < COLS; col++) {
    const colInvaders = invaders.filter(inv => inv.col === col && inv.alive);
    if (colInvaders.length > 0) {
      liveCols.push(col);
    }
  }
  if (liveCols.length === 0) return;

  // Pick a random column
  const chosenCol = liveCols[Math.floor(Math.random() * liveCols.length)];

  // Find the lowest living invader in that column (highest y value)
  const colInvaders = invaders.filter(inv => inv.col === chosenCol && inv.alive);
  let lowest = colInvaders[0];
  for (const inv of colInvaders) {
    if (inv.y > lowest.y) lowest = inv;
  }

  // Spawn bullet at the bottom-centre of that invader
  enemyBullets.push({
    x: lowest.x + (INVADER_WIDTH - ENEMY_BULLET_WIDTH) / 2,
    y: lowest.y + INVADER_HEIGHT,
    width: ENEMY_BULLET_WIDTH,
    height: ENEMY_BULLET_HEIGHT,
  });
}

// ---------------------------------------------------------------------------
// Initialise Level 2
// ---------------------------------------------------------------------------
function initLevel2() {
  directionX = 1;
  formationOffsetX = 0;
  formationOffsetY = 0;
  stepTimer = 0;
  transitionFired = false;
  gameOverFired = false;

  enemyBullets = [];
  shootTimer = 0;
  shootInterval = randomShootInterval();

  ufo = null;
  ufoTimer = 0;
  ufoFromLeft = true;

  invulnerable = false;
  invulnerabilityTimer = 0;
  flashTimer = 0;
  flashVisible = true;

  // cumulativeShotCount is NOT reset — carries over from level 1 / session
  // (level 1 didn't track it, so it starts from 0 at level 2 entry)

  buildFormation();
  hudState.level = 2;

  // Position the player at the spawn position (carry over lives from level 1)
  const currentPlayer = player;
  if (currentPlayer) {
    currentPlayer.x = SPAWN_X;
    currentPlayer.y = SPAWN_Y;
    currentPlayer.clearBullet();
  }
}

// ---------------------------------------------------------------------------
// update(dt) — called every fixed-timestep tick by the game loop
// dt is in seconds
// ---------------------------------------------------------------------------
function update(dt) {
  const dtMs = dt * 1000;

  const currentPlayer = player;

  // -------------------------------------------------------------------------
  // Win condition — all invaders destroyed
  // -------------------------------------------------------------------------
  const alive = invaders.filter(inv => inv.alive);
  const liveCount = alive.length;

  if (liveCount === 0 && !transitionFired) {
    transitionFired = true;
    transitionTo('level3');
    return;
  }

  // -------------------------------------------------------------------------
  // Formation step timer
  // -------------------------------------------------------------------------
  stepTimer += dtMs;
  const interval = calcStepInterval(liveCount);
  if (stepTimer >= interval) {
    stepTimer -= interval;
    stepFormation();
  }

  // -------------------------------------------------------------------------
  // Player bullet vs invaders
  // -------------------------------------------------------------------------
  if (currentPlayer) {
    const bullet = currentPlayer.getBullet();
    if (bullet) {
      for (const inv of invaders) {
        if (!inv.alive) continue;
        if (checkHit({ x: inv.x, y: inv.y, width: inv.width, height: inv.height }, bullet)) {
          inv.alive = false;
          currentPlayer.clearBullet();
          triggerExplosion(inv.x, inv.y);
          hudState.score += 10;
          cumulativeShotCount++;
          break;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Enemy shooting timer
  // -------------------------------------------------------------------------
  shootTimer += dtMs;
  if (shootTimer >= shootInterval) {
    shootTimer = 0;
    shootInterval = randomShootInterval();
    fireEnemyBullet();
  }

  // -------------------------------------------------------------------------
  // Update enemy bullets
  // -------------------------------------------------------------------------
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.y += ENEMY_BULLET_SPEED * dt;
    // Remove if off-screen bottom
    if (b.y > CANVAS_HEIGHT) {
      enemyBullets.splice(i, 1);
    }
  }

  // -------------------------------------------------------------------------
  // Enemy bullets vs player
  // -------------------------------------------------------------------------
  if (currentPlayer && !invulnerable) {
    const playerRect = {
      x: currentPlayer.x,
      y: currentPlayer.y,
      width: SHIP_WIDTH,
      height: SHIP_HEIGHT,
    };
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      if (checkHit(enemyBullets[i], playerRect)) {
        // Remove the bullet
        enemyBullets.splice(i, 1);
        // Lose a life
        currentPlayer.lives -= 1;
        hudState.lives = currentPlayer.lives;

        if (currentPlayer.lives <= 0) {
          // Game Over
          if (!gameOverFired) {
            gameOverFired = true;
            enterGameOver();
          }
          return;
        } else {
          // Respawn with invulnerability
          respawnPlayer();
        }
        break; // Only one hit per frame
      }
    }
  } else if (currentPlayer && invulnerable) {
    // Still remove bullets that would hit the player (ignored but consumed)
    const playerRect = {
      x: currentPlayer.x,
      y: currentPlayer.y,
      width: SHIP_WIDTH,
      height: SHIP_HEIGHT,
    };
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      if (checkHit(enemyBullets[i], playerRect)) {
        enemyBullets.splice(i, 1);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Invulnerability timer and flash
  // -------------------------------------------------------------------------
  if (invulnerable) {
    invulnerabilityTimer += dtMs;
    flashTimer += dtMs;
    if (flashTimer >= FLASH_PERIOD_MS) {
      flashTimer -= FLASH_PERIOD_MS;
      flashVisible = !flashVisible;
    }
    if (invulnerabilityTimer >= INVULNERABILITY_DURATION_MS) {
      invulnerable = false;
      flashVisible = true;
    }
  }

  // -------------------------------------------------------------------------
  // UFO spawn timer
  // -------------------------------------------------------------------------
  ufoTimer += dtMs;
  if (ufoTimer >= UFO_SPAWN_INTERVAL_MS && ufo === null) {
    ufoTimer -= UFO_SPAWN_INTERVAL_MS;
    spawnUfo();
  }

  // -------------------------------------------------------------------------
  // UFO movement and collisions
  // -------------------------------------------------------------------------
  if (ufo !== null) {
    ufo.x += ufo.dx * dt;

    // Check if UFO reached the far edge — disappears silently
    if (ufo.dx > 0 && ufo.x > CANVAS_WIDTH) {
      ufo = null;
    } else if (ufo.dx < 0 && ufo.x + UFO_WIDTH < 0) {
      ufo = null;
    } else if (currentPlayer) {
      // Check player bullet vs UFO
      const bullet = currentPlayer.getBullet();
      if (bullet && checkHit(bullet, { x: ufo.x, y: ufo.y, width: ufo.width, height: ufo.height })) {
        // Award score
        const tier = cumulativeShotCount % 4;
        hudState.score += UFO_SCORE_TIERS[tier];
        cumulativeShotCount++;
        currentPlayer.clearBullet();
        triggerExplosion(ufo.x, ufo.y);
        ufo = null;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Loss condition: any invader's bottom edge >= player's top-edge Y
  // -------------------------------------------------------------------------
  if (currentPlayer) {
    const playerTopY = currentPlayer.y;
    for (const inv of alive) {
      if (inv.y + inv.height >= playerTopY) {
        currentPlayer.lives -= 1;
        hudState.lives = currentPlayer.lives;
        if (currentPlayer.lives <= 0) {
          if (!gameOverFired) {
            gameOverFired = true;
            enterGameOver();
          }
          return;
        }
        // Reset formation, respawn player
        directionX = 1;
        formationOffsetX = 0;
        formationOffsetY = 0;
        stepTimer = 0;
        buildFormation();
        enemyBullets = [];
        respawnPlayer();
        return;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// render(ctx) — called every animation frame by the game loop
// ---------------------------------------------------------------------------
function render(ctx) {
  // Draw invaders
  ctx.fillStyle = '#00FF00';
  for (const inv of invaders) {
    if (inv.alive) {
      ctx.fillRect(Math.round(inv.x), Math.round(inv.y), INVADER_WIDTH, INVADER_HEIGHT);
    }
  }

  // Draw enemy bullets (red)
  ctx.fillStyle = '#FF4444';
  for (const b of enemyBullets) {
    ctx.fillRect(Math.round(b.x), Math.round(b.y), ENEMY_BULLET_WIDTH, ENEMY_BULLET_HEIGHT);
  }

  // Draw UFO (magenta)
  if (ufo !== null) {
    ctx.fillStyle = '#FF00FF';
    ctx.fillRect(Math.round(ufo.x), ufo.y, UFO_WIDTH, UFO_HEIGHT);
    // Label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('UFO', Math.round(ufo.x) + UFO_WIDTH / 2, ufo.y + UFO_HEIGHT / 2);
  }

  // Draw the player — respecting the flash state during invulnerability.
  // The game loop's renderPlaying() also calls player.draw(ctx), so we
  // need to intercept the draw by temporarily overriding draw when invisible.
  // However, since the render hook is called BEFORE player.draw() in
  // game.js's renderPlaying(), we patch draw() on the live player instance.
  const currentPlayer = player;
  if (currentPlayer && invulnerable && !flashVisible) {
    // Store original draw, replace with no-op, will be restored after game
    // renders. We do this by marking a flag that the override draws nothing.
    // Since we can't prevent game.js from calling player.draw(), we patch it.
    currentPlayer._skipDraw = true;
  } else if (currentPlayer) {
    currentPlayer._skipDraw = false;
  }
}

// ---------------------------------------------------------------------------
// Patch Player.draw to respect _skipDraw flag
// ---------------------------------------------------------------------------
// We import Player class but we can't easily patch the prototype without
// risking affecting level 1. Instead we monkey-patch on the instance after
// the player is assigned. We do this once in update/render by checking the
// flag. A cleaner approach is to wrap draw on the instance.
// We handle this by patching in initLevel2 once player is available.
//
// Actually the simplest approach: override draw on the player instance
// in initLevel2, wrapping the original.
// ---------------------------------------------------------------------------

function patchPlayerDraw() {
  const currentPlayer = player;
  if (!currentPlayer || currentPlayer._drawPatched) return;
  const originalDraw = currentPlayer.draw.bind(currentPlayer);
  currentPlayer.draw = function(ctx) {
    if (this._skipDraw) return;
    originalDraw(ctx);
  };
  currentPlayer._drawPatched = true;
  currentPlayer._skipDraw = false;
}

// ---------------------------------------------------------------------------
// Initialise and register with the game loop
// ---------------------------------------------------------------------------
initLevel2();

// We need to patch player draw after initLevel2 (player exists at this point
// since transitionTo('level2') is called while game is in playing scene).
patchPlayerDraw();

registerLevel({ update, render });

// Also re-export enterGameOver so it can be called from within this module
import { enterGameOver } from './game.js';
