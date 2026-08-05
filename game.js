// game.js — Game loop, scene state machine, and HUD for Space Invaders

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';         // Input card
import { Player }    from './player.js';         // Player card
import { InvaderGrid } from './invaders.js';     // Invaders card
import { ExplosionPool } from './explosions.js'; // Explosions
import { collide }   from './collisions.js';     // Collision card

// Future card imports (do NOT create these files here — they are added by later cards):
// import { loadLevel1 } from './level1.js';                              // Added by: Level 1 card
// import { loadLevel2 } from './level2.js';                              // Added by: Level 2 card
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
};

// ---------------------------------------------------------------------------
// Playing-scene entities (created fresh each time the Playing scene starts)
// ---------------------------------------------------------------------------
let player      = null;
let invaderGrid = null;
let explosions  = null;

function initPlayingScene() {
  initInput(); // safe to call multiple times — listeners accumulate but are idempotent
  player      = new Player(CANVAS_WIDTH / 2, ctx);
  invaderGrid = new InvaderGrid();
  explosions  = new ExplosionPool();
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;
}

// ---------------------------------------------------------------------------
// Scene state machine
// Scenes: 'title' | 'playing' | 'gameover'
// ---------------------------------------------------------------------------
let currentScene = 'title';

function transitionTo(scene) {
  if (scene === 'title') {
    // Reset game state when returning to title
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
  }
  if (scene === 'playing') {
    initPlayingScene();
  }
  currentScene = scene;
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

// Placeholder: pressing 'G' in the Playing scene triggers Game Over
// (the real condition will be owned by later cards — collision / invaders).
let goConsumed = false;

function goKeyJustPressed() {
  if (keysDown['KeyG'] && !goConsumed) {
    goConsumed = true;
    return true;
  }
  if (!keysDown['KeyG']) {
    goConsumed = false;
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
  }
}

function updateTitle(_dt) {
  if (enterJustPressed()) {
    transitionTo('playing');
  }
}

function updatePlaying(dt) {
  // --- Player update (movement + shooting) ---
  player.update(dt);

  // --- Invader march ---
  invaderGrid.update();

  // --- Collision pass (MUST run before draw) ---
  collide(player, invaderGrid, explosions, hudState);

  // --- Explosion tick (decrement frame counters, remove expired) ---
  explosions.tick();

  // Placeholder game-over trigger: press G to simulate game over
  if (goKeyJustPressed()) {
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    transitionTo('gameover');
  }
}

function updateGameOver(_dt) {
  if (enterJustPressed()) {
    transitionTo('title');
  }
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
  //  2. Invader formation
  //  3. Explosions
  //  4. Player ship (+ bullet)
  drawHUD();
  invaderGrid.draw(ctx);
  explosions.draw(ctx);
  player.draw(ctx);
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

  // Reset alignment for subsequent draws
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ---------------------------------------------------------------------------
// Kick off the loop
// ---------------------------------------------------------------------------
requestAnimationFrame(gameLoop);
