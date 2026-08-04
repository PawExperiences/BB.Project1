// game.js — Fixed-timestep game loop, scene state machine, HUD renderer.
// Exported: hud, switchScene, renderHUD

import { initInput, isKeyHeld } from './input.js';
import { Player } from './player.js';
import { InvaderGrid, SplitInvaderGrid } from './invaders.js';
import {
  checkBulletInvaderCollisions,
  checkInvaderBulletPlayerCollision,
  checkBulletBunkerCollisions,
} from './collision.js';
import { ShieldManager } from './shields.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STARTING_LIVES,
  SCORE_PER_KILL,
} from './gameConfig.js';

// ─────────────────────────────────────────────
// Canvas setup
// ─────────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
canvas.width  = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

// ─────────────────────────────────────────────
// HUD state (exported for testing)
// ─────────────────────────────────────────────

export const hud = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
  level:   1,
};

// ─────────────────────────────────────────────
// Scene state machine
// ─────────────────────────────────────────────

/** @type {'Title'|'Playing'|'GameOver'} */
let currentScene = 'Title';

/**
 * Switch to a new scene and perform scene setup.
 * @param {'Title'|'Playing'|'GameOver'} name
 */
export function switchScene(name) {
  currentScene = name;
  if (name === 'Playing') {
    startLevel(hud.level);
  }
}

// ─────────────────────────────────────────────
// Level management
// ─────────────────────────────────────────────

let player       = null;
let grid         = null;
let shields      = null; // ShieldManager — only active in Level 3

// Level 2: invader bullets and UFO
let invaderBullets  = []; // Array of { x, y, col } objects
let ufo             = null; // { x, y, alive, points } or null
let ufoTimer        = 0;   // seconds until next UFO spawn
let playerShotCount = 0;   // for UFO scoring

// Respawn invulnerability
let invulnTimer     = 0;   // seconds remaining
const INVULN_DURATION = 1.5;

// Invader bullet parameters
const INV_BULLET_W  = 4;
const INV_BULLET_H  = 10;
const INV_BULLET_SPEED = 220; // px/s downward

// UFO parameters
const UFO_W      = 48;
const UFO_H      = 20;
const UFO_SPEED  = 130; // px/s
const UFO_POINTS = [50, 100, 150, 300];
const UFO_Y      = 40;

// Level 3
let level3KillCount = 0;

/**
 * Initialise all game objects for the given level.
 * @param {number} level
 */
function startLevel(level) {
  hud.level = level;

  // Reset invader bullets and UFO for a clean level start
  invaderBullets  = [];
  ufo             = null;
  ufoTimer        = randomUFODelay();
  playerShotCount = 0;
  invulnTimer     = 0;

  // Player: carry lives across levels, reset position
  if (!player || level === 1) {
    player = new Player();
    player.lives = hud.lives;
  } else {
    // Reposition player ship without resetting lives
    player.x = CANVAS_WIDTH / 2 - 25;
    player.bullet = null;
  }
  player.lives = hud.lives;

  // Speed multiplier increases per level
  const speedMultiplier = level === 1 ? 1 : level === 2 ? 1.5 : 2;

  if (level === 3) {
    grid = new SplitInvaderGrid({ speedMultiplier, startY: 80 });
    shields = new ShieldManager();
    level3KillCount = 0;
  } else {
    grid = new InvaderGrid({ speedMultiplier, startY: 80 });
    shields = null;
  }
}

function randomUFODelay() {
  return 15 + Math.random() * 20; // 15–35 s
}

// ─────────────────────────────────────────────
// Game loop — fixed timestep
// ─────────────────────────────────────────────

const STEP_MS  = 1000 / 60;  // ~16.67 ms
const CAP_MS   = 200;         // max accumulated delta

let lastTime   = 0;
let accumMs    = 0;

initInput();

// Title blink state
let blinkTimer = 0;
let blinkVisible = true;

requestAnimationFrame(loop);

