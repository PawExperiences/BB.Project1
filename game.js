/**
 * game.js — Main ES module: game loop, scene state machine, HUD.
 *
 * Future import sites (added by later cards):
 *   import { createInvaders, updateInvaders } from './invaders.js'; // Card: Level 1 – the classic grid
 *   import { checkCollisions } from './collision.js';     // Card: Sprite rendering and collision detection
 *   import { initLevel1 } from './level1.js';             // Card: Level 1
 *   import { initLevel2 } from './level2.js';             // Card: Level 2
 *   import { initLevel3 } from './level3.js';             // Card: Level 3
 *   import { initBoss }   from './boss.js';               // Card: Boss level – multi-phase finale
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';

// ---------------------------------------------------------------------------
// HUD state — exported so later modules can read and mutate it directly.
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
};

// ---------------------------------------------------------------------------
// Canvas / context
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Scene identifiers
// ---------------------------------------------------------------------------
const SCENE = Object.freeze({
  TITLE:    'TITLE',
  PLAYING:  'PLAYING',
  GAME_OVER: 'GAME_OVER',
});

let currentScene = SCENE.TITLE;

// ---------------------------------------------------------------------------
// Keyboard input — initialise the full input module.
// ENTER tracking is still handled here; arrow / space handled in player.js.
// ---------------------------------------------------------------------------
initInput();

let enterPressed = false;

window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter') {
    enterPressed = true;
  }
});

function consumeEnter() {
  const was = enterPressed;
  enterPressed = false;
  return was;
}

// ---------------------------------------------------------------------------
// Player instance — created fresh each game session.
// ---------------------------------------------------------------------------
let player = null;

// ---------------------------------------------------------------------------
// Scene transitions
// ---------------------------------------------------------------------------
function transitionTo(scene) {
  if (scene === SCENE.PLAYING) {
    // Reset game state for a fresh run.
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    // Create a new player for the session.
    player = new Player();
  }
  if (scene === SCENE.TITLE) {
    // Update hi-score when returning to title.
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    player = null;
  }
  currentScene = scene;
}

// ---------------------------------------------------------------------------
// Update  (called N times per frame at fixed 1/60 s steps)
// ---------------------------------------------------------------------------
const UPDATE_STEP = 1 / 60; // seconds

function update(dt) {
  switch (currentScene) {
    case SCENE.TITLE:
      if (consumeEnter()) {
        transitionTo(SCENE.PLAYING);
      }
      break;

    case SCENE.PLAYING:
      // Update player movement and bullets.
      if (player) {
        player.update(dt);
        // Mirror lives from hudState so level cards can decrement hudState.lives.
        player.lives = hudState.lives;
      }

      // TODO (invaders.js) — update invader grid here
      // TODO (collision.js)— run collision detection here
      // TODO (level files) — check level-completion conditions here

      // Transition to Game Over when lives are exhausted.
      if (hudState.lives <= 0) {
        if (hudState.score > hudState.hiScore) {
          hudState.hiScore = hudState.score;
        }
        transitionTo(SCENE.GAME_OVER);
      }

      // Consume ENTER so it is not re-triggered immediately on the next scene.
      consumeEnter();
      break;

    case SCENE.GAME_OVER:
      if (consumeEnter()) {
        transitionTo(SCENE.TITLE);
      }
      break;
  }
}

// ---------------------------------------------------------------------------
// Render  (called once per frame)
// ---------------------------------------------------------------------------
function render() {
  // Clear canvas.
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (currentScene) {
    case SCENE.TITLE:
      renderTitle();
      break;
    case SCENE.PLAYING:
      renderPlaying();
      break;
    case SCENE.GAME_OVER:
      renderGameOver();
      break;
  }
}

function renderTitle() {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#0f0';
  ctx.font = 'bold 64px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#fff';
  ctx.font = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  // Hi-score
  ctx.fillStyle = '#ff0';
  ctx.font = '22px monospace';
  ctx.fillText('HI-SCORE: ' + hudState.hiScore, CANVAS_WIDTH / 2, 40);
}

function renderPlaying() {
  // Draw player ship and bullet.
  if (player) {
    player.draw(ctx);
  }

  // TODO (invaders.js) — draw invader grid here
  // TODO (collision.js)— draw bullets / explosions here
  // TODO (level files) — draw level-specific elements here

  renderHUD();
}

function renderGameOver() {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#f00';
  ctx.font = 'bold 72px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  ctx.fillStyle = '#fff';
  ctx.font = '32px monospace';
  ctx.fillText('SCORE: ' + hudState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.fillStyle = '#aaa';
  ctx.font = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);

  // Hi-score
  ctx.fillStyle = '#ff0';
  ctx.font = '22px monospace';
  ctx.fillText('HI-SCORE: ' + hudState.hiScore, CANVAS_WIDTH / 2, 40);
}

function renderHUD() {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText('SCORE: ' + hudState.score, 16, 16);

  ctx.textAlign = 'right';
  ctx.fillText('LIVES: ' + hudState.lives, CANVAS_WIDTH - 16, 16);
}

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// ---------------------------------------------------------------------------
const MAX_ACCUMULATED = 0.2; // seconds (200 ms cap — prevents burst on tab resume)

let previousTime = null;
let accumulated  = 0;

function loop(timestamp) {
  // timestamp is in milliseconds; convert to seconds.
  const now = timestamp / 1000;

  if (previousTime === null) {
    previousTime = now;
  }

  let delta = now - previousTime;
  previousTime = now;

  // Cap the accumulated delta so a backgrounded tab does not fire a burst.
  accumulated += delta;
  if (accumulated > MAX_ACCUMULATED) {
    accumulated = MAX_ACCUMULATED;
  }

  // Fixed-timestep update phase.
  while (accumulated >= UPDATE_STEP) {
    update(UPDATE_STEP);
    accumulated -= UPDATE_STEP;
  }

  // Render phase — runs once per animation frame.
  render();

  requestAnimationFrame(loop);
}

// Kick off the loop.
requestAnimationFrame(loop);
