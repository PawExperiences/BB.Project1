import { CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';
import {
  collide,
  updateExplosions,
  drawExplosions,
  clearExplosions,
} from './collision.js';
import { createLevel } from './levels.js';

// Level modules self-register with the level registry (levels.js) when
// imported — one import line per level module, each owned by its card:
// level1.js — added by "Level 1: the classic grid"
import './level1.js';
// level2.js — added by "Level 2: they shoot back"
import './level2.js';
// Future import sites — comments only: the files do not exist yet, and a
// real import of a missing file would throw at load time.
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
// (the in-flight bullet, or null), call player.loseLife() when the ship is
// hit or a breach costs a life, and player.resetPosition() to restart a
// level.
export const player = new Player();

// Hostile (invader-fired) bullets, part of the game state. "Level 2: they
// shoot back" pushes its bullets into this list, and the collision pass
// consumes whatever the list holds every frame. Exported so that card
// writes to the same list this card passes to collide().
export const hostileBullets = [];

// HUD state, owned by this card and exported for sibling cards: they import
// and mutate this object (e.g. hud.score += ... on a kill). hud.lives is a
// display mirror of the lives counter owned by player.js — every Playing
// update copies player.lives into it, so the HUD text and the lives <= 0
// game-over check below follow the player's counter. hud.level is the
// current level number: set to 1 at the start of every game and bumped on
// every level change by advanceLevel(). In-memory only — no localStorage
// persistence (explicitly out of scope for this card).
export const hud = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
  level: 1,
};

// The slice of game state handed to every level the registry creates.
// Level 1 reads the player's row for its breach check and calls
// loseLife()/resetPosition() on it; Level 2 pushes its bullets into
// hostileBullets and awards its UFO bonus through hud; invader-kill score
// changes stay owned by collision.js via hud.
const levelContext = { player, hud, hostileBullets };

// The active level object (created through the registry in levels.js) and
// its 1-based number. currentLevel is null only while no module is
// registered for the current level number — clearing a level whose
// successor has not landed yet (today: Level 3) leaves the Playing scene
// running with an empty field while the HUD already shows the new level
// number. currentLevel is exported as a live binding so the README's
// manual verification can reach the active level's formation from the
// DevTools console.
export let currentLevel = null;
let levelNumber = 1;

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
  hostileBullets.length = 0;
  clearExplosions();
  hud.lives = player.lives;
  // Every game starts at Level 1, created through the registry so later
  // level cards plug in without changes here or in level1.js.
  levelNumber = 1;
  hud.level = levelNumber;
  currentLevel = createLevel(levelNumber, levelContext);
  scene = SCENES.PLAYING;
}

// Level-clear handoff: bump the level counter, mirror it into the HUD and
// ask the registry for the next level's module. Level 2 is registered by
// level2.js, so clearing Level 1 starts it immediately, in this same fixed
// step, with the lives/score state untouched. createLevel() returns null
// when no module has registered the new number yet (today: level 3), which
// leaves the Playing scene running with an empty field until then.
function advanceLevel() {
  levelNumber += 1;
  hud.level = levelNumber;
  currentLevel = createLevel(levelNumber, levelContext);
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
    // Manual stand-in only: ENTER ends the game so the full
    // Title -> Playing -> Game Over -> Title loop stays verifiable by
    // hand. The wired trigger is the hud.lives <= 0 check in update(),
    // reached when Level 1's breach handling (or Level 2's invader fire)
    // takes the last life via player.loseLife().
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
      if (currentLevel !== null) {
        // The level owns the formation march (discrete steps with linear
        // acceleration), the edge drops, the breach -> lose-one-life +
        // restart path and clear detection.
        currentLevel.update(dt);
        if (currentLevel.cleared) advanceLevel();
      }
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

  // Current level number, centered on the HUD's top line: visible from the
  // moment the level starts and bumped on every level change.
  ctx.textAlign = 'center';
  ctx.fillText(`LEVEL ${hud.level}`, CANVAS_WIDTH / 2, 28);

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
  if (currentLevel !== null) currentLevel.draw(ctx);
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
  // collision.js; the render code below performs none. The formation under
  // test belongs to the active level.
  if (scene === SCENES.PLAYING && currentLevel !== null) {
    collide({
      player,
      formation: currentLevel.formation,
      hostileBullets,
      hud,
    });
  }

  // Phase 3 — draw exactly once per animation frame.
  render();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
