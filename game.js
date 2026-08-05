// game.js — Main entry module: fixed-timestep loop, scene state machine, HUD
import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';

// ---------------------------------------------------------------------------
// HUD state — exported so sibling modules (player, invaders, …) can mutate it
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
};

// ---------------------------------------------------------------------------
// Scene identifiers
// ---------------------------------------------------------------------------
const SCENE_TITLE     = 'title';
const SCENE_PLAYING   = 'playing';
const SCENE_GAME_OVER = 'gameover';

let currentScene = SCENE_TITLE;

// ---------------------------------------------------------------------------
// Canvas / context
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Input — track ENTER key (full keyboard handling is in input.js / player card)
// ---------------------------------------------------------------------------
const keys = {};

window.addEventListener('keydown', (e) => {
  if (!keys[e.code] && e.code === 'Enter') {
    handleEnter();
  }
  keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

function handleEnter() {
  switch (currentScene) {
    case SCENE_TITLE:
      transitionTo(SCENE_PLAYING);
      break;
    case SCENE_PLAYING:
      // ENTER during gameplay is reserved for gameplay mechanics (future cards).
      // Scene exits to Game Over when lives reach 0 — see checkGameOver().
      break;
    case SCENE_GAME_OVER:
      resetGame();
      transitionTo(SCENE_TITLE);
      break;
  }
}

function transitionTo(scene) {
  currentScene = scene;
}

function resetGame() {
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;
}

// Hook called by sibling modules (player card) whenever lives change.
// Also checked each update tick so the Game Over transition fires automatically.
function checkGameOver() {
  if (currentScene === SCENE_PLAYING && hudState.lives <= 0) {
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    transitionTo(SCENE_GAME_OVER);
  }
}

// ---------------------------------------------------------------------------
// Fixed-timestep loop
// ---------------------------------------------------------------------------
const FIXED_DT   = 1 / 60;      // seconds per update tick (~16.67 ms)
const MAX_DELTA  = 0.250;        // 250 ms cap — prevents burst after tab switch

let lastTimestamp = null;
let accumulator   = 0;

function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  // Raw delta in seconds, clamped to MAX_DELTA
  const rawDelta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp  = timestamp;
  const delta    = Math.min(rawDelta, MAX_DELTA);

  accumulator += delta;

  // Drain accumulator in fixed steps
  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  render();

  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Update — called once per fixed tick
// ---------------------------------------------------------------------------
function update(dt) {  // eslint-disable-line no-unused-vars
  checkGameOver();

  // Future cards (player, invaders, bullets, …) call their own update logic
  // here, driven by the dt argument (seconds).
}

// ---------------------------------------------------------------------------
// Render — called once per animation frame
// ---------------------------------------------------------------------------
function render() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (currentScene) {
    case SCENE_TITLE:
      renderTitle();
      break;
    case SCENE_PLAYING:
      renderPlaying();
      break;
    case SCENE_GAME_OVER:
      renderGameOver();
      break;
  }
}

// ---------------------------------------------------------------------------
// Scene renderers
// ---------------------------------------------------------------------------
function renderTitle() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#0f0';
  ctx.font      = 'bold 56px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#fff';
  ctx.font      = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

function renderPlaying() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Stub: future cards draw sprites here.
  drawHUD();
}

function renderGameOver() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#f00';
  ctx.font      = 'bold 64px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  ctx.fillStyle = '#fff';
  ctx.font      = '32px monospace';
  ctx.fillText('Score: ' + hudState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.font = '24px monospace';
  ctx.fillText('Hi-Score: ' + hudState.hiScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

  ctx.fillStyle = '#aaa';
  ctx.font      = '22px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
}

// ---------------------------------------------------------------------------
// HUD — drawn on canvas during Playing scene
// ---------------------------------------------------------------------------
function drawHUD() {
  const PAD = 16;

  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle    = '#fff';
  ctx.font         = '20px monospace';
  ctx.fillText('SCORE  ' + hudState.score,   PAD, PAD);
  ctx.fillText('HI     ' + hudState.hiScore, CANVAS_WIDTH / 2 - 80, PAD);

  ctx.textAlign = 'right';
  ctx.fillText('LIVES  ' + hudState.lives, CANVAS_WIDTH - PAD, PAD);
}

// ---------------------------------------------------------------------------
// Kick off the loop
// ---------------------------------------------------------------------------
requestAnimationFrame(loop);
