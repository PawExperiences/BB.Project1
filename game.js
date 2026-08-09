// game.js — Main game loop and level dispatcher
// ES module; loaded directly by index.html via <script type="module">.
import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Level1Scene } from './level1.js';
import { Level2Scene } from './level2.js';
import { Level3Scene } from './level3.js';
import { Level4Scene } from './boss.js';

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
let currentScene = null;
let lastTime     = null;

// ---------------------------------------------------------------------------
// Start / restart the game from Level 1
// ---------------------------------------------------------------------------
function startGame() {
  initInput();
  loadLevel(1, { lives: STARTING_LIVES, score: 0, sessionShotCount: 0 });
}

// ---------------------------------------------------------------------------
// Level dispatcher — same mechanism for all levels including Level 4
// ---------------------------------------------------------------------------
function loadLevel(levelNumber, { lives, score, sessionShotCount }) {
  const opts = {
    lives,
    score,
    sessionShotCount,
    onGameOver:   () => {
      // Reset entirely to Level 1 with fresh state
      loadLevel(1, { lives: STARTING_LIVES, score: 0, sessionShotCount: 0 });
    },
    onLevelClear: (state) => {
      const next = levelNumber + 1;
      if (next <= 4) {
        loadLevel(next, state);
      } else {
        // Beyond Level 4 — loop back to Level 1 (safety fallback)
        loadLevel(1, { lives: STARTING_LIVES, score: 0, sessionShotCount: 0 });
      }
    },
  };

  switch (levelNumber) {
    case 1:  currentScene = new Level1Scene(opts); break;
    case 2:  currentScene = new Level2Scene(opts); break;
    case 3:  currentScene = new Level3Scene(opts); break;
    case 4:  currentScene = new Level4Scene(opts); break;
    default: currentScene = new Level1Scene(opts); break;
  }
}

// ---------------------------------------------------------------------------
// Game loop
// ---------------------------------------------------------------------------
function gameLoop(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50 ms
  lastTime = timestamp;

  if (currentScene) {
    currentScene.update(dt);
    currentScene.draw(ctx);
  }

  requestAnimationFrame(gameLoop);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
startGame();
requestAnimationFrame(gameLoop);
