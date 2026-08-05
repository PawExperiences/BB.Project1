/**
 * game.js — Main entry point and runtime for Space Invaders.
 * ES module; loaded by index.html as type="module".
 *
 * Architecture:
 *   - Fixed-timestep game loop at 60 steps/s via requestAnimationFrame.
 *   - Scene state machine: 'title' | 'playing' | 'levelcomplete' | 'gameover'.
 *   - ENTER drives all scene transitions.
 *   - HUD shows Score, Level, Best, Lives during play.
 *   - hudState exported so other modules can read/mutate score, lives, hiScore.
 */

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STARTING_LIVES,
} from './gameConfig.js';

import { initInput } from './input.js';
import { Player }    from './player.js';

import { drawInvaders } from './invaders.js';

import {
  updateExplosions,
  drawExplosions,
  clearExplosions,
} from './explosion.js';

import { runCollisionPass } from './collision.js';

import {
  initLevel1,
  updateLevel1,
  LEVEL_NUMBER as LEVEL1_NUMBER,
} from './level1.js';

import { Level2 } from './level2.js';

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('gameCanvas'));
const ctx    = canvas.getContext('2d');

canvas.width  = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
initInput();

// ---------------------------------------------------------------------------
// Player entity
// ---------------------------------------------------------------------------
const player = new Player();

// ---------------------------------------------------------------------------
// Shared HUD state — exported so collision.js and others can mutate score.
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
};

// ---------------------------------------------------------------------------
// Scene state machine
// ---------------------------------------------------------------------------
// Scenes: 'title' | 'playing' | 'levelcomplete' | 'gameover'
let currentScene = 'title';

/** Which level is active: 1 or 2. Used for HUD label and update dispatch. */
let currentLevel = 1;

/** Level2 instance — created once, reused per game. */
let level2Instance = null;

function setScene(sceneName) {
  currentScene = sceneName;
}

// ---------------------------------------------------------------------------
// Level-1 callbacks
// ---------------------------------------------------------------------------

/**
 * Called by level1.js when the formation's bottom edge reaches the player row.
 * Decrements lives, then either restarts the level or triggers game-over.
 */
function onPlayerReached() {
  hudState.lives -= 1;
  clearExplosions();
  if (hudState.lives <= 0) {
    triggerGameOver();
  } else {
    initLevel1(player, { onPlayerReached, onLevelComplete });
  }
}

/**
 * Called by level1.js when all invaders are cleared.
 * Transitions immediately to Level 2 — no intermediate screen.
 * Lives and score are preserved.
 * @param {number} _nextLevel  Always 2 from level1.js.
 */
function onLevelComplete(_nextLevel) {
  // Transition to Level 2 immediately — no intermediate screen.
  currentLevel = 2;
  clearExplosions();

  if (level2Instance === null) {
    level2Instance = new Level2(player, {
      onLevelComplete: onLevel2Complete,
    });
  }
  level2Instance.init();
  // Stay in 'playing' scene — no scene change needed.
}

/**
 * Called by Level2 when all its invaders are cleared.
 * For now, show a level-complete holding screen (Level 3 is out of scope).
 */
function onLevel2Complete(_nextLevel) {
  setScene('levelcomplete');
}

// ---------------------------------------------------------------------------
// ENTER-key handler — drives all scene transitions
// ---------------------------------------------------------------------------
window.addEventListener('keydown', function onKey(event) {
  if (event.code !== 'Enter') return;

  if (currentScene === 'title') {
    // Title → Playing (Level 1)
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    currentLevel   = 1;
    level2Instance = null;
    clearExplosions();
    initLevel1(player, { onPlayerReached, onLevelComplete });
    setScene('playing');

  } else if (currentScene === 'gameover' || currentScene === 'levelcomplete') {
    // Game Over / Level Complete → Title
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    currentLevel   = 1;
    level2Instance = null;
    setScene('title');
  }
});

