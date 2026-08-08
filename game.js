// game.js — Main game loop and scene manager
// Wires together input, player, invaders, HUD, and level scenes.

import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';
import { drawFormation, updateFormation, resetFormation, invaders, score } from './invaders.js';
import level1 from './level1.js';
import level2 from './level2.js';
import level3 from './level3.js';

// ─── Canvas setup ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ─── Shared game state ───────────────────────────────────────────────────────
const gameState = {
  lives:      STARTING_LIVES,
  level:      1,
  score:      0,
  playerY:    CANVAS_HEIGHT - 60,
  gameOver:   false,
  win:        false,
  triggerGameOver() {
    gameState.gameOver = true;
  },
};

// ─── Player (shared for levels 1 and 2) ──────────────────────────────────────
const player = new Player(CANVAS_WIDTH / 2, gameState.playerY);

// ─── Input initialisation ─────────────────────────────────────────────────────
initInput();

// ─── Scene management ────────────────────────────────────────────────────────
let currentLevel = null;
let currentLevelId = null;

function transitionTo(levelId) {
  currentLevelId = levelId;

  if (levelId === 1) {
    resetFormation();
    level1.init(gameState);
    currentLevel = level1;
  } else if (levelId === 2) {
    level2.init(gameState);
    currentLevel = level2;
  } else if (levelId === 3) {
    level3.init(gameState);
    currentLevel = level3;
  } else if (levelId === 'boss') {
    // Boss level not yet implemented — show placeholder
    currentLevel = {
      init:   () => {},
      update: () => {},
      render: (ctx) => {
        ctx.save();
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.font         = '48px monospace';
        ctx.fillStyle    = '#ff4444';
        ctx.fillText('BOSS INCOMING', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.restore();
      },
    };
  }
}

// Start at level 1
transitionTo(1);

// ─── Fixed timestep ───────────────────────────────────────────────────────────
const TARGET_FPS   = 60;
const FIXED_DT     = 1 / TARGET_FPS;
let   lastTime     = null;
let   accumulator  = 0;

// ─── HUD renderer ────────────────────────────────────────────────────────────
function renderHUD(ctx, state) {
  const padding = 16;
  ctx.save();
  ctx.font         = '20px monospace';
  ctx.textBaseline = 'top';

  // Score — top-left
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SCORE: ' + (state.score || 0), padding, padding);

  // Lives — top-right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#00ff00';
  ctx.fillText('LIVES: ' + state.lives, CANVAS_WIDTH - padding, padding);

  // Hi-score placeholder — top-centre
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffff00';
  ctx.fillText('HI-SCORE', CANVAS_WIDTH / 2, padding);

  ctx.restore();
}

// ─── Game-over screen ────────────────────────────────────────────────────────
function renderGameOver(ctx) {
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.font      = '64px monospace';
  ctx.fillStyle = '#ff0000';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  ctx.font      = '24px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Press F5 / Cmd+R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  ctx.restore();
}

// ─── Main loop ────────────────────────────────────────────────────────────────
function loop(timestamp) {
  requestAnimationFrame(loop);

  if (lastTime === null) { lastTime = timestamp; }
  const raw = (timestamp - lastTime) / 1000;
  lastTime  = timestamp;

  // Cap dt to avoid spiral-of-death after tab is hidden.
  const cappedDt = Math.min(raw, 0.1);
  accumulator += cappedDt;

  // Fixed-step update
  while (accumulator >= FIXED_DT) {
    accumulator -= FIXED_DT;

    if (!gameState.gameOver) {
      // ── Level transition check ───────────────────────────────────────────
      const newLevel = gameState.level;
      if (newLevel !== currentLevelId) {
        transitionTo(newLevel);
      }

      // ── Level-specific update ────────────────────────────────────────────
      if (currentLevel && typeof currentLevel.update === 'function') {
        currentLevel.update(FIXED_DT, gameState);
      }

      // ── Levels 1 & 2: shared update paths ────────────────────────────────
      if (currentLevelId === 1 || currentLevelId === 2) {
        updateFormation(FIXED_DT);
        player.update(FIXED_DT);
        gameState.score = score;
      }
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (gameState.gameOver) {
    renderGameOver(ctx);
    return;
  }

  // HUD (always on top)
  renderHUD(ctx, gameState);

  // Level-specific rendering
  if (currentLevelId === 1 || currentLevelId === 2) {
    // Shared rendering for levels 1 and 2
    drawFormation(ctx);
    player.draw(ctx);
  }

  // Level module render hook (HUD label etc.)
  if (currentLevel && typeof currentLevel.render === 'function') {
    currentLevel.render(ctx, gameState);
  }
}

requestAnimationFrame(loop);
