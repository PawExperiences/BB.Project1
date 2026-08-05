// game.js — Game loop, scene state machine, and HUD

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Player, SHIP_WIDTH, SHIP_HEIGHT } from './player.js';
import { initInvaders, getInvaders, updateInvaders, renderInvaders } from './invaders.js';
import { initExplosions, triggerExplosion, updateExplosions, renderExplosions } from './explosion.js';
import { collideBulletsWithInvaders, collideEnemyBulletsWithPlayer } from './collision.js';

// ---------------------------------------------------------------------------
// HUD STATE — exported so later cards can import and mutate directly
// ---------------------------------------------------------------------------
export const hudState = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
  level: 0,
};

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width  = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ---------------------------------------------------------------------------
// Game-object instances (created fresh on enterPlaying)
// ---------------------------------------------------------------------------
export let player = null;

// Enemy bullets — empty array until Level 2 wires in shooting
let enemyBullets = [];

// ---------------------------------------------------------------------------
// Input initialisation
// ---------------------------------------------------------------------------
initInput();

// ---------------------------------------------------------------------------
// Level registry — levels register their update/render hooks here
// ---------------------------------------------------------------------------
let registeredLevel = null;

/**
 * registerLevel({ update, render })
 * Called by a level module to hook into the game loop.
 * Only one level is active at a time.
 */
export function registerLevel(hooks) {
  registeredLevel = hooks;
}

/**
 * transitionTo(levelId)
 * Transitions to the named level or scene.
 * Currently supports: 'level1', 'level2', 'level3', 'level4', 'gameover'
 */
export function transitionTo(levelId) {
  if (levelId === 'level4') {
    registeredLevel = null;
    hudState.level = 4;
    // Re-initialise player and core systems so boss level starts clean
    player = new Player();
    enemyBullets = [];
    initExplosions();
    import('./boss.js').catch(() => {
      enterGameOver();
    });
    return;
  }
  if (levelId === 'level3') {
    registeredLevel = null;
    hudState.level = 3;
    // Re-initialise player and core systems so level3 starts clean
    player = new Player();
    enemyBullets = [];
    initExplosions();
    import('./level3.js').catch(() => {
      enterGameOver();
    });
    return;
  }
  if (levelId === 'level2') {
    registeredLevel = null;
    hudState.level = 2;
    import('./level2.js').catch(() => {
      enterGameOver();
    });
    return;
  }
  if (levelId === 'level1') {
    registeredLevel = null;
    hudState.level = 1;
    // Re-initialise player and core systems so level1 starts clean
    player = new Player();
    enemyBullets = [];
    initExplosions();
    import('./level1.js').catch(() => {
      console.warn('level1.js not found');
    });
    return;
  }
  if (levelId === 'gameover') {
    enterGameOver();
    return;
  }
}

// ---------------------------------------------------------------------------
// Scene state machine
// Scenes: 'title' | 'playing' | 'gameover'
// ---------------------------------------------------------------------------
let currentScene = 'title';

function enterTitle() {
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;
  hudState.level = 0;
  currentScene   = 'title';
  player = null;
  registeredLevel = null;
}

function enterPlaying() {
  currentScene = 'playing';
  player = new Player();
  enemyBullets = [];
  initInvaders();
  initExplosions();
  // Load level 1
  hudState.level = 1;
  registeredLevel = null;
  import('./level1.js').catch((err) => {
    console.warn('level1.js not found:', err);
  });
}

export function enterGameOver() {
  if (hudState.score > hudState.hiScore) {
    hudState.hiScore = hudState.score;
  }
  currentScene = 'gameover';
  registeredLevel = null;
}

// Expose transition helpers so later cards can trigger Game Over
export { enterTitle, enterPlaying };

// Export canvas context for level modules
export { ctx, canvas };

// ---------------------------------------------------------------------------
// Keyboard input — ENTER key drives scene transitions
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Enter') return;

  if (currentScene === 'title') {
    enterPlaying();
  } else if (currentScene === 'gameover') {
    enterTitle();
  }
  // ENTER has no effect during 'playing' (levels handle their own Enter)
});

