// game.js — Main entry point: fixed-timestep game loop, scene FSM, HUD.

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';
import { checkCollisions } from './collision.js';
import { init as level1Init, update as level1Update, render as level1Render } from './level1.js';
import { init as level2Init, update as level2Update, render as level2Render } from './level2.js';

// ---------------------------------------------------------------------------
// HUD state — exported so sibling modules can read and mutate it.
// ---------------------------------------------------------------------------
export const hudState = {
  score:              0,
  lives:              STARTING_LIVES,
  hiScore:            0,
  level:              1,
  playerTotalShotCount: 0,   // incremented by player.js or here on each shot
};

// ---------------------------------------------------------------------------
// Scene identifiers
// ---------------------------------------------------------------------------
const SCENE = Object.freeze({
  TITLE:     'TITLE',
  PLAYING:   'PLAYING',
  GAME_OVER: 'GAME_OVER',
});

let currentScene = SCENE.TITLE;

// ---------------------------------------------------------------------------
// Canvas / context
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Player instance
// ---------------------------------------------------------------------------
let player = null;

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
initInput();

// Track Space key for shot counting (detect new presses, not held state)
let spaceWasHeld = false;

// ---------------------------------------------------------------------------
// Fixed-timestep constants
// ---------------------------------------------------------------------------
const FIXED_STEP    = 1 / 60;           // seconds per update tick
const MAX_DELTA     = 5 * FIXED_STEP;   // cap: never more than 5 catch-up steps
let   accumulator   = 0;                // leftover time carried between frames
let   lastTimestamp = null;             // previous rAF timestamp (ms)

// ---------------------------------------------------------------------------
// Level initialisation helpers
// ---------------------------------------------------------------------------
function startLevel() {
  hudState.level = 1;
  level1Init(ctx, hudState);
}

/**
 * Called by the game loop when hudState.level transitions from 1 → 2.
 * Hands off to Level 2 with the player's current lives intact.
 */
function advanceLevel(state) {
  state.level = 2;
  level2Init(ctx, state, player);
}

// ---------------------------------------------------------------------------
// ENTER key — drives every scene transition
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Enter') return;

  if (currentScene === SCENE.TITLE) {
    // Reset HUD when starting a new game
    hudState.score              = 0;
    hudState.lives              = STARTING_LIVES;
    hudState.playerTotalShotCount = 0;
    currentScene                = SCENE.PLAYING;

    // Initialise game objects
    player = new Player();
    startLevel();
    return;
  }

  if (currentScene === SCENE.GAME_OVER) {
    // Update hi-score before returning to title
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    currentScene = SCENE.TITLE;
    player = null;
    return;
  }
});

// ---------------------------------------------------------------------------
// Update — advances game state; never draws.
// dt: fixed timestep in seconds (always FIXED_STEP).
// ---------------------------------------------------------------------------
function update(dt) {
  if (currentScene !== SCENE.PLAYING) return;

  // Track player shots for UFO scoring
  if (player) {
    const spaceHeld = isSpaceHeld();
    const bulletActive = player.bullet !== null && player.bullet.active;
    if (spaceHeld && !spaceWasHeld && !bulletActive) {
      // Player just fired a new bullet
      hudState.playerTotalShotCount += 1;
    }
    spaceWasHeld = spaceHeld;
  }

  if (player) {
    player.update(dt);
  }

  // Advance the active level (dt converted to ms)
  const prevLevel = hudState.level;

  if (hudState.level === 1) {
    level1Update(dt * 1000);

    // Handle Level 1 → Level 2 transition
    if (hudState.level !== prevLevel && hudState.level === 2) {
      advanceLevel(hudState);
      return;
    }
  } else if (hudState.level === 2) {
    level2Update(dt * 1000);

    // If level2 sets level to 3 (cleared), handle as win for now
    if (hudState.level !== prevLevel) {
      if (hudState.score > hudState.hiScore) {
        hudState.hiScore = hudState.score;
      }
      currentScene = SCENE.TITLE;
      player = null;
      return;
    }
  }

  // Collision pass: player bullet vs invaders (handles both levels since
  // getLivingInvaders() is shared)
  if (player) {
    checkCollisions(player);
  }

  // Trigger GAME_OVER when lives reach 0
  if (hudState.lives <= 0) {
    currentScene = SCENE.GAME_OVER;
  }
}

// Small helper: check if Space is currently held using the input module.
// Avoids importing isKeyHeld at module scope if not already done — we inline it
// via a dynamic check against the held-key set via a closure-compatible approach.
import { isKeyHeld } from './input.js';
function isSpaceHeld() {
  return isKeyHeld(' ');
}

// ---------------------------------------------------------------------------
// Render — draws the current frame; never mutates game state.
// ---------------------------------------------------------------------------
function render(ctx) {
  // Clear the entire canvas each frame.
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (currentScene) {
    case SCENE.TITLE:
      renderTitle(ctx);
      break;
    case SCENE.PLAYING:
      renderPlaying(ctx);
      break;
    case SCENE.GAME_OVER:
      renderGameOver(ctx);
      break;
  }
}

// ---------------------------------------------------------------------------
// Scene renderers
// ---------------------------------------------------------------------------
function renderTitle(ctx) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#00ff00';
  ctx.font      = 'bold 56px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '24px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

function renderPlaying(ctx) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (hudState.level === 2) {
    // Level 2 render handles invaders, UFO, enemy bullets, AND the player ship
    // (with invulnerability flash).  We do NOT call player.draw separately.
    level2Render(ctx);
  } else {
    // Level 1
    level1Render(ctx);
    if (player) {
      player.draw(ctx);
    }
  }

  renderHUD(ctx);
}

function renderGameOver(ctx) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ff0000';
  ctx.font      = 'bold 56px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '28px monospace';
  ctx.fillText(`Score: ${hudState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.font = '22px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

// ---------------------------------------------------------------------------
// HUD — drawn on the canvas (not DOM)
// ---------------------------------------------------------------------------
function renderHUD(ctx) {
  const PAD  = 16;
  const TOP  = 24;

  ctx.textBaseline = 'top';
  ctx.font         = '18px monospace';

  // Score — left
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`SCORE  ${hudState.score}`, PAD, TOP);

  // Hi-score — centre
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffff00';
  ctx.fillText(`HI  ${hudState.hiScore}`, CANVAS_WIDTH / 2, TOP);

  // Lives — right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#00ff00';
  ctx.fillText(`LIVES  ${hudState.lives}`, CANVAS_WIDTH - PAD, TOP);

  // Separator line
  ctx.strokeStyle = '#333';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(0, TOP + 28);
  ctx.lineTo(CANVAS_WIDTH, TOP + 28);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// ---------------------------------------------------------------------------
function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);

  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  // Real elapsed seconds since last frame
  let elapsed = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // Cap to prevent a burst of catch-up steps after backgrounding
  if (elapsed > MAX_DELTA) elapsed = MAX_DELTA;

  accumulator += elapsed;

  // Drain the accumulator in fixed increments
  while (accumulator >= FIXED_STEP) {
    update(FIXED_STEP);
    accumulator -= FIXED_STEP;
  }

  render(ctx);
}

// Kick off the loop
requestAnimationFrame(gameLoop);
