// game.js — Main entry module: fixed-timestep loop, scene state machine, HUD
import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput, isKeyHeld } from './input.js';
import { Player } from './player.js';
import { invaders, drawInvaders } from './invaders.js';
import { runCollisionPass } from './collision.js';
import { updateExplosions, drawExplosions } from './explosion.js';
import { getScore, addScore, resetScore } from './score.js';
import {
  initLevel1,
  updateLevel1,
  resetFormation,
  getCurrentLevel,
} from './level1.js';

// ---------------------------------------------------------------------------
// HUD state — exported so sibling modules can read it
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
// Player instance
// ---------------------------------------------------------------------------
let player = new Player();

// ---------------------------------------------------------------------------
// Input — initialise the input module
// ---------------------------------------------------------------------------
initInput();

// ---------------------------------------------------------------------------
// Level 1 — wire up callbacks
// ---------------------------------------------------------------------------
function wireLevel1() {
  initLevel1({
    level:       1,
    getPlayerY:  () => player.y,
    getLives:    () => hudState.lives,
    onLoseLife:  () => {
      hudState.lives -= 1;
      // Reset formation and player position.
      resetFormation();
      player = new Player();
    },
    onGameOver:  () => {
      if (hudState.score > hudState.hiScore) {
        hudState.hiScore = hudState.score;
      }
      transitionTo(SCENE_GAME_OVER);
    },
    onLevelClear: () => {
      // Transition to Level 2 (future card).
      transitionTo('level2');
    },
  });
}

// Initialise Level 1 wiring at start-up.
wireLevel1();

// ---------------------------------------------------------------------------
// Track ENTER key for scene transitions
// ---------------------------------------------------------------------------
const _enterKeys = {};
window.addEventListener('keydown', (e) => {
  if (!_enterKeys[e.code] && e.code === 'Enter') {
    handleEnter();
  }
  _enterKeys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
  _enterKeys[e.code] = false;
});

function handleEnter() {
  switch (currentScene) {
    case SCENE_TITLE:
      transitionTo(SCENE_PLAYING);
      break;
    case SCENE_PLAYING:
      break;
    case SCENE_GAME_OVER:
      resetGame();
      transitionTo(SCENE_TITLE);
      break;
  }
}

export function transitionTo(scene) {
  currentScene = scene;
}

export function resetGame() {
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;
  resetScore();
  // Rebuild the player instance so position and bullet are fresh.
  player = new Player();
  // Re-wire Level 1 (resets formation to starting position).
  wireLevel1();
}

export function checkGameOver() {
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
const FIXED_DT  = 1 / 60;    // seconds per update tick
const MAX_DELTA = 0.250;      // 250 ms cap

let lastTimestamp = null;
let accumulator   = 0;

function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  const rawDelta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp  = timestamp;
  const delta    = Math.min(rawDelta, MAX_DELTA);

  accumulator += delta;

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
function update(dt) {
  checkGameOver();

  if (currentScene !== SCENE_PLAYING) return;

  // Player update.
  player.update(dt);

  // Level 1 movement (timer-based, handles edge detection, life-loss, level-clear).
  updateLevel1(dt);

  // Explosion timers.
  updateExplosions();

  // COLLISION PASS — runs before render.
  runCollisionPass(player);

  // Keep hudState.score in sync with score module.
  hudState.score = getScore();
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
    default:
      // Future scenes (level2, etc.) — show a placeholder.
      renderLevelTransition();
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

  // Draw invaders (green rectangles).
  drawInvaders(ctx);

  // Draw explosions (white flicker).
  drawExplosions(ctx);

  // Draw player ship and bullet.
  player.draw(ctx);

  // HUD overlay.
  drawHUD();
}

export function renderGameOver() {
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

function renderLevelTransition() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#0f0';
  ctx.font      = 'bold 48px monospace';
  ctx.fillText('LEVEL CLEAR!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  ctx.fillStyle = '#fff';
  ctx.font      = '28px monospace';
  ctx.fillText('Level 2 coming soon…', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

// ---------------------------------------------------------------------------
// HUD — extended to show current level number
// ---------------------------------------------------------------------------
export function drawHUD() {
  const PAD = 16;

  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle    = '#fff';
  ctx.font         = '20px monospace';
  ctx.fillText('SCORE  ' + hudState.score,   PAD, PAD);
  ctx.fillText('HI     ' + hudState.hiScore, CANVAS_WIDTH / 2 - 80, PAD);

  // Level number — centred below the score line.
  const levelNum = getCurrentLevel();
  ctx.textAlign = 'center';
  ctx.fillText('LEVEL ' + levelNum, CANVAS_WIDTH / 2, PAD + 28);

  ctx.textAlign = 'right';
  ctx.fillText('LIVES  ' + hudState.lives, CANVAS_WIDTH - PAD, PAD);
}

// ---------------------------------------------------------------------------
// Kick off
// ---------------------------------------------------------------------------
requestAnimationFrame(loop);
