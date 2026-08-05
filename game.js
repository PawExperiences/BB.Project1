import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput, isKeyJustPressed, clearJustPressed } from './input.js';

// ---------------------------------------------------------------------------
// HUD state — exported so sibling modules can read / write score and lives.
// ---------------------------------------------------------------------------
export const hudState = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
};

// ---------------------------------------------------------------------------
// Scene state machine
// ---------------------------------------------------------------------------
// Scenes: 'title' | 'playing' | 'gameover'
let currentScene = 'title';

// Flag that sibling game-logic modules can set to trigger game-over.
export let triggerGameOver = false;
export function setGameOver() {
  triggerGameOver = true;
}

function transitionTo(scene) {
  if (scene === 'playing') {
    // Reset round state each time we start playing.
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    triggerGameOver = false;
  }
  if (scene === 'title') {
    triggerGameOver = false;
  }
  currentScene = scene;
}

// ---------------------------------------------------------------------------
// Update — pure logic, no rendering.
// ---------------------------------------------------------------------------
function update(dt) {
  switch (currentScene) {
    case 'title':
      if (isKeyJustPressed('Enter')) {
        transitionTo('playing');
      }
      break;

    case 'playing':
      // Sibling cards will add real gameplay here.
      // Game-over can be triggered externally via setGameOver().
      if (triggerGameOver) {
        if (hudState.score > hudState.hiScore) {
          hudState.hiScore = hudState.score;
        }
        transitionTo('gameover');
      }
      break;

    case 'gameover':
      if (isKeyJustPressed('Enter')) {
        transitionTo('title');
      }
      break;
  }

  // Consume all just-pressed flags after each update tick.
  clearJustPressed();
}

// ---------------------------------------------------------------------------
// Render — reads state only, never mutates it.
// ---------------------------------------------------------------------------
function render(ctx) {
  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (currentScene) {
    case 'title':
      renderTitle(ctx);
      break;
    case 'playing':
      renderPlaying(ctx);
      break;
    case 'gameover':
      renderGameOver(ctx);
      break;
  }
}

function renderTitle(ctx) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 64px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.font = '28px monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

function renderPlaying(ctx) {
  // HUD — score top-left, lives top-right.
  ctx.textBaseline = 'top';
  ctx.font = '20px monospace';

  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.fillText('SCORE: ' + hudState.score, 16, 16);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#fff';
  ctx.fillText('LIVES: ' + hudState.lives, CANVAS_WIDTH - 16, 16);

  // Placeholder content — sibling cards will draw sprites here.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '18px monospace';
  ctx.fillStyle = '#333';
  ctx.fillText('[ game area ]', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function renderGameOver(ctx) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 72px monospace';
  ctx.fillStyle = '#f00';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  ctx.font = '30px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('Score: ' + hudState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.font = '24px monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// ---------------------------------------------------------------------------
const FIXED_DT      = 1 / 60;          // seconds
const MAX_DELTA     = 0.250;           // 250 ms cap to prevent catch-up bursts

let accumulator     = 0;
let lastTimestamp   = null;

function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  // Raw delta in seconds, clamped to MAX_DELTA.
  const rawDelta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp  = timestamp;
  const delta    = Math.min(rawDelta, MAX_DELTA);

  accumulator += delta;

  // Drain the accumulator in fixed steps.
  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  const canvas = document.getElementById('gameCanvas');
  const ctx    = canvas.getContext('2d');
  render(ctx);

  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
initInput();
requestAnimationFrame(loop);
