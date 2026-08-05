// game.js — Game loop, scene state machine, and HUD

// --- Import stubs for later cards ---
// input.js     — added by "Keyboard input and the player ship" card
// player.js    — added by "Keyboard input and the player ship" card
// invaders.js  — added by "Level 1: the classic grid" card
// collision.js — added by "Sprite rendering and collision detection" card
// level1.js    — added by "Level 1: the classic grid" card
// level2.js    — added by "Level 2: they shoot back" card
// level3.js    — added by "Level 3: shields and formations" card
// boss.js      — added by "Boss level: multi-phase finale" card

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';

// ---------------------------------------------------------------------------
// HUD STATE — exported so later cards can import and mutate directly
// ---------------------------------------------------------------------------
export const hudState = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
};

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width  = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ---------------------------------------------------------------------------
// Scene state machine
// Scenes: 'title' | 'playing' | 'gameover'
// ---------------------------------------------------------------------------
let currentScene = 'title';

function enterTitle() {
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;
  currentScene   = 'title';
}

function enterPlaying() {
  currentScene = 'playing';
  // Later cards initialise their game objects here.
}

function enterGameOver() {
  if (hudState.score > hudState.hiScore) {
    hudState.hiScore = hudState.score;
  }
  currentScene = 'gameover';
}

// Expose transition helpers so later cards can trigger Game Over
export { enterTitle, enterPlaying, enterGameOver };

// ---------------------------------------------------------------------------
// Keyboard input — ENTER key drives scene transitions
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Enter') return;

  if (currentScene === 'title') {
    enterPlaying();
  } else if (currentScene === 'gameover') {
    enterTitle();
  }
  // ENTER has no effect during 'playing'
});

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// Step size: 1000/60 ms  (~16.667 ms)
// Delta cap : 250 ms  (prevents catch-up burst after tab background)
// ---------------------------------------------------------------------------
const STEP_MS  = 1000 / 60;   // fixed update interval in milliseconds
const CAP_MS   = 250;         // maximum accumulated delta

let lastTimestamp = null;
let accumulator   = 0;

function update(dt) {
  // dt is the fixed timestep in SECONDS (1/60)
  if (currentScene === 'playing') {
    // Later cards attach their update logic here via the exported helpers.
    // Nothing to update in the shell beyond scene/HUD state.
  }
}

function render() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (currentScene === 'title') {
    renderTitle();
  } else if (currentScene === 'playing') {
    renderPlaying();
  } else if (currentScene === 'gameover') {
    renderGameOver();
  }

  renderHUD();
}

function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Cap to prevent catch-up burst after the tab was backgrounded
  if (elapsed > CAP_MS) {
    elapsed = CAP_MS;
  }

  accumulator += elapsed;

  // Fixed-timestep updates
  while (accumulator >= STEP_MS) {
    update(STEP_MS / 1000); // pass dt in seconds
    accumulator -= STEP_MS;
  }

  render();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// ---------------------------------------------------------------------------
// Scene renderers
// ---------------------------------------------------------------------------
function renderTitle() {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 56px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

  ctx.font = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function renderPlaying() {
  // Later cards (player.js, invaders.js, etc.) render game objects here.
  // For now, show a placeholder so the scene is visually distinct.
  ctx.fillStyle = '#444';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '20px monospace';
  ctx.fillText('[ game in progress ]', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function renderGameOver() {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 56px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.font = '32px monospace';
  ctx.fillText(`Score: ${hudState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

  ctx.font = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

// ---------------------------------------------------------------------------
// HUD renderer — score (top-left), hi-score (top-centre), lives (top-right)
// ---------------------------------------------------------------------------
function renderHUD() {
  const PAD  = 16;
  const TOP  = 24;

  ctx.font          = '20px monospace';
  ctx.textBaseline  = 'top';
  ctx.fillStyle     = '#0f0';

  // Score — top-left
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${hudState.score}`, PAD, PAD);

  // Hi-Score — top-centre
  ctx.textAlign = 'center';
  ctx.fillText(`HI: ${hudState.hiScore}`, CANVAS_WIDTH / 2, PAD);

  // Lives — top-right
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES: ${hudState.lives}`, CANVAS_WIDTH - PAD, PAD);
}