function loop(timestamp) {
  const raw    = timestamp - lastTime;
  lastTime     = timestamp;
  const deltaMs = Math.min(raw, CAP_MS);
  accumMs      += deltaMs;

  while (accumMs >= STEP_MS) {
    accumMs -= STEP_MS;
    update(STEP_MS / 1000);
  }

  render();
  requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────
// Update
// ─────────────────────────────────────────────

function update(dt) {
  switch (currentScene) {
    case 'Title':    updateTitle(dt);   break;
    case 'Playing':  updatePlaying(dt); break;
    case 'GameOver': updateGameOver(dt); break;
  }
}

function updateTitle(dt) {
  blinkTimer += dt;
  if (blinkTimer >= 0.5) { blinkTimer = 0; blinkVisible = !blinkVisible; }
  if (isKeyHeld('Enter')) {
    hud.score = 0;
    hud.lives = STARTING_LIVES;
    hud.level = 1;
    switchScene('Playing');
  }
}

function updateGameOver(dt) {
  if (isKeyHeld('Enter')) {
    switchScene('Title');
  }
}

function updatePlaying(dt) {
  // ── Invulnerability timer ──
  if (invulnTimer > 0) invulnTimer -= dt;

  // ── Player update ──
  const prevBullet = player.bullet;
  player.update(dt);
  // Count shots fired (for UFO scoring)
  if (!prevBullet && player.bullet) playerShotCount++;

  // ── Grid update ──
  grid.update(dt);

  // ── Invader bullets (Level 2+) ──
  if (hud.level >= 2) {
    updateInvaderBullets(dt);
  }

  // ── UFO (Level 2+) ──
  if (hud.level >= 2) {
    updateUFO(dt);
  }

  // ── Collision: player bullet vs invaders ──
  if (player.bullet) {
    const result = checkBulletInvaderCollisions(player.bullet, grid);
    if (result.hit) {
      hud.score += result.points;
      if (hud.score > hud.hiScore) hud.hiScore = hud.score;
      player.bullet = null;
      // Level 3: track kills and trigger split
      if (hud.level === 3) {
        level3KillCount++;
        /** @type {SplitInvaderGrid} */ (grid).maybeSplit();
      }
    }
  }

  // ── Collision: player bullet vs UFO ──
  if (hud.level >= 2 && player.bullet && ufo && ufo.alive) {
    const bx = player.bullet.x;
    const by = player.bullet.y;
    if (
      bx + 4  > ufo.x        &&
      bx      < ufo.x + UFO_W &&
      by + 14 > ufo.y        &&
      by      < ufo.y + UFO_H
    ) {
      hud.score += ufo.points;
      if (hud.score > hud.hiScore) hud.hiScore = hud.score;
      player.bullet = null;
      ufo.alive = false;
    }
  }

  // ── Collision: player bullet vs bunkers (Level 3) ──
  if (hud.level === 3 && player.bullet && shields) {
    const bunkerHit = checkBulletBunkerCollisions(player.bullet, 4, 14, shields);
    if (bunkerHit.hit) {
      player.bullet = null;
    }
  }

  // ── Collision: invader bullets vs player ──
  if (!invulnTimer || invulnTimer <= 0) {
    for (let i = invaderBullets.length - 1; i >= 0; i--) {
      const ib = invaderBullets[i];
      const result = checkInvaderBulletPlayerCollision(ib, player);
      if (result.hit) {
        invaderBullets.splice(i, 1);
        hud.lives--;
        player.lives = hud.lives;
        invulnTimer = INVULN_DURATION;
        if (hud.lives <= 0) {
          switchScene('GameOver');
          return;
        }
        break;
      }
    }
  }

  // ── Collision: invader bullets vs bunkers (Level 3) ──
  if (hud.level === 3 && shields) {
    for (let i = invaderBullets.length - 1; i >= 0; i--) {
      const ib = invaderBullets[i];
      const bunkerHit = checkBulletBunkerCollisions(ib, INV_BULLET_W, INV_BULLET_H, shields);
      if (bunkerHit.hit) {
        invaderBullets.splice(i, 1);
      }
    }
  }

  // ── Lose condition: invader reaches player ──
  const bottomY = grid.bottomY();
  if (bottomY !== -Infinity && bottomY >= player.y) {
    hud.lives--;
    player.lives = hud.lives;
    if (hud.lives <= 0) {
      switchScene('GameOver');
      return;
    }
    // Restart current level
    startLevel(hud.level);
    return;
  }

  // ── Win condition: all invaders defeated ──
  if (grid.allDefeated()) {
    const nextLevel = hud.level + 1;
    if (nextLevel > 3) {
      // After Level 3: Game Over (boss not implemented yet)
      switchScene('GameOver');
    } else {
      hud.level = nextLevel;
      startLevel(nextLevel);
    }
    return;
  }
}

// ── Invader bullets ────────────────────────────────────────────────────────

/** Seconds between invader bullet fires per column. */
const INV_FIRE_INTERVAL_MIN = 0.8;
const INV_FIRE_INTERVAL_MAX = 2.5;

let invFireTimers = []; // one timer per column

function initInvFireTimers() {
  invFireTimers = [];
  for (let c = 0; c < 11; c++) {
    invFireTimers.push(INV_FIRE_INTERVAL_MIN + Math.random() * (INV_FIRE_INTERVAL_MAX - INV_FIRE_INTERVAL_MIN));
  }
}

function updateInvaderBullets(dt) {
  // Init timers if needed
  if (invFireTimers.length === 0) initInvFireTimers();

  // Tick each column's fire timer
  for (let c = 0; c < 11; c++) {
    invFireTimers[c] -= dt;
    if (invFireTimers[c] <= 0) {
      invFireTimers[c] = INV_FIRE_INTERVAL_MIN + Math.random() * (INV_FIRE_INTERVAL_MAX - INV_FIRE_INTERVAL_MIN);

      // Find the lowest alive invader in column c
      let lowestInv = null;
      // Check main grid first, or split halves
      const allInvaders = (typeof grid.aliveInvadersList === 'function')
        ? grid.aliveInvadersList()
        : grid.invaders.flat().filter(i => i.alive);

      // Filter to column c — use inv.col if available, otherwise derive
      for (const inv of allInvaders) {
        const col = (inv.col !== undefined) ? inv.col
                  : Math.round((inv.x - 16) / (36 + 16));
        if (col !== c) continue;
        if (!lowestInv || inv.y > lowestInv.y) lowestInv = inv;
      }

      if (lowestInv) {
        invaderBullets.push({
          x: lowestInv.x + lowestInv.w / 2 - INV_BULLET_W / 2,
          y: lowestInv.y + lowestInv.h,
        });
      }
    }
  }

  // Move existing bullets
  for (let i = invaderBullets.length - 1; i >= 0; i--) {
    invaderBullets[i].y += INV_BULLET_SPEED * dt;
    if (invaderBullets[i].y > CANVAS_HEIGHT) {
      invaderBullets.splice(i, 1);
    }
  }
}

// ── UFO ───────────────────────────────────────────────────────────────────

function updateUFO(dt) {
  if (ufo && ufo.alive) {
    ufo.x += UFO_SPEED * ufo.dir;
    if (ufo.dir > 0 && ufo.x > CANVAS_WIDTH + UFO_W) {
      ufo = null;
      ufoTimer = randomUFODelay();
    } else if (ufo.dir < 0 && ufo.x + UFO_W < 0) {
      ufo = null;
      ufoTimer = randomUFODelay();
    }
  } else if (!ufo) {
    ufoTimer -= dt;
    if (ufoTimer <= 0) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const pts = UFO_POINTS[playerShotCount % 4];
      ufo = {
        x:     dir > 0 ? -UFO_W : CANVAS_WIDTH,
        y:     UFO_Y,
        alive: true,
        dir,
        points: pts,
      };
    }
  }
}

