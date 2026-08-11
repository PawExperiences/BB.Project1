// game.js
// Fixed-timestep game loop + Title/Playing/Game Over scene machine.
// This card only lays the framework: gameplay (player, invaders, collisions,
// levels, boss) is added by later cards -- see README.md for the planned layout.

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STARTING_LIVES,
} from './gameConfig.js';

// Named export so sibling cards (input/player, collision, levels, boss) can
// read and mutate the HUD as gameplay happens.
export const hud = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
};

const SCENES = {
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
};

let scene = SCENES.TITLE;

const canvas = document.getElementById('game-canvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

function startGame() {
  hud.score = 0;
  hud.lives = STARTING_LIVES;
  scene = SCENES.PLAYING;
}

function endGame() {
  if (hud.score > hud.hiScore) {
    hud.hiScore = hud.score;
  }
  scene = SCENES.GAME_OVER;
}

function returnToTitle() {
  hud.score = 0;
  hud.lives = STARTING_LIVES;
  scene = SCENES.TITLE;
}

// All scene transitions are driven exclusively by ENTER -- no other input,
// no page reload/navigation. Once collision.js (future card) can detect the
// player losing their last life during Playing, it will drive the Playing ->
// Game Over transition itself instead of ENTER.
window.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;

  if (scene === SCENES.TITLE) {
    startGame();
  } else if (scene === SCENES.PLAYING) {
    endGame();
  } else if (scene === SCENES.GAME_OVER) {
    returnToTitle();
  }
});

function update(dt) {
  // input.js / player.js (future card): read input and move the player here.
  // invaders.js, level1.js/level2.js/level3.js (future cards): spawn and advance enemy waves here.
  // boss.js (future card): update the boss encounter here.
  // collision.js (future card): detect hits, update hud.score/hud.lives here.
}

function drawBackground() {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCenteredText(text, y, font, color = '#ffffff') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, y);
}

function drawHUD() {
  ctx.font = '20px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'top';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${hud.score}`, 16, 16);

  ctx.textAlign = 'center';
  ctx.fillText(`HI-SCORE ${hud.hiScore}`, canvas.width / 2, 16);

  ctx.textAlign = 'right';
  ctx.fillText(`LIVES ${hud.lives}`, canvas.width - 16, 16);
}

function renderTitle() {
  drawCenteredText('SPACE INVADERS', canvas.height / 2 - 20, 'bold 40px monospace');
  drawCenteredText('Press ENTER to start', canvas.height / 2 + 30, '20px monospace', '#aaaaaa');
}

function renderPlaying() {
  drawHUD();
  // player.js, invaders.js, level1.js/level2.js/level3.js, boss.js (future
  // cards): render the playfield (player, enemies, bullets) here.
}

function renderGameOver() {
  drawCenteredText('GAME OVER', canvas.height / 2 - 60, 'bold 40px monospace');
  drawCenteredText(`Final Score: ${hud.score}`, canvas.height / 2, '24px monospace');
  drawCenteredText('Press ENTER to restart', canvas.height / 2 + 50, '20px monospace', '#aaaaaa');
}

function render() {
  drawBackground();

  if (scene === SCENES.TITLE) {
    renderTitle();
  } else if (scene === SCENES.PLAYING) {
    renderPlaying();
  } else if (scene === SCENES.GAME_OVER) {
    renderGameOver();
  }
}

const FIXED_STEP = 1 / 60;
const MAX_ACCUMULATED_TIME = FIXED_STEP * 5; // bound catch-up after e.g. a backgrounded tab

let lastTime = performance.now();
let accumulator = 0;

function frame(now) {
  requestAnimationFrame(frame);

  let frameTime = (now - lastTime) / 1000;
  lastTime = now;
  if (frameTime > MAX_ACCUMULATED_TIME) {
    frameTime = MAX_ACCUMULATED_TIME;
  }

  accumulator += frameTime;
  while (accumulator >= FIXED_STEP) {
    update(FIXED_STEP);
    accumulator -= FIXED_STEP;
  }

  render();
}

requestAnimationFrame(frame);
