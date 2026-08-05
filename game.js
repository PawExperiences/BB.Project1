// game.js — Main module: fixed-timestep loop, scene state machine, HUD
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STARTING_LIVES,
  INVULNERABILITY_DURATION,
  UFO_WIDTH,
  UFO_HEIGHT,
} from './gameConfig.js';
import { drawInvaders, getLivingCount } from './invaders.js';
import { checkBulletInvaderCollisions, aabbOverlap } from './collision.js';
import { Player } from './player.js';
import { initInput } from './input.js';
import { startLevel1, updateLevel1 } from './level1.js';
import { startLevel2, updateLevel2, getInvaderBullets, getUFOState } from './level2.js';

// ---------------------------------------------------------------------------
// Scene identifiers
// ---------------------------------------------------------------------------
export const SCENES = Object.freeze({
  TITLE:     'TITLE',
  PLAYING:   'PLAYING',
  GAME_OVER: 'GAME_OVER',
});

// ---------------------------------------------------------------------------
// HUD state — mutable; sibling modules import and mutate directly
// ---------------------------------------------------------------------------
export const hudState = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
  level:   0,   // updated by startLevel(n); 0 = no active level (title/game-over)
};

// ---------------------------------------------------------------------------
// Internal game state
// ---------------------------------------------------------------------------
let currentScene = SCENES.TITLE;

// Fixed-timestep constants
const UPDATE_STEP     = 1000 / 60;        // ~16.67 ms
const MAX_ACCUMULATOR = UPDATE_STEP * 5;  // ~83 ms — delta cap

let lastTimestamp = null;
let accumulator   = 0;

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------
let player = null;

// Default spawn position (reused for respawn after invader-bullet hits)
const PLAYER_START_X = (CANVAS_WIDTH - 40) / 2; // 40 = SHIP_WIDTH
const PLAYER_START_Y = CANVAS_HEIGHT - 80;

function createPlayer() {
  player = new Player(PLAYER_START_X, PLAYER_START_Y);
}

// ---------------------------------------------------------------------------
// Level dispatcher
// ---------------------------------------------------------------------------

/**
 * Transition to the given level number.
 * Lives and score are preserved across level transitions.
 * Level 1 is fully implemented; Level 2 is implemented here.
 * Levels beyond 2 log a stub message and return to the title screen.
 * @param {number} n
 */
export function startLevel(n) {
  hudState.level = n;

  if (n === 1) {
    startLevel1();
    currentScene = SCENES.PLAYING;

  } else if (n === 2) {
    startLevel2();
    // Keep the existing player (lives carry over); reset position + invulnerability
    if (player) player.resetForLevel(PLAYER_START_X);
    currentScene = SCENES.PLAYING;

  } else {
    // Level not yet implemented — log intent and gracefully return to title
    console.info(
      `startLevel(${n}) called — Level ${n} not yet implemented. Returning to title.`
    );
    if (hudState.score > hudState.hiScore) {
      hudState.hiScore = hudState.score;
    }
    currentScene   = SCENES.TITLE;
    hudState.level = 0;
  }
}

// ---------------------------------------------------------------------------
// Input init
// ---------------------------------------------------------------------------
initInput();

// ---------------------------------------------------------------------------
// Keyboard handling
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleEnterKey();
  // Debug hotkey: G while PLAYING simulates a game-over
  if ((e.key === 'g' || e.key === 'G') && currentScene === SCENES.PLAYING) {
    triggerGameOver();
  }
});

function handleEnterKey() {
  if (currentScene === SCENES.TITLE) {
    // Reset per-round state
    hudState.score = 0;
    hudState.lives = STARTING_LIVES;
    // Fresh player ship
    createPlayer();
    // Start Level 1
    startLevel(1);
  } else if (currentScene === SCENES.GAME_OVER) {
    currentScene   = SCENES.TITLE;
    hudState.level = 0;
  }
}

function triggerGameOver() {
  if (hudState.score > hudState.hiScore) {
    hudState.hiScore = hudState.score;
  }
  currentScene   = SCENES.GAME_OVER;
  hudState.level = 0;
}

// ---------------------------------------------------------------------------
// Build the wrapped bullet array the collision module needs
// ---------------------------------------------------------------------------
function getPlayerBullets() {
  if (!player || !player.bullet) return [];
  const b = player.bullet;
  if (!('active'     in b)) b.active     = true;
  if (!('fromPlayer' in b)) b.fromPlayer = true;
  if (!('width'      in b)) b.width      = 4;
  if (!('height'     in b)) b.height     = 12;
  return [b];
}

// ---------------------------------------------------------------------------
// Level 2: invader-bullet vs player collision (respects invulnerability)
// ---------------------------------------------------------------------------

/**
 * Check each active invader bullet against the player.
 * - Immune (isInvulnerable): bullet deactivates but no life is lost.
 * - Vulnerable: life decremented; if lives reach 0 → game over;
 *   otherwise player respawns at default X with invulnerability window.
 * @param {Array} invBullets
 */
