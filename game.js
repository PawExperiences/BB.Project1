import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STARTING_LIVES,
  MAX_FRAME_DELTA,
} from './gameConfig.js';
import { initInput } from './input.js';
import { Player } from './player.js';
import { Level1 } from './level1.js';
import { Level2 } from './level2.js';
import { Level3 } from './level3.js';
import { Boss } from './boss.js';
import {
  checkPlayerBulletVsInvaders,
  checkInvaderBulletsVsPlayer,
  updateExplosions,
  getExplosions,
} from './collision.js';

const STEP = 1 / 60;

const Scene = {
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
  WIN: 'WIN',
};

// Single source of truth for score/lives/hiScore. Exported as one mutable
// object (not individual primitive exports) so sibling cards can write to
// its fields -- an imported `export let` binding is read-only at the
// importer and could never be mutated by player.js or collision.js.
export const hud = {
  score: 0,
  lives: STARTING_LIVES,
  hiScore: 0,
  playerHit: false,
};

// Invader bullets, owned here (not by collision.js) so a later card can push
// into it without importing the collision pass. Empty until the "they shoot
// back" card starts spawning into it; collision.js already iterates it every
// frame via checkInvaderBulletsVsPlayer below.
export const invaderBullets = [];

// Which level is live during Scene.PLAYING. An object (not a bare `export
// let`) for the same reason `hud` is one: sibling cards -- and the devtools
// console paths documented in README.md -- need to write `levelState.current`,
// and an imported `export let` binding is read-only at the importer.
export const levelState = { current: 1 };

let scene = Scene.TITLE;
let finalScore = 0;
let enterPressed = false;
let paused = false;
let pausePressed = false;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

window.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    enterPressed = true;
  }
  // event.repeat is true on the synthetic keydown events OS auto-repeat
  // fires while P stays held -- ignoring those is what makes the toggle
  // fire once per physical press no matter how long the key is held.
  if (event.code === 'KeyP' && !event.repeat) {
    pausePressed = true;
  }
});

initInput();

function startRun() {
  hud.score = 0;
  hud.lives = STARTING_LIVES;
  hud.playerHit = false;
  levelState.current = 1;
  Level1.reset();
  Level2.reset();
  Level3.reset();
  Boss.reset();
  Player.resetShotCount();
  paused = false;
  scene = Scene.PLAYING;
}

function endRun(nextScene) {
  finalScore = hud.score;
  hud.hiScore = Math.max(hud.score, hud.hiScore);
  scene = nextScene;
}

function updateTitle() {
  if (enterPressed) {
    startRun();
  }
}

function updateLevel1(dt) {
  // Level1.update() owns the formation's marching, wall drops, and the
  // invasion check -- an invasion decrements hud.lives and restarts the
  // level internally; it never ends the run itself.
  Level1.update(dt, Player, hud);

  // Collide only after every entity's update() has run this step, and
  // always before render() -- an invader killed here is already gone by
  // the time draw happens, never collide-inside-draw.
  checkPlayerBulletVsInvaders(Player, Level1.fleet, hud);
  checkInvaderBulletsVsPlayer(invaderBullets, Player, hud);

  if (hud.lives <= 0) {
    endRun(Scene.GAME_OVER);
    return;
  }

  if (Level1.isCleared()) {
    levelState.current = 2;
  }
}

function updateLevel2(dt) {
  // Level2.update() owns marching, invader fire and the bonus UFO; it never
  // ends the run or touches hud.lives itself -- every life-losing path is
  // decided here, right after this frame's hit detection, so a bullet hit
  // and a body-contact hit in the same frame can only ever cost one life.
  Level2.update(dt);

  checkPlayerBulletVsInvaders(Player, Level2.fleet, hud);
  Level2.checkUfoHit(Player, hud);
  checkInvaderBulletsVsPlayer(Level2.bullets, Player, hud);
  const bodyContact = Level2.checkPlayerContact(Player);

  // Player.invulnerable suppresses every damage source for the 2 s after a
  // respawn, per spec -- not just the bullet that triggered it.
  if ((hud.playerHit || bodyContact) && !Player.invulnerable) {
    hud.lives -= 1;
    Player.respawn();
  }

  if (hud.lives <= 0) {
    endRun(Scene.GAME_OVER);
    return;
  }

  if (Level2.isCleared()) {
    levelState.current = 3;
  }
}

function updateLevel3(dt) {
  // Level3.update() owns marching (single formation, then the two
  // independently-sweeping halves after the 28-kill split), invader fire,
  // and bunker erosion from descending invader bodies; it never ends the
  // run or touches hud.lives itself, same contract as updateLevel2.
  Level3.update(dt);

  // Bunkers sit between the invaders and the player, so each side's
  // projectile is tested against them first -- a bullet a bunker cell
  // stops is consumed there and never reaches the invaders/player check
  // below (Player.getBulletBounds() is already null by then).
  Level3.checkPlayerBulletVsBunkers(Player);
  checkPlayerBulletVsInvaders(Player, Level3.fleet, hud);
  Level3.checkInvaderBulletsVsBunkers();
  checkInvaderBulletsVsPlayer(Level3.bullets, Player, hud);
  const bodyContact = Level3.checkPlayerContact(Player);

  // Player.invulnerable suppresses every damage source for the 2 s after a
  // respawn, per spec -- not just the bullet that triggered it.
  if ((hud.playerHit || bodyContact) && !Player.invulnerable) {
    hud.lives -= 1;
    Player.respawn();
  }

  if (hud.lives <= 0) {
    endRun(Scene.GAME_OVER);
    return;
  }

  if (Level3.isCleared()) {
    levelState.current = 4;
  }
}

