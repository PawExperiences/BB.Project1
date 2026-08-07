// game.js — main ES module: canvas setup, fixed-timestep loop, scene state machine, HUD

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';
import { CollisionSystem } from './collision.js';
import { Level1 } from './level1.js';
import { Level2 } from './level2.js';
import { state } from './state.js';

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
// Initialise input (once at startup)
// ---------------------------------------------------------------------------
iniInput();

function iniInput() {
  initInput();
}

// ---------------------------------------------------------------------------
// Level number tracking
// ---------------------------------------------------------------------------
let currentLevelNum = 1; // 1 or 2

// ---------------------------------------------------------------------------
// Game entities — constructed / reconstructed per new game
// ---------------------------------------------------------------------------
let player          = null;
let currentLevel    = null; // Level1 or Level2 instance
let collisionSystem = null;

// ---------------------------------------------------------------------------
// Game controller object passed into levels
// ---------------------------------------------------------------------------
const gameController = {
  nextLevel() {
    if (currentLevelNum === 1) {
      currentLevelNum = 2;
      // Save lives into shared state before constructing Level 2
      state.lives = player.lives;
      currentLevel = new Level2({
        ctx,
        player,
        hud: null,
        game: gameController,
      });
      // Reset collision system for the new level (score accumulates)
      // Keep score — do not reset collisionSystem score
      // We manage score via hudState.score directly in Level 2
    } else {
      // Level 2 cleared — game is won; show title or game over
      // For now transition to title scene as a "win"
      if (hudState.score > hudState.hiScore) {
        hudState.hiScore = hudState.score;
      }
      currentScene = SCENE.TITLE;
    }
  },
  gameOver() {
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    currentScene = SCENE.GAME_OVER;
  },
};

// ---------------------------------------------------------------------------
// Helper: start a fresh game
// ---------------------------------------------------------------------------
function startNewGame() {
  // Reset shared state
  state.sessionShotCount = 0;
  state.lives = STARTING_LIVES;

  // Reset HUD
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;

  // Reset level number
  currentLevelNum = 1;

  // Create fresh player (lives come from shared state / config)
  player = new Player(CANVAS_HEIGHT);
  player.lives = STARTING_LIVES;

  // Create collision system
  collisionSystem = new CollisionSystem();

  // Create Level 1
  currentLevel = new Level1({
    ctx,
    player,
    hud: null,
    game: gameController,
  });

  currentScene = SCENE.PLAYING;
}

// ---------------------------------------------------------------------------
// Keyboard state (for scene transitions — ENTER key)
// Game-play keys are handled by input.js / player.js
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
    startNewGame();
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
// Build bullet descriptor array for the collision system.
// Wraps the player's single-bullet mechanic into the array interface.
// ---------------------------------------------------------------------------
function getPlayerBulletDescriptors() {
  const bullet = player ? player.bullet : null;
  if (bullet === null) return [];

  // Bullet dimensions match those in player.js
  const BULLET_WIDTH  = 4;
  const BULLET_HEIGHT = 10;

  return [{
    getBounds() {
      return {
        x:      bullet.x - BULLET_WIDTH / 2,
        y:      bullet.y,
        width:  BULLET_WIDTH,
        height: BULLET_HEIGHT,
      };
    },
    remove() {
      player.clearBullet();
    },
    removed: false,
  }];
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
// Scene: Playing
// ---------------------------------------------------------------------------
const playingScene = {
  update(dt) {
    if (!currentLevel || !player) return;

    // ---- Player update (movement + shooting) ----
    player.update(dt);

    // ---- Build bullet descriptors for this tick ----
    const bulletDescs = getPlayerBulletDescriptors();

    // ---- Level 1: use CollisionSystem for player-bullet vs invader ----
    if (currentLevelNum === 1) {
      // Collision pass: player bullets vs invaders
      collisionSystem.update(
        bulletDescs,
        currentLevel.getInvaders(),
        [], // no invader bullets in Level 1
        player,
      );

      // Sync score from collision system
      hudState.score = collisionSystem.getScore();

      // Level 1 update (movement, breach, completion)
      currentLevel.update(dt);

    } else {
      // ---- Level 2: collision handled inside level (for invader bullets) ----
      // Player bullet vs invaders via CollisionSystem
      collisionSystem.update(
        bulletDescs,
        currentLevel.getInvaders(),
        [], // Level 2 handles invader-bullet-vs-player internally
        player,
      );

      // Base score from invader kills
      hudState.score = collisionSystem.getScore();

      // Level 2 update — also returns scoreGained (UFO) and gameOver flag
      const result = currentLevel.update(dt, bulletDescs, (n) => { hudState.score += n; });

      // Apply UFO score
      if (result && result.scoreGained > 0) {
        hudState.score += result.scoreGained;
      }

      // Handle game over
      if (result && result.gameOver) {
        gameController.gameOver();
        return;
      }
    }

    // Sync lives into HUD
    hudState.lives = player.lives;

    // Sync lives into shared state
    state.lives = player.lives;
  },

  render() {
    if (!currentLevel || !player) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // HUD is always rendered during gameplay
    renderHUD();

    // Draw level (invaders, UFO, invader bullets, level label)
    currentLevel.draw();

    // Draw the player ship and bullet
    player.draw(ctx);

    // Draw explosion effects (on top of everything)
    collisionSystem.draw(ctx);
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
