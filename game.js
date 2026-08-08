// game.js — Game loop, scene state machine, and HUD for Space Invaders

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STARTING_LIVES,
  TIMESTEP,
  MAX_ACCUMULATED_DELTA
} from './gameConfig.js';

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// HUD state — exported so downstream modules can read/write score, lives, etc.
// ---------------------------------------------------------------------------
export const hud = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0
};

// ---------------------------------------------------------------------------
// Scene state machine
// Possible values: 'title' | 'playing' | 'gameover'
// ---------------------------------------------------------------------------
let currentScene = 'title';

function transitionTo(scene) {
  currentScene = scene;
}

// ---------------------------------------------------------------------------
// ENTER key handling
// NOTE: This is a temporary direct listener in game.js.
// input.js — added by 'Keyboard input and the player ship' will own key handling.
// ---------------------------------------------------------------------------
window.addEventListener('keydown', function (e) {
  if (e.code !== 'Enter') return;

  if (currentScene === 'title') {
    transitionTo('playing');
  } else if (currentScene === 'gameover') {
    // Reset HUD state before returning to title — no page reload
    hud.score = 0;
    hud.lives = STARTING_LIVES;
    transitionTo('title');
  }
});

// ---------------------------------------------------------------------------
// Scene: Title
// ---------------------------------------------------------------------------
function updateTitle(/* dt */) {
  // Nothing to update on the title screen yet.
  // ENTER transition is handled by the keydown listener above.
}

function renderTitle() {
  // Dark background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Main heading
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  // Subtitle
  ctx.fillStyle = '#aaa';
  ctx.font = '24px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

// ---------------------------------------------------------------------------
// Scene: Playing
// ---------------------------------------------------------------------------
function updatePlaying(/* dt */) {
  // Downstream cards fill in entity update logic here:
  // input.js   — added by 'Keyboard input and the player ship'
  // player.js  — added by 'Keyboard input and the player ship'
  // invaders.js — added by 'Level 1: the classic grid'
  // collision.js — added by 'Sprite rendering and collision detection'
  // level1.js  — added by 'Level 1: the classic grid'
  // level2.js  — added by 'Level 2: they shoot back'
  // level3.js  — added by 'Level 3: shields and formations'
  // boss.js    — added by 'Boss level: multi-phase finale'
}

function renderPlaying() {
  // Black game area
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw HUD at the top of the canvas
  renderHUD();
}

// ---------------------------------------------------------------------------
// Scene: Game Over
// ---------------------------------------------------------------------------
function updateGameOver(/* dt */) {
  // Nothing to update on the game-over screen yet.
  // ENTER transition is handled by the keydown listener above.
}

function renderGameOver() {
  // Dark background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // "GAME OVER" heading
  ctx.fillStyle = '#ff3333';
  ctx.font = 'bold 56px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  // Final score
  ctx.fillStyle = '#fff';
  ctx.font = '32px monospace';
  ctx.fillText('SCORE: ' + hud.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

  // Restart prompt
  ctx.fillStyle = '#aaa';
  ctx.font = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

// ---------------------------------------------------------------------------
// HUD renderer — used during the playing scene
// ---------------------------------------------------------------------------
function renderHUD() {
  const HUD_HEIGHT = 40;
  const PADDING = 12;

  // HUD background bar
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);

  ctx.font = '18px monospace';
  ctx.textBaseline = 'middle';
  const midY = HUD_HEIGHT / 2;

  // Score — left
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE: ' + hud.score, PADDING, midY);

  // Hi-Score — centre
  ctx.textAlign = 'center';
  ctx.fillText('HI: ' + hud.hiScore, CANVAS_WIDTH / 2, midY);

  // Lives — right
  ctx.textAlign = 'right';
  ctx.fillText('LIVES: ' + hud.lives, CANVAS_WIDTH - PADDING, midY);

  // Separator line
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, HUD_HEIGHT);
  ctx.lineTo(CANVAS_WIDTH, HUD_HEIGHT);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// ---------------------------------------------------------------------------
let accumulated = 0;
let lastTimestamp = null;

function update(dt) {
  switch (currentScene) {
    case 'title':    updateTitle(dt);    break;
    case 'playing':  updatePlaying(dt);  break;
    case 'gameover': updateGameOver(dt); break;
  }
}

function render() {
  switch (currentScene) {
    case 'title':    renderTitle();    break;
    case 'playing':  renderPlaying();  break;
    case 'gameover': renderGameOver(); break;
  }
}

function loop(timestamp) {
  requestAnimationFrame(loop);

  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Cap accumulated delta to prevent spiral-of-death after tab backgrounding
  accumulated += delta;
  if (accumulated > MAX_ACCUMULATED_DELTA) {
    accumulated = MAX_ACCUMULATED_DELTA;
  }

  // Consume accumulated time in fixed steps of TIMESTEP (~16.667 ms)
  while (accumulated >= TIMESTEP) {
    update(TIMESTEP / 1000); // convert ms -> seconds for physics convenience
    accumulated -= TIMESTEP;
  }

  // Render once per animation frame regardless of how many update steps ran
  render();
}

// Kick off the loop
requestAnimationFrame(loop);
