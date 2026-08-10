import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';

// Future: import { createInvaders, updateInvaders, renderInvaders } from './invaders.js'; -- owned by "Invaders" card
// Future: import { checkCollisions } from './collision.js'; -- owned by "Collision detection" card
// Future: import { runLevel1 } from './level1.js'; -- owned by "Level 1" card
// Future: import { runLevel2 } from './level2.js'; -- owned by "Level 2" card
// Future: import { runLevel3 } from './level3.js'; -- owned by "Level 3" card
// Future: import { runBoss } from './boss.js'; -- owned by "Boss fight" card

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Mutable HUD state, shared with later cards (player, invaders, collision, levels, boss)
// so they can update score/lives without owning scene or HUD rendering logic.
export const hudState = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
};

const SCENES = {
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
};

let currentScene = SCENES.TITLE;

const PLAYER_START_X = CANVAS_WIDTH / 2;
const PLAYER_START_Y = CANVAS_HEIGHT - 60;

let player = new Player(PLAYER_START_X, PLAYER_START_Y);

function startPlaying() {
  hudState.score = 0;
  hudState.lives = STARTING_LIVES;
  player = new Player(PLAYER_START_X, PLAYER_START_Y);
  currentScene = SCENES.PLAYING;
}

function endGame() {
  hudState.hiScore = Math.max(hudState.hiScore, hudState.score);
  currentScene = SCENES.GAME_OVER;
}

function returnToTitle() {
  currentScene = SCENES.TITLE;
}

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;

  if (currentScene === SCENES.TITLE) {
    startPlaying();
  } else if (currentScene === SCENES.GAME_OVER) {
    returnToTitle();
  }
});

function updateTitle(dt) {
  // Nothing to simulate on the title screen yet.
}

function updatePlaying(dt) {
  player.update(dt);

  if (hudState.lives <= 0) {
    endGame();
  }
}

function updateGameOver(dt) {
  // Nothing to simulate on the game-over screen yet.
}

function update(dt) {
  if (currentScene === SCENES.TITLE) {
    updateTitle(dt);
  } else if (currentScene === SCENES.PLAYING) {
    updatePlaying(dt);
  } else if (currentScene === SCENES.GAME_OVER) {
    updateGameOver(dt);
  }
}

function drawCenteredText(text, y, size, color = '#ffffff') {
  ctx.fillStyle = color;
  ctx.font = `${size}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(text, CANVAS_WIDTH / 2, y);
}

function renderHud() {
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${hudState.score}`, 16, 28);
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES: ${hudState.lives}`, CANVAS_WIDTH - 16, 28);
}

function renderTitle() {
  drawCenteredText('SPACE INVADERS', CANVAS_HEIGHT / 2 - 20, 40);
  drawCenteredText('Press ENTER to start', CANVAS_HEIGHT / 2 + 30, 20);
}

function renderPlaying() {
  player.draw(ctx);
  renderHud();
}

function renderGameOver() {
  drawCenteredText('GAME OVER', CANVAS_HEIGHT / 2 - 40, 40);
  drawCenteredText(`SCORE: ${hudState.score}`, CANVAS_HEIGHT / 2 + 10, 24);
  drawCenteredText('Press ENTER to restart', CANVAS_HEIGHT / 2 + 50, 20);
}

function render() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (currentScene === SCENES.TITLE) {
    renderTitle();
  } else if (currentScene === SCENES.PLAYING) {
    renderPlaying();
  } else if (currentScene === SCENES.GAME_OVER) {
    renderGameOver();
  }
}

// Fixed-timestep game loop: update runs at a constant 60Hz regardless of
// display refresh rate, render runs once per animation frame. The
// accumulator is clamped so a backgrounded/restored tab doesn't fire a
// large burst of queued update calls when it resumes.
const FIXED_DT = 1 / 60;
const MAX_ACCUMULATED_DT = 0.25;

let lastTime = null;
let accumulator = 0;

function loop(timestamp) {
  if (lastTime === null) {
    lastTime = timestamp;
  }

  let frameDt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  accumulator += frameDt;
  if (accumulator > MAX_ACCUMULATED_DT) {
    accumulator = MAX_ACCUMULATED_DT;
  }

  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  render();

  requestAnimationFrame(loop);
}

initInput();
requestAnimationFrame(loop);
