// game.js — Game loop, scene state machine, and HUD for Space Invaders

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';         // Input card
import { initLevel1, updateLevel1, renderLevel1 } from './level1.js'; // Level 1 card
import { initLevel2, updateLevel2, renderLevel2 } from './level2.js'; // Level 2 card
// Future card imports:
// import { loadLevel3 } from './level3.js';                              // Added by: Level 3 card
// import { createBoss, updateBoss, renderBoss } from './boss.js';        // Added by: Boss card

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// HUD state — named export so later cards can import and mutate directly
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
  level:   1,
};

// ---------------------------------------------------------------------------
// Scene state machine
// Scenes: 'title' | 'playing' | 'level2' | 'gameover'
// ---------------------------------------------------------------------------
let currentScene = 'title';

/**
 * Transition to a new scene.
 * Exported so level modules can call it directly.
 * @param {string} scene
 */
export function transitionTo(scene) {
  if (scene === 'title') {
    // Reset game state when returning to title
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    hudState.level = 1;
  }
  if (scene === 'playing') {
    initPlayingScene();
  }
  if (scene === 'level2') {
    initLevel2Scene();
  }
  currentScene = scene;
}

// ---------------------------------------------------------------------------
// Playing-scene initialisation
// ---------------------------------------------------------------------------
function initPlayingScene() {
  initInput(); // safe to call multiple times — listeners are idempotent
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;
  hudState.level = 1;
  initLevel1();
}

/**
 * Initialise Level 2 scene.
 * Lives and score carry over from Level 1 — do not reset them here.
 */
function initLevel2Scene() {
  initInput();
  initLevel2();
}

// ---------------------------------------------------------------------------
// Input — minimal ENTER-key handling (full input system initialised above)
// ---------------------------------------------------------------------------
const keysDown = {};

window.addEventListener('keydown', (e) => {
  keysDown[e.code] = true;
});

window.addEventListener('keyup', (e) => {
  delete keysDown[e.code];
});

// One-shot ENTER detection: consumed once per press
let enterConsumed = false;

function enterJustPressed() {
  if (keysDown['Enter'] && !enterConsumed) {
    enterConsumed = true;
    return true;
  }
  if (!keysDown['Enter']) {
    enterConsumed = false;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// ---------------------------------------------------------------------------
const UPDATE_STEP   = 1 / 60;   // seconds per update tick
const MAX_DELTA     = 0.25;     // cap to prevent burst after backgrounding

let lastTimestamp   = null;
let accumulator     = 0;

function gameLoop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let delta = (timestamp - lastTimestamp) / 1000; // convert ms → seconds
  lastTimestamp = timestamp;

  // Cap accumulated delta
  if (delta > MAX_DELTA) delta = MAX_DELTA;
  accumulator += delta;

  // Fixed-timestep update phase
  while (accumulator >= UPDATE_STEP) {
    update(UPDATE_STEP);
    accumulator -= UPDATE_STEP;
  }

  // Render phase — called once per animation frame
  render();

  requestAnimationFrame(gameLoop);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
function update(dt) {
  switch (currentScene) {
    case 'title':
      updateTitle(dt);
      break;
    case 'playing':
      updatePlaying(dt);
      break;
    case 'gameover':
      updateGameOver(dt);
      break;
    case 'level2':
      updateLevel2Scene(dt);
      break;
  }
}

function updateTitle(_dt) {
  if (enterJustPressed()) {
    transitionTo('playing');
  }
}

function updatePlaying(dt) {
  updateLevel1(dt);
}

function updateGameOver(_dt) {
  if (enterJustPressed()) {
    transitionTo('title');
  }
}

function updateLevel2Scene(dt) {
  updateLevel2(dt);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function render() {
  // Clear
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (currentScene) {
    case 'title':
      renderTitle();
      break;
    case 'playing':
      renderPlaying();
      break;
    case 'gameover':
      renderGameOver();
      break;
    case 'level2':
      renderLevel2Scene();
      break;
  }
}

// ---------------------------------------------------------------------------
// Scene renderers
// ---------------------------------------------------------------------------
function renderTitle() {
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  // Title text
  ctx.fillStyle = '#0f0';
  ctx.font      = 'bold 64px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  // Subtitle
  ctx.fillStyle = '#fff';
  ctx.font      = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

function renderPlaying() {
  // Draw order (back to front):
  //  1. HUD
  //  2. Level 1 entities (invaders, explosions, player)
  drawHUD();
  renderLevel1(ctx);
}

function renderLevel2Scene() {
  drawHUD();
  renderLevel2(ctx);
}

function renderGameOver() {
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  // Game Over
  ctx.fillStyle = '#f00';
  ctx.font      = 'bold 72px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  // Final score
  ctx.fillStyle = '#fff';
  ctx.font      = '32px monospace';
  ctx.fillText('Score: ' + hudState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  // Restart prompt
  ctx.font = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

// ---------------------------------------------------------------------------
// HUD — drawn directly onto the canvas
// ---------------------------------------------------------------------------
function drawHUD() {
  const PAD  = 16;

  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.font         = 'bold 20px monospace';

  // Score
  ctx.fillStyle = '#fff';
  ctx.fillText('SCORE: ' + hudState.score, PAD, PAD);

  // Hi-Score (centred)
  ctx.textAlign = 'center';
  ctx.fillText('HI: ' + hudState.hiScore, CANVAS_WIDTH / 2, PAD);

  // Lives
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f0';
  ctx.fillText('LIVES: ' + hudState.lives, CANVAS_WIDTH - PAD, PAD);

  // Level number — displayed below lives on the right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ff0';
  ctx.fillText('LEVEL ' + hudState.level, CANVAS_WIDTH - PAD, PAD + 24);

  // Reset alignment for subsequent draws
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ---------------------------------------------------------------------------
// Kick off the loop
// ---------------------------------------------------------------------------
initInput();
requestAnimationFrame(gameLoop);
