// game.js — Scene manager and main game loop for Space Invaders
// Loads level1, level2 lazily via dynamic import to keep file:// compatible.
import { initInput, isKeyHeld } from './input.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Scene registry
// A scene object must expose:
//   .update(dt)  — advance state, returns nothing
//   .draw(ctx)   — render
// Transitions are driven by callbacks passed into each scene constructor.
// ---------------------------------------------------------------------------
let currentScene = null;

// ---------------------------------------------------------------------------
// Scene factories
// ---------------------------------------------------------------------------
async function startLevel1() {
  const { Level1Scene } = await import('./level1.js');
  currentScene = new Level1Scene({
    lives:            STARTING_LIVES,
    score:            0,
    sessionShotCount: 0,
    onGameOver:       (score) => showGameOver(score),
    onLevelClear:     (state) => startLevel2(state),
  });
}

async function startLevel2(state) {
  const { Level2Scene } = await import('./level2.js');
  currentScene = new Level2Scene({
    lives:            state.lives,
    score:            state.score,
    sessionShotCount: state.sessionShotCount,
    onGameOver:       (score) => showGameOver(score),
    onLevelClear:     (s)     => startLevel3(s),
  });
}

async function startLevel3(state) {
  // Level 3 is out of scope; show a placeholder or loop back to title.
  // When level3.js is implemented it should be imported here.
  showGameOver(state.score); // temporary: treat level-clear as end
}

// ---------------------------------------------------------------------------
// Game Over scene (inline — lightweight, no separate module needed)
// ---------------------------------------------------------------------------
class GameOverScene {
  constructor(score) {
    this._score   = score;
    this._entered = false;
  }

  update(_dt) {
    // ENTER key returns to title (Level 1 restart)
    if (isKeyHeld('Enter') && !this._entered) {
      this._entered = true;
      startTitle();
    }
    // Reset when key is released so it can be pressed again if needed
    if (!isKeyHeld('Enter')) {
      this._entered = false;
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#ff0000';
    ctx.font      = '64px monospace';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    ctx.fillStyle = '#ffffff';
    ctx.font      = '32px monospace';
    ctx.fillText(`SCORE: ${this._score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    ctx.fillStyle = '#aaaaaa';
    ctx.font      = '24px monospace';
    ctx.fillText('PRESS ENTER TO RETURN TO TITLE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);

    ctx.textAlign = 'left'; // reset
  }
}

function showGameOver(score) {
  currentScene = new GameOverScene(score);
}

// ---------------------------------------------------------------------------
// Title scene (inline)
// ---------------------------------------------------------------------------
class TitleScene {
  constructor() {
    this._ready = false;
  }

  update(_dt) {
    if (isKeyHeld('Enter') && !this._ready) {
      this._ready = true;
      startLevel1();
    }
    if (!isKeyHeld('Enter')) {
      this._ready = false;
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign    = 'center';
    ctx.fillStyle    = '#33ff33';
    ctx.font         = '64px monospace';
    ctx.fillText('SPACE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    ctx.fillText('INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

    ctx.fillStyle = '#ffffff';
    ctx.font      = '28px monospace';
    ctx.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);

    ctx.textAlign = 'left';
  }
}

function startTitle() {
  currentScene = new TitleScene();
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
let lastTime = null;

function loop(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50 ms
  lastTime = timestamp;

  if (currentScene !== null) {
    currentScene.update(dt);
    currentScene.draw(ctx);
  }

  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
initInput();
startTitle();
requestAnimationFrame(loop);
