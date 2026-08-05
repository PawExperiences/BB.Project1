// game.js — Main entry point: fixed-timestep game loop, scene FSM, HUD.

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';
import { checkCollisions } from './collision.js';
import { init as level1Init, update as level1Update, render as level1Render } from './level1.js';

// ---------------------------------------------------------------------------
// HUD state — exported so sibling modules can read and mutate it.
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
  level:   1,
};

// ---------------------------------------------------------------------------
// Scene identifiers
// ---------------------------------------------------------------------------
const SCENE = Object.freeze({
  TITLE:     'TITLE',
  PLAYING:   'PLAYING',
  GAME_OVER: 'GAME_OVER',
});

let currentScene = SCENE.TITLE;

// ---------------------------------------------------------------------------
// Canvas / context
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Player instance
// ---------------------------------------------------------------------------
let player = null;

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
initInput();

// ---------------------------------------------------------------------------
// Fixed-timestep constants
// ---------------------------------------------------------------------------
const FIXED_STEP    = 1 / 60;           // seconds per update tick
const MAX_DELTA     = 5 * FIXED_STEP;   // cap: never more than 5 catch-up steps
let   accumulator   = 0;                // leftover time carried between frames
let   lastTimestamp = null;             // previous rAF timestamp (ms)

// ---------------------------------------------------------------------------
// Level initialisation helper
// ---------------------------------------------------------------------------
function startLevel() {
  hudState.level = 1;
  level1Init(ctx, hudState);
}

// ---------------------------------------------------------------------------
// ENTER key — drives every scene transition
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Enter') return;

  if (currentScene === SCENE.TITLE) {
    // Reset HUD when starting a new game
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    currentScene   = SCENE.PLAYING;

    // Initialise game objects
    player = new Player();
    startLevel();
    return;
  }

  if (currentScene === SCENE.GAME_OVER) {
    // Update hi-score before returning to title
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    currentScene = SCENE.TITLE;
    player = null;
    return;
  }
});

// ---------------------------------------------------------------------------
// Update — advances game state; never draws.
// dt: fixed timestep in seconds (always FIXED_STEP).
// ---------------------------------------------------------------------------
function update(dt) {
  if (currentScene !== SCENE.PLAYING) return;

  if (player) {
    player.update(dt);
  }

  // Advance the current level (dt converted to ms for level modules).
  const prevLevel = hudState.level;
  level1Update(dt * 1000);

  // Handle level transition: level1 sets hudState.level = 2 when cleared.
  if (hudState.level !== prevLevel) {
    // For now, Level 2 is not yet implemented — return to Title with a win
    // note.  When level2.js is added, replace this block with level2Init().
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    currentScene = SCENE.TITLE;
    player = null;
    return;
  }

  // Collision pass: after update, before draw
  if (player) {
    checkCollisions(player);
  }

  // Trigger GAME_OVER when lives reach 0
  if (hudState.lives <= 0) {
    currentScene = SCENE.GAME_OVER;
  }
}

// ---------------------------------------------------------------------------
// Render — draws the current frame; never mutates game state.
// ---------------------------------------------------------------------------
function render(ctx) {
  // Clear the entire canvas each frame.
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (currentScene) {
    case SCENE.TITLE:
      renderTitle(ctx);
      break;
    case SCENE.PLAYING:
      renderPlaying(ctx);
      break;
    case SCENE.GAME_OVER:
      renderGameOver(ctx);
      break;
  }
}

// ---------------------------------------------------------------------------
// Scene renderers
// ---------------------------------------------------------------------------
function renderTitle(ctx) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#00ff00';
  ctx.font      = 'bold 56px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '24px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

function renderPlaying(ctx) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Delegate invader drawing and level HUD to the active level module.
  level1Render(ctx);

  if (player) {
    player.draw(ctx);
  }

  renderHUD(ctx);
}

function renderGameOver(ctx) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ff0000';
  ctx.font      = 'bold 56px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '28px monospace';
  ctx.fillText(`Score: ${hudState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.font = '22px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

// ---------------------------------------------------------------------------
// HUD — drawn on the canvas (not DOM)
// ---------------------------------------------------------------------------
function renderHUD(ctx) {
  const PAD  = 16;
  const TOP  = 24;

  ctx.textBaseline = 'top';
  ctx.font         = '18px monospace';

  // Score — left
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`SCORE  ${hudState.score}`, PAD, TOP);

  // Hi-score — centre
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffff00';
  ctx.fillText(`HI  ${hudState.hiScore}`, CANVAS_WIDTH / 2, TOP);

  // Lives — right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#00ff00';
  ctx.fillText(`LIVES  ${hudState.lives}`, CANVAS_WIDTH - PAD, TOP);

  // Separator line
  ctx.strokeStyle = '#333';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(0, TOP + 28);
  ctx.lineTo(CANVAS_WIDTH, TOP + 28);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// ---------------------------------------------------------------------------
function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);

  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  // Real elapsed seconds since last frame
  let elapsed = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // Cap to prevent a burst of catch-up steps after backgrounding
  if (elapsed > MAX_DELTA) elapsed = MAX_DELTA;

  accumulator += elapsed;

  // Drain the accumulator in fixed increments
  while (accumulator >= FIXED_STEP) {
    update(FIXED_STEP);
    accumulator -= FIXED_STEP;
  }

  render(ctx);
}

// Kick off the loop
requestAnimationFrame(gameLoop);