function updateBossLevel(dt) {
  Boss.update(dt);
  Boss.checkPlayerBulletHit(Player);

  // Level 4 is sudden death: a single boss projectile touching the player
  // ends the run immediately, regardless of hud.lives -- so this checks
  // hud.playerHit directly instead of ever decrementing lives.
  checkInvaderBulletsVsPlayer(Boss.bullets, Player, hud);
  if (hud.playerHit) {
    endRun(Scene.GAME_OVER);
    return;
  }

  if (Boss.hp <= 0) {
    endRun(Scene.WIN);
  }
}

function updatePlaying(dt) {
  Player.update(dt);

  switch (levelState.current) {
    case 1:
      updateLevel1(dt);
      break;
    case 2:
      updateLevel2(dt);
      break;
    case 3:
      updateLevel3(dt);
      break;
    case 4:
      updateBossLevel(dt);
      break;
    default:
      // Every level 1-4 has a branch above; an unknown level number ends
      // the run defensively instead of rendering nothing.
      endRun(Scene.GAME_OVER);
      break;
  }

  updateExplosions(dt);
}

function updateGameOver() {
  if (enterPressed) {
    scene = Scene.TITLE;
  }
}

function updateWin() {
  if (enterPressed) {
    startRun();
  }
}

function update(dt) {
  // The toggle only applies in PLAYING -- P is a no-op on Title/Game
  // Over/Win -- and is consumed here every call so a press made on another
  // scene never carries over and fires once PLAYING is reached.
  if (scene === Scene.PLAYING && pausePressed) {
    paused = !paused;
  }
  pausePressed = false;

  switch (scene) {
    case Scene.TITLE:
      updateTitle(dt);
      break;
    case Scene.PLAYING:
      // Skipping updatePlaying(dt) entirely while paused is what freezes
      // every simulation (marching, bullets, UFO, explosions, timers) in
      // place -- there is no separate frozen/not-frozen flag per system.
      if (!paused) {
        updatePlaying(dt);
      }
      break;
    case Scene.GAME_OVER:
      updateGameOver(dt);
      break;
    case Scene.WIN:
      updateWin(dt);
      break;
  }
  enterPressed = false;
}

function renderTitle() {
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '48px monospace';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  ctx.font = '20px monospace';
  ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

function renderPlaying() {
  switch (levelState.current) {
    case 1:
      Level1.draw(ctx);
      break;
    case 2:
      Level2.draw(ctx);
      break;
    case 3:
      Level3.draw(ctx);
      break;
    case 4:
      Boss.draw(ctx);
      break;
    default:
      // Every level 1-4 has a branch above; updatePlaying() already moves
      // the scene to GAME_OVER the same frame an unknown level number lands
      // here, so render() won't actually call this branch -- nothing to draw.
      break;
  }

  Player.draw(ctx);

  ctx.fillStyle = '#ffaa00';
  for (const explosion of getExplosions()) {
    ctx.fillRect(explosion.x, explosion.y, explosion.width, explosion.height);
  }

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.font = '20px monospace';
  ctx.fillText(`SCORE: ${hud.score}`, 16, 28);
  ctx.fillText(`LIVES: ${hud.lives}`, 16, 52);
  ctx.fillText(`LEVEL: ${levelState.current}`, 16, 76);
}

function renderPaused() {
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '48px monospace';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function renderGameOver() {
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '48px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  ctx.font = '28px monospace';
  ctx.fillText(`SCORE: ${finalScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  ctx.font = '20px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function renderWin() {
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '48px monospace';
  ctx.fillText('YOU WIN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  ctx.font = '28px monospace';
  ctx.fillText(`SCORE: ${finalScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  ctx.font = '20px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function render() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (scene) {
    case Scene.TITLE:
      renderTitle();
      break;
    case Scene.PLAYING:
      renderPlaying();
      if (paused) {
        renderPaused();
      }
      break;
    case Scene.GAME_OVER:
      renderGameOver();
      break;
    case Scene.WIN:
      renderWin();
      break;
  }
}

let lastTime = null;
let accumulator = 0;

function frame(timestamp) {
  if (lastTime === null) {
    lastTime = timestamp;
  }

  let frameDelta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  // Clamp before the step loop consumes it: a tab that was backgrounded
  // for seconds must not hand the accumulator a huge delta and fast-forward
  // through a burst of catch-up update() steps on return.
  if (frameDelta > MAX_FRAME_DELTA) {
    frameDelta = MAX_FRAME_DELTA;
  }

  accumulator += frameDelta;
  while (accumulator >= STEP) {
    update(STEP);
    accumulator -= STEP;
  }

  render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
