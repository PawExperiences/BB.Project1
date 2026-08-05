// game.js — Game loop, scene state machine, and HUD for Space Invaders

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput }                                   from './input.js';
import { initLevel1, updateLevel1, renderLevel1 }      from './level1.js';
import { initLevel2, updateLevel2, renderLevel2 }      from './level2.js';
import { initLevel3, updateLevel3, renderLevel3 }      from './level3.js';
import { initBoss,   updateBoss,   renderBoss }        from './boss.js';
import { Player }                                       from './player.js';

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// HUD state — named export so later cards can import and mutate directly
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
  level:   1,
};

// ---------------------------------------------------------------------------
// Scene state machine
// Scenes: 'title' | 'playing' | 'level2' | 'level3' | 'boss' | 'gameover'
// ---------------------------------------------------------------------------
let currentScene = 'title';

/**
 * Transition to a new scene.
 * Exported so level modules can call it directly.
 *
 * Special intercepts:
 * - level2 → gameover (lives > 0): route to level3 (level cleared, not died)
 * - level3 → gameover (lives > 0): route to boss
 *
 * @param {string} scene
 */
export function transitionTo(scene) {
  // Level-2 clear: lives > 0 means level beaten, auto-advance to Level 3
  if (scene === 'gameover' && currentScene === 'level2' && hudState.lives > 0) {
    scene = 'level3';
  }

  // Level-3 clear: lives > 0 means level beaten, auto-advance to Boss
  if (scene === 'gameover' && currentScene === 'level3' && hudState.lives > 0) {
    scene = 'boss';
  }

  if (scene === 'title') {
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    hudState.level = 1;
  }
  if (scene === 'playing') {
    initPlayingScene();
  }
  if (scene === 'level2') {
    initLevel2Scene();
  }
  if (scene === 'level3') {
    initLevel3Scene();
  }
  if (scene === 'boss') {
    initBossScene();
  }
  // 'gameover' needs no extra init.

  currentScene = scene;
}

// ---------------------------------------------------------------------------
// Scene initialisers
// ---------------------------------------------------------------------------
function initPlayingScene() {
  initInput();
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;
  hudState.level = 1;
  initLevel1();
}

/**
 * Initialise Level 2.
 * Lives and score carry over — do NOT reset them.
 */
function initLevel2Scene() {
  initInput();
  initLevel2();
}

/**
 * Initialise Level 3.
 * Lives and score carry over from Level 2.
 */
function initLevel3Scene() {
  initInput();
  initLevel3();
}

/**
 * Initialise Boss level.
 * Lives and score carry over from Level 3.
 * A fresh Player is created at the standard bottom-centre position.
 */
function initBossScene() {
  initInput();
  // Create a fresh player; lives and score carry over from level 3
  const bossPlayer = new Player(CANVAS_WIDTH / 2, null);
  bossPlayer.lives = hudState.lives;
  initBoss(bossPlayer);
}

// ---------------------------------------------------------------------------
// Input — minimal ENTER-key handling (full input system initialised above)
// ---------------------------------------------------------------------------
const keysDown = {};

window.addEventListener('keydown', (e) => { keysDown[e.code] = true;  });
window.addEventListener('keyup',   (e) => { delete keysDown[e.code]; });

let enterConsumed = false;

function enterJustPressed() {
  if (keysDown['Enter'] && !enterConsumed) {
    enterConsumed = true;
    return true;
  }
  if (!keysDown['Enter']) {
    enterConsumed = false;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// ---------------------------------------------------------------------------
const UPDATE_STEP = 1 / 60;   // seconds per update tick
const MAX_DELTA   = 0.25;     // cap to prevent burst after backgrounding

let lastTimestamp = null;
let accumulator   = 0;

function gameLoop(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;

  let delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  if (delta > MAX_DELTA) delta = MAX_DELTA;
  accumulator += delta;

  while (accumulator >= UPDATE_STEP) {
    update(UPDATE_STEP);
    accumulator -= UPDATE_STEP;
  }

  render();
  requestAnimationFrame(gameLoop);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
function update(dt) {
  switch (currentScene) {
    case 'title':    updateTitle(dt);        break;
    case 'playing':  updatePlaying(dt);      break;
    case 'gameover': updateGameOver(dt);     break;
    case 'level2':   updateLevel2Scene(dt);  break;
    case 'level3':   updateLevel3Scene(dt);  break;
    case 'boss':     updateBossScene(dt);    break;
  }
}

function updateTitle(_dt) {
  if (enterJustPressed()) transitionTo('playing');
}

function updatePlaying(dt) {
  updateLevel1(dt);
}

function updateGameOver(_dt) {
  if (enterJustPressed()) transitionTo('title');
}

function updateLevel2Scene(dt) {
  updateLevel2(dt);
}

function updateLevel3Scene(dt) {
  updateLevel3(dt);
}

function updateBossScene(dt) {
  updateBoss(dt);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (currentScene) {
    case 'title':    renderTitle();        break;
    case 'playing':  renderPlaying();      break;
    case 'gameover': renderGameOver();     break;
    case 'level2':   renderLevel2Scene();  break;
    case 'level3':   renderLevel3Scene();  break;
    case 'boss':     renderBossScene();    break;
  }
}

// ---------------------------------------------------------------------------
// Scene renderers
// ---------------------------------------------------------------------------
function renderTitle() {
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#0f0';
  ctx.font      = 'bold 64px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#fff';
  ctx.font      = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

function renderPlaying() {
  drawHUD();
  renderLevel1(ctx);
}

function renderLevel2Scene() {
  drawHUD();
  renderLevel2(ctx);
}

function renderLevel3Scene() {
  drawHUD();
  renderLevel3(ctx);
}

function renderBossScene() {
  drawHUD();
  renderBoss(ctx);
}

function renderGameOver() {
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#f00';
  ctx.font      = 'bold 72px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  ctx.fillStyle = '#fff';
  ctx.font      = '32px monospace';
  ctx.fillText('Score: ' + hudState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.font = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
function drawHUD() {
  const PAD = 16;

  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.font         = 'bold 20px monospace';

  ctx.fillStyle = '#fff';
  ctx.fillText('SCORE: ' + hudState.score, PAD, PAD);

  ctx.textAlign = 'center';
  ctx.fillText('HI: ' + hudState.hiScore, CANVAS_WIDTH / 2, PAD);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f0';
  ctx.fillText('LIVES: ' + hudState.lives, CANVAS_WIDTH - PAD, PAD);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ff0';
  ctx.fillText('LEVEL ' + hudState.level, CANVAS_WIDTH - PAD, PAD + 24);

  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ---------------------------------------------------------------------------
// Kick off
// ---------------------------------------------------------------------------
initInput();
requestAnimationFrame(gameLoop);
