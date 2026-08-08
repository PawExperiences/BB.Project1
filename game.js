// game.js — main ES module: game loop, scene state machine, HUD

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput, isKeyHeld } from './input.js';
import { Player } from './player.js';
import { initInvaders, updateInvaders, drawInvaders, invaders, registerExplosion } from './invaders.js';
import { checkBulletVsInvaders, checkInvaderBulletsVsPlayer } from './collision.js';
import { start as startLevel1, stop as stopLevel1, notifyKill as level1NotifyKill } from './level1.js';
import {
  start as startLevel2,
  stop  as stopLevel2,
  notifyKill as level2NotifyKill,
  getEnemyBullets,
  playerIsInvulnerable,
  playerFlashVisible,
  notifyEnemyBulletHit,
  tryShootUfo,
  update as level2Update,
  draw   as level2Draw,
} from './level2.js';
// TODO: import added by card "Level 3" (level3.js)
// TODO: import added by card "Boss encounter" (boss.js)

// ---------------------------------------------------------------------------
// Named constants for score
// ---------------------------------------------------------------------------
const SCORE_PER_KILL = 10;

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// HUD state — exported so later modules can import and mutate directly.
// hudState.set(key, value) stores extra display fields (e.g. 'level').
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
  _extra:  {},   // keyed storage for set() calls

  /**
   * set(key, value)
   * Stores an arbitrary HUD field.  level1.js (and future level modules)
   * call hud.set('level', 1) to display the current level number.
   */
  set(key, value) {
    this._extra[key] = value;
  },

  /**
   * get(key)
   * Retrieve a previously set field, or undefined.
   */
  get(key) {
    return this._extra[key];
  },
};

// ---------------------------------------------------------------------------
// Session shot count — cumulative across all levels, never reset
// ---------------------------------------------------------------------------
let sessionShotCount = 0;

function getSessionShotCount() {
  return sessionShotCount;
}

// ---------------------------------------------------------------------------
// Active level tracker
// ---------------------------------------------------------------------------
let activeLevel = 0;   // 0 = none, 1 = level1, 2 = level2

// ---------------------------------------------------------------------------
// Player instance (created fresh on transition to 'playing')
// ---------------------------------------------------------------------------
let player = null;

// Track previous bullet state to detect new shots
let _prevBulletNull = true;

// ---------------------------------------------------------------------------
// Scene state machine
// Scenes: 'title' | 'playing' | 'gameover'
// ---------------------------------------------------------------------------
let currentScene = 'title';

function transitionTo(scene) {
  if (scene === 'playing') {
    // Reset per-round state
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    hudState._extra = {};
    sessionShotCount = 0;  // reset session shot count at new game start
    player = new Player();
    _prevBulletNull = true;
    initInvaders();
    activeLevel = 1;
    // Start Level 1 march loop
    startLevel1(ctx, hudState);
  }
  if (scene === 'title') {
    // Stop any active level loop
    _stopActiveLevel();
    activeLevel = 0;
    // Update hi-score when returning to title
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
  }
  if (scene === 'gameover') {
    // Stop any active level loop
    _stopActiveLevel();
    activeLevel = 0;
    // Persist hi-score
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
  }
  currentScene = scene;
}

/** Stop whichever level module is currently running. */
function _stopActiveLevel() {
  if (activeLevel === 1) stopLevel1();
  if (activeLevel === 2) stopLevel2();
}

// ---------------------------------------------------------------------------
// Listen for levelComplete event dispatched by level modules
// ---------------------------------------------------------------------------
window.addEventListener('levelComplete', (e) => {
  console.log('levelComplete received, nextLevel:', e.detail.nextLevel);
  const next = e.detail.nextLevel;

  if (next === 2) {
    // Transition from Level 1 to Level 2
    // Do NOT reset lives or score — carry them over
    stopLevel1();
    activeLevel = 2;
    hudState._extra = {};
    // Re-init invaders for Level 2's fresh grid
    initInvaders();
    // Start Level 2 — pass live player reference getter
    startLevel2(ctx, hudState, () => player, getSessionShotCount);
  } else if (next === 3) {
    // Level 3 not yet implemented — return to title
    // (Level 3 card will replace this branch)
    stopLevel2();
    activeLevel = 0;
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    transitionTo('title');
  } else {
    // Fallback
    transitionTo('title');
  }
});

// ---------------------------------------------------------------------------
// Initialise input
// ---------------------------------------------------------------------------
initInput();

// ---------------------------------------------------------------------------
// Keyboard input (scene transitions)
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;

  if (currentScene === 'title') {
    transitionTo('playing');
  } else if (currentScene === 'gameover') {
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    transitionTo('title');
  } else if (currentScene === 'playing') {
    // Allow Enter during Playing to simulate Game Over for manual testing
    transitionTo('gameover');
  }
});

// ---------------------------------------------------------------------------
// Fixed-timestep loop constants
// ---------------------------------------------------------------------------
const UPDATE_STEP = 1 / 60;   // seconds per logic tick (~16.67 ms)
const MAX_DELTA   = 0.25;     // delta cap: 250 ms

let lastTimestamp = null;
let accumulator   = 0;

