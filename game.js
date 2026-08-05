// game.js — Main game loop and scene manager.
//
// Scene flow:
//   SCENE_PLAYING  — active gameplay (Levels 1-3 then Boss)
//   SCENE_WIN      — win screen shown after boss is defeated
//
// Level progression: Level 1 → Level 2 → Level 3 → Boss (level 4) → Win Screen

import { initInput } from './input.js';
import { Player } from './player.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { getScore, resetScore } from './score.js';
import { drawInvaders } from './invaders.js';
import { updateExplosions, drawExplosions } from './explosion.js';
import { runCollisionPass } from './collision.js';
import { initLevel1, updateLevel1, resetFormation } from './level1.js';
import { initLevel2, updateLevel2 } from './level2.js';
import { initLevel3, updateLevel3 } from './level3.js';
import {
  initBoss,
  updateBoss,
  drawBoss,
  resetBoss,
  checkPlayerBulletVsBoss,
  drawWinScreen,
} from './boss.js';

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Scene identifiers
// ---------------------------------------------------------------------------
const SCENE_PLAYING = 'playing';
const SCENE_WIN     = 'win';

// ---------------------------------------------------------------------------
// Mutable game state
// ---------------------------------------------------------------------------
let currentScene = SCENE_PLAYING;
let currentLevel = 1;   // 1, 2, 3, or 4 (boss)
let hudLives     = 3;
let winScore     = 0;   // score captured at victory

let player = new Player();

// ---------------------------------------------------------------------------
// Fixed-timestep loop variables
// ---------------------------------------------------------------------------
const FIXED_DT    = 1 / 60;          // seconds
const FIXED_DT_MS = FIXED_DT * 1000; // milliseconds
let accumulator   = 0;
let lastTimestamp = null;

// ---------------------------------------------------------------------------
// Level initialisation
// ---------------------------------------------------------------------------
function startLevel(level) {
  currentLevel = level;

  // Always reset boss state when not entering the boss level, so stale
  // state from a previous run cannot interfere.
  if (level !== 4) resetBoss();

  if (level === 1) {
    initLevel1({
      onLoseLife:   handleLoseLife,
      onGameOver:   handleGameOver,
      onLevelClear: () => startLevel(2),
      getPlayerY:   () => player.y,
      getLives:     () => hudLives,
      level:        1,
    });
  } else if (level === 2) {
    initLevel2({
      onLoseLife:   handleLoseLife,
      onGameOver:   handleGameOver,
      onLevelClear: () => startLevel(3),
      getPlayerY:   () => player.y,
      getLives:     () => hudLives,
      level:        2,
    });
  } else if (level === 3) {
    initLevel3({
      onLoseLife:   handleLoseLife,
      onGameOver:   handleGameOver,
      onLevelClear: () => startLevel(4),
      getPlayerY:   () => player.y,
      getLives:     () => hudLives,
      level:        3,
    });
  } else if (level === 4) {
    initBoss({
      onPlayerHit:    handleBossInstantDeath,
      onBossDefeated: handleBossDefeated,
      getPlayer:      () => player,
    });
  }
}

// ---------------------------------------------------------------------------
// Event callbacks
// ---------------------------------------------------------------------------
function handleLoseLife() {
  hudLives -= 1;
  if (hudLives <= 0) {
    handleGameOver();
  } else {
    resetFormation();
  }
}

function handleGameOver() {
  hudLives = 3;
  resetScore();
  player = new Player();
  currentScene = SCENE_PLAYING;
  startLevel(1);
}

/** Boss projectile hit the player — instant death, restart from Level 1. */
function handleBossInstantDeath() {
  hudLives = 3;
  resetScore();
  player = new Player();
  currentScene = SCENE_PLAYING;
  startLevel(1);
}

/** Boss reached 0 HP — show the win screen. */
function handleBossDefeated() {
  winScore = getScore();
  currentScene = SCENE_WIN;
}

// Any-key handler for the win screen.
window.addEventListener('keydown', (e) => {
  // Ignore key-repeat to avoid double-triggering.
  if (e.repeat) return;
  if (currentScene === SCENE_WIN) {
    hudLives = 3;
    resetScore();
    player = new Player();
    currentScene = SCENE_PLAYING;
    startLevel(1);
  }
});

// ---------------------------------------------------------------------------
// Collision pass for the boss level
// ---------------------------------------------------------------------------
function runBossCollisionPass() {
  if (player.bullet === null) return;
  const hit = checkPlayerBulletVsBoss(player.bullet);
  if (hit) {
    player.bullet = null;
  }
}

// ---------------------------------------------------------------------------
// Update (fixed-timestep)
// ---------------------------------------------------------------------------
function update(dt) {
  if (currentScene !== SCENE_PLAYING) return;

  player.update(dt);

  if (currentLevel === 1) {
    runCollisionPass(player);
    updateLevel1(dt);
  } else if (currentLevel === 2) {
    runCollisionPass(player);
    updateLevel2(dt);
  } else if (currentLevel === 3) {
    runCollisionPass(player);
    updateLevel3(dt);
  } else if (currentLevel === 4) {
    runBossCollisionPass();
    updateBoss(dt);
  }

  updateExplosions();
}

// ---------------------------------------------------------------------------
// Draw
// ---------------------------------------------------------------------------
function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (currentScene === SCENE_WIN) {
    drawWinScreen(ctx, winScore);
    return;
  }

  // SCENE_PLAYING
  if (currentLevel === 4) {
    drawBoss(ctx);
  } else {
    drawInvaders(ctx);
  }

  player.draw(ctx);
  drawExplosions(ctx);
  drawHUD();
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
function drawHUD() {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font      = '16px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${getScore()}`, 16, 24);

  ctx.textAlign = 'right';
  ctx.fillText(`Lives: ${hudLives}`, CANVAS_WIDTH - 16, 24);

  ctx.textAlign = 'center';
  const levelLabel = currentLevel === 4 ? 'BOSS' : String(currentLevel);
  ctx.fillText(`Level: ${levelLabel}`, CANVAS_WIDTH / 2, 24);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Game loop
// ---------------------------------------------------------------------------
function loop(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  accumulator += elapsed;
  while (accumulator >= FIXED_DT_MS) {
    update(FIXED_DT);
    accumulator -= FIXED_DT_MS;
  }

  draw();
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
initInput();
startLevel(1);
requestAnimationFrame(loop);
