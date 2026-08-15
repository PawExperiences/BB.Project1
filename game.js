import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';

// --- Canvas setup -----------------------------------------------------

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

// --- HUD state ----------------------------------------------------------
// Exported so later cards (player/invaders/collision/levels/boss) can read
// and mutate score/lives/hiScore directly as gameplay happens.

export const hud = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
};

// --- Scene state machine -------------------------------------------------

export const SCENES = Object.freeze({
  TITLE: 'Title',
  PLAYING: 'Playing',
  GAME_OVER: 'GameOver',
});

let scene = SCENES.TITLE;

initInput();
const player = new Player();

function goToPlaying() {
  hud.score = 0;
  hud.lives = STARTING_LIVES;
  scene = SCENES.PLAYING;
}

// Exposed for future cards (e.g. collision.js) to call once lives reach 0.
// This card only wires the transition itself, not the condition that
// triggers it.
export function triggerGameOver() {
  hud.hiScore = Math.max(hud.hiScore, hud.score);
  scene = SCENES.GAME_OVER;
}

function goToTitle() {
  hud.score = 0;
  hud.lives = STARTING_LIVES;
  scene = SCENES.TITLE;
}

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;

  if (scene === SCENES.TITLE) {
    goToPlaying();
  } else if (scene === SCENES.GAME_OVER) {
    goToTitle();
  }
});

// --- Fixed-timestep loop (accumulator pattern) ---------------------------

const FIXED_STEP = 1 / 60; // seconds per update() call
const MAX_FRAME_DELTA = 0.25; // clamp so a backgrounded-tab resume can't spiral

let accumulator = 0;
let lastTimestamp = null;

function update(dt) {
  switch (scene) {
    case SCENES.TITLE:
      // No gameplay update logic on the title screen.
      break;
    case SCENES.PLAYING:
      player.update(dt);
      // Invader formation/movement: owned by the "Invaders" card (invaders.js)
      // Collision detection (bullets/invaders/player): owned by the "Collision" card (collision.js)
      // Level content/progression: owned by the level1.js / level2.js / level3.js cards
      // Boss encounter: owned by the "Boss" card (boss.js)
      break;
    case SCENES.GAME_OVER:
      // No gameplay update logic on the game-over screen.
      break;
  }
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  switch (scene) {
    case SCENES.TITLE:
      renderTitle();
      break;
    case SCENES.PLAYING:
      renderPlaying();
      break;
    case SCENES.GAME_OVER:
      renderGameOver();
      break;
  }
}

function renderTitle() {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';

  ctx.font = '48px monospace';
  ctx.fillText('SPACE INVADERS', canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = '20px monospace';
  ctx.fillText('Press ENTER to start', canvas.width / 2, canvas.height / 2 + 30);
}

function renderPlaying() {
  // Gameplay visuals (invaders, ...) are drawn by the sibling cards listed
  // in update(). This card draws the player ship/bullet and the HUD.
  player.draw(ctx);
  renderHud();
}

function renderGameOver() {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';

  ctx.font = '48px monospace';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

  ctx.font = '24px monospace';
  ctx.fillText(`Score: ${hud.score}`, canvas.width / 2, canvas.height / 2 + 10);

  ctx.font = '20px monospace';
  ctx.fillText('Press ENTER to restart', canvas.width / 2, canvas.height / 2 + 50);
}

function renderHud() {
  ctx.fillStyle = '#fff';
  ctx.font = '18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${hud.score}`, 16, 28);
  ctx.fillText(`Hi-Score: ${hud.hiScore}`, 16, 50);

  ctx.textAlign = 'right';
  ctx.fillText(`Lives: ${hud.lives}`, canvas.width - 16, 28);
}

function frame(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (delta > MAX_FRAME_DELTA) {
    delta = MAX_FRAME_DELTA;
  }

  accumulator += delta;

  while (accumulator >= FIXED_STEP) {
    update(FIXED_STEP);
    accumulator -= FIXED_STEP;
  }

  render();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
