// game.js — Main module: fixed-timestep loop, scene state machine, HUD
import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Scene identifiers
// ---------------------------------------------------------------------------
export const SCENES = Object.freeze({
  TITLE:     'TITLE',
  PLAYING:   'PLAYING',
  GAME_OVER: 'GAME_OVER',
});

// ---------------------------------------------------------------------------
// HUD state — mutable; sibling modules import and mutate directly
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
};

// ---------------------------------------------------------------------------
// Internal game state
// ---------------------------------------------------------------------------
let currentScene = SCENES.TITLE;

// Fixed-timestep constants
const UPDATE_STEP = 1000 / 60;          // ~16.67 ms
const MAX_ACCUMULATOR = UPDATE_STEP * 5; // ~83 ms — delta cap

let lastTimestamp  = null;
let accumulator    = 0;

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Keyboard handling (Enter key for scene transitions; G key for game-over stub)
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleEnterKey();
  }

  // Temporary hotkey: press G while PLAYING to simulate a game-over
  // (allows manual verification per acceptance criteria)
  if (e.key === 'g' || e.key === 'G') {
    if (currentScene === SCENES.PLAYING) {
      triggerGameOver();
    }
  }
});

function handleEnterKey() {
  if (currentScene === SCENES.TITLE) {
    // Reset per-round state and start playing
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    currentScene   = SCENES.PLAYING;
  } else if (currentScene === SCENES.GAME_OVER) {
    // Return to title; hi-score already updated in triggerGameOver()
    currentScene = SCENES.TITLE;
  }
}

function triggerGameOver() {
  // Update hi-score before switching scene
  if (hudState.score > hudState.hiScore) {
    hudState.hiScore = hudState.score;
  }
  currentScene = SCENES.GAME_OVER;
}

// ---------------------------------------------------------------------------
// Update — pure logic, no drawing
// ---------------------------------------------------------------------------
function update(/* dt */) {
  // Placeholder: sibling cards (player, invaders, collision) will hook in here.
  // Game-over condition will be detected here and call triggerGameOver().
}

// ---------------------------------------------------------------------------
// Render — pure drawing, no logic
// ---------------------------------------------------------------------------
function render() {
  // Clear
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (currentScene) {
    case SCENES.TITLE:
      renderTitle();
      break;
    case SCENES.PLAYING:
      renderPlaying();
      break;
    case SCENES.GAME_OVER:
      renderGameOver();
      break;
  }
}

function renderTitle() {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 64px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  ctx.font = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

function renderPlaying() {
  renderHUD();
  // Placeholder: player.render(ctx) and invaders.render(ctx) called by sibling cards
}

function renderGameOver() {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 72px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.font = '32px monospace';
  ctx.fillText(`Score: ${hudState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

  ctx.font = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

function renderHUD() {
  const PAD  = 16;
  const TOP  = PAD + 16; // baseline position from top

  ctx.font = '20px monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fff';

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

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Delta cap — prevents burst of catch-up updates after tab was backgrounded
  if (delta > MAX_ACCUMULATOR) {
    delta = MAX_ACCUMULATOR;
  }

  accumulator += delta;

  // Drain accumulator with fixed-size steps
  while (accumulator >= UPDATE_STEP) {
    update(UPDATE_STEP);
    accumulator -= UPDATE_STEP;
  }

  render();

  requestAnimationFrame(loop);
}

// Kick off the loop
requestAnimationFrame(loop);
