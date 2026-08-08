// game.js — Game loop, scene state machine, and canvas framework

import { initInput, isKeyHeld } from './input.js';
import { Player } from './player.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TIMESTEP,
  MAX_ACCUMULATED_DELTA,
  STARTING_LIVES
} from './gameConfig.js';
import { score, addScore } from './collision.js';

// Level modules — imported lazily via dynamic import to keep file:// compat
// (static imports are fine; we import all of them upfront)
import * as Level1 from './level1.js';
import * as Level2 from './level2.js';
import * as Level3 from './level3.js';
import {
  initBoss,
  updateBoss,
  drawBoss,
  isBossWon,
  isBossAlive,
  getBossState,
  resetBossFlags
} from './boss.js';

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Scene state
// 'title' | 'playing' | 'gameover' | 'boss' | 'win'
// ---------------------------------------------------------------------------
let currentScene = 'title';
let currentLevel = 1;       // 1–4
let enterWasHeld = false;   // edge-detect for ENTER

// ---------------------------------------------------------------------------
// HUD state — exported so other modules can read score/lives
// ---------------------------------------------------------------------------
export const hud = {
  score: 0,
  hi:    0,
  lives: STARTING_LIVES
};

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------
let player = new Player();

// ---------------------------------------------------------------------------
// Win screen state
// ---------------------------------------------------------------------------
let winScore = 0;

// ---------------------------------------------------------------------------
// Level dispatch — called when a level clears or on game start
// ---------------------------------------------------------------------------
function startLevel(level) {
  currentLevel = level;

  if (level === 1) {
    if (typeof Level1.initLevel === 'function') Level1.initLevel(player);
  } else if (level === 2) {
    if (typeof Level2.initLevel === 'function') Level2.initLevel(player);
  } else if (level === 3) {
    if (typeof Level3.initLevel === 'function') Level3.initLevel(player);
  } else if (level === 4) {
    initBoss(player);
  }
}

// ---------------------------------------------------------------------------
// Start / restart helpers
// ---------------------------------------------------------------------------
function startGame() {
  hud.score = 0;
  hud.lives = STARTING_LIVES;
  player    = new Player();
  currentScene = 'playing';
  startLevel(1);
}

function triggerGameOver() {
  currentScene = 'gameover';
}

function triggerWin() {
  winScore = hud.score;
  currentScene = 'win';
}

// ---------------------------------------------------------------------------
// Input initialisation
// ---------------------------------------------------------------------------
initInput();

// ---------------------------------------------------------------------------
// Fixed-timestep loop
// ---------------------------------------------------------------------------
let lastTimestamp  = null;
let accumulated    = 0;
const TIMESTEP_S   = TIMESTEP / 1000; // seconds

function update() {
  if (currentScene === 'playing' || currentScene === 'boss') {
    updateGameplay();
  }
}

