// game.js — Central game loop and scene manager.
// Scenes: 'playing' (levels 1-3), 'boss', 'win'.
// Exports: hudState (read by collision.js)

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput, isKeyHeld } from './input.js';
import { Player } from './player.js';
import { checkCollisions } from './collision.js';
import { init as level1Init, update as level1Update, render as level1Render } from './level1.js';
import { init as level2Init, update as level2Update, render as level2Render } from './level2.js';
import { init as level3Init, update as level3Update, render as level3Render } from './level3.js';
import {
  init    as bossInit,
  update  as bossUpdate,
  render  as bossRender,
  getBossHP,
  getBossRect,
  hitBoss,
} from './boss.js';

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Shared HUD state — exported so collision.js can mutate score.
// ---------------------------------------------------------------------------
export const hudState = {
  score: 0,
  lives: STARTING_LIVES,
  level: 1,
};

// ---------------------------------------------------------------------------
// Scene management
// ---------------------------------------------------------------------------
// Possible scenes: 'playing', 'boss', 'win'
let scene = 'playing';

// The Player instance, recreated on full restart.
let player = null;

// Tracks whether the boss has been initialised for the current run.
let bossInitialised = false;

// Win screen: was the restart button activated via keyboard?
let winRestartReady = false;

// ---------------------------------------------------------------------------
// Full game reset — back to Level 1, score 0
// ---------------------------------------------------------------------------
function resetGame() {
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;
  hudState.level = 1;

  scene            = 'playing';
  bossInitialised  = false;
  winRestartReady  = false;

  player = new Player();
  // Expose player on hudState so boss.js collision can reach it.
  hudState.player  = player;

  level1Init(ctx, hudState);
}

// ---------------------------------------------------------------------------
// Boss callbacks (injected into boss.js on boss init)
// ---------------------------------------------------------------------------
function onPlayerHit() {
  // Sudden-death rule: immediately restart from Level 1
  resetGame();
}

function onBossDead() {
  // Transition to win screen
  scene = 'win';
}

// ---------------------------------------------------------------------------
// Boss player-bullet vs boss collision
// ---------------------------------------------------------------------------
function checkBossCollisions() {
  if (!player.bullet || !player.bullet.active) return;

  const bullet = player.bullet;
  const bulletRect = {
    x:      bullet.x,
    y:      bullet.y,
    width:  4,
    height: 10,
  };

  const bossRect = getBossRect();
  if (
    bulletRect.x < bossRect.x + bossRect.width  &&
    bulletRect.x + bulletRect.width  > bossRect.x &&
    bulletRect.y < bossRect.y + bossRect.height &&
    bulletRect.y + bulletRect.height > bossRect.y
  ) {
    player.bullet.active = false;
    hudState.score += 50; // bonus points per boss hit
    hitBoss();
  }
}

// ---------------------------------------------------------------------------
// Level-module dispatch table
// ---------------------------------------------------------------------------
const levelModules = {
  1: { init: level1Init, update: level1Update, render: level1Render },
  2: { init: level2Init, update: level2Update, render: level2Render },
  3: { init: level3Init, update: level3Update, render: level3Render },
};

let currentLevelInited = false;
let lastLevelInited    = 0;

// ---------------------------------------------------------------------------
// HUD rendering (lives, score, level)
// ---------------------------------------------------------------------------
function drawHUD() {
  ctx.save();
  ctx.font         = '18px monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle    = '#ffffff';

  // Score — top left
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${hudState.score}`, 16, 16);

  // Lives — top right
  ctx.textAlign = 'right';
  ctx.fillText(`Lives: ${hudState.lives}`, CANVAS_WIDTH - 16, 16);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Win screen rendering
// ---------------------------------------------------------------------------
function drawWinScreen() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Dark background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const cx = CANVAS_WIDTH  / 2;
  const cy = CANVAS_HEIGHT / 2;

  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  // Congratulatory title
  ctx.font      = 'bold 48px monospace';
  ctx.fillStyle = '#ffdd00';
  ctx.fillText('YOU WIN!', cx, cy - 120);

  // Stars / flavour
  ctx.font      = '24px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('The boss has been defeated!', cx, cy - 70);

  // Final score
  ctx.font      = '32px monospace';
  ctx.fillStyle = '#00ff88';
  ctx.fillText(`Final Score: ${hudState.score}`, cx, cy);

  // Restart instruction
  ctx.font      = '22px monospace';
  ctx.fillStyle = '#aaaaff';
  ctx.fillText('Press  ENTER  or  R  to play again', cx, cy + 80);

  // Restart button — drawn as a styled rect
  const btnW = 260;
  const btnH = 50;
  const btnX = cx - btnW / 2;
  const btnY = cy + 120;

  ctx.fillStyle   = '#223366';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = '#aaaaff';
  ctx.lineWidth   = 2;
  ctx.strokeRect(btnX, btnY, btnW, btnH);

  ctx.font      = 'bold 20px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('[ RESTART — Level 1 ]', cx, btnY + btnH / 2);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main game loop
// ---------------------------------------------------------------------------
let lastTimestamp = null;

function loop(timestamp) {
  requestAnimationFrame(loop);

  // Compute dt in seconds (capped at 100 ms to avoid spiral-of-death on tab-focus)
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const dtMs = Math.min(timestamp - lastTimestamp, 100);
  lastTimestamp = timestamp;
  const dt = dtMs / 1000;

  // ── WIN SCREEN ────────────────────────────────────────────────────────────
  if (scene === 'win') {
    drawWinScreen();

    // Listen for restart input
    if (isKeyHeld('Enter') || isKeyHeld('r') || isKeyHeld('R')) {
      if (!winRestartReady) {
        winRestartReady = true;
        resetGame();
      }
    } else {
      winRestartReady = false;
    }
    return;
  }

  // ── CLEAR CANVAS ─────────────────────────────────────────────────────────
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // ── BOSS SCENE ───────────────────────────────────────────────────────────
  if (scene === 'boss') {
    if (!bossInitialised) {
      bossInit(ctx, hudState, onPlayerHit, onBossDead);
      bossInitialised = true;
    }

    player.update(dt);
    bossUpdate(dt);
    checkBossCollisions();

    bossRender(ctx);
    player.draw(ctx);
    drawHUD();
    return;
  }

  // ── PLAYING SCENE (levels 1–3) ───────────────────────────────────────────
  const levelNum = hudState.level;
  const mod      = levelModules[levelNum];

  if (!mod) {
    // No module for this level number — should not happen in normal play
    console.warn('game.js: no module for level', levelNum);
    return;
  }

  // Initialise the level module when we first enter it (or after a level change)
  if (!currentLevelInited || lastLevelInited !== levelNum) {
    mod.init(ctx, hudState);
    currentLevelInited = true;
    lastLevelInited    = levelNum;
  }

  // Update
  const levelBefore = hudState.level;
  mod.update(dtMs);   // level modules accept dt in ms
  player.update(dt);

  // Run player-bullet vs invader collision
  checkCollisions(player);

  // Check if level module advanced the level
  if (hudState.level !== levelBefore) {
    currentLevelInited = false; // force re-init on next frame

    // If we just finished Level 3, switch to boss scene
    if (levelBefore === 3) {
      scene           = 'boss';
      bossInitialised = false;
    }
  }

  // Render
  mod.render(ctx);
  player.draw(ctx);
  drawHUD();
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
initInput();
resetGame();
requestAnimationFrame(loop);
