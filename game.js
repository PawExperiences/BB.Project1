// game.js — main ES module: game loop, scene state machine, HUD
import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Import placeholders for sibling-card modules (not yet created)
// ---------------------------------------------------------------------------
// input.js     added by: "Keyboard input and the player ship"
// player.js    added by: "Keyboard input and the player ship"
// invaders.js  added by: "Level 1: the classic grid"
// collision.js added by: "Sprite rendering and collision detection"
// level1.js    added by: "Level 1: the classic grid"
// level2.js    added by: "Level 2: they shoot back"
// level3.js    added by: "Level 3: shields and formations"
// boss.js      added by: "Boss level: multi-phase finale"

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Shared HUD state — single source of truth; sibling modules import & mutate
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
};

// ---------------------------------------------------------------------------
// Scene identifiers
// ---------------------------------------------------------------------------
const SCENE_TITLE    = 'title';
const SCENE_PLAYING  = 'playing';
const SCENE_GAMEOVER = 'gameover';

let currentScene = SCENE_TITLE;

// ---------------------------------------------------------------------------
// Keyboard input (ENTER key only — full input module added by sibling card)
// ---------------------------------------------------------------------------
let enterPressed = false;

window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter') {
    enterPressed = true;
  }
});

// Consume the enterPressed flag once per frame
function consumeEnter() {
  const val = enterPressed;
  enterPressed = false;
  return val;
}

// ---------------------------------------------------------------------------
// Scene transitions
// ---------------------------------------------------------------------------
function transitionTo(scene) {
  if (scene === SCENE_TITLE) {
    // Reset game state when returning to title
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
  }
  if (scene === SCENE_PLAYING) {
    // Fresh start for the playing scene
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
  }
  currentScene = scene;
}

// ---------------------------------------------------------------------------
// Update — fixed-step logic (dt is always FIXED_STEP seconds)
// ---------------------------------------------------------------------------
function update(dt) {
  switch (currentScene) {
    case SCENE_TITLE:
      if (consumeEnter()) {
        transitionTo(SCENE_PLAYING);
      }
      break;

    case SCENE_PLAYING:
      // Sibling cards will add entity update calls here.
      // Game-over condition: lives reach 0 (sibling cards decrement hudState.lives).
      // For now, ENTER also transitions to Game Over (useful for manual testing).
      if (consumeEnter() || hudState.lives <= 0) {
        if (hudState.score > hudState.hiScore) {
          hudState.hiScore = hudState.score;
        }
        currentScene = SCENE_GAMEOVER;
      }
      break;

    case SCENE_GAMEOVER:
      if (consumeEnter()) {
        transitionTo(SCENE_TITLE);
      }
      break;
  }
}

// ---------------------------------------------------------------------------
// Render — called once per animation frame AFTER all fixed-step updates
// ---------------------------------------------------------------------------
function render() {
  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (currentScene) {
    case SCENE_TITLE:
      renderTitle();
      break;
    case SCENE_PLAYING:
      renderPlaying();
      break;
    case SCENE_GAMEOVER:
      renderGameOver();
      break;
  }
}

function renderTitle() {
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#00ff00';
  ctx.font      = 'bold 56px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 48);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 32);
}

function renderPlaying() {
  // Sibling cards will add entity render calls here.
  renderHUD();
}

function renderHUD() {
  const padding = 16;
  ctx.textBaseline = 'top';
  ctx.font         = '20px monospace';

  // Score — top left
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SCORE: ' + hudState.score, padding, padding);

  // Hi-Score — top centre
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('HI: ' + hudState.hiScore, CANVAS_WIDTH / 2, padding);

  // Lives — top right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('LIVES: ' + hudState.lives, CANVAS_WIDTH - padding, padding);
}

function renderGameOver() {
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ff0000';
  ctx.font      = 'bold 64px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 64);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '32px monospace';
  ctx.fillText('SCORE: ' + hudState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// ---------------------------------------------------------------------------
const FIXED_STEP    = 1 / 60;          // seconds per update step (~16.67 ms)
const MAX_DELTA     = 0.250;           // cap at 250 ms to avoid spiral of death
const FIXED_STEP_MS = FIXED_STEP * 1000;

let lastTimestamp  = null;
let accumulator    = 0; // seconds

function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  // Elapsed since last frame, in seconds
  let elapsed = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // Cap to prevent spiral of death after backgrounding
  if (elapsed > MAX_DELTA) {
    elapsed = MAX_DELTA;
  }

  accumulator += elapsed;

  // Fixed-step update phase
  while (accumulator >= FIXED_STEP) {
    update(FIXED_STEP);
    accumulator -= FIXED_STEP;
  }

  // Render phase — called ONCE per animation frame, outside the update loop
  render();

  requestAnimationFrame(loop);
}

// Kick off the loop
requestAnimationFrame(loop);
