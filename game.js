import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';
import { Level1 } from './level1.js';
import { Level2 } from './level2.js';
import { Level3 } from './level3.js';
import { Level4 } from './boss.js';
import * as collision from './collision.js';

// --- Canvas setup -----------------------------------------------------

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

// --- HUD state ----------------------------------------------------------
// Exported so later cards (player/invaders/collision/levels/boss) can read
// and mutate score/lives/hiScore directly as gameplay happens.

export const hud = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
};

// --- Scene state machine -------------------------------------------------

export const SCENES = Object.freeze({
  TITLE: 'Title',
  PLAYING: 'Playing',
  GAME_OVER: 'GameOver',
  WIN: 'Win',
});

let scene = SCENES.TITLE;

initInput();
const player = new Player();

// Level dispatcher: `level` selects which level module's update()/draw()
// runs during the Playing scene, ordered 1 -> 2 -> 3 -> 4 (the boss, from
// boss.js). Each level is constructed the instant the previous one's
// `cleared` flag fires, mirrored below in update()'s switch.
let level = 1;
let level1 = null; // constructed on level start, in goToPlaying()
let level2 = null; // constructed once Level 1 clears, in update()
let level3 = null; // constructed once Level 2 clears, in update()
let level4 = null; // constructed once Level 3 clears, in update()

function goToPlaying() {
  hud.score = 0;
  hud.lives = STARTING_LIVES;
  level = 1;
  level1 = new Level1();
  level2 = null;
  level3 = null;
  level4 = null;
  scene = SCENES.PLAYING;
}

// Exposed for other cards (collision.js, boss.js) to call once lives reach
// 0 -- or, for the boss's sudden-death rule, immediately regardless of
// remaining lives.
export function triggerGameOver() {
  hud.hiScore = Math.max(hud.hiScore, hud.score);
  scene = SCENES.GAME_OVER;
}

// Exposed for boss.js to call once the boss's HP reaches 0.
export function triggerWin() {
  hud.hiScore = Math.max(hud.hiScore, hud.score);
  scene = SCENES.WIN;
}

function goToTitle() {
  hud.score = 0;
  hud.lives = STARTING_LIVES;
  scene = SCENES.TITLE;
}

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;

  if (scene === SCENES.TITLE) {
    goToPlaying();
  } else if (scene === SCENES.GAME_OVER || scene === SCENES.WIN) {
    goToTitle();
  }
});

// --- Fixed-timestep loop (accumulator pattern) ---------------------------

const FIXED_STEP = 1 / 60; // seconds per update() call
const MAX_FRAME_DELTA = 0.25; // clamp so a backgrounded-tab resume can't spiral

let accumulator = 0;
let lastTimestamp = null;

function update(dt) {
  switch (scene) {
    case SCENES.TITLE:
      // No gameplay update logic on the title screen.
      break;
    case SCENES.PLAYING:
      player.update(dt);
      switch (level) {
        case 1:
          level1.update(dt, player);
          // Collision pass runs after movement, strictly before rendering
          // ("collide, then draw").
          collision.update(dt, player, level1.formation);
          if (level1.cleared) {
            level = 2;
            // Player lives and player.shotsFired (used by Level 2's bonus
            // UFO scoring) carry over unchanged -- the same `player`
            // instance is reused, never recreated here.
            level2 = new Level2();
          }
          break;
        case 2:
          level2.update(dt, player);
          collision.update(dt, player, level2.formation);
          if (level2.cleared) {
            level = 3;
            // Player lives/shotsFired carry over unchanged, same pattern as
            // the Level 1 -> Level 2 handoff above.
            level3 = new Level3();
          }
          break;
        case 3:
          level3.update(dt, player);
          collision.update(dt, player, level3.formation);
          if (level3.cleared) {
            level = 4;
            // Player lives/shotsFired carry over unchanged, same pattern as
            // the earlier level handoffs above.
            level4 = new Level4();
          }
          break;
        case 4:
          // The boss is the finale -- its own module calls triggerWin()/
          // triggerGameOver() directly once the fight resolves, so there's
          // no `cleared`-driven handoff to a Level 5 here.
          level4.update(dt, player);
          collision.update(dt, player, level4.formation);
          break;
      }
      break;
    case SCENES.GAME_OVER:
      // No gameplay update logic on the game-over screen.
      break;
    case SCENES.WIN:
      // No gameplay update logic on the win screen.
      break;
  }
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    case SCENES.WIN:
      renderWin();
      break;
  }
}

function renderTitle() {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';

  ctx.font = '48px monospace';
  ctx.fillText('SPACE INVADERS', canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = '20px monospace';
  ctx.fillText('Press ENTER to start', canvas.width / 2, canvas.height / 2 + 30);
}

function renderPlaying() {
  if (level === 1) {
    level1.draw(ctx);
  } else if (level === 2) {
    level2.draw(ctx);
  } else if (level === 3) {
    level3.draw(ctx);
  } else if (level === 4) {
    level4.draw(ctx);
  }
  collision.draw(ctx);
  player.draw(ctx);
  renderHud();
}

function renderGameOver() {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';

  ctx.font = '48px monospace';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

  ctx.font = '24px monospace';
  ctx.fillText(`Score: ${hud.score}`, canvas.width / 2, canvas.height / 2 + 10);

  ctx.font = '20px monospace';
  ctx.fillText('Press ENTER to restart', canvas.width / 2, canvas.height / 2 + 50);
}

function renderWin() {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';

  ctx.font = '48px monospace';
  ctx.fillText('YOU WIN', canvas.width / 2, canvas.height / 2 - 40);

  ctx.font = '24px monospace';
  ctx.fillText(`Score: ${hud.score}`, canvas.width / 2, canvas.height / 2 + 10);

  ctx.font = '20px monospace';
  ctx.fillText('Press ENTER to restart', canvas.width / 2, canvas.height / 2 + 50);
}

function renderHud() {
  ctx.fillStyle = '#fff';
  ctx.font = '18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${hud.score}`, 16, 28);
  ctx.fillText(`Hi-Score: ${hud.hiScore}`, 16, 50);

  ctx.textAlign = 'center';
  ctx.fillText(`Level: ${level}`, canvas.width / 2, 28);

  ctx.textAlign = 'right';
  ctx.fillText(`Lives: ${hud.lives}`, canvas.width - 16, 28);
}

function frame(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  let delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (delta > MAX_FRAME_DELTA) {
    delta = MAX_FRAME_DELTA;
  }

  accumulator += delta;

  while (accumulator >= FIXED_STEP) {
    update(FIXED_STEP);
    accumulator -= FIXED_STEP;
  }

  render();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
