// game.js — Main module: fixed-timestep loop, scene state machine, HUD
import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { drawInvaders, getLivingCount } from './invaders.js';
import { checkBulletInvaderCollisions, checkInvaderBulletPlayerCollisions } from './collision.js';
import { Player } from './player.js';
import { initInput } from './input.js';
import { startLevel1, updateLevel1 } from './level1.js';

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
  level:   0,   // updated by startLevel(n); 0 = no active level (title/game-over)
};

// ---------------------------------------------------------------------------
// Internal game state
// ---------------------------------------------------------------------------
let currentScene = SCENES.TITLE;

// Fixed-timestep constants
const UPDATE_STEP    = 1000 / 60;       // ~16.67 ms
const MAX_ACCUMULATOR = UPDATE_STEP * 5; // ~83 ms — delta cap

let lastTimestamp = null;
let accumulator   = 0;

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------
let player = null;

function createPlayer() {
  const startX = (CANVAS_WIDTH - 40) / 2; // 40 = SHIP_WIDTH from player.js
  const startY = CANVAS_HEIGHT - 80;
  player = new Player(startX, startY);
}

// ---------------------------------------------------------------------------
// Level dispatcher — globally exported so level modules can call startLevel(n)
// ---------------------------------------------------------------------------

/**
 * Transition to the given level number.
 * Level 1 is fully implemented; higher levels are stubs (return to title).
 * @param {number} n - Level number to start
 */
export function startLevel(n) {
  hudState.level = n;
  if (n === 1) {
    startLevel1();
    currentScene = SCENES.PLAYING;
  } else {
    // Levels beyond 1 are not yet implemented.
    // Preserve hi-score and return to title as a graceful fallback.
    console.info(`startLevel(${n}) called — Level ${n} not yet implemented. Returning to title.`);
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    currentScene   = SCENES.TITLE;
    hudState.level = 0;
  }
}

// ---------------------------------------------------------------------------
// Input init
// ---------------------------------------------------------------------------
initInput();

// ---------------------------------------------------------------------------
// Keyboard handling
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleEnterKey();
  }
  // Temporary hotkey: press G while PLAYING to simulate a game-over
  if (e.key === 'g' || e.key === 'G') {
    if (currentScene === SCENES.PLAYING) {
      triggerGameOver();
    }
  }
});

function handleEnterKey() {
  if (currentScene === SCENES.TITLE) {
    // Reset per-round state
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    // Create a fresh player ship
    createPlayer();
    // Start Level 1 (sets hudState.level = 1, inits invaders, sets PLAYING)
    startLevel(1);
  } else if (currentScene === SCENES.GAME_OVER) {
    currentScene   = SCENES.TITLE;
    hudState.level = 0;
  }
}

function triggerGameOver() {
  if (hudState.score > hudState.hiScore) {
    hudState.hiScore = hudState.score;
  }
  currentScene   = SCENES.GAME_OVER;
  hudState.level = 0;
}

// ---------------------------------------------------------------------------
// Build the bullet list the collision module needs from the player's bullet
// ---------------------------------------------------------------------------
function getPlayerBullets() {
  if (!player || !player.bullet) return [];
  const b = player.bullet;
  if (!('active'     in b)) b.active     = true;
  if (!('fromPlayer' in b)) b.fromPlayer = true;
  if (!('width'      in b)) b.width      = 4;
  if (!('height'     in b)) b.height     = 12;
  return [b];
}

// ---------------------------------------------------------------------------
// Update — pure logic, no drawing
// ---------------------------------------------------------------------------
function update(dt) {
  if (currentScene !== SCENES.PLAYING) return;

  // 1. Update player (movement + bullet)
  if (player) player.update(dt / 1000); // player.update expects seconds

  // 2. Level 1 update: explosion timers, formation stepping, lose-condition check
  const levelResult = player ? updateLevel1(dt, player) : null;

  // 3. Collision pass — always before render
  const playerBullets = getPlayerBullets();
  checkBulletInvaderCollisions(playerBullets, hudState);

  // Deactivate player bullet if the collision pass marked it inactive
  if (player && player.bullet && player.bullet.active === false) {
    player.bullet.y = -9999;
  }

  // Invader-bullet-vs-player stub (no invader firing in Level 1)
  if (player) {
    checkInvaderBulletPlayerCollisions([], player, hudState);
  }

  // 4. Handle lose condition (invaders reached the player)
  if (levelResult === 'lose') {
    hudState.lives -= 1;
    if (hudState.lives <= 0) {
      triggerGameOver();
    } else {
      // Reset formation; preserve score and lives
      startLevel1();
    }
    return;
  }

  // 5. Win condition: all invaders destroyed
  if (getLivingCount() === 0) {
    startLevel(2); // Level 2 internals are out of scope; startLevel stubs gracefully
    return;
  }
}

// ---------------------------------------------------------------------------
// Render — pure drawing, no logic
// ---------------------------------------------------------------------------
function render() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (currentScene) {
    case SCENES.TITLE:     renderTitle();    break;
    case SCENES.PLAYING:   renderPlaying();  break;
    case SCENES.GAME_OVER: renderGameOver(); break;
  }
}

function renderTitle() {
  ctx.fillStyle    = '#fff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 64px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  ctx.font = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

function renderPlaying() {
  renderHUD();
  drawInvaders(ctx);
  if (player) player.draw(ctx);
}

function renderGameOver() {
  ctx.fillStyle    = '#fff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 72px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.font = '32px monospace';
  ctx.fillText(`Score: ${hudState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

  ctx.font = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

function renderHUD() {
  const PAD = 16;

  ctx.font         = '20px monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle    = '#fff';

  // Score — top-left
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${hudState.score}`, PAD, PAD);

  // Hi-Score — top-centre
  ctx.textAlign = 'center';
  ctx.fillText(`HI: ${hudState.hiScore}`, CANVAS_WIDTH / 2, PAD);

  // Lives — top-right
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES: ${hudState.lives}`, CANVAS_WIDTH - PAD, PAD);

  // Level — second row, top-left (sourced from hudState.level, not hardcoded)
  ctx.textAlign = 'left';
  ctx.fillText(`LEVEL: ${hudState.level}`, PAD, PAD + 28);
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

  if (delta > MAX_ACCUMULATOR) {
    delta = MAX_ACCUMULATOR;
  }

  accumulator += delta;

  while (accumulator >= UPDATE_STEP) {
    update(UPDATE_STEP);
    accumulator -= UPDATE_STEP;
  }

  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
