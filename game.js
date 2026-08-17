import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';

// Forward-looking imports for sibling cards — nothing below is implemented yet.
// input.js — added by "Keyboard input and the player ship"
// player.js — added by "Keyboard input and the player ship"
// collision.js — added by "Sprite rendering and collision detection"
// invaders.js — added by "Level 1: the classic grid"
// level1.js — added by "Level 1: the classic grid"
// level2.js — added by "Level 2: they shoot back"
// level3.js — added by "Level 3: shields and formations"
// boss.js — added by "Boss level: multi-phase finale"

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// HUD state, owned by this card. Sibling cards import and mutate this object
// (e.g. score += ... on a kill, lives -= 1 on a hit) rather than re-declaring it.
export const hud = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
};

const SCENES = {
  TITLE: 'title',
  PLAYING: 'playing',
  GAME_OVER: 'gameOver',
};

let scene = SCENES.TITLE;

const FIXED_DT = 1 / 60;
// Caps how much simulated time a single frame can contribute to the
// accumulator, so resuming a backgrounded/inactive tab (where the browser
// reports one huge delta) doesn't burst-fire a queue of catch-up updates.
const MAX_DELTA = 0.25;

let accumulator = 0;
let lastTimestamp = null;

function startGame() {
  scene = SCENES.PLAYING;
  hud.score = 0;
  hud.lives = STARTING_LIVES;
}

function endGame() {
  if (hud.score > hud.hiScore) hud.hiScore = hud.score;
  scene = SCENES.GAME_OVER;
}

function returnToTitle() {
  scene = SCENES.TITLE;
}

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;

  if (scene === SCENES.TITLE) {
    startGame();
  } else if (scene === SCENES.PLAYING) {
    // No gameplay entities exist yet, so there is no real end-of-game
    // condition to check. ENTER stands in as the manual trigger until a
    // sibling card (losing all lives, clearing level 3 + boss) replaces it.
    endGame();
  } else if (scene === SCENES.GAME_OVER) {
    returnToTitle();
  }
});

function update(dt) {
  switch (scene) {
    case SCENES.TITLE:
      break;
    case SCENES.PLAYING:
      // No gameplay-entity logic in this card — just the loop and the HUD.
      break;
    case SCENES.GAME_OVER:
      break;
  }
}

function drawHud() {
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.fillText(`Score: ${hud.score}`, 16, 28);
  ctx.fillText(`Lives: ${hud.lives}`, 16, 52);

  ctx.textAlign = 'right';
  ctx.fillText(`Hi: ${hud.hiScore}`, CANVAS_WIDTH - 16, 28);
  ctx.textAlign = 'left';
}

function renderTitle() {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '48px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

  ctx.font = '20px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  ctx.textAlign = 'left';
}

function renderPlaying() {
  drawHud();
}

function renderGameOver() {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '48px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.font = '24px monospace';
  ctx.fillText(`Score: ${hud.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

  ctx.font = '20px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  ctx.textAlign = 'left';

  drawHud();
}

function render() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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

function frame(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;

  let delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  if (delta > MAX_DELTA) delta = MAX_DELTA;

  accumulator += delta;
  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  render();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
