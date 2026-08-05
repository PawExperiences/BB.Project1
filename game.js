/**
 * game.js — Main entry point and runtime for Space Invaders.
 * ES module; loaded by index.html as type="module".
 *
 * Architecture:
 *   - Fixed-timestep game loop at 60 steps/s via requestAnimationFrame.
 *   - Three-scene state machine: 'title' | 'playing' | 'gameover'.
 *   - ENTER key drives every scene transition (no page reloads).
 *   - Canvas HUD drawn each frame during the playing scene.
 *   - hudState exported so later modules can read/mutate score, lives, hiScore.
 */

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STARTING_LIVES,
} from './gameConfig.js';

// input.js added by: Keyboard input and the player ship
// player.js added by: Keyboard input and the player ship
// invaders.js added by: Invader grid and movement
// collision.js added by: Collision detection
// level1.js added by: Level 1 wave definition
// level2.js added by: Level 2 wave definition
// level3.js added by: Level 3 wave definition
// boss.js added by: Boss enemy

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('gameCanvas'));
const ctx    = canvas.getContext('2d');

canvas.width  = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ---------------------------------------------------------------------------
// Shared HUD state — exported so later cards can import and mutate it.
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
};

// ---------------------------------------------------------------------------
// Scene state machine
// ---------------------------------------------------------------------------
// Valid scenes: 'title' | 'playing' | 'gameover'
let currentScene = 'title';

/**
 * Transition to a new scene, performing any necessary reset logic.
 * @param {'title'|'playing'|'gameover'} sceneName
 */
function setScene(sceneName) {
  currentScene = sceneName;
}

// ---------------------------------------------------------------------------
// ENTER-key handler — drives all scene transitions
// ---------------------------------------------------------------------------
window.addEventListener('keydown', function onKey(event) {
  if (event.code !== 'Enter') return;

  if (currentScene === 'title') {
    // Transition: Title → Playing
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    setScene('playing');

  } else if (currentScene === 'gameover') {
    // Transition: Game Over → Title
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    setScene('title');
  }
  // No transition out of 'playing' via ENTER; game-over is triggered by logic.
});

// ---------------------------------------------------------------------------
// Game-over trigger — called by game logic when lives reach 0.
// Exported so later modules (player.js, etc.) can trigger the transition.
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
/**
 * @param {number} dt  Fixed timestep in seconds (1/60).
 */
function update(dt) {
  if (currentScene !== 'playing') return;

  // input.js added by: Keyboard input and the player ship
  // player.js added by: Keyboard input and the player ship  (update player position, bullets)
  // invaders.js added by: Invader grid and movement         (update invader positions, bullets)
  // collision.js added by: Collision detection              (check all collisions, mutate hudState)

  // Check for game-over condition (lives depleted).
  if (hudState.lives <= 0) {
    triggerGameOver();
  }
}

// ---------------------------------------------------------------------------
// RENDER — pure drawing, no state mutation
// ---------------------------------------------------------------------------
function render() {
  // Clear the canvas for every frame.
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (currentScene) {
    case 'title':
      renderTitle();
      break;
    case 'playing':
      renderPlaying();
      break;
    case 'gameover':
      renderGameOver();
      break;
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

  // player.js added by: Keyboard input and the player ship   (render player)
  // invaders.js added by: Invader grid and movement          (render invaders)
  // collision.js added by: Collision detection               (render bullets/shields)

  renderHUD();
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

// -- HUD renderer (canvas, not DOM) ------------------------------------------

function renderHUD() {
  const padding = 14;
  const lineY   = CANVAS_HEIGHT - 36;

  ctx.font      = '20px monospace';
  ctx.textBaseline = 'alphabetic';

  // Score — left aligned
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE ' + hudState.score, padding, lineY);

  // Hi-Score — centred
  ctx.textAlign = 'center';
  ctx.fillText('BEST ' + hudState.hiScore, CANVAS_WIDTH / 2, lineY);

  // Lives — right aligned
  ctx.textAlign = 'right';
  ctx.fillText('LIVES ' + hudState.lives, CANVAS_WIDTH - padding, lineY);

  // Separator line above HUD
  ctx.strokeStyle = '#333333';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(0, CANVAS_HEIGHT - 52);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 52);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// ---------------------------------------------------------------------------
const FIXED_DT   = 1 / 60;          // seconds per update step
const DELTA_CAP  = 0.250;           // maximum accumulated delta (250 ms → ≤15 steps)

let lastTimestamp = null;            // DOMHighResTimeStamp of previous frame
let accumulator   = 0;              // leftover time waiting to be consumed

/**
 * Main loop — called by requestAnimationFrame each display frame.
 * @param {DOMHighResTimeStamp} timestamp
 */
function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let elapsed = (timestamp - lastTimestamp) / 1000; // convert ms → s
  lastTimestamp = timestamp;

  // Cap to prevent spiral-of-death after tab backgrounding.
  if (elapsed > DELTA_CAP) {
    elapsed = DELTA_CAP;
  }

  accumulator += elapsed;

  // Drain the accumulator in fixed steps (update phase — no drawing).
  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  // Render phase — completely separate from update.
  render();

  requestAnimationFrame(loop);
}

// Kick off the loop.
requestAnimationFrame(loop);
