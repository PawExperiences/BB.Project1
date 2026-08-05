// game.js — Game loop, scene state machine, and HUD for Space Invaders

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput }                                   from './input.js';
import { initLevel1, updateLevel1, renderLevel1 }      from './level1.js';
import { initLevel2, updateLevel2, renderLevel2 }      from './level2.js';
import { initLevel3, updateLevel3, renderLevel3 }      from './level3.js'; // Level 3 card
// import { createBoss, updateBoss, renderBoss } from './boss.js';          // Boss card

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
 * Special intercept: when Level 2 calls transitionTo('gameover') after
 * clearing all invaders (hudState.lives > 0), we route to Level 3 instead.
 *
 * @param {string} scene
 */
export function transitionTo(scene) {
  // --- Level-2 clear intercept: lives > 0 means the level was beaten, not
  //     a game-over death. Route automatically to Level 3.
  if (scene === 'gameover' && currentScene === 'level2' && hudState.lives > 0) {
    scene = 'level3';
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
  // 'boss' and 'gameover' need no extra init.

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

function updateBossScene(_dt) {
  // Placeholder: boss card not yet implemented.
  if (enterJustPressed()) transitionTo('title');
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
  // Placeholder screen until the Boss card is implemented.
  drawHUD();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ff0';
  ctx.font      = 'bold 52px monospace';
  ctx.fillText('BOSS INCOMING!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

  ctx.fillStyle = '#fff';
  ctx.font      = '26px monospace';
  ctx.fillText('(Boss level — coming soon)', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  ctx.font = '22px monospace';
  ctx.fillText('Press ENTER to return to title', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
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