function updateGameplay() {
  if (currentScene === 'boss') {
    // -- Boss level update --------------------------------------------------
    player.update(TIMESTEP_S);
    updateBoss(TIMESTEP_S);

    const state = getBossState();
    resetBossFlags();

    if (state.playerHit) {
      // Sudden death
      hud.score = 0;
      hud.lives = STARTING_LIVES;
      player    = new Player();
      currentScene = 'playing';
      startLevel(1);
      return;
    }

    if (state.won) {
      triggerWin();
      return;
    }

    // Sync score
    hud.score = score;

  } else {
    // -- Normal level update ------------------------------------------------
    player.update(TIMESTEP_S);

    let levelCleared = false;

    if (currentLevel === 1) {
      if (typeof Level1.updateLevel === 'function') {
        levelCleared = Level1.updateLevel(TIMESTEP_S, player, hud) || false;
      }
    } else if (currentLevel === 2) {
      if (typeof Level2.updateLevel === 'function') {
        levelCleared = Level2.updateLevel(TIMESTEP_S, player, hud) || false;
      }
    } else if (currentLevel === 3) {
      if (typeof Level3.updateLevel === 'function') {
        levelCleared = Level3.updateLevel(TIMESTEP_S, player, hud) || false;
      }
    }

    // Sync score from collision module
    hud.score = score;
    if (hud.score > hud.hi) hud.hi = hud.score;

    // Check player lives
    if (hud.lives <= 0) {
      triggerGameOver();
      return;
    }

    // Advance to next level when current one is cleared
    if (levelCleared) {
      const next = currentLevel + 1;
      if (next <= 3) {
        startLevel(next);
      } else if (next === 4) {
        // Transition to boss fight
        currentScene = 'boss';
        startLevel(4);
      } else {
        // Should not happen — boss handles win
        triggerWin();
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function render() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (currentScene) {
    case 'title':    renderTitle();    break;
    case 'playing':  renderPlaying();  break;
    case 'boss':     renderBoss();     break;
    case 'gameover': renderGameOver(); break;
    case 'win':      renderWin();      break;
  }
}

// -- Title ------------------------------------------------------------------
function renderTitle() {
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '24px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

// -- HUD strip --------------------------------------------------------------
function renderHUD() {
  ctx.fillStyle = '#222222';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 40);

  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SCORE: ${hud.score}`, 12, 20);

  ctx.textAlign = 'center';
  ctx.fillText(`HI: ${hud.hi}`, CANVAS_WIDTH / 2, 20);

  ctx.textAlign = 'right';
  ctx.fillText(`LIVES: ${hud.lives}`, CANVAS_WIDTH - 12, 20);
}

// -- Playing ----------------------------------------------------------------
function renderPlaying() {
  renderHUD();

  if (currentLevel === 1) {
    if (typeof Level1.drawLevel === 'function') Level1.drawLevel(ctx);
  } else if (currentLevel === 2) {
    if (typeof Level2.drawLevel === 'function') Level2.drawLevel(ctx);
  } else if (currentLevel === 3) {
    if (typeof Level3.drawLevel === 'function') Level3.drawLevel(ctx);
  }

  player.draw(ctx);
}

// -- Boss -------------------------------------------------------------------
function renderBoss() {
  renderHUD();
  drawBoss(ctx);
  player.draw(ctx);
}

// -- Game Over --------------------------------------------------------------
function renderGameOver() {
  ctx.fillStyle = '#ff0000';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = '28px monospace';
  ctx.fillText(`SCORE: ${hud.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '20px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

// -- Win screen -------------------------------------------------------------
function renderWin() {
  // Background gradient feel with solid fill
  ctx.fillStyle = '#000033';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#ffff00';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);

  ctx.fillStyle = '#ffffff';
  ctx.font = '32px monospace';
  ctx.fillText(`FINAL SCORE: ${winScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  // Restart prompt (clearly labelled)
  ctx.fillStyle = '#00ff00';
  ctx.font = '24px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);

  // Decorative stars (static, drawn each frame — deterministic)
  ctx.fillStyle = '#ffffff';
  const starPositions = [
    [50, 80], [200, 40], [400, 100], [600, 60], [720, 90],
    [100, 200], [300, 150], [500, 180], [680, 220],
    [80, 700], [250, 750], [450, 720], [630, 780], [710, 700]
  ];
  for (const [sx, sy] of starPositions) {
    ctx.fillRect(sx, sy, 2, 2);
  }
}

// ---------------------------------------------------------------------------
// ENTER key handling (scene transitions)
// ---------------------------------------------------------------------------
function handleEnterEdge(enterHeld) {
  const justPressed = enterHeld && !enterWasHeld;
  enterWasHeld = enterHeld;

  if (!justPressed) return;

  if (currentScene === 'title') {
    startGame();
  } else if (currentScene === 'gameover') {
    hud.score = 0;
    hud.lives = STARTING_LIVES;
    currentScene = 'title';
  } else if (currentScene === 'win') {
    // Restart from win screen — fresh game, score reset
    hud.score = 0;
    hud.hi    = Math.max(hud.hi, winScore); // preserve hi-score across restart
    hud.lives = STARTING_LIVES;
    player    = new Player();
    winScore  = 0;
    currentScene = 'playing';
    startLevel(1);
  }
}

// ---------------------------------------------------------------------------
// Main animation loop
// ---------------------------------------------------------------------------
function loop(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Cap delta to prevent tab-background burst
  if (delta > MAX_ACCUMULATED_DELTA) {
    delta = MAX_ACCUMULATED_DELTA;
  }

  accumulated += delta;

  // Handle ENTER edge
  handleEnterEdge(isKeyHeld('Enter'));

  // Fixed-timestep update steps
  while (accumulated >= TIMESTEP) {
    update();
    accumulated -= TIMESTEP;
  }

  render();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