// ---------------------------------------------------------------------------
// Fixed-timestep game loop
// Step size: 1000/60 ms  (~16.667 ms)
// Delta cap : 250 ms  (prevents catch-up burst after tab background)
// ---------------------------------------------------------------------------
const STEP_MS  = 1000 / 60;   // fixed update interval in milliseconds
const CAP_MS   = 250;         // maximum accumulated delta

let lastTimestamp = null;
let accumulator   = 0;

// ---------------------------------------------------------------------------
// UPDATE — game logic, one fixed tick
// ---------------------------------------------------------------------------
function update(dt) {
  if (currentScene !== 'playing') return;

  // Player movement and bullet travel
  if (player) player.update(dt);

  // If a level is registered, let it update
  if (registeredLevel && registeredLevel.update) {
    registeredLevel.update(dt);
  } else {
    // Legacy: use the old invaders module directly (no level registered)
    updateInvaders();
  }

  // Explosion countdown
  updateExplosions();
}

// ---------------------------------------------------------------------------
// COLLIDE — AABB pass, runs between update and render every frame
// ---------------------------------------------------------------------------
function collide() {
  if (currentScene !== 'playing') return;
  if (!player) return;

  // If a level is registered, it handles its own collisions internally
  if (!registeredLevel) {
    const invaders = getInvaders();

    // Player bullet vs invaders
    collideBulletsWithInvaders(
      player,
      invaders,
      triggerExplosion,
      () => { hudState.score += 10; }
    );
  }

  // Enemy bullets vs player (stub — no enemy bullets until Level 2)
  collideEnemyBulletsWithPlayer(enemyBullets, player);
}

// ---------------------------------------------------------------------------
// RENDER — draw the current frame
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

  renderHUD();
}

function renderPlaying() {
  if (registeredLevel && registeredLevel.render) {
    // Level handles its own rendering
    registeredLevel.render(ctx);
  } else {
    // Legacy: use the old invaders module directly
    renderInvaders(ctx);
  }

  // Explosions (drawn over invaders, under player)
  renderExplosions(ctx);

  // Player ship and bullet
  if (player) player.draw(ctx);
}

// ---------------------------------------------------------------------------
// Main loop — update → collide → render order is enforced here
// ---------------------------------------------------------------------------
function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (elapsed > CAP_MS) {
    elapsed = CAP_MS;
  }

  accumulator += elapsed;

  // Fixed-timestep: update + collide run together per tick
  while (accumulator >= STEP_MS) {
    update(STEP_MS / 1000);
    collide();                  // collision pass between update and render
    accumulator -= STEP_MS;
  }

  // Render once per animation frame (after all ticks)
  render();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// ---------------------------------------------------------------------------
// Scene renderers
// ---------------------------------------------------------------------------
function renderTitle() {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 56px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

  ctx.font = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function renderGameOver() {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 56px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.font = '32px monospace';
  ctx.fillText(`Score: ${hudState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

  ctx.font = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

// ---------------------------------------------------------------------------
// HUD renderer — score (top-left), hi-score (top-centre), lives (top-right)
// Level number displayed bottom-left during play
// ---------------------------------------------------------------------------
function renderHUD() {
  const PAD = 16;

  ctx.font         = '20px monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle    = '#0f0';

  // Score — top-left
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${hudState.score}`, PAD, PAD);

  // Hi-Score — top-centre
  ctx.textAlign = 'center';
  ctx.fillText(`HI: ${hudState.hiScore}`, CANVAS_WIDTH / 2, PAD);

  // Lives — top-right
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES: ${hudState.lives}`, CANVAS_WIDTH - PAD, PAD);

  // Level number — shown during playing scene
  if (currentScene === 'playing' && hudState.level > 0) {
    ctx.textAlign = 'left';
    ctx.fillText(`LEVEL: ${hudState.level}`, PAD, PAD + 28);
  }
}