// ---------------------------------------------------------------------------
// Game-over trigger — exported for DevTools / future use
// ---------------------------------------------------------------------------
export function triggerGameOver() {
  if (hudState.score > hudState.hiScore) {
    hudState.hiScore = hudState.score;
  }
  setScene('gameover');
}

// ---------------------------------------------------------------------------
// UPDATE — pure logic, no drawing
// ---------------------------------------------------------------------------
function update(dt) {
  if (currentScene !== 'playing') return;

  player.update(dt);

  if (currentLevel === 1) {
    runCollisionPass(player);
    updateLevel1(dt);
    updateExplosions();

    // Safety net: catch lives depletion not handled by onPlayerReached.
    if (hudState.lives <= 0 && currentScene === 'playing') {
      triggerGameOver();
    }
  } else if (currentLevel === 2 && level2Instance !== null) {
    // In Level 2 the collision pass for player bullets vs invaders still
    // runs via runCollisionPass (which also increments score).
    runCollisionPass(player);
    level2Instance.update(dt);
    updateExplosions();

    if (hudState.lives <= 0 && currentScene === 'playing') {
      triggerGameOver();
    }
  }
}

// ---------------------------------------------------------------------------
// RENDER — pure drawing, no state mutation
// ---------------------------------------------------------------------------
function render() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (currentScene) {
    case 'title':         renderTitle();         break;
    case 'playing':       renderPlaying();       break;
    case 'levelcomplete': renderLevelComplete(); break;
    case 'gameover':      renderGameOver();      break;
  }
}

// -- Scene renderers ---------------------------------------------------------

function renderTitle() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#00ff00';
  ctx.font      = 'bold 56px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

function renderPlaying() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawInvaders(ctx);
  drawExplosions(ctx);

  // In Level 2, respect the flash visibility flag for invulnerability effect.
  const drawPlayer = (currentLevel !== 2 || level2Instance === null || level2Instance.playerVisible);
  if (drawPlayer) {
    player.draw(ctx);
  }

  // Level 2 draws enemy bullets and UFO.
  if (currentLevel === 2 && level2Instance !== null) {
    level2Instance.draw(ctx);
  }

  renderHUD();
}

function renderLevelComplete() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#00ff00';
  ctx.font      = 'bold 52px monospace';
  ctx.fillText('LEVEL COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '28px monospace';
  ctx.fillText('Score: ' + hudState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

  ctx.font = '22px monospace';
  ctx.fillText('Press ENTER to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

function renderGameOver() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ff2222';
  ctx.font      = 'bold 64px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '32px monospace';
  ctx.fillText('Score: ' + hudState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.font = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

// -- HUD renderer ------------------------------------------------------------

function renderHUD() {
  const padding = 14;
  const lineY   = CANVAS_HEIGHT - 36;

  ctx.font         = '20px monospace';
  ctx.textBaseline = 'alphabetic';

  // SCORE — far left
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE ' + hudState.score, padding, lineY);

  // LEVEL — left of centre (~30 % across)
  ctx.textAlign = 'center';
  ctx.fillText('LEVEL ' + currentLevel, Math.round(CANVAS_WIDTH * 0.30), lineY);

  // BEST — centre
  ctx.fillText('BEST ' + hudState.hiScore, CANVAS_WIDTH / 2, lineY);

  // LIVES — far right
  ctx.textAlign = 'right';
  ctx.fillText('LIVES ' + hudState.lives, CANVAS_WIDTH - padding, lineY);

  // Separator line above HUD
  ctx.strokeStyle = '#333333';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(0,            CANVAS_HEIGHT - 52);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 52);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// ---------------------------------------------------------------------------
const FIXED_DT  = 1 / 60;    // seconds per update step
const DELTA_CAP = 0.250;     // max accumulated delta (250 ms)

let lastTimestamp = null;
let accumulator   = 0;

function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let elapsed = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (elapsed > DELTA_CAP) elapsed = DELTA_CAP;

  accumulator += elapsed;

  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
