import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STARTING_LIVES,
  MAX_FRAME_DELTA,
} from './gameConfig.js';

// Sibling cards owned by later tasks. They will import `hud` from this
// module and write the fields listed in README.md. Nothing here imports
// them yet -- each is added by its own card.
// - input.js: keyboard state for player movement and firing.
// - player.js: the player ship entity.
// - invaders.js: the invader grid entity.
// - collision.js: hit detection between bullets, player and invaders.
// - level1.js / level2.js / level3.js: the three level definitions.
// - boss.js: the boss encounter.

const STEP = 1 / 60;

const Scene = {
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
};

// Single source of truth for score/lives/hiScore. Exported as one mutable
// object (not individual primitive exports) so sibling cards can write to
// its fields -- an imported `export let` binding is read-only at the
// importer and could never be mutated by player.js or collision.js.
export const hud = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
};

let scene = Scene.TITLE;
let finalScore = 0;
let enterPressed = false;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

window.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    enterPressed = true;
  }
});

function startRun() {
  hud.score = 0;
  hud.lives = STARTING_LIVES;
  scene = Scene.PLAYING;
}

function endRun() {
  finalScore = hud.score;
  hud.hiScore = Math.max(hud.score, hud.hiScore);
  scene = Scene.GAME_OVER;
}

function updateTitle() {
  if (enterPressed) {
    startRun();
  }
}

function updatePlaying() {
  // collision.js will decrement hud.lives on a hit; this watches the
  // shared HUD state for depletion rather than owning hit detection.
  if (hud.lives <= 0) {
    endRun();
  }
}

function updateGameOver() {
  if (enterPressed) {
    scene = Scene.TITLE;
  }
}

function update(dt) {
  switch (scene) {
    case Scene.TITLE:
      updateTitle(dt);
      break;
    case Scene.PLAYING:
      updatePlaying(dt);
      break;
    case Scene.GAME_OVER:
      updateGameOver(dt);
      break;
  }
  enterPressed = false;
}

function renderTitle() {
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '48px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  ctx.font = '20px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

function renderPlaying() {
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.font = '20px monospace';
  ctx.fillText(`SCORE: ${hud.score}`, 16, 28);
  ctx.fillText(`LIVES: ${hud.lives}`, 16, 52);
}

function renderGameOver() {
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '48px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  ctx.font = '28px monospace';
  ctx.fillText(`SCORE: ${finalScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  ctx.font = '20px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function render() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (scene) {
    case Scene.TITLE:
      renderTitle();
      break;
    case Scene.PLAYING:
      renderPlaying();
      break;
    case Scene.GAME_OVER:
      renderGameOver();
      break;
  }
}

let lastTime = null;
let accumulator = 0;

function frame(timestamp) {
  if (lastTime === null) {
    lastTime = timestamp;
  }

  let frameDelta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  // Clamp before the step loop consumes it: a tab that was backgrounded
  // for seconds must not hand the accumulator a huge delta and fast-forward
  // through a burst of catch-up update() steps on return.
  if (frameDelta > MAX_FRAME_DELTA) {
    frameDelta = MAX_FRAME_DELTA;
  }

  accumulator += frameDelta;
  while (accumulator >= STEP) {
    update(STEP);
    accumulator -= STEP;
  }

  render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
