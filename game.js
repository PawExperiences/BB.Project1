// game.js — Main entry point and game loop
// Imports gameConfig constants
import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';

// input.js added by card: "Keyboard input and the player ship"
// player.js added by card: "Keyboard input and the player ship"
// invaders.js added by card: "Level 1: the classic grid"
// collision.js added by card: "Sprite rendering and collision detection"
// level1.js added by card: "Level 1: the classic grid"
// level2.js added by card: "Level 2: they shoot back"
// level3.js added by card: "Level 3: shields and formations"
// boss.js added by card: "Boss level: multi-phase finale"

import { initInput } from './input.js';
import { Player }    from './player.js';

// Initialise keyboard tracking once at startup
initInput();

// ─── HUD State (exported so sibling modules can read/mutate) ─────────────────
export const hudState = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
};

// ─── Canvas / Context ────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ─── Player instance (created fresh per run) ─────────────────────────────────
let player = null;

function createPlayer() {
  player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
}

// ─── Scene State Machine ─────────────────────────────────────────────────────
// Scenes: 'title' | 'playing' | 'gameover'
let currentScene = 'title';

function transitionTo(scene) {
  currentScene = scene;
}

// Called programmatically (by later cards) when lives reach 0
export function triggerGameOver() {
  if (hudState.score > hudState.hiScore) {
    hudState.hiScore = hudState.score;
  }
  transitionTo('gameover');
}

// ─── Keyboard Input (scene transitions — Enter key) ──────────────────────────
const sceneKeys = {};

window.addEventListener('keydown', (e) => {
  if (!sceneKeys[e.code]) {
    sceneKeys[e.code] = true;
    onKeyPressed(e.code);
  }
});

window.addEventListener('keyup', (e) => {
  sceneKeys[e.code] = false;
});

function onKeyPressed(code) {
  if (code === 'Enter') {
    if (currentScene === 'title') {
      // Reset game state for a fresh run
      hudState.score = 0;
      hudState.lives = STARTING_LIVES;
      createPlayer();
      transitionTo('playing');
    } else if (currentScene === 'gameover') {
      transitionTo('title');
    }
  }
}

// ─── Fixed-Timestep Game Loop ─────────────────────────────────────────────────
const UPDATE_RATE = 1 / 60;          // seconds per fixed step (~16.67 ms)
const MAX_DELTA  = 0.25;             // 250 ms cap — prevents burst after tab switch

let lastTimestamp = null;
let accumulator   = 0;

function tick(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  // Wall-clock elapsed in seconds
  let elapsed = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // Delta cap: clamp so a backgrounded tab can't fire dozens of catch-up steps
  if (elapsed > MAX_DELTA) {
    elapsed = MAX_DELTA;
  }

  accumulator += elapsed;

  // Drain accumulator in fixed steps
  while (accumulator >= UPDATE_RATE) {
    update(UPDATE_RATE);
    accumulator -= UPDATE_RATE;
  }

  render();
  requestAnimationFrame(tick);
}

// ─── Update Phase ─────────────────────────────────────────────────────────────
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

function updateTitle(dt) {
  // Future: animate title elements
}

function updatePlaying(dt) {
  // player.js update called here by card: "Keyboard input and the player ship"
  if (player) {
    player.update(dt);
    hudState.lives = player.lives;
  }
  // invaders.js update called here by card: "Level 1: the classic grid"
  // collision.js update called here by card: "Sprite rendering and collision detection"
}

function updateGameOver(dt) {
  // Future: animate game over screen
}

// ─── Render Phase ─────────────────────────────────────────────────────────────
function render() {
  // Clear canvas
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

// ─── Title Scene ──────────────────────────────────────────────────────────────
function renderTitle() {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#00ff00';
  ctx.font = 'bold 56px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  if (hudState.hiScore > 0) {
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px monospace';
    ctx.fillText('HI-SCORE: ' + hudState.hiScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  }
}

// ─── Playing Scene ────────────────────────────────────────────────────────────
function renderPlaying() {
  // Placeholder: show a dim grid to confirm Playing scene is active
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_WIDTH; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  // player.js renders here by card: "Keyboard input and the player ship"
  if (player) {
    player.draw(ctx);
  }
  // invaders.js renders here by card: "Level 1: the classic grid"

  renderHUD();
}

// ─── Game Over Scene ──────────────────────────────────────────────────────────
function renderGameOver() {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ff0000';
  ctx.font = 'bold 64px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = '32px monospace';
  ctx.fillText('SCORE: ' + hudState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '20px monospace';
  ctx.fillText('HI-SCORE: ' + hudState.hiScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = '28px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);

  renderHUD();
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function renderHUD() {
  const padding = 16;
  ctx.textBaseline = 'top';
  ctx.font = '20px monospace';

  // Score — top left
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SCORE: ' + hudState.score, padding, padding);

  // Hi-Score — top centre
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffff00';
  ctx.fillText('HI: ' + hudState.hiScore, CANVAS_WIDTH / 2, padding);

  // Lives — top right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#00ff00';
  ctx.fillText('LIVES: ' + hudState.lives, CANVAS_WIDTH - padding, padding);
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
requestAnimationFrame(tick);
