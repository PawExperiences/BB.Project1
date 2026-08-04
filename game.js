/**
 * game.js — Main entry point and game loop.
 *
 * Responsibilities:
 *  - Acquire the canvas and 2-D context.
 *  - Run a fixed-timestep loop (60 steps/s) with a delta cap.
 *  - Manage the three-scene state machine: Title → Playing → GameOver → Title.
 *  - Draw the canvas HUD each frame.
 *  - Export hudState so sibling modules can read/mutate it.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { isKeyJustPressed, clearJustPressed, initInput } from './input.js';

// ─── HUD State (named export — sibling modules import & mutate this) ─────────
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
};

// ─── Scene identifiers ───────────────────────────────────────────────────────
const SCENE_TITLE    = 'title';
const SCENE_PLAYING  = 'playing';
const SCENE_GAMEOVER = 'gameover';

let currentScene = SCENE_TITLE;

/**
 * transitionTo — change scene and run any required reset logic.
 * Exported so tests / the dev console can trigger transitions directly.
 */
export function transitionTo(scene) {
  if (scene === SCENE_TITLE) {
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    currentScene   = SCENE_TITLE;
  } else if (scene === SCENE_PLAYING) {
    currentScene = SCENE_PLAYING;
  } else if (scene === SCENE_GAMEOVER) {
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    currentScene = SCENE_GAMEOVER;
  }
}

// Convenience export for acceptance-criteria testing
export function triggerGameOver() {
  transitionTo(SCENE_GAMEOVER);
}

// ─── Canvas setup ────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ─── Fixed-timestep loop constants ───────────────────────────────────────────
const FIXED_DT   = 1 / 60;          // seconds per update step
const MAX_ACCUM  = 0.25;            // 250 ms delta cap

let lastTimestamp = null;
let accumulator   = 0;

// ─── Update ──────────────────────────────────────────────────────────────────
function update(dt) {
  // Handle ENTER key transitions
  if (isKeyJustPressed('Enter')) {
    if (currentScene === SCENE_TITLE) {
      transitionTo(SCENE_PLAYING);
    } else if (currentScene === SCENE_GAMEOVER) {
      transitionTo(SCENE_TITLE);
    }
    // ENTER during PLAYING is intentionally a no-op (reserved for pause later)
  }

  // Auto game-over when lives reach 0 while playing
  if (currentScene === SCENE_PLAYING && hudState.lives <= 0) {
    transitionTo(SCENE_GAMEOVER);
  }

  clearJustPressed();
}

// ─── Render ──────────────────────────────────────────────────────────────────
function render(ctx) {
  // Clear
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Scene-specific rendering
  if (currentScene === SCENE_TITLE) {
    renderTitle(ctx);
  } else if (currentScene === SCENE_PLAYING) {
    renderPlaying(ctx);
  } else if (currentScene === SCENE_GAMEOVER) {
    renderGameOver(ctx);
  }

  // HUD is drawn on top of every scene
  renderHUD(ctx);
}

function renderTitle(ctx) {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 56px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 48);

  ctx.font = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 24);
}

function renderPlaying(ctx) {
  // Stub — real game objects are added in later cards.
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '20px monospace';
  ctx.fillText('Playing… (game objects coming in later cards)', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function renderGameOver(ctx) {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 56px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 64);

  ctx.font = '32px monospace';
  ctx.fillText(`Score: ${hudState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.font = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 56);
}

function renderHUD(ctx) {
  const PAD  = 16;
  const TOP  = 20;

  ctx.font          = '20px monospace';
  ctx.textBaseline  = 'top';
  ctx.fillStyle     = '#0f0';  // bright green — readable against black

  // Score — top-left
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${hudState.score}`, PAD, TOP);

  // Hi-score — top-centre
  ctx.textAlign = 'center';
  ctx.fillText(`HI  ${hudState.hiScore}`, CANVAS_WIDTH / 2, TOP);

  // Lives — top-right
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES  ${hudState.lives}`, CANVAS_WIDTH - PAD, TOP);
}

// ─── Main loop ───────────────────────────────────────────────────────────────
function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let elapsed = (timestamp - lastTimestamp) / 1000; // convert ms → s
  lastTimestamp = timestamp;

  // Delta cap — prevents burst of catch-up steps after backgrounded tab
  if (elapsed > MAX_ACCUM) {
    elapsed = MAX_ACCUM;
  }

  accumulator += elapsed;

  // Drain accumulator in fixed steps
  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  render(ctx);

  requestAnimationFrame(loop);
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
initInput();
requestAnimationFrame(loop);
