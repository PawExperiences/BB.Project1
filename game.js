// game.js — main ES module: canvas setup, fixed-timestep loop, scene state machine, HUD

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';

// input.js — added by "Keyboard input and the player ship" card
// player.js — added by "Keyboard input and the player ship" card
// invaders.js — added by "Invader grid and movement" card
// collision.js — added by "Collision detection" card
// level1.js — added by "Level 1" card
// level2.js — added by "Level 2" card
// level3.js — added by "Level 3" card
// boss.js — added by "Boss enemy" card

// ---------------------------------------------------------------------------
// HUD state — exported so later ES modules can read/write via live bindings
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
};

// ---------------------------------------------------------------------------
// Canvas and 2-D context
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
canvas.width  = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Fixed-timestep loop constants
// ---------------------------------------------------------------------------
const TIMESTEP   = 1000 / 60;   // ms per update tick  (~16.667 ms)
const MAX_DELTA  = 250;          // ms — cap to avoid spiral of death

// ---------------------------------------------------------------------------
// Scene identifiers
// ---------------------------------------------------------------------------
const SCENE = Object.freeze({
  TITLE:     'title',
  PLAYING:   'playing',
  GAME_OVER: 'gameOver',
});

let currentScene = SCENE.TITLE;

// ---------------------------------------------------------------------------
// Keyboard state
// ---------------------------------------------------------------------------
const keys = {};

document.addEventListener('keydown', (e) => {
  if (!keys[e.code]) {
    keys[e.code] = true;
    handleKeyPressed(e.code);
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// ---------------------------------------------------------------------------
// Scene transitions (ENTER key, no location.reload())
// ---------------------------------------------------------------------------
function handleKeyPressed(code) {
  if (code !== 'Enter') return;

  if (currentScene === SCENE.TITLE) {
    // Reset game state when starting a new game
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    currentScene = SCENE.PLAYING;
  } else if (currentScene === SCENE.GAME_OVER) {
    // Update hi-score before going back to title
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    currentScene = SCENE.TITLE;
  }
  // PLAYING: ENTER is reserved for future use (no transition here)
}

// ---------------------------------------------------------------------------
// HUD rendering helper
// ---------------------------------------------------------------------------
function renderHUD() {
  ctx.save();
  ctx.font = '18px monospace';
  ctx.fillStyle = '#0f0';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${hudState.score}`, 16, 28);
  ctx.textAlign = 'center';
  ctx.fillText(`HI  ${hudState.hiScore}`, CANVAS_WIDTH / 2, 28);
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES  ${hudState.lives}`, CANVAS_WIDTH - 16, 28);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Scene: Title
// ---------------------------------------------------------------------------
const titleScene = {
  update(/* dt */) {
    // Transitions are handled by handleKeyPressed; nothing to update here.
  },
  render() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Title text
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font      = 'bold 56px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    // Prompt
    ctx.font      = '24px monospace';
    ctx.fillStyle = '#0f0';
    // Blink effect based on time
    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    // Hi-score
    ctx.font      = '18px monospace';
    ctx.fillStyle = '#ff0';
    ctx.fillText(`HI-SCORE  ${hudState.hiScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    ctx.restore();
  },
};

// ---------------------------------------------------------------------------
// Scene: Playing  (stub — downstream cards add real logic)
// ---------------------------------------------------------------------------
const playingScene = {
  update(/* dt */) {
    // Placeholder: downstream cards (player.js, invaders.js, etc.) will
    // populate this phase.
    //
    // Temporary: transition to Game Over when score hits 0 is NOT triggered
    // here; future cards will set hudState.lives = 0 and call
    // setScene(SCENE.GAME_OVER) when the game ends.
  },
  render() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // HUD is always rendered during gameplay
    renderHUD();

    // Placeholder visual so the Playing scene is visually distinct
    ctx.save();
    ctx.fillStyle = '#333';
    ctx.font      = '20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('[ Game area — coming soon ]', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.restore();
  },
};

// ---------------------------------------------------------------------------
// Scene: Game Over
// ---------------------------------------------------------------------------
const gameOverScene = {
  update(/* dt */) {
    // Transitions are handled by handleKeyPressed.
  },
  render() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // "GAME OVER" heading
    ctx.fillStyle = '#f00';
    ctx.font      = 'bold 64px monospace';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

    // Final score
    ctx.fillStyle = '#fff';
    ctx.font      = '28px monospace';
    ctx.fillText(`SCORE  ${hudState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    // Prompt (blinking)
    ctx.font      = '22px monospace';
    ctx.fillStyle = '#0f0';
    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    }
    ctx.restore();

    // HUD (shows lives = 0, final score)
    renderHUD();
  },
};

// ---------------------------------------------------------------------------
// Scene router
// ---------------------------------------------------------------------------
const scenes = {
  [SCENE.TITLE]:     titleScene,
  [SCENE.PLAYING]:   playingScene,
  [SCENE.GAME_OVER]: gameOverScene,
};

function getScene() {
  return scenes[currentScene];
}

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// ---------------------------------------------------------------------------
let lastTimestamp = null;
let accumulator   = 0;

function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  // Raw elapsed time since last frame
  let elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Cap the accumulator to prevent spiral-of-death after tab suspension
  if (elapsed > MAX_DELTA) {
    elapsed = MAX_DELTA;
  }

  accumulator += elapsed;

  // Update phase — consume fixed-size timesteps
  const scene = getScene();
  while (accumulator >= TIMESTEP) {
    scene.update(TIMESTEP / 1000); // dt in seconds
    accumulator -= TIMESTEP;
  }

  // Render phase — always once per animation frame
  scene.render();

  requestAnimationFrame(loop);
}

// Kick off the loop
requestAnimationFrame(loop);
