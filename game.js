// game.js — Main entry point: game loop, scene state machine, HUD.

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput, isKeyHeld } from './input.js';

// ─────────────────────────────────────────────
// Canvas setup
// ─────────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
canvas.width  = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

// ─────────────────────────────────────────────
// HUD state (exported so other modules can read/write)
// ─────────────────────────────────────────────

/** Shared HUD state. Other modules import and mutate this directly. */
export const hud = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
};

// ─────────────────────────────────────────────
// Scene state machine
// ─────────────────────────────────────────────

/** Valid scene names: 'Title' | 'Playing' | 'GameOver' */
let currentScene = 'Title';

/**
 * Switch to a named scene. Accepted values: 'Title', 'Playing', 'GameOver'.
 * @param {'Title'|'Playing'|'GameOver'} name
 */
export function switchScene(name) {
  if (name !== 'Title' && name !== 'Playing' && name !== 'GameOver') {
    console.warn(`switchScene: unknown scene '${name}'`);
    return;
  }
  currentScene = name;
}

// ─────────────────────────────────────────────
// ENTER key edge-detection
// ─────────────────────────────────────────────

let enterWasHeld = false;

/** Returns true on the frame ENTER transitions from released → held. */
function enterJustPressed() {
  const held = isKeyHeld('Enter');
  const fired = held && !enterWasHeld;
  enterWasHeld = held;
  return fired;
}

// ─────────────────────────────────────────────
// HUD renderer (exported)
// ─────────────────────────────────────────────

/**
 * Draw score, hi-score, and lives onto the canvas.
 * @param {CanvasRenderingContext2D} renderCtx
 * @param {number} lives
 */
export function renderHUD(renderCtx, lives) {
  renderCtx.save();
  renderCtx.font = '18px monospace';
  renderCtx.fillStyle = '#ffffff';

  // Score — top left
  renderCtx.textAlign = 'left';
  renderCtx.fillText(`SCORE  ${hud.score}`, 16, 28);

  // Hi-Score — top centre
  renderCtx.textAlign = 'center';
  renderCtx.fillText(`HI  ${hud.hiScore}`, CANVAS_WIDTH / 2, 28);

  // Lives — top right
  renderCtx.textAlign = 'right';
  renderCtx.fillText(`LIVES  ${lives}`, CANVAS_WIDTH - 16, 28);

  // Divider line
  renderCtx.strokeStyle = '#444444';
  renderCtx.lineWidth = 1;
  renderCtx.beginPath();
  renderCtx.moveTo(0, 36);
  renderCtx.lineTo(CANVAS_WIDTH, 36);
  renderCtx.stroke();

  renderCtx.restore();
}

// ─────────────────────────────────────────────
// Scene renderers / updaters
// ─────────────────────────────────────────────

function updateTitle(/*dt*/) {
  if (enterJustPressed()) {
    // Reset game state for a fresh run
    hud.score = 0;
    hud.lives = STARTING_LIVES;
    switchScene('Playing');
  }
}

function drawTitle() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title
  ctx.save();
  ctx.fillStyle = '#00ff00';
  ctx.font      = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  // Prompt
  ctx.fillStyle = '#ffffff';
  ctx.font      = '24px monospace';
  // Blink effect: visible for ~700 ms, hidden for ~300 ms out of every 1000 ms
  if (Math.floor(Date.now() / 600) % 2 === 0) {
    ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }
  ctx.restore();
}

function updatePlaying(/*dt*/) {
  // Stub — full implementation owned by later cards.
  // Game Over transition will be triggered by the Playing scene implementation;
  // for now ENTER also goes to GameOver so the scene machine can be verified.
  if (enterJustPressed()) {
    switchScene('GameOver');
  }
}

function drawPlaying() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // HUD
  renderHUD(ctx, hud.lives);

  // Placeholder message
  ctx.save();
  ctx.fillStyle = '#888888';
  ctx.font      = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('[ Playing scene — implementation pending ]', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  ctx.fillStyle = '#555555';
  ctx.font      = '16px monospace';
  ctx.fillText('Press ENTER → Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 36);
  ctx.restore();
}

function updateGameOver(/*dt*/) {
  if (enterJustPressed()) {
    switchScene('Title');
  }
}

function drawGameOver() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();

  // "GAME OVER"
  ctx.fillStyle = '#ff3333';
  ctx.font      = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  // Final score
  ctx.fillStyle = '#ffffff';
  ctx.font      = '28px monospace';
  ctx.fillText(`SCORE  ${hud.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  // Restart prompt
  ctx.font = '20px monospace';
  if (Math.floor(Date.now() / 600) % 2 === 0) {
    ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  }

  ctx.restore();
}

// ─────────────────────────────────────────────
// Fixed-timestep game loop
// ─────────────────────────────────────────────

/** Fixed update timestep in milliseconds (≈60 Hz). */
const TIMESTEP_MS  = 1000 / 60;

/** Maximum accumulated delta before capping (prevents update bursts after tab sleep). */
const MAX_DELTA_MS = 200;

let lastTimestamp  = null;
let accumulator    = 0;

/**
 * Main RAF callback.
 * @param {DOMHighResTimeStamp} timestamp
 */
function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Cap to prevent spiral-of-death after backgrounded tab resumes
  if (elapsed > MAX_DELTA_MS) elapsed = MAX_DELTA_MS;

  accumulator += elapsed;

  // Fixed-timestep update steps
  const dt = TIMESTEP_MS / 1000; // seconds per step
  while (accumulator >= TIMESTEP_MS) {
    switch (currentScene) {
      case 'Title':    updateTitle(dt);    break;
      case 'Playing':  updatePlaying(dt);  break;
      case 'GameOver': updateGameOver(dt); break;
    }
    accumulator -= TIMESTEP_MS;
  }

  // Render once per frame (not once per step)
  switch (currentScene) {
    case 'Title':    drawTitle();    break;
    case 'Playing':  drawPlaying();  break;
    case 'GameOver': drawGameOver(); break;
  }

  requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────

initInput();
requestAnimationFrame(loop);
