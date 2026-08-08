// game.js — main ES module: game loop, scene state machine, HUD

// TODO: import added by card "Keyboard input and the player ship" (input.js)
// TODO: import added by card "Player ship implementation" (player.js)
// TODO: import added by card "Invader grid and movement" (invaders.js)
// TODO: import added by card "Collision detection" (collision.js)
// TODO: import added by card "Level 1" (level1.js)
// TODO: import added by card "Level 2" (level2.js)
// TODO: import added by card "Level 3" (level3.js)
// TODO: import added by card "Boss encounter" (boss.js)

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// HUD state — exported so later modules can import and mutate directly
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
};

// ---------------------------------------------------------------------------
// Scene state machine
// Scenes: 'title' | 'playing' | 'gameover'
// ---------------------------------------------------------------------------
let currentScene = 'title';

function transitionTo(scene) {
  if (scene === 'playing') {
    // Reset per-round state
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
  }
  if (scene === 'title') {
    // Update hi-score when returning to title
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
  }
  if (scene === 'gameover') {
    // Persist hi-score
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
  }
  currentScene = scene;
}

// ---------------------------------------------------------------------------
// Keyboard input (minimal — only what this module needs for scene transitions)
// Full input handling will be added by the Keyboard input card.
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;

  if (currentScene === 'title') {
    transitionTo('playing');
  } else if (currentScene === 'gameover') {
    // Persist hi-score before resetting, then go back to title
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    transitionTo('title');
  }
  // During 'playing', Enter is not used for scene transitions here;
  // game-over transition will be triggered by game logic in later cards.
  // For now, allow pressing Enter during Playing to simulate Game Over
  // so the scene machine can be manually verified.
  else if (currentScene === 'playing') {
    transitionTo('gameover');
  }
});

// ---------------------------------------------------------------------------
// Fixed-timestep loop constants
// ---------------------------------------------------------------------------
const UPDATE_STEP = 1 / 60;          // seconds per logic tick (~16.67 ms)
const MAX_DELTA   = 0.25;            // delta cap: 250 ms — prevents spiral of death

let lastTimestamp = null;            // wall-clock time of the previous rAF tick
let accumulator   = 0;               // unprocessed time in seconds

// ---------------------------------------------------------------------------
// update(dt) — advance game logic by exactly one fixed step
// dt is always UPDATE_STEP (seconds)
// ---------------------------------------------------------------------------
function update(dt) {  // eslint-disable-line no-unused-vars
  if (currentScene !== 'playing') return;

  // TODO: update player   — wired by card "Keyboard input and the player ship"
  // TODO: update invaders — wired by card "Invader grid and movement"
  // TODO: update bullets  — wired by collision/player cards
  // TODO: check collisions — wired by card "Collision detection"
  // TODO: check level completion — wired by level cards
}

// ---------------------------------------------------------------------------
// render() — draw the current frame (called once per rAF tick)
// ---------------------------------------------------------------------------
function render() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (currentScene === 'title') {
    renderTitle();
  } else if (currentScene === 'playing') {
    renderPlaying();
  } else if (currentScene === 'gameover') {
    renderGameOver();
  }
}

// ---------------------------------------------------------------------------
// Scene renderers
// ---------------------------------------------------------------------------
function renderTitle() {
  // Background already cleared to #000 by clearRect

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#00ff00';
  ctx.font      = 'bold 56px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  ctx.fillStyle = '#aaaaaa';
  ctx.font      = '22px monospace';
  ctx.fillText('HI-SCORE: ' + hudState.hiScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
}

function renderPlaying() {
  // Canvas is already cleared.
  // TODO: render player   — wired by card "Player ship implementation"
  // TODO: render invaders — wired by card "Invader grid and movement"
  // TODO: render bullets  — wired by player/invader cards

  renderHUD();
}

function renderHUD() {
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle    = '#ffffff';
  ctx.font         = '20px monospace';
  ctx.fillText('SCORE: ' + hudState.score, 12, 12);

  ctx.textAlign = 'right';
  ctx.fillText('LIVES: ' + hudState.lives, CANVAS_WIDTH - 12, 12);
}

function renderGameOver() {
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ff4444';
  ctx.font      = 'bold 64px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '32px monospace';
  ctx.fillText('SCORE: ' + hudState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.fillStyle = '#aaaaaa';
  ctx.font      = '22px monospace';
  ctx.fillText('HI-SCORE: ' + hudState.hiScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
}

// ---------------------------------------------------------------------------
// Main rAF loop
// ---------------------------------------------------------------------------
function gameLoop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  // Wall-clock delta in seconds
  let delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // Delta cap — prevents burst of updates after tab comes back from background
  if (delta > MAX_DELTA) {
    delta = MAX_DELTA;
  }

  accumulator += delta;

  // Drain accumulator in fixed steps
  while (accumulator >= UPDATE_STEP) {
    update(UPDATE_STEP);
    accumulator -= UPDATE_STEP;
  }

  render();

  requestAnimationFrame(gameLoop);
}

// Kick off the loop
requestAnimationFrame(gameLoop);
