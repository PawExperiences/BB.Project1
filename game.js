// game.js — Main entry point and game loop
// Imports gameConfig constants
import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';

// input.js added by card: "Keyboard input and the player ship"
// player.js added by card: "Keyboard input and the player ship"
// invaders.js added by card: "Level 1: the classic grid"
// collision.js added by card: "Sprite rendering and collision detection"
// level1.js added by card: "Level 1: the classic grid"
// level2.js added by card: "Level 2: they shoot back"
// level3.js added by card: "Level 3: shields and formations"
// boss.js added by card: "Boss level: multi-phase finale"

import { initInput } from './input.js';
import { Player }    from './player.js';
import {
  updateFormation,
  drawFormation,
  invaders,
  score as invaderScore,
  resetFormation,
  addScore,
} from './invaders.js';
import { runCollisions } from './collision.js';
import level1 from './level1.js';
import level2 from './level2.js';

// Initialise keyboard tracking once at startup
initInput();

// ─── HUD State (exported so sibling modules can read/mutate) ─────────────────
export const hudState = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
  level: 1,
  sessionShotCount: 0,
};

// ─── Canvas / Context ────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ─── Player instance (created fresh per run) ─────────────────────────────────
let player = null;

function createPlayer() {
  player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
}

// ─── Invader bullet array ─────────────────────────────────────────────────────
const invaderBullets = [];

// ─── Scene State Machine ─────────────────────────────────────────────────────
// Scenes: 'title' | 'playing' | 'gameover'
let currentScene = 'title';

function transitionTo(scene) {
  currentScene = scene;
}

// Called programmatically (by later cards) when lives reach 0
export function triggerGameOver() {
  if (hudState.score > hudState.hiScore) {
    hudState.hiScore = hudState.score;
  }
  transitionTo('gameover');
}

// ─── Keyboard Input (scene transitions — Enter key) ──────────────────────────
const sceneKeys = {};

window.addEventListener('keydown', (e) => {
  if (!sceneKeys[e.code]) {
    sceneKeys[e.code] = true;
    onKeyPressed(e.code);
  }
});

window.addEventListener('keyup', (e) => {
  sceneKeys[e.code] = false;
});

function onKeyPressed(code) {
  if (code === 'Enter') {
    if (currentScene === 'title') {
      // Reset game state for a fresh run
      hudState.score = 0;
      hudState.lives = STARTING_LIVES;
      hudState.level = 1;
      hudState.sessionShotCount = 0;
      invaderBullets.length = 0;
      resetFormation();
      createPlayer();
      // Initialise level1 with a reference to hudState
      level1.init(hudState);
      transitionTo('playing');
    } else if (currentScene === 'gameover') {
      transitionTo('title');
    }
  }
}

// ─── Track player shots for session shot count ────────────────────────────────
// We patch the player's _handleFire indirectly by checking bullet spawns each tick.
let _prevBulletNull = true;

// ─── Fixed-Timestep Game Loop ─────────────────────────────────────────────────
const UPDATE_RATE = 1 / 60;          // seconds per fixed step (~16.67 ms)
const MAX_DELTA  = 0.25;             // 250 ms cap — prevents burst after tab switch

let lastTimestamp = null;
let accumulator   = 0;

function tick(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  // Wall-clock elapsed in seconds
  let elapsed = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // Delta cap: clamp so a backgrounded tab can't fire dozens of catch-up steps
  if (elapsed > MAX_DELTA) {
    elapsed = MAX_DELTA;
  }

  accumulator += elapsed;

  // Drain accumulator in fixed steps
  while (accumulator >= UPDATE_RATE) {
    update(UPDATE_RATE);
    accumulator -= UPDATE_RATE;
  }

  render();
  requestAnimationFrame(tick);
}

// ─── Update Phase ─────────────────────────────────────────────────────────────
function update(dt) {
  switch (currentScene) {
    case 'title':
      updateTitle(dt);
      break;
    case 'playing':
      updatePlaying(dt);
      break;
    case 'gameover':
      updateGameOver(dt);
      break;
  }
}

function updateTitle(dt) {
  // Future: animate title elements
}

