// game.js — Main game loop, scene state machine, HUD renderer, HUD state export.
// Imports shared constants from gameConfig.js.

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STARTING_LIVES,
} from './gameConfig.js';

// ─────────────────────────────────────────────
// Internal constants
// ─────────────────────────────────────────────
const TARGET_FPS  = 60;
const FIXED_DT    = 1 / TARGET_FPS;          // seconds per simulation step (~0.01667 s)
const FIXED_DT_MS = FIXED_DT * 1000;         // same in milliseconds (~16.67 ms)
const MAX_DELTA   = 250;                     // ms — cap to avoid spiral-of-death on tab restore

const STARTING_SCORE = 0;

// Scene name constants
export const SCENE_TITLE     = 'title';
export const SCENE_PLAYING   = 'playing';
export const SCENE_GAME_OVER = 'game-over';

// ─────────────────────────────────────────────
// Canvas setup
// ─────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
canvas.width  = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

// ─────────────────────────────────────────────
// HUD state  (exported so sibling modules can read/write)
// ─────────────────────────────────────────────
export const hudState = {
  score:   STARTING_SCORE,
  lives:   STARTING_LIVES,
  hiScore: 0,
};

// ─────────────────────────────────────────────
// Scene state machine
// ─────────────────────────────────────────────
let currentScene = null;

const scenes = {
  [SCENE_TITLE]: {
    update(_dt) {
      // Title scene has no time-based simulation; input handled via keydown listener
    },
    render(ctx) {
      // Background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Title text
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 64px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

      // Prompt — blink every ~500 ms
      ctx.fillStyle = '#ffffff';
      ctx.font = '28px monospace';
      const blink = Math.floor(Date.now() / 500) % 2 === 0;
      if (blink) {
        ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      }
    },
  },

  [SCENE_PLAYING]: {
    // Stub player rectangle — replaced by the Player card
    get playerX() { return CANVAS_WIDTH / 2 - 25; },
    get playerY() { return CANVAS_HEIGHT - 60; },

    update(_dt) {
      // Stub — entities will be populated by future cards
    },
    render(ctx) {
      // Background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // HUD
      renderHUD(ctx);

      // Stub player rectangle
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(this.playerX, this.playerY, 50, 20);
    },
  },

  [SCENE_GAME_OVER]: {
    update(_dt) {
      // Game Over scene has no time-based simulation
    },
    render(ctx) {
      // Background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // HUD (shows final score)
      renderHUD(ctx);

      // Game Over text
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 72px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);

      // Final score
      ctx.fillStyle = '#ffffff';
      ctx.font = '32px monospace';
      ctx.fillText(`Score: ${hudState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

      // Restart prompt — blink every ~500 ms
      ctx.font = '24px monospace';
      const blink = Math.floor(Date.now() / 500) % 2 === 0;
      if (blink) {
        ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      }
    },
  },
};

/**
 * Transition to a named scene.
 * Resets score and lives when beginning a new game (Title → Playing).
 * @param {string} name  One of SCENE_TITLE | SCENE_PLAYING | SCENE_GAME_OVER
 */
export function switchScene(name) {
  if (!scenes[name]) {
    console.error(`[game] Unknown scene: "${name}"`);
    return;
  }
  console.log(`[game] switchScene: ${currentScene ?? '(none)'} → ${name}`);
  currentScene = name;

  // Reset HUD when a fresh game starts from the Title screen
  if (name === SCENE_PLAYING) {
    hudState.score = STARTING_SCORE;
    hudState.lives = STARTING_LIVES;
  }
}

// ─────────────────────────────────────────────
// HUD renderer  (shared by Playing + Game Over)
// ─────────────────────────────────────────────
function renderHUD(ctx) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px monospace';
  ctx.textBaseline = 'top';

  // Score — left
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${hudState.score}`, 16, 12);

  // Hi-Score — centre
  ctx.textAlign = 'center';
  ctx.fillText(`Hi: ${hudState.hiScore}`, CANVAS_WIDTH / 2, 12);

  // Lives — right
  ctx.textAlign = 'right';
  ctx.fillText(`Lives: ${hudState.lives}`, CANVAS_WIDTH - 16, 12);

  ctx.restore();
}

// ─────────────────────────────────────────────
// Keyboard input — scene transitions only.
// Full keyboard handling is owned by the 'Keyboard input' card (input.js).
// ─────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;

  if (currentScene === SCENE_TITLE) {
    switchScene(SCENE_PLAYING);
  } else if (currentScene === SCENE_GAME_OVER) {
    // Return to Title and reset HUD
    hudState.score = STARTING_SCORE;
    hudState.lives = STARTING_LIVES;
    switchScene(SCENE_TITLE);
  }
});

// ─────────────────────────────────────────────
// Fixed-timestep game loop
// ─────────────────────────────────────────────
let lastTimestamp = null;
let accumulator   = 0;      // ms of unprocessed simulation time
let updateCount   = 0;      // steps fired since last log
let logTimer      = 0;      // wall-clock ms since last log

function loop(timestamp) {
  // Initialise on the very first frame
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Spiral-of-death guard: cap elapsed to MAX_DELTA after a tab has been backgrounded
  if (elapsed > MAX_DELTA) {
    console.log(`[game] Delta capped: ${elapsed.toFixed(1)} ms → ${MAX_DELTA} ms`);
    elapsed = MAX_DELTA;
  }

  accumulator += elapsed;
  logTimer    += elapsed;

  // Fixed-timestep update phase: drain the accumulator in FIXED_DT_MS chunks
  const scene = scenes[currentScene];
  while (accumulator >= FIXED_DT_MS) {
    if (scene) scene.update(FIXED_DT);   // scene.update receives dt in seconds
    accumulator -= FIXED_DT_MS;
    updateCount++;
  }

  // Log update frequency roughly once per second (AC6)
  if (logTimer >= 1000) {
    console.log(`[game] update steps in last ~1 s: ${updateCount}`);
    updateCount = 0;
    logTimer   -= 1000;
  }

  // Render phase (once per animation frame)
  if (scene) scene.render(ctx);

  requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────
switchScene(SCENE_TITLE);
requestAnimationFrame(loop);
