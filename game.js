import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';
import { InvaderFormation } from './invaders.js';
import {
  collide,
  updateExplosions,
  drawExplosions,
  clearExplosions,
} from './collision.js';

// Future import sites — one line per sibling module with the card that owns
// it. These are comments only: the files do not exist yet, and a real import
// of a missing file would throw at load time.
// level1.js — added by "Level 1: the classic grid"
// level2.js — added by "Level 2: they shoot back"
// level3.js — added by "Level 3: shields and formations"
// boss.js — added by "Boss level: multi-phase finale"

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Keyboard input: initInput() attaches the keydown/keyup listeners once at
// startup; input.js owns the held-key state and every module reads the
// keyboard through isKeyHeld().
initInput();

// The player ship, created once at startup and reset at the start of every
// game. Exported for the collision/level cards: they read player.bullet
// (the in-flight bullet, or null) and call player.loseLife() when the ship
// is hit.
export const player = new Player();

// The invader formation (11 columns x 5 rows = 55 invaders), created once
// at startup and reset at the start of every game. invaders.js owns the
// grid and its marching; collision.js owns what happens when a bullet
// meets an invader.
const formation = new InvaderFormation();

// Hostile (invader-fired) bullets, part of the game state. No card spawns
// these yet — "Level 2: they shoot back" will push its bullets into this
// list — but the collision pass already consumes whatever the list holds
// every frame. Exported so that card writes to the same list this card
// passes to collide().
export const hostileBullets = [];

// HUD state, owned by this card and exported for sibling cards: they import
// and mutate this object (e.g. hud.score += ... on a kill). hud.lives is a
// display mirror of the lives counter owned by player.js — every Playing
// update copies player.lives into it, so the HUD text and the lives <= 0
// game-over check below follow the player's counter. In-memory only — no
// localStorage persistence (explicitly out of scope for this card).
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

// Fixed timestep: update() is always invoked with exactly this dt, i.e. 60
// steps per second, independent of the display's actual frame rate.
const FIXED_DT = 1 / 60;
// Maximum frame delta (250 ms) allowed into the accumulator. While the tab
// is backgrounded, requestAnimationFrame pauses and the next frame reports
// one huge delta; clamping it means resuming fires at most
// MAX_DELTA / FIXED_DT = 15 catch-up updates instead of an unbounded burst.
const MAX_DELTA = 0.25;

let accumulator = 0;
let lastTimestamp = null;

function startGame() {
  hud.score = 0;
  player.reset();
  formation.reset();
  hostileBullets.length = 0;
  clearExplosions();
  hud.lives = player.lives;
  scene = SCENES.PLAYING;
}

function endGame() {
  if (hud.score > hud.hiScore) hud.hiScore = hud.score;
  scene = SCENES.GAME_OVER;
}

function returnToTitle() {
  scene = SCENES.TITLE;
}

// Every scene transition is driven from here by the ENTER key; the page is
// never reloaded or navigated at any point.
window.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;

  if (scene === SCENES.TITLE) {
    startGame();
  } else if (scene === SCENES.PLAYING) {
    // Manual stand-in only: no card yet ships gameplay that reduces lives,
    // so ENTER ends the game to keep the full Title -> Playing -> Game
    // Over -> Title loop verifiable by hand. The real trigger is the
    // hud.lives <= 0 check in update(); the level cards reduce lives via
    // player.loseLife() and replace this branch.
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
      player.update(dt);
      formation.update(dt);
      // Explosions are pure visuals owned by collision.js; aging them here
      // keeps their ~0.3 s lifetime on the same fixed timestep as the rest
      // of the world.
      updateExplosions(dt);
      // Mirror the player's lives counter into the HUD and run the wired
      // Playing -> Game Over transition: the level cards call
      // player.loseLife(), and the moment lives reach 0 the game ends
      // (hiScore is updated inside endGame()).
      hud.lives = player.lives;
      if (hud.lives <= 0) {
        endGame();
      }
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
  // Draw only — every collision/overlap decision for this frame has
  // already been made by collide() before render() is called.
  formation.draw(ctx);
  player.draw(ctx);
  drawExplosions(ctx);
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

  // Phase 1 — fixed-timestep simulation: 0..15 updates of exactly 1/60 s.
  accumulator += delta;
  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  // Phase 2 — collision pass: exactly once per animation frame, after the
  // world updates and before any drawing. All AABB/overlap checks live in
  // collision.js; the render code below performs none.
  if (scene === SCENES.PLAYING) {
    collide({ player, formation, hostileBullets, hud });
  }

  // Phase 3 — draw exactly once per animation frame.
  render();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
