// game.js — Main game loop and scene manager.
//
// Scene flow:
//   title    — Title screen, press ENTER to start
//   playing  — Active gameplay (delegates to update/draw)
//   gameover — Game Over screen, press ENTER to return to title
//
// Exports:
//   hudState          — { score, lives, hiScore } — mutable, shared with sibling modules
//   handleGameOver()  — transitions playing → gameover

import { initInput } from './input.js';
import { Player } from './player.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
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
const SCENE_TITLE    = 'title';
const SCENE_PLAYING  = 'playing';
const SCENE_GAMEOVER = 'gameover';
const SCENE_WIN      = 'win';

// ---------------------------------------------------------------------------
// HUD state — named export so sibling modules can read/write it.
// game.js owns the canonical copy; drawHUD() reads from this object.
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
};

// ---------------------------------------------------------------------------
// Mutable game state
// ---------------------------------------------------------------------------
let currentScene = SCENE_TITLE;
let currentLevel = 1;   // 1, 2, 3, or 4 (boss)
let winScore     = 0;   // score captured at victory

let player = new Player();

// ---------------------------------------------------------------------------
// Fixed-timestep loop variables
// ---------------------------------------------------------------------------
const UPDATE_STEP    = 1 / 60;           // seconds per tick
const DELTA_CAP_MS   = 250;              // ms — cap to prevent burst catch-up
const FIXED_DT_MS    = UPDATE_STEP * 1000;
let accumulator      = 0;
let lastTimestamp    = null;

// ---------------------------------------------------------------------------
// Scene transition helpers
// ---------------------------------------------------------------------------

/** Transition playing → gameover. Callable from game logic. */
export function handleGameOver() {
  // Preserve hi-score before resetting.
  if (hudState.score > hudState.hiScore) {
    hudState.hiScore = hudState.score;
  }
  currentScene = SCENE_GAMEOVER;
}

/** Full game reset — used when returning to title from gameover. */
function fullReset() {
  resetScore();
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;
  player = new Player();
  currentLevel = 1;
}

