// game.js — Main entry point, scene manager, and game loop.
// ES module; loaded by index.html via <script type="module">.

import { initInput } from './input.js';
import { Player, CANVAS_WIDTH, BULLET_SPEED } from './player.js';
import { CANVAS_HEIGHT, STARTING_LIVES } from './gameConfig.js';
import { InvaderGrid } from './invaders.js';
import { checkBulletInvaderCollisions } from './collision.js';

// ─────────────────────────────────────────────
// Canvas setup
// ─────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ─────────────────────────────────────────────
// Scene registry
// ─────────────────────────────────────────────
/** @type {Map<string, {update:(dt:number)=>void, render:(ctx:CanvasRenderingContext2D)=>void}>} */
const scenes = new Map();
let activeScene = null;

/**
 * Register a named scene.
 * @param {string} name
 * @param {{update:(dt:number)=>void, render:(ctx:CanvasRenderingContext2D)=>void}} scene
 */
function registerScene(name, scene) {
  scenes.set(name, scene);
}

/**
 * Switch to a named scene immediately.
 * @param {string} name
 */
function switchScene(name) {
  if (!scenes.has(name)) {
    console.error(`switchScene: unknown scene "${name}"`);
    return;
  }
  activeScene = scenes.get(name);
}

// ─────────────────────────────────────────────
// HUD renderer (shared across game scenes)
// ─────────────────────────────────────────────
/**
 * Draw score and lives bar at the top of the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} score
 * @param {number} lives
 */
