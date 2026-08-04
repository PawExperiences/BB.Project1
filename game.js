// game.js — Main entry point: game loop, scene state machine, HUD.

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES, SCORE_PER_KILL } from './gameConfig.js';
import { initInput, isKeyHeld } from './input.js';
import { Player } from './player.js';
import { InvaderGrid } from './invaders.js';
import { checkBulletInvaderCollisions } from './collision.js';

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
  const held  = isKeyHeld('Enter');
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
// Playing scene — live game objects
// ─────────────────────────────────────────────

/** @type {Player|null} */
let player = null;

/** @type {InvaderGrid|null} */
let grid = null;

/** Initialise (or re-initialise) all Playing scene objects. */
function initPlayingScene() {
  player = new Player();
  grid   = new InvaderGrid({ speedMultiplier: 1, startY: 80 });
}

// ─────────────────────────────────────────────
// Scene updaters
// ─────────────────────────────────────────────

function updateTitle(/*dt*/) {
  if (enterJustPressed()) {
    // Reset game state for a fresh run
    hud.score = 0;
    hud.lives = STARTING_LIVES;
    initPlayingScene();
    switchScene('Playing');
  }
}

/**
 * Update the Playing scene for one fixed timestep.
 * ORDER: collision pass FIRST, then state updates — never inside draw().
 * @param {number} dt  Delta time in seconds.
 */
function updatePlaying(dt) {
  if (!player || !grid) return;

  // 1. Update player input / movement / bullet
  player.update(dt);

  // 2. Update invader formation
  grid.update(dt);

  // 3. ── COLLISION PASS (before any draw) ──────────────────────────────────
  //    Player bullet vs. invaders
  const result = checkBulletInvaderCollisions(player.bullet, grid);
  if (result.hit) {
    // Award points
    hud.score += SCORE_PER_KILL;
    if (hud.score > hud.hiScore) hud.hiScore = hud.score;
    // Consume the bullet so it doesn't pass through
    player.bullet = null;
  }
  // ── end collision pass ────────────────────────────────────────────────────
}

function updateGameOver(/*dt*/) {
  if (enterJustPressed()) {
    switchScene('Title');
  }
}

// ─────────────────────────────────────────────
// Scene draw functions
// ─────────────────────────────────────────────

function drawTitle() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  ctx.fillStyle = '#00ff00';
  ctx.font      = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '24px monospace';
  if (Math.floor(Date.now() / 600) % 2 === 0) {
    ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }
  ctx.restore();
}

function drawPlaying() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // HUD (score visible every frame — top-left)
  renderHUD(ctx, hud.lives);

  // Draw player ship and bullet
  if (player) player.draw(ctx);

  // Draw invader grid (alive invaders + explosion flashes)
  // Collision logic has already executed this frame in updatePlaying().
  if (grid) grid.draw(ctx);
}

function drawGameOver() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();

  ctx.fillStyle = '#ff3333';
  ctx.font      = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '28px monospace';
  ctx.fillText(`SCORE  ${hud.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

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

  if (elapsed > MAX_DELTA_MS) elapsed = MAX_DELTA_MS;

  accumulator += elapsed;

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