function handleInvaderBulletHit(invBullets) {
  if (!player || !invBullets || invBullets.length === 0) return;

  const playerRect = {
    x: player.x, y: player.y,
    width: player.width, height: player.height,
  };

  for (const bullet of invBullets) {
    if (!bullet.active) continue;

    const bulletRect = {
      x: bullet.x, y: bullet.y,
      width: bullet.width, height: bullet.height,
    };

    if (aabbOverlap(bulletRect, playerRect)) {
      bullet.active = false; // bullet always deactivates on contact

      if (player.isInvulnerable) {
        // Immune — bullet passes through, no life loss
        continue;
      }

      hudState.lives -= 1;

      if (hudState.lives <= 0) {
        triggerGameOver();
        return; // exit early — game is over
      }

      // Respawn at default X and grant temporary immunity
      player.respawn(PLAYER_START_X);
      player.startInvulnerability(INVULNERABILITY_DURATION);
    }
  }
}

// ---------------------------------------------------------------------------
// Update — pure logic, no drawing
// ---------------------------------------------------------------------------
function update(dt) {
  if (currentScene !== SCENES.PLAYING) return;

  // 1. Update player (movement + bullet + invulnerability timer)
  if (player) player.update(dt / 1000);

  // 2. Level-specific logic
  let levelResult = null;
  if (hudState.level === 1 && player) {
    levelResult = updateLevel1(dt, player);
  } else if (hudState.level === 2 && player) {
    levelResult = updateLevel2(dt, player, hudState);
  }

  // 3. Player bullet vs invaders
  const playerBullets = getPlayerBullets();
  checkBulletInvaderCollisions(playerBullets, hudState);

  // Deactivate player bullet visually if the collision pass marked it inactive
  if (player && player.bullet && player.bullet.active === false) {
    player.bullet.y = -9999;
  }

  // 4. Level 2: invader bullets vs player (with invulnerability support)
  if (hudState.level === 2 && player) {
    handleInvaderBulletHit(getInvaderBullets());
  }

  // Guard: a collision above may have triggered game-over mid-tick
  if (currentScene !== SCENES.PLAYING) return;

  // 5. Lose condition: formation reached the player
  if (levelResult === 'lose') {
    hudState.lives -= 1;
    if (hudState.lives <= 0) {
      triggerGameOver();
    } else {
      // Reset the level formation, preserve score + lives
      if (hudState.level === 1) startLevel1();
      else if (hudState.level === 2) startLevel2();
    }
    return;
  }

  // 6. Win condition: all invaders destroyed → advance to next level
  if (getLivingCount() === 0) {
    startLevel(hudState.level + 1);
    return;
  }
}

// ---------------------------------------------------------------------------
// Render — pure drawing, no logic
// ---------------------------------------------------------------------------
function render() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (currentScene) {
    case SCENES.TITLE:     renderTitle();    break;
    case SCENES.PLAYING:   renderPlaying();  break;
    case SCENES.GAME_OVER: renderGameOver(); break;
  }
}

function renderTitle() {
  ctx.fillStyle    = '#fff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 64px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  ctx.font = '28px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

function renderPlaying() {
  renderHUD();
  drawInvaders(ctx);

  // Level-2 extras: invader bullets and UFO
  if (hudState.level === 2) {
    drawInvaderBullets(ctx);
    drawUFO(ctx);
  }

  if (player) player.draw(ctx);
}

function renderGameOver() {
  ctx.fillStyle    = '#fff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 72px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.font = '32px monospace';
  ctx.fillText(`Score: ${hudState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

  ctx.font = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

function renderHUD() {
  const PAD = 16;

  ctx.font         = '20px monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle    = '#fff';

  // Score — top-left
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${hudState.score}`, PAD, PAD);

  // Hi-Score — top-centre
  ctx.textAlign = 'center';
  ctx.fillText(`HI: ${hudState.hiScore}`, CANVAS_WIDTH / 2, PAD);

  // Lives — top-right
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES: ${hudState.lives}`, CANVAS_WIDTH - PAD, PAD);

  // Level — second row, top-left
  ctx.textAlign = 'left';
  ctx.fillText(`LEVEL: ${hudState.level}`, PAD, PAD + 28);
}

/** Draw all active invader bullets (red/orange). */
function drawInvaderBullets(ctx) {
  const bullets = getInvaderBullets();
  ctx.fillStyle = '#f60';
  for (const b of bullets) {
    if (!b.active) continue;
    ctx.fillRect(Math.round(b.x), Math.round(b.y), b.width, b.height);
  }
}

/** Draw the UFO sprite when active. */
function drawUFO(ctx) {
  const state = getUFOState();
  if (!state.active) return;

  const ux = Math.round(state.x);
  const uy = Math.round(state.y);

  // Body
  ctx.fillStyle = '#f0f';
  ctx.fillRect(ux, uy + UFO_HEIGHT / 2, UFO_WIDTH, UFO_HEIGHT / 2);

  // Dome / top half (lighter)
  ctx.fillStyle = '#f8f';
  ctx.fillRect(ux + 8, uy, UFO_WIDTH - 16, UFO_HEIGHT / 2);

  // Port-holes
  ctx.fillStyle = '#000';
  ctx.fillRect(ux + 10, uy + 5, 6, 6);
  ctx.fillRect(ux + UFO_WIDTH / 2 - 3, uy + 5, 6, 6);
  ctx.fillRect(ux + UFO_WIDTH - 16, uy + 5, 6, 6);
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (delta > MAX_ACCUMULATOR) delta = MAX_ACCUMULATOR;

  accumulator += delta;

  while (accumulator >= UPDATE_STEP) {
    update(UPDATE_STEP);
    accumulator -= UPDATE_STEP;
  }

  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