function renderHUD(ctx, score, lives) {
  ctx.save();
  ctx.font      = '20px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`SCORE: ${score}`, 16, 28);

  // Lives as small green triangles
  ctx.fillStyle = '#00ff00';
  for (let i = 0; i < lives; i++) {
    const lx = CANVAS_WIDTH - 30 - i * 26;
    const ly = 14;
    ctx.beginPath();
    ctx.moveTo(lx + 10, ly);
    ctx.lineTo(lx,      ly + 18);
    ctx.lineTo(lx + 20, ly + 18);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ─────────────────────────────────────────────
// ── MENU SCENE ──────────────────────────────
// ─────────────────────────────────────────────
const menuScene = (() => {
  let pressedLastFrame = false;

  return {
    update(_dt) {
      const { isKeyHeld } = window.__inputHandles__;
      const pressed = isKeyHeld(' ') || isKeyHeld('Enter');
      if (pressed && !pressedLastFrame) {
        switchScene('level1');
      }
      pressedLastFrame = pressed;
    },
    render(ctx) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

      ctx.font = '24px monospace';
      ctx.fillText('Press SPACE or ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

      ctx.font = '16px monospace';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText('Arrow Keys / A D to move   SPACE to fire', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      ctx.restore();
    },
  };
})();

// ─────────────────────────────────────────────
// ── GAME-OVER SCENE ─────────────────────────
// ─────────────────────────────────────────────
let gameOverScore = 0;
const gameOverScene = (() => {
  let pressedLastFrame = false;

  return {
    update(_dt) {
      const { isKeyHeld } = window.__inputHandles__;
      const pressed = isKeyHeld(' ') || isKeyHeld('Enter');
      if (pressed && !pressedLastFrame) {
        switchScene('menu');
      }
      pressedLastFrame = pressed;
    },
    render(ctx) {
      ctx.save();
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

      ctx.fillStyle = '#ffffff';
      ctx.font = '28px monospace';
      ctx.fillText(`SCORE: ${gameOverScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

      ctx.font = '20px monospace';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText('Press SPACE or ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
      ctx.restore();
    },
  };
})();

// ─────────────────────────────────────────────
// ── LEVEL 1 SCENE ───────────────────────────
// ─────────────────────────────────────────────

/** Pixel rows where the invader grid starts. */
const INVADER_START_Y = 80;

const level1Scene = (() => {
  let player  = null;
  let grid    = null;
  let score   = 0;
  let initialized = false;

  function init() {
    player  = new Player();
    grid    = new InvaderGrid({ speedMultiplier: 1.0, startY: INVADER_START_Y });
    score   = 0;
    initialized = true;
  }

  return {
    // Expose internals so Level 2 can read score/lives on transition
    get player()  { return player; },
    get score()   { return score;  },

    start() {
      init();
    },

    update(dt) {
      if (!initialized) init();

      player.update(dt);
      grid.update(dt);

      // ── Bullet → Invader collisions ──
      if (player.bullet) {
        const result = checkBulletInvaderCollisions(player.bullet, grid);
        if (result.hit) {
          score += result.points;
          player.bullet = null;
        }
      }

      // ── Level clear ──
      if (grid.allDefeated()) {
        // Pass score and lives into Level 2
        level2Scene.initFromLevel1(score, player.lives);
        switchScene('level2');
      }
    },

    render(ctx) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      grid.draw(ctx);
      player.draw(ctx);
      renderHUD(ctx, score, player.lives);
    },
  };
})();

// ─────────────────────────────────────────────
// ── LEVEL 2 SCENE ───────────────────────────
// ─────────────────────────────────────────────

/**
 * Level 2 configuration constants.
 */
const L2_SPEED_MULTIPLIER     = 1.6;   // invader grid moves 60% faster than Level 1's 1.0
const L2_INVADER_SHOT_SPEED   = 280;   // px/s downward
const L2_SHOT_MIN_DELAY       = 0.6;   // seconds between random shots (min)
const L2_SHOT_MAX_DELAY       = 2.2;   // seconds between random shots (max)
const L2_UFO_INTERVAL         = 18;    // seconds between UFO appearances
const L2_UFO_SPEED            = 130;   // px/s horizontal
const L2_UFO_Y                = 52;    // y-position of the UFO (centre)
const L2_UFO_W                = 56;    // UFO sprite width
const L2_UFO_H                = 22;    // UFO sprite height
const L2_INVULN_DURATION      = 2.0;   // seconds of invulnerability after being hit
const L2_FLASH_INTERVAL       = 0.12;  // seconds between flash toggles
/** Score tiers for UFO, indexed by playerShotCount % 4 */
const L2_UFO_SCORE_TIERS      = [50, 100, 150, 300];

/** Invader shot projectile dimensions */
const ISHOT_W = 4;
const ISHOT_H = 14;

const level2Scene = (() => {
  let player          = null;
  let grid            = null;
  let score           = 0;
  let invaderShots    = [];   // array of { x, y }
  let shotTimer       = 0;    // countdown to next shot
  let shotDelay       = 1.0;  // current delay (re-randomised after each shot)

  // UFO state
  let ufo             = null; // null when not on screen, else { x, y, dir: +1|-1 }
  let ufoTimer        = 0;    // countdown to next UFO spawn

  // Player shot counter (for UFO score tier)
  let playerShotCount = 0;
  let prevBulletNull  = true; // tracks rising edge of bullet creation

  // Invulnerability state
  let invulnTimer     = 0;    // > 0 means invulnerable
  let flashTimer      = 0;    // cycles flash
  let flashVisible    = true; // current flash state

  // Start-position for player respawn
  const PLAYER_START_X = CANVAS_WIDTH / 2 - 25; // 25 = SHIP_W/2
  const PLAYER_START_Y_OFFSET = 60;             // same as Player constructor: CANVAS_HEIGHT - 60 - SHIP_H

  /** Initialise (or re-initialise) from a Level 1 handoff. */
  function initFromLevel1(inheritedScore, inheritedLives) {
    player = new Player();
    player.lives = inheritedLives;  // override default STARTING_LIVES
    score  = inheritedScore;

    grid = new InvaderGrid({ speedMultiplier: L2_SPEED_MULTIPLIER, startY: INVADER_START_Y });

    invaderShots  = [];
    shotTimer     = _randomShotDelay();
    ufo           = null;
    ufoTimer      = L2_UFO_INTERVAL;
    playerShotCount = 0;
    prevBulletNull  = true;
    invulnTimer   = 0;
    flashTimer    = 0;
    flashVisible  = true;
  }

  function _randomShotDelay() {
    return L2_SHOT_MIN_DELAY + Math.random() * (L2_SHOT_MAX_DELAY - L2_SHOT_MIN_DELAY);
  }

  /** Return the bottom-most alive invader in each column, as an array of {x,y} centres. */
  function _getBottomInvaders(grid) {
    // grid.invaders is a 2-D array [row][col]
    const invaders = grid.invaders;
    if (!invaders || invaders.length === 0) return [];
    const cols = invaders[0].length;
    const result = [];
    for (let c = 0; c < cols; c++) {
      // Scan from bottom row upward
      for (let r = invaders.length - 1; r >= 0; r--) {
        const inv = invaders[r][c];
        if (inv && inv.alive) {
          result.push(inv);
          break;
        }
      }
    }
    return result;
  }

  /** Fire a shot from a random bottom invader. */
  function _fireInvaderShot(grid) {
    const candidates = _getBottomInvaders(grid);
    if (candidates.length === 0) return;
    const inv = candidates[Math.floor(Math.random() * candidates.length)];
    // Centre the shot on the invader
    invaderShots.push({
      x: inv.x + inv.w / 2 - ISHOT_W / 2,
      y: inv.y + inv.h,
    });
  }

  /** Draw a UFO-style saucer at the given position. */
  function _drawUFO(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = '#ff4444';
    // Bottom oval body
    ctx.beginPath();
    ctx.ellipse(x + L2_UFO_W / 2, y + L2_UFO_H * 0.7, L2_UFO_W / 2, L2_UFO_H * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    // Top dome
    ctx.fillStyle = '#ff8888';
    ctx.beginPath();
    ctx.ellipse(x + L2_UFO_W / 2, y + L2_UFO_H * 0.55, L2_UFO_W * 0.28, L2_UFO_H * 0.45, 0, Math.PI, 0);
    ctx.fill();
    ctx.restore();
  }

  return {
    initFromLevel1,

    update(dt) {
      if (!player) return; // safety guard before first init

      // ── Track player shot count (rising edge of bullet spawn) ──
      const bulletExists = player.bullet !== null;
      if (bulletExists && prevBulletNull) {
        playerShotCount++;
      }
      prevBulletNull = !bulletExists;

      // ── Invulnerability countdown ──
      if (invulnTimer > 0) {
        invulnTimer -= dt;
        flashTimer  -= dt;
        if (flashTimer <= 0) {
          flashVisible = !flashVisible;
          flashTimer   = L2_FLASH_INTERVAL;
        }
        if (invulnTimer <= 0) {
          invulnTimer  = 0;
          flashVisible = true; // ensure fully visible when window ends
        }
      }

      // ── Player update ──
      player.update(dt);

      // ── Grid update ──
      grid.update(dt);

      // ── Player bullet → Invader collisions ──
      if (player.bullet) {
        const result = checkBulletInvaderCollisions(player.bullet, grid);
        if (result.hit) {
          score += result.points;
          player.bullet = null;
        }
      }

      // ── Player bullet → UFO collision ──
      if (player.bullet && ufo) {
        const bx = player.bullet.x;
        const by = player.bullet.y;
        if (
          bx < ufo.x + L2_UFO_W &&
          bx + 4 > ufo.x &&        // 4 = BULLET_W from player.js
          by < ufo.y + L2_UFO_H &&
          by + 14 > ufo.y           // 14 = BULLET_H from player.js
        ) {
          const tier = playerShotCount % 4;
          score += L2_UFO_SCORE_TIERS[tier];
          ufo = null;
          player.bullet = null;
        }
      }

      // ── Invader shot timer ──
      shotTimer -= dt;
      if (shotTimer <= 0) {
        _fireInvaderShot(grid);
        shotTimer = _randomShotDelay();
      }

      // ── Move invader shots ──
      for (const shot of invaderShots) {
        shot.y += L2_INVADER_SHOT_SPEED * dt;
      }

      // ── Invader shot → Player collision ──
      if (invulnTimer <= 0) {
        for (let i = invaderShots.length - 1; i >= 0; i--) {
          const shot = invaderShots[i];
          // Player bounding box
          const px = player.x;
          const py = player.y;
          const pw = 50; // SHIP_W
          const ph = 30; // SHIP_H
          if (
            shot.x < px + pw &&
            shot.x + ISHOT_W > px &&
            shot.y < py + ph &&
            shot.y + ISHOT_H > py
          ) {
            invaderShots.splice(i, 1);
            player.lives -= 1;
            if (player.lives <= 0) {
              gameOverScore = score;
              switchScene('gameover');
              return;
            }
            // Respawn player
            player.x      = PLAYER_START_X;
            player.bullet = null;
            // Begin invulnerability
            invulnTimer  = L2_INVULN_DURATION;
            flashTimer   = L2_FLASH_INTERVAL;
            flashVisible = false;
            break; // only one hit per frame
          }
        }
      }

      // ── Remove invader shots that exit the canvas ──
      invaderShots = invaderShots.filter(s => s.y <= CANVAS_HEIGHT);

      // ── UFO timer / spawn ──
      ufoTimer -= dt;
      if (ufoTimer <= 0 && ufo === null) {
        // Alternate direction based on spawn count for variety
        const dir = (Math.floor(ufoTimer * -1) % 2 === 0) ? 1 : -1;
        ufo = {
          x:   dir === 1 ? -L2_UFO_W : CANVAS_WIDTH,
          y:   L2_UFO_Y - L2_UFO_H / 2,
          dir: dir,
        };
        ufoTimer = L2_UFO_INTERVAL;
      }

      // ── Move UFO ──
      if (ufo) {
        ufo.x += L2_UFO_SPEED * ufo.dir * dt;
        // Remove if off-screen
        if (ufo.x + L2_UFO_W < 0 || ufo.x > CANVAS_WIDTH) {
          ufo = null;
        }
      }

      // ── Level clear ──
      if (grid.allDefeated()) {
        // For now: go back to menu (future: Level 3)
        gameOverScore = score;
        switchScene('menu');
      }
    },

    render(ctx) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw grid
      grid.draw(ctx);

      // Draw UFO
      if (ufo) {
        _drawUFO(ctx, ufo.x, ufo.y);
      }

      // Draw invader shots
      ctx.fillStyle = '#ff6600';
      for (const shot of invaderShots) {
        ctx.fillRect(shot.x, shot.y, ISHOT_W, ISHOT_H);
      }

      // Draw player (respecting flash)
      if (flashVisible) {
        player.draw(ctx);
      }

      // Draw HUD
      renderHUD(ctx, score, player.lives);

      // Draw level indicator
      ctx.save();
      ctx.font      = '16px monospace';
      ctx.fillStyle = '#aaaaaa';
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL 2', CANVAS_WIDTH / 2, 24);
      ctx.restore();
    },
  };
})();

// ─────────────────────────────────────────────
// ── Wire up scenes ──────────────────────────
// ─────────────────────────────────────────────
registerScene('menu',     menuScene);
registerScene('level1',   level1Scene);
registerScene('level2',   level2Scene);
registerScene('gameover', gameOverScene);

// ─────────────────────────────────────────────
// ── Bootstrap ───────────────────────────────
// ─────────────────────────────────────────────
initInput();

// Expose isKeyHeld to scenes (avoids a circular import through game.js)
import { isKeyHeld } from './input.js';
window.__inputHandles__ = { isKeyHeld };

// Kick off at the menu
switchScene('menu');
level1Scene.start(); // pre-warm level1 so it's ready immediately

// ─────────────────────────────────────────────
// ── Game loop ───────────────────────────────
// ─────────────────────────────────────────────
const MAX_DT = 1 / 20; // cap at 50 ms to avoid spiral of death
let lastTimestamp = null;

/**
 * One iteration of the game loop.
 * @param {DOMHighResTimeStamp} timestamp
 */
function loop(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const rawDt = (timestamp - lastTimestamp) / 1000;
  const dt    = Math.min(rawDt, MAX_DT);
  lastTimestamp = timestamp;

  if (activeScene) {
    activeScene.update(dt);
    activeScene.render(ctx);
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