// ---------------------------------------------------------------------------
// Collision pass
// Runs BEFORE update/draw each tick.
// ---------------------------------------------------------------------------
function runCollisions() {
  if (!player) return;

  // Convert player.bullet to the active-flag contract expected by collision.js
  if (player.bullet !== null) {
    // Ensure the bullet has an `active` flag; add it lazily if missing
    if (player.bullet.active === undefined) {
      player.bullet.active = true;
    }

    if (player.bullet.active) {
      checkBulletVsInvaders(player.bullet, invaders, (killedInvader) => {
        hudState.score += SCORE_PER_KILL;
        registerExplosion(killedInvader.x, killedInvader.y);
        // Notify the active level so march interval recalculates immediately
        if (activeLevel === 1) level1NotifyKill();
        if (activeLevel === 2) level2NotifyKill();
      });
    }

    // If bullet was consumed by collision, null it out on the player
    if (!player.bullet.active) {
      player.bullet = null;
    }
  }

  // Level 2: check player bullet vs UFO
  if (activeLevel === 2 && player.bullet !== null && player.bullet.active) {
    const BULLET_W = 4;
    const BULLET_H = 12;
    const bRect = {
      x: player.bullet.x - BULLET_W / 2,
      y: player.bullet.y,
      w: BULLET_W,
      h: BULLET_H,
    };
    const ufoScore = tryShootUfo(bRect, sessionShotCount);
    if (ufoScore > 0) {
      hudState.score += ufoScore;
      player.bullet.active = false;
      player.bullet = null;
    }
  }

  // Level 2: invader bullets vs player
  if (activeLevel === 2) {
    const enemyBullets = getEnemyBullets();
    if (!playerIsInvulnerable()) {
      checkInvaderBulletsVsPlayer(enemyBullets, player, () => {
        notifyEnemyBulletHit();
      });
    }
  } else {
    // Level 1 stub — empty array
    checkInvaderBulletsVsPlayer([], player, () => {});
  }

  // Breach / game-over check
  if (hudState.lives <= 0 && currentScene === 'playing') {
    transitionTo('gameover');
  }
}

// ---------------------------------------------------------------------------
// update(dt) — advance game logic by exactly one fixed step
// dt is always UPDATE_STEP (seconds)
// ---------------------------------------------------------------------------
function update(dt) {
  if (currentScene !== 'playing') return;

  // Track whether a new bullet was just fired this tick
  const bulletWasNull = (player.bullet === null);

  // Shoot flag: ensure new bullets start with active=true
  if (player.bullet !== null && player.bullet.active === undefined) {
    player.bullet.active = true;
  }

  player.update(dt);

  // Re-stamp active flag after player.update (player.update may create a new bullet)
  if (player.bullet !== null && player.bullet.active === undefined) {
    player.bullet.active = true;
  }

  // If bullet was null before and non-null after, a new shot was fired
  if (bulletWasNull && player.bullet !== null) {
    sessionShotCount++;
  }

  updateInvaders(dt);

  // Level 2 per-frame update (enemy bullets, UFO, invulnerability)
  if (activeLevel === 2) {
    level2Update(dt);
  }
}

// ---------------------------------------------------------------------------
// render() — draw the current frame (called once per rAF tick)
// ---------------------------------------------------------------------------
function render() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (currentScene === 'title') {
    renderTitle();
  } else if (currentScene === 'playing') {
    renderPlaying();
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

  ctx.fillStyle = '#00ff00';
  ctx.font      = 'bold 56px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  ctx.fillStyle = '#aaaaaa';
  ctx.font      = '22px monospace';
  ctx.fillText('HI-SCORE: ' + hudState.hiScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
}

function renderPlaying() {
  // Order: invaders (back) → level2 elements → player (front) → HUD (always on top)
  drawInvaders(ctx);

  // Level 2 elements (enemy bullets, UFO)
  if (activeLevel === 2) {
    level2Draw(ctx);
  }

  // Draw player — skip during flash-off frames in Level 2 invulnerability
  if (player) {
    const shouldDraw = (activeLevel !== 2) || playerFlashVisible();
    if (shouldDraw) {
      player.draw(ctx);
    }
  }

  renderHUD();
}

function renderHUD() {
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle    = '#ffffff';
  ctx.font         = '20px monospace';
  ctx.fillText('SCORE: ' + hudState.score, 12, 12);

  ctx.textAlign = 'right';
  ctx.fillText('LIVES: ' + hudState.lives, CANVAS_WIDTH - 12, 12);

  // Display current level if set
  const level = hudState.get('level');
  if (level !== undefined) {
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('LEVEL: ' + level, CANVAS_WIDTH / 2, 12);
  }
}

function renderGameOver() {
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ff4444';
  ctx.font      = 'bold 64px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '32px monospace';
  ctx.fillText('SCORE: ' + hudState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.fillStyle = '#aaaaaa';
  ctx.font      = '22px monospace';
  ctx.fillText('HI-SCORE: ' + hudState.hiScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
}

// ---------------------------------------------------------------------------
// Main rAF loop  —  order per spec: collide → update → draw
// ---------------------------------------------------------------------------
function gameLoop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (delta > MAX_DELTA) delta = MAX_DELTA;

  accumulator += delta;

  while (accumulator >= UPDATE_STEP) {
    runCollisions();         // 1. collision pass
    update(UPDATE_STEP);     // 2. update positions
    accumulator -= UPDATE_STEP;
  }

  render();                  // 3. draw

  requestAnimationFrame(gameLoop);
}

// Kick off the loop
requestAnimationFrame(gameLoop);
