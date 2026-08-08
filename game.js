// game.js — Game loop and canvas framework
// Owned by card: "Game loop and canvas framework"

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';
import { initInvaders } from './invaders.js';
import * as Level1 from './level1.js';
import * as Level2 from './level2.js';
import * as Level3 from './level3.js';
import * as Level4 from './boss.js';

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

canvas.width  = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ---------------------------------------------------------------------------
// Shared HUD state (exported so level modules can read it)
// ---------------------------------------------------------------------------
export const hudState = {
  score: 0,
  lives: STARTING_LIVES,
  level: 1,
};

// ---------------------------------------------------------------------------
// HUD controller — thin wrapper so level modules don't mutate hudState directly
// ---------------------------------------------------------------------------
const hud = {
  set(key, value) {
    if (key in hudState) {
      hudState[key] = value;
    }
  },
};

// ---------------------------------------------------------------------------
// Player instance (shared across levels)
// ---------------------------------------------------------------------------
let player = new Player();

// ---------------------------------------------------------------------------
// Level-dispatch table
// ---------------------------------------------------------------------------
const levelModules = {
  1: Level1,
  2: Level2,
  3: Level3,
  4: Level4,
};

let currentLevel   = 0;
let currentModule  = null;

// ---------------------------------------------------------------------------
// drawHUD — renders score, lives, level each frame
// ---------------------------------------------------------------------------
function drawHUD() {
  ctx.save();
  ctx.fillStyle  = '#ffffff';
  ctx.font       = '16px monospace';
  ctx.textAlign  = 'left';
  ctx.textBaseline = 'top';

  ctx.fillText(`Score: ${hudState.score}`,  10,  4);
  ctx.fillText(`Lives: ${hudState.lives}`,  10, 22);
  ctx.fillText(`Level: ${hudState.level}`, 10, 40);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// restartGame — full reset back to Level 1
// ---------------------------------------------------------------------------
function restartGame() {
  // Stop current level if running
  if (currentModule && typeof currentModule.stop === 'function') {
    currentModule.stop();
  }

  // Reset shared state
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;
  hudState.level = 1;

  // Reset player
  player = new Player();

  // Reset invader formation
  initInvaders();

  // Go to Level 1
  startLevel(1);
}

// ---------------------------------------------------------------------------
// startLevel(n) — activates a level module
// ---------------------------------------------------------------------------
function startLevel(n) {
  // Stop previous level
  if (currentModule && typeof currentModule.stop === 'function') {
    currentModule.stop();
  }

  currentLevel  = n;
  currentModule = levelModules[n];
  hudState.level = n;

  if (!currentModule) {
    console.warn(`game.js: no module registered for level ${n}`);
    return;
  }

  if (typeof currentModule.start === 'function') {
    // Level 4 (boss) needs extra args: player reference and restart callback
    if (n === 4) {
      currentModule.start(ctx, hud, player, restartGame);
    } else {
      currentModule.start(ctx, hud);
    }
  }
}

// ---------------------------------------------------------------------------
// Main rAF loop — draws HUD + player each frame (levels own their own loops
// except for HUD/player which are always drawn here for levels 1–3)
// ---------------------------------------------------------------------------
let lastTimestamp = null;

function mainLoop(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
  lastTimestamp = timestamp;

  // Level 4 (boss) owns its own full rAF loop including player draw.
  // For levels 1–3, game.js drives the player update/draw and HUD.
  if (currentLevel !== 4) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Update & draw player
    player.update(dt);
    player.draw(ctx);

    // Draw HUD on top
    drawHUD();
  }

  requestAnimationFrame(mainLoop);
}

// ---------------------------------------------------------------------------
// levelComplete event listener — moves to the next level
// ---------------------------------------------------------------------------
window.addEventListener('levelComplete', (e) => {
  const next = e.detail && e.detail.nextLevel;
  if (next && levelModules[next]) {
    startLevel(next);
  } else {
    console.warn(`game.js: levelComplete received unknown nextLevel=${next}`);
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
initInput();
startLevel(1);
requestAnimationFrame(mainLoop);
