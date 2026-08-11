// game.js
// Fixed-timestep game loop + Title/Playing/Game Over scene machine.
// This card only lays the framework: gameplay (player, invaders, collisions,
// levels, boss) is added by later cards -- see README.md for the planned layout.

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STARTING_LIVES,
} from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';
import { Level1 } from './level1.js';
import { Level2 } from './level2.js';
import { collide, drawExplosions } from './collision.js';

// Named export so sibling cards (input/player, collision, levels, boss) can
// read and mutate the HUD as gameplay happens.
export const hud = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
  level: 1,
  // Cumulative shots fired this session (player.js increments this on every
  // shot). Started here in Level 1, never reset between levels -- Level 2's
  // bonus UFO scoring tier is indexed off this running total.
  shotsFired: 0,
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

initInput();
let player = new Player();
let level1 = new Level1();
let level1Active = true;
let level2 = null;
let level2Active = false;

function startGame() {
  hud.score = 0;
  hud.lives = STARTING_LIVES;
  hud.level = 1;
  hud.shotsFired = 0;
  player = new Player();
  level1 = new Level1();
  level1Active = true;
  level2 = null;
  level2Active = false;
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
  if (scene === SCENES.PLAYING) {
    player.update(dt);
    if (level1Active) {
      const result = level1.update(dt, player);
      if (result === 'cleared') {
        // No level-select screen: Level 1 clearing drops straight into
        // Level 2, carrying the existing player/hud state over unchanged.
        level1Active = false;
        hud.level = 2;
        level2 = new Level2();
        level2Active = true;
      }
    } else if (level2Active) {
      level2.update(dt, player);
    }
    // Collision must fully resolve before this frame's render pass below.
    // level2.js resolves its own collisions internally; this call remains a
    // harmless no-op against Level 1's (by then empty) formation once
    // Level 1 is cleared.
    collide(dt, player, level1.formation);
  }
  // level3.js (future card): spawn and advance enemy waves here.
  // boss.js (future card): update the boss encounter here.
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
  ctx.fillText(`LEVEL ${hud.level}`, canvas.width / 2, 40);

  ctx.textAlign = 'right';
  ctx.fillText(`LIVES ${hud.lives}`, canvas.width - 16, 16);
}

function renderTitle() {
  drawCenteredText('SPACE INVADERS', canvas.height / 2 - 20, 'bold 40px monospace');
  drawCenteredText('Press ENTER to start', canvas.height / 2 + 30, '20px monospace', '#aaaaaa');
}

function renderPlaying() {
  drawHUD();
  if (level1Active) {
    level1.draw(ctx);
    player.draw(ctx);
  } else if (level2Active) {
    // Level2.draw() also draws the player itself, so it can hide/flash the
    // ship during its post-respawn invulnerability window.
    level2.draw(ctx, player);
  }
  drawExplosions(ctx);
  // level3.js, boss.js (future cards): render the rest of the playfield
  // (shields, boss) here.
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