// ─────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────

function render() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  switch (currentScene) {
    case 'Title':    renderTitle();   break;
    case 'Playing':  renderPlaying(); break;
    case 'GameOver': renderGameOver(); break;
  }
}

export function renderHUD() {
  ctx.save();
  ctx.font      = 'bold 18px monospace';
  ctx.fillStyle = '#ffffff';

  // Score — top left
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${hud.score}`, 16, 28);

  // Hi-score — top centre
  ctx.textAlign = 'center';
  ctx.fillText(`HI  ${hud.hiScore}`, CANVAS_WIDTH / 2, 28);

  // Lives — top right
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES  ${hud.lives}`, CANVAS_WIDTH - 16, 28);

  // Level — below hi-score
  ctx.textAlign = 'center';
  ctx.fillText(`LEVEL  ${hud.level}`, CANVAS_WIDTH / 2, 52);

  ctx.restore();
}

function renderTitle() {
  ctx.save();

  ctx.fillStyle = '#00ff00';
  ctx.font      = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  if (blinkVisible) {
    ctx.fillStyle = '#ffffff';
    ctx.font      = '24px monospace';
    ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }

  ctx.restore();
}

function renderPlaying() {
  renderHUD();

  // Draw grid (handles both pre-split and post-split rendering)
  grid.draw(ctx);

  // Draw shields (Level 3 only)
  if (hud.level === 3 && shields) {
    shields.draw(ctx);
  }

  // Draw player (with invulnerability blink)
  const showPlayer = invulnTimer <= 0 || Math.floor(invulnTimer * 10) % 2 === 0;
  if (showPlayer) {
    player.draw(ctx);
  }

  // Draw invader bullets
  ctx.fillStyle = '#ff4444';
  for (const ib of invaderBullets) {
    ctx.fillRect(ib.x, ib.y, INV_BULLET_W, INV_BULLET_H);
  }

  // Draw UFO
  if (ufo && ufo.alive) {
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(ufo.x, ufo.y, UFO_W, UFO_H);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('UFO', ufo.x + UFO_W / 2, ufo.y + UFO_H - 4);
  }
}

function renderGameOver() {
  ctx.save();

  ctx.fillStyle = '#ff0000';
  ctx.font      = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '24px monospace';
  ctx.fillText(`SCORE: ${hud.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  if (blinkVisible) {
    ctx.fillText('Press ENTER to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  }

  ctx.restore();
}
