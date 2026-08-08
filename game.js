// game.js — Game loop, scene state machine, and HUD

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Placeholder imports — added by later task cards
// ---------------------------------------------------------------------------
// input.js     added by card: "Keyboard input and the player ship"
// player.js    added by card: "Keyboard input and the player ship"
// invaders.js  added by card: "Level 1: the classic grid"
// collision.js added by card: "Sprite rendering and collision detection"
// level1.js    added by card: "Level 1: the classic grid"
// level2.js    added by card: "Level 2: they shoot back"
// level3.js    added by card: "Level 3: shields and formations"
// boss.js      added by card: "Boss level: multi-phase finale"

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Exported HUD state — later cards import and mutate this object directly
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

function enterScene(scene) {
  currentScene = scene;
}

// ---------------------------------------------------------------------------
// Keyboard input
// ---------------------------------------------------------------------------
const keysPressed = {};

window.addEventListener('keydown', (e) => {
  keysPressed[e.code] = true;

  if (e.code === 'Enter') {
    handleEnter();
  }
});

window.addEventListener('keyup', (e) => {
  keysPressed[e.code] = false;
});

function handleEnter() {
  if (currentScene === 'title') {
    // Reset game state when starting a new game
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    enterScene('playing');
  } else if (currentScene === 'gameover') {
    enterScene('title');
  }
  // 'playing' -> 'gameover' is triggered programmatically (e.g. lives === 0)
}

// ---------------------------------------------------------------------------
// Public helper: other modules call this to trigger a game-over transition
// ---------------------------------------------------------------------------
export function triggerGameOver() {
  if (hudState.score > hudState.hiScore) {
    hudState.hiScore = hudState.score;
  }
  enterScene('gameover');
}

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// ---------------------------------------------------------------------------
const UPDATE_STEP = 1 / 60;          // seconds per logic tick
const DELTA_CAP   = 0.25;            // 250 ms max accumulated delta

let lastTimestamp  = null;
let accumulator    = 0;

function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let elapsed = (timestamp - lastTimestamp) / 1000; // convert ms → s
  lastTimestamp = timestamp;

  // Delta cap: prevents a burst of catch-up ticks after tab is backgrounded
  if (elapsed > DELTA_CAP) {
    elapsed = DELTA_CAP;
  }

  accumulator += elapsed;

  // Fixed-timestep update phase
  while (accumulator >= UPDATE_STEP) {
    update(UPDATE_STEP);
    accumulator -= UPDATE_STEP;
  }

  // Render phase — always separate from update
  render();

  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Update — pure logic, no drawing
// ---------------------------------------------------------------------------
function update(dt) { // eslint-disable-line no-unused-vars
  if (currentScene === 'playing') {
    // Future cards will call their own update logic here.
    // Example game-over trigger: lives reaching 0
    if (hudState.lives <= 0) {
      triggerGameOver();
    }
  }
}

// ---------------------------------------------------------------------------
// Render — pure drawing, no state mutation
// ---------------------------------------------------------------------------
function render() {
  // Clear canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (currentScene === 'title') {
    renderTitle();
  } else if (currentScene === 'playing') {
    renderHUD();
    renderPlaying();
  } else if (currentScene === 'gameover') {
    renderGameOver();
  }
}

// ---------------------------------------------------------------------------
// Scene renderers
// ---------------------------------------------------------------------------
function renderTitle() {
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#0f0';
  ctx.font      = 'bold 56px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 48);

  ctx.fillStyle = '#fff';
  ctx.font      = '24px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 32);
}

function renderPlaying() {
  // Placeholder — entities added by later cards will draw here.
  // HUD is already drawn by renderHUD() before this function is called.
}

function renderHUD() {
  const PAD  = 16;
  const LINE = 20;

  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle    = '#fff';
  ctx.font         = `${LINE}px monospace`;

  ctx.fillText(`SCORE  ${hudState.score}`,   PAD,                       PAD);
  ctx.fillText(`LIVES  ${hudState.lives}`,   PAD,                       PAD + LINE + 4);

  ctx.textAlign = 'right';
  ctx.fillText(`HI  ${hudState.hiScore}`,    CANVAS_WIDTH - PAD,        PAD);
  ctx.textAlign = 'left';
}

function renderGameOver() {
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#f00';
  ctx.font      = 'bold 64px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 64);

  ctx.fillStyle = '#fff';
  ctx.font      = '28px monospace';
  ctx.fillText(`Score: ${hudState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.font = '22px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 56);
}

// ---------------------------------------------------------------------------
// Start the loop
// ---------------------------------------------------------------------------
requestAnimationFrame(loop);