function updatePlaying(dt) {
  // Expose player y for level lose-condition check
  if (player) {
    hudState.playerY = player.y;
  }

  // player.js update
  if (player) {
    // Track session shot count: detect new bullet spawns
    const hadBullet = player.bullet !== null;
    player.update(dt);
    const hasBullet = player.bullet !== null;
    // A shot was fired this tick if bullet went from null → non-null
    if (!hadBullet && hasBullet) {
      hudState.sessionShotCount = (hudState.sessionShotCount || 0) + 1;
    }
    // Sync lives from hudState into player
    player.lives = hudState.lives;
  }

  // Explosion tick (from invaders.js)
  updateFormation(dt);

  if (hudState.level === 1) {
    // level1.js update — handles discrete movement, win/lose conditions
    level1.update(dt, hudState);

    // Handle level transition signalled by level1 (level cleared)
    if (hudState.level === 2) {
      // Advance to level 2 WITHOUT resetting lives
      // Reset formation for fresh grid
      resetFormation();
      invaderBullets.length = 0;
      if (player) {
        player.x = CANVAS_WIDTH / 2;
        player._bullet = null;
      }
      // Initialise level2; lives carry over
      level2.init(hudState, player, invaderBullets);
      // hudState.level is already 2
      // Do NOT transitionTo — still 'playing'
    }

    // Handle level restart triggered by level1 lose condition
    if (level1._restarted) {
      level1._restarted = false;
      resetFormation();
      if (player) {
        player.x = CANVAS_WIDTH / 2;
        player._bullet = null;
      }
    }
  } else if (hudState.level === 2) {
    // level2.js update
    level2.update(dt, hudState);

    // Handle level transition signalled by level2 (level cleared)
    if (hudState.level === 3) {
      // Level 3 not yet implemented; treat as session end → title
      if (hudState.score > hudState.hiScore) {
        hudState.hiScore = hudState.score;
      }
      hudState.level = 1;
      transitionTo('title');
    }
  }

  // Handle game-over when lives reach 0
  if (hudState.lives <= 0) {
    triggerGameOver();
    return;
  }

  // collision.js update — BEFORE draw calls
  // For level 2, invader bullet collisions are handled inside level2.update;
  // we still run runCollisions for player-bullet vs invader hits.
  const playerBullets = player && player.bullet ? [player.bullet] : [];
  // Pass empty invaderBullets to runCollisions when in level2 (level2 handles them)
  const bulletArrayForCollision = hudState.level === 2 ? [] : invaderBullets;
  runCollisions(playerBullets, bulletArrayForCollision, invaders, player);
  // If the collision pass deactivated the bullet, sync back to the player
  if (player && player.bullet && playerBullets.length === 0) {
    player._bullet = null;
  }

  // Sync score from invaders module into hudState
  hudState.score = invaderScore;
}

function updateGameOver(dt) {
  // Future: animate game over screen
}

// ─── Render Phase ─────────────────────────────────────────────────────────────
function render() {
  // Clear canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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

// ─── Title Scene ──────────────────────────────────────────────────────────────
function renderTitle() {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#00ff00';
  ctx.font = 'bold 56px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  if (hudState.hiScore > 0) {
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px monospace';
    ctx.fillText('HI-SCORE: ' + hudState.hiScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  }
}

// ─── Playing Scene ────────────────────────────────────────────────────────────
function renderPlaying() {
  // Placeholder: show a dim grid to confirm Playing scene is active
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_WIDTH; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  // invaders.js renders here
  drawFormation(ctx);

  // player.js renders here
  if (player) {
    // In level 2, respect the invulnerability flash
    if (hudState.level === 2) {
      if (level2.playerVisible) {
        player.draw(ctx);
      }
    } else {
      player.draw(ctx);
    }
  }

  // HUD
  renderHUD();

  // Level-specific render (label, UFO, invader bullets, etc.)
  if (hudState.level === 1) {
    level1.render(ctx, hudState);
  } else if (hudState.level === 2) {
    level2.render(ctx, hudState);
  }
}

// ─── Game Over Scene ──────────────────────────────────────────────────────────
function renderGameOver() {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ff0000';
  ctx.font = 'bold 64px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = '32px monospace';
  ctx.fillText('SCORE: ' + hudState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '20px monospace';
  ctx.fillText('HI-SCORE: ' + hudState.hiScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = '28px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);

  renderHUD();
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function renderHUD() {
  const padding = 16;
  ctx.textBaseline = 'top';
  ctx.font = '20px monospace';

  // Score — top left
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SCORE: ' + hudState.score, padding, padding);

  // Hi-Score — top centre
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffff00';
  ctx.fillText('HI: ' + hudState.hiScore, CANVAS_WIDTH / 2, padding);

  // Lives — top right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#00ff00';
  ctx.fillText('LIVES: ' + hudState.lives, CANVAS_WIDTH - padding, padding);
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
requestAnimationFrame(tick);
