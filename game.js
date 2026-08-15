import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';
import { Invaders } from './invaders.js';
import { collide } from './collision.js';

// Future: import { level1 } from './level1.js';
// Future: import { level2 } from './level2.js';
// Future: import { level3 } from './level3.js';
// Future: import { Boss } from './boss.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

initInput();

const SCENES = {
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
};

let currentScene = SCENES.TITLE;

// Exported so later cards (player, invaders, collision, etc.) can import
// and mutate score/lives/hiScore as gameplay progresses.
export const hudState = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
};

let enterPressed = false;
window.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    enterPressed = true;
  }
});

// Exported so the manual verification steps in the README can reach the
// live player and invaders instances from the devtools console.
export let player = new Player();
export let invaders = new Invaders();

function resetRun() {
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;
  player = new Player();
  invaders = new Invaders();
}

function handleSceneTransitions() {
  if (!enterPressed) return;
  enterPressed = false;

  if (currentScene === SCENES.TITLE) {
    resetRun();
    currentScene = SCENES.PLAYING;
  } else if (currentScene === SCENES.GAME_OVER) {
    currentScene = SCENES.TITLE;
  }
}

const UPDATE_HZ = 60;
const FIXED_DT = 1 / UPDATE_HZ;
const MAX_ACCUMULATED_DT = 0.25; // clamp so a backgrounded tab can't queue a huge burst of steps

function update(dt) {
  handleSceneTransitions();

  if (currentScene === SCENES.PLAYING) {
    player.update(dt);
    invaders.update(dt);
    collide(player, invaders, hudState);
    if (hudState.lives <= 0) {
      hudState.hiScore = Math.max(hudState.hiScore, hudState.score);
      currentScene = SCENES.GAME_OVER;
    }
  }
}

function drawBackground() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawCenteredText(text, y, size = 32) {
  ctx.fillStyle = '#fff';
  ctx.font = `${size}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(text, CANVAS_WIDTH / 2, y);
}

function drawHud() {
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${hudState.score}`, 16, 28);
  ctx.fillText(`LIVES: ${hudState.lives}`, 16, 52);
}

function renderTitle() {
  drawBackground();
  drawCenteredText('SPACE INVADERS', CANVAS_HEIGHT / 2 - 20, 40);
  drawCenteredText('Press ENTER to start', CANVAS_HEIGHT / 2 + 30, 20);
}

function renderPlaying() {
  drawBackground();
  invaders.draw(ctx);
  player.draw(ctx);
  drawHud();
}

function renderGameOver() {
  drawBackground();
  drawCenteredText('GAME OVER', CANVAS_HEIGHT / 2 - 60, 40);
  drawCenteredText(`SCORE: ${hudState.score}`, CANVAS_HEIGHT / 2, 24);
  drawCenteredText('Press ENTER to restart', CANVAS_HEIGHT / 2 + 50, 20);
}

function render() {
  if (currentScene === SCENES.TITLE) {
    renderTitle();
  } else if (currentScene === SCENES.PLAYING) {
    renderPlaying();
  } else if (currentScene === SCENES.GAME_OVER) {
    renderGameOver();
  }
}

let lastTime = null;
let accumulator = 0;

function frame(timestamp) {
  if (lastTime === null) {
    lastTime = timestamp;
  }
  let frameDt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  if (frameDt > MAX_ACCUMULATED_DT) {
    frameDt = MAX_ACCUMULATED_DT;
  }

  accumulator += frameDt;
  if (accumulator > MAX_ACCUMULATED_DT) {
    accumulator = MAX_ACCUMULATED_DT;
  }

  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  render();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
