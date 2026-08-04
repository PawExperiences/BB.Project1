// ─────────────────────────────────────────────
// Named constants
// ─────────────────────────────────────────────
export const CANVAS_WIDTH   = 800;
export const CANVAS_HEIGHT  = 600;
export const TARGET_FPS     = 60;
export const FIXED_DT       = 1000 / TARGET_FPS;   // ms per simulation step (~16.67 ms)
export const MAX_DELTA      = 200;                  // cap to avoid spiral-of-death (ms)

export const SCENE_TITLE     = 'title';
export const SCENE_PLAYING   = 'playing';
export const SCENE_GAME_OVER = 'game-over';

// Starting values
const STARTING_LIVES = 3;
const STARTING_SCORE = 0;

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
      // Title scene has no time-based simulation; input handled below
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

      // Prompt
      ctx.fillStyle = '#ffffff';
      ctx.font = '28px monospace';
      // Blink every ~800 ms
      const blink = Math.floor(Date.now() / 500) % 2 === 0;
      if (blink) {
        ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      }
    },
  },

  [SCENE_PLAYING]: {
    // Stub player rect
    playerX: CANVAS_WIDTH / 2 - 25,
    playerY: CANVAS_HEIGHT - 60,

    update(_dt) {
      // Stub — entities will be added by future tasks
    },
    render(ctx) {
      // Background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Stub player
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(this.playerX, this.playerY, 50, 20);

      // HUD
      renderHUD(ctx);
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

      // Prompt
      ctx.font = '24px monospace';
      const blink = Math.floor(Date.now() / 500) % 2 === 0;
      if (blink) {
        ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      }
    },
  },
};

/**
 * Transition to a named scene, resetting HUD if restarting.
 * @param {string} name  One of the SCENE_* constants
 */
export function switchScene(name) {
  if (!scenes[name]) {
    console.error(`[game] Unknown scene: "${name}"`);
    return;
  }
  console.log(`[game] switchScene: ${currentScene ?? '(none)'} → ${name}`);
  currentScene = name;

  // Reset HUD when a fresh game starts
  if (name === SCENE_PLAYING) {
    hudState.score = STARTING_SCORE;
    hudState.lives = STARTING_LIVES;
  }
}

// ─────────────────────────────────────────────
// HUD renderer (shared by Playing + Game Over)
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
// Keyboard input (scoped to scene transitions only;
// full keyboard module is a separate task)
// ─────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;

  if (currentScene === SCENE_TITLE) {
    switchScene(SCENE_PLAYING);
  } else if (currentScene === SCENE_GAME_OVER) {
    switchScene(SCENE_TITLE);
  }
});

// ─────────────────────────────────────────────
// Fixed-timestep game loop
// ─────────────────────────────────────────────
let lastTimestamp  = null;
let accumulator    = 0;
let updateCount    = 0;   // used for ~60 Hz logging
let logTimer       = 0;   // accumulates wall-clock ms for logging

function loop(timestamp) {
  // Initialise on first frame
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // AC7: cap delta to prevent spiral-of-death after tab blur/focus
  if (elapsed > MAX_DELTA) {
    console.log(`[game] Delta capped: ${elapsed.toFixed(1)} ms → ${MAX_DELTA} ms`);
    elapsed = MAX_DELTA;
  }

  accumulator += elapsed;
  logTimer    += elapsed;

  // Fixed-timestep update phase
  const scene = scenes[currentScene];
  while (accumulator >= FIXED_DT) {
    if (scene) scene.update(FIXED_DT);
    accumulator -= FIXED_DT;
    updateCount++;
  }

  // AC6: log update frequency roughly once per second
  if (logTimer >= 1000) {
    console.log(`[game] update steps in last ~1 s: ${updateCount}`);
    updateCount = 0;
    logTimer   -= 1000;
  }

  // Render phase
  if (scene) scene.render(ctx);

  requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────
switchScene(SCENE_TITLE);
requestAnimationFrame(loop);
