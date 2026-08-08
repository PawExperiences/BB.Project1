// game.js — Main game loop and level dispatcher
// ES module; orchestrates Player, level modules, and Boss.
// Runs from a file:// URL with no bundler.

import { initInput, isKeyHeld } from './input.js';
import { Player } from './player.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import * as Level1 from './level1.js';
import * as Level2 from './level2.js';
import * as Level3 from './level3.js';
import * as Boss   from './boss.js';

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
const TOTAL_LEVELS = 4;

let currentLevel   = 1;
let score          = 0;
let gameState      = 'playing'; // 'playing' | 'gameOver' | 'win'
let lastTimestamp  = null;

// Player
let player         = null;

// Active player bullets — shared array passed to level modules
let playerBullets  = [];

// ---------------------------------------------------------------------------
// Initialisation helpers
// ---------------------------------------------------------------------------

function createPlayer() {
  return new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}

/**
 * Build a top-left-origin rect from the player (whose x,y is centre).
 * Used by boss collision and level-loss checks.
 */
function playerRect() {
  return {
    x:      player.x - player.width  / 2,
    y:      player.y - player.height / 2,
    width:  player.width,
    height: player.height,
  };
}

// playerTopLeft — top-left rect used by level 1–3 modules
function playerTopLeft() {
  return {
    x:      player.x - player.width  / 2,
    y:      player.y - player.height / 2,
    width:  player.width,
    height: player.height,
  };
}

function startLevel(level) {
  currentLevel  = level;
  playerBullets = [];

  if (level === 1) {
    Level1.init(canvas, ctx, playerTopLeft());
  } else if (level === 2) {
    Level2.init(canvas, ctx, playerTopLeft());
  } else if (level === 3) {
    Level3.init(canvas, ctx, playerTopLeft());
  } else if (level === 4) {
    Boss.init(canvas, ctx);
  }
}

function resetGame() {
  score      = 0;
  gameState  = 'playing';
  player     = createPlayer();
  startLevel(1);
}

// ---------------------------------------------------------------------------
// Input — fire bullet from player
// ---------------------------------------------------------------------------
// Space is handled inside player.js already (single-bullet mechanic).
// We just collect the bullet into the shared array each frame.
function syncPlayerBullet() {
  if (player.bulletActive) {
    // Represent bullet as AABB rect (top-left origin)
    const bullet = {
      x:      player.bulletX - 1.5,  // half of BULLET_W=3
      y:      player.bulletY,
      width:  3,
      height: 10,
    };
    // Sync: replace or insert
    if (playerBullets.length === 0) {
      playerBullets.push(bullet);
    } else {
      // Update the single bullet's position in place
      playerBullets[0].x = bullet.x;
      playerBullets[0].y = bullet.y;
    }
  } else {
    playerBullets.length = 0;
  }
}

// ---------------------------------------------------------------------------
// Win screen overlay
// ---------------------------------------------------------------------------
function drawWinScreen() {
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  // Title
  ctx.fillStyle = '#ffdd00';
  ctx.font      = 'bold 48px monospace';
  ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 80);

  // Score
  ctx.fillStyle = '#ffffff';
  ctx.font      = '28px monospace';
  ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, canvas.height / 2 - 20);

  // Restart prompt
  ctx.fillStyle = '#aaffaa';
  ctx.font      = '22px monospace';
  ctx.fillText('Press ENTER or R to Restart', canvas.width / 2, canvas.height / 2 + 40);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Game-over screen overlay
// ---------------------------------------------------------------------------
function drawGameOverScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ff4444';
  ctx.font      = 'bold 48px monospace';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '28px monospace';
  ctx.fillText(`SCORE: ${score}`, canvas.width / 2, canvas.height / 2);

  ctx.fillStyle = '#aaffaa';
  ctx.font      = '22px monospace';
  ctx.fillText('Press ENTER or R to Restart', canvas.width / 2, canvas.height / 2 + 60);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main game loop
// ---------------------------------------------------------------------------
function loop(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05); // cap at 50 ms
  lastTimestamp = timestamp;

  // -------------------------------------------------------------------------
  // Non-playing states
  // -------------------------------------------------------------------------
  if (gameState === 'win') {
    // Keep drawing the last frame underneath then overlay win screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawWinScreen();

    if (isKeyHeld('Enter') || isKeyHeld('KeyR')) {
      resetGame();
    }
    requestAnimationFrame(loop);
    return;
  }

  if (gameState === 'gameOver') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGameOverScreen();

    if (isKeyHeld('Enter') || isKeyHeld('KeyR')) {
      resetGame();
    }
    requestAnimationFrame(loop);
    return;
  }

  // -------------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------------

  // Player
  player.update(dt);
  syncPlayerBullet();

  // Level dispatch
  let levelResult = null;

  if (currentLevel === 1) {
    // Level1 expects playerState as top-left rect; pass fresh each update
    // Level1.init was called with a snapshot; we update the shared ref via re-init
    // is not ideal — instead we pass playerBullets and get result.
    // Level1.update(deltaTime, playerBullets) — playerState was set at init;
    // for a robust solution we re-pass it here if the API supports it.
    levelResult = Level1.update(dt, playerBullets);

  } else if (currentLevel === 2) {
    levelResult = Level2.update(dt, playerBullets);

  } else if (currentLevel === 3) {
    levelResult = Level3.update(dt, playerBullets);

  } else if (currentLevel === 4) {
    // Boss level — pass playerBullets and player bounding rect
    const pRect = playerRect();
    levelResult = Boss.update(dt, playerBullets, pRect);
  }

  // Handle level results
  if (levelResult === 'NEXT_LEVEL') {
    const nextLevel = currentLevel + 1;
    if (nextLevel > TOTAL_LEVELS) {
      // All levels complete — this path shouldn't occur since Level 4 returns
      // 'BOSS_DEAD' not 'NEXT_LEVEL', but guard anyway.
      gameState = 'win';
    } else {
      score += 100; // level-clear bonus
      startLevel(nextLevel);
    }
  } else if (levelResult === 'LIFE_LOST') {
    player.lives -= 1;
    if (player.lives <= 0) {
      gameState = 'gameOver';
    } else {
      // Restart current level (keep lives)
      startLevel(currentLevel);
    }
  } else if (levelResult === 'BOSS_DEAD') {
    gameState = 'win';
  } else if (levelResult === 'PLAYER_HIT') {
    // Sudden death — boss hit player
    gameState = 'gameOver';
    // Score is preserved for display; reset will start from Level 1
  }

  // Sync bullet removal back to player if a level consumed the bullet
  if (playerBullets.length === 0 && player.bulletActive) {
    player.clearBullet();
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw level content
  if (currentLevel === 1) {
    Level1.draw();
  } else if (currentLevel === 2) {
    Level2.draw();
  } else if (currentLevel === 3) {
    Level3.draw();
  } else if (currentLevel === 4) {
    Boss.draw();
  }

  // Draw player
  player.draw(ctx);

  // Draw score HUD
  _drawHUD();

  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
function _drawHUD() {
  ctx.save();
  ctx.fillStyle    = '#ffffff';
  ctx.font         = '16px monospace';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  // Score at top-right, avoid overlapping boss health bar (which uses top area)
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE: ${score}`, canvas.width - 10, 32);
  if (currentLevel < 4) {
    ctx.textAlign = 'left';
    ctx.fillText(`LIVES: ${player.lives}`, 10, 32);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
initInput();
resetGame();
requestAnimationFrame(loop);