// ---------------------------------------------------------------------------
// Level initialisation
// ---------------------------------------------------------------------------
function startLevel(level) {
  currentLevel = level;

  if (level !== 4) resetBoss();

  if (level === 1) {
    initLevel1({
      onLoseLife:   handleLoseLife,
      onGameOver:   handleGameOver,
      onLevelClear: () => startLevel(2),
      getPlayerY:   () => player.y,
      getLives:     () => hudState.lives,
      level:        1,
    });
  } else if (level === 2) {
    initLevel2({
      onLoseLife:   handleLoseLife,
      onGameOver:   handleGameOver,
      onLevelClear: () => startLevel(3),
      getPlayerY:   () => player.y,
      getLives:     () => hudState.lives,
      level:        2,
    });
  } else if (level === 3) {
    initLevel3({
      onLoseLife:   handleLoseLife,
      onGameOver:   handleGameOver,
      onLevelClear: () => startLevel(4),
      getPlayerY:   () => player.y,
      getLives:     () => hudState.lives,
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
// Event callbacks from level modules
// ---------------------------------------------------------------------------
function handleLoseLife() {
  hudState.lives -= 1;
  if (hudState.lives <= 0) {
    handleGameOver();
  } else {
    resetFormation();
  }
}

/** Boss projectile hit the player — instant death, restart from Level 1. */
function handleBossInstantDeath() {
  if (hudState.score > hudState.hiScore) {
    hudState.hiScore = hudState.score;
  }
  resetScore();
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;
  player = new Player();
  currentScene = SCENE_PLAYING;
  startLevel(1);
}

/** Boss reached 0 HP — show the win screen. */
function handleBossDefeated() {
  winScore = getScore();
  if (winScore > hudState.hiScore) {
    hudState.hiScore = winScore;
  }
  currentScene = SCENE_WIN;
}

// ---------------------------------------------------------------------------
// Keyboard listeners for scene transitions
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;

  if (currentScene === SCENE_TITLE && e.code === 'Enter') {
    // title → playing
    fullReset();
    currentScene = SCENE_PLAYING;
    startLevel(1);
    return;
  }

  if (currentScene === SCENE_GAMEOVER && e.code === 'Enter') {
    // gameover → title (no reload)
    fullReset();
    currentScene = SCENE_TITLE;
    return;
  }

  if (currentScene === SCENE_WIN) {
    // win screen — any key → title
    fullReset();
    currentScene = SCENE_TITLE;
    return;
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
// Update (fixed-timestep) — called once per tick
// ---------------------------------------------------------------------------
export function update(dt) {
  if (currentScene !== SCENE_PLAYING) return;

  // Keep hudState.score in sync with score.js
  hudState.score = getScore();

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

  // Sync hudState after score updates from collision
  hudState.score = getScore();
}

// ---------------------------------------------------------------------------
// Draw — called every animation frame
// ---------------------------------------------------------------------------
export function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (currentScene === SCENE_TITLE) {
    drawTitleScene();
    return;
  }

  if (currentScene === SCENE_GAMEOVER) {
    drawGameOverScene();
    return;
  }

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
// Scene renderers
// ---------------------------------------------------------------------------

function drawTitleScene() {
  ctx.save();

  // Background already cleared to transparent; fill black.
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title text
  ctx.fillStyle  = '#ffffff';
  ctx.font       = 'bold 48px monospace';
  ctx.textAlign  = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  // Subtitle / prompt
  ctx.fillStyle = '#00ff00';
  ctx.font      = '24px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  // Hi-score
  if (hudState.hiScore > 0) {
    ctx.fillStyle = '#ffff00';
    ctx.font      = '18px monospace';
    ctx.fillText(`HI-SCORE: ${hudState.hiScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  }

  ctx.restore();
}

function drawGameOverScene() {
  ctx.save();

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  // "GAME OVER"
  ctx.fillStyle = '#ff0000';
  ctx.font      = 'bold 56px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  // Final score
  ctx.fillStyle = '#ffffff';
  ctx.font      = '28px monospace';
  ctx.fillText(`Score: ${hudState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  // Hi-score
  ctx.fillStyle = '#ffff00';
  ctx.font      = '20px monospace';
  ctx.fillText(`Hi-Score: ${hudState.hiScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

  // Restart prompt
  ctx.fillStyle = '#00ff00';
  ctx.font      = '22px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// HUD — drawn directly onto the canvas during SCENE_PLAYING
// ---------------------------------------------------------------------------
export function drawHUD() {
  ctx.save();
  ctx.fillStyle    = '#ffffff';
  ctx.font         = '16px monospace';
  ctx.textBaseline = 'top';

  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${hudState.score}`, 16, 8);

  ctx.textAlign = 'right';
  ctx.fillText(`Lives: ${hudState.lives}`, CANVAS_WIDTH - 16, 8);

  ctx.textAlign = 'center';
  const levelLabel = currentLevel === 4 ? 'BOSS' : `Level: ${currentLevel}`;
  ctx.fillText(levelLabel, CANVAS_WIDTH / 2, 8);

  // Hi-score
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffff00';
  ctx.fillText(`HI: ${hudState.hiScore}`, CANVAS_WIDTH / 2, 28);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Game loop
// ---------------------------------------------------------------------------
function loop(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;

  let elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Cap the accumulated delta so returning from a background tab never
  // triggers a burst of catch-up update steps.
  if (elapsed > DELTA_CAP_MS) elapsed = DELTA_CAP_MS;

  accumulator += elapsed;
  while (accumulator >= FIXED_DT_MS) {
    update(UPDATE_STEP);
    accumulator -= FIXED_DT_MS;
  }

  draw();
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
initInput();
requestAnimationFrame(loop);
