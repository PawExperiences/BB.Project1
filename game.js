// game.js — Game loop, scene state machine, and HUD

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';
import {
  createFormation,
  updateFormation,
  drawFormation,
} from './invaders.js';
import { runCollisions } from './collision.js';

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Initialise keyboard input
// ---------------------------------------------------------------------------
initInput();

// ---------------------------------------------------------------------------
// Exported HUD state — later cards import and mutate this object directly
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
};

// ---------------------------------------------------------------------------
// Shared game state object — single source of truth for all entities
// ---------------------------------------------------------------------------
const state = {
  player:        null,
  playerBullets: [],   // { x, y, width, height } — top-left origin
  invaderBullets:[],   // same shape; populated by future cards
  invaders:      [],   // flat array of Invader instances
  score:         0,
  explosions:    [],   // { x, y, ttl }
};

// ---------------------------------------------------------------------------
// Bullet dimensions (must match player.js internals — keep in sync)
// ---------------------------------------------------------------------------
const BULLET_W = 3;
const BULLET_H = 10;

// ---------------------------------------------------------------------------
// Player instance — created when a new game starts
// ---------------------------------------------------------------------------
let player = null;

function createPlayer() {
  player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
  state.player = player;
  hudState.lives = player.lives;
}

// ---------------------------------------------------------------------------
// Scene state machine
// Scenes: 'title' | 'playing' | 'gameover'
// ---------------------------------------------------------------------------
let currentScene = 'title';

function enterScene(scene) {
  currentScene = scene;
}

// ---------------------------------------------------------------------------
// Keyboard input (Enter key for scene transitions)
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter') {
    handleEnter();
  }
});

function handleEnter() {
  if (currentScene === 'title') {
    // Reset shared state for a new game
    state.score         = 0;
    state.playerBullets = [];
    state.invaderBullets= [];
    state.explosions    = [];
    state.invaders      = createFormation();

    hudState.score = 0;
    hudState.lives = STARTING_LIVES;

    createPlayer();
    enterScene('playing');
  } else if (currentScene === 'gameover') {
    enterScene('title');
    player       = null;
    state.player = null;
  }
}

// ---------------------------------------------------------------------------
// Public helper: other modules call this to trigger a game-over transition
// ---------------------------------------------------------------------------
export function triggerGameOver() {
  if (hudState.score > hudState.hiScore) {
    hudState.hiScore = hudState.score;
  }
  enterScene('gameover');
}

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// ---------------------------------------------------------------------------
const UPDATE_STEP = 1 / 60;  // seconds per logic tick
const DELTA_CAP   = 0.25;    // 250 ms max accumulated delta

let lastTimestamp = null;
let accumulator   = 0;

function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let elapsed = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (elapsed > DELTA_CAP) {
    elapsed = DELTA_CAP;
  }

  accumulator += elapsed;

  while (accumulator >= UPDATE_STEP) {
    update(UPDATE_STEP);
    accumulator -= UPDATE_STEP;
  }

  render();

  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Update — pure logic, no drawing
// Loop order: update positions/timers → runCollisions
// ---------------------------------------------------------------------------
function update(dt) {
  if (currentScene !== 'playing') return;

  // 1. Update player position and bullet travel
  if (player) {
    player.update(dt);
    hudState.lives = player.lives;

    // Sync player bullet into the shared playerBullets array so collision
    // can operate on it.  Player owns one bullet at a time; mirror it.
    if (player.bulletActive) {
      // Bullet rect (top-left origin)
      const bx = player.bulletX - BULLET_W / 2;
      const by = player.bulletY;

      if (state.playerBullets.length === 0) {
        // Add the bullet proxy object
        state.playerBullets.push({ x: bx, y: by, width: BULLET_W, height: BULLET_H, _owner: player });
      } else {
        // Update the existing proxy
        state.playerBullets[0].x = bx;
        state.playerBullets[0].y = by;
      }
    } else {
      // No bullet in flight — clear the array
      state.playerBullets.length = 0;
    }
  }

  // 2. Update formation movement
  if (state.invaders.length > 0) {
    updateFormation(state.invaders, canvas, dt);
  }

  // 3. Advance explosion timers; remove expired ones
  for (let i = state.explosions.length - 1; i >= 0; i--) {
    state.explosions[i].ttl -= dt;
    if (state.explosions[i].ttl <= 0) {
      state.explosions.splice(i, 1);
    }
  }

  // 4. Run collision detection (mutates state)
  runCollisions(state);

  // If a player bullet was removed by collision, tell the Player instance
  if (player && player.bulletActive && state.playerBullets.length === 0) {
    player.clearBullet();
  }

  // 5. Sync score to HUD
  hudState.score = state.score;

  // 6. Sync lives; check game-over
  if (player) {
    hudState.lives = player.lives;
  }
  if (hudState.lives <= 0) {
    triggerGameOver();
  }
}

// ---------------------------------------------------------------------------
// Render — pure drawing, no state mutation
// Loop order: draw formation → bullets → player → HUD → explosions
// ---------------------------------------------------------------------------
function render() {
  // Clear
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (currentScene === 'title') {
    renderTitle();
  } else if (currentScene === 'playing') {
    renderPlaying();
    renderHUD();
  } else if (currentScene === 'gameover') {
    renderGameOver();
  }
}

// ---------------------------------------------------------------------------
// Scene renderers
// ---------------------------------------------------------------------------
function renderTitle() {
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#0f0';
  ctx.font      = 'bold 56px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 48);

  ctx.fillStyle = '#fff';
  ctx.font      = '24px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 32);
}

function renderPlaying() {
  // 1. Invader formation
  if (state.invaders.length > 0) {
    drawFormation(ctx, state.invaders);
  }

  // 2. Player bullet (drawn by player.draw)
  // 3. Player ship
  if (player) {
    player.draw(ctx);
  }

  // 4. Score display (top-left, in addition to full HUD)
  // The full HUD (renderHUD) is called separately and already shows score.

  // 5. Explosions
  renderExplosions();
}

function renderExplosions() {
  ctx.fillStyle = '#ffaa00';
  for (const exp of state.explosions) {
    ctx.beginPath();
    ctx.arc(Math.round(exp.x), Math.round(exp.y), 16, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderHUD() {
  const PAD  = 16;
  const LINE = 20;

  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle    = '#fff';
  ctx.font         = `${LINE}px monospace`;

  ctx.fillText(`Score: ${hudState.score}`,  PAD,               PAD);
  ctx.fillText(`Lives: ${hudState.lives}`,  PAD,               PAD + LINE + 4);

  ctx.textAlign = 'right';
  ctx.fillText(`HI  ${hudState.hiScore}`,   CANVAS_WIDTH - PAD, PAD);
  ctx.textAlign = 'left';
}

function renderGameOver() {
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#f00';
  ctx.font      = 'bold 64px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 64);

  ctx.fillStyle = '#fff';
  ctx.font      = '28px monospace';
  ctx.fillText(`Score: ${hudState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.font = '22px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 56);
}

// ---------------------------------------------------------------------------
// Start the loop
// ---------------------------------------------------------------------------
requestAnimationFrame(loop);
