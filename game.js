// game.js — Game loop, scene state machine, HUD renderer.
// Entry point loaded as an ES module by index.html.

import { initInput, isKeyHeld } from './input.js';
import { Player } from './player.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STARTING_LIVES,
  SCORE_PER_KILL,
  EXPLOSION_DURATION_MS,
} from './gameConfig.js';
import { InvaderGrid, SplitInvaderGrid } from './invaders.js';
import { ShieldManager } from './shields.js';
import {
  checkBulletInvaderCollisions,
  checkInvaderBulletPlayerCollision,
  checkBulletBunkerCollisions,
} from './collision.js';

// ─────────────────────────────────────────────────────────────
// Canvas setup
// ─────────────────────────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ─────────────────────────────────────────────────────────────
// HUD state (exported so scenes can read/write it)
// ─────────────────────────────────────────────────────────────

export const hud = {
  score:   0,
  hiScore: 0,
  lives:   STARTING_LIVES,
  level:   1,
};

// ─────────────────────────────────────────────────────────────
// Scene registry & switchScene
// ─────────────────────────────────────────────────────────────

/** @type {Map<string, () => object>} */
const sceneFactories = new Map();

/** Currently active scene object. */
let currentScene = null;

/**
 * Register a scene factory under a given name.
 * @param {string} name
 * @param {() => { update(dt:number):void, draw(ctx:CanvasRenderingContext2D):void, destroy?():void }} factory
 */
function registerScene(name, factory) {
  sceneFactories.set(name, factory);
}

/**
 * Transition to a named scene. Calls destroy() on the outgoing scene (if it
 * has one), then constructs the new scene via its factory.
 * @param {string} name
 */
export function switchScene(name) {
  if (currentScene && typeof currentScene.destroy === 'function') {
    currentScene.destroy();
  }
  const factory = sceneFactories.get(name);
  if (!factory) throw new Error(`Unknown scene: "${name}"`);
  currentScene = factory();
}

// ─────────────────────────────────────────────────────────────
// Fixed-timestep game loop
// ─────────────────────────────────────────────────────────────

const FIXED_STEP_MS  = 1000 / 60;   // ~16.67 ms
const MAX_DELTA_MS   = 250;         // delta cap to avoid spiral-of-death

let lastTimestamp = null;
let accumulator   = 0;

/**
 * Main loop — called every animation frame by the browser.
 * @param {number} timestamp  DOMHighResTimeStamp from requestAnimationFrame.
 */
function loop(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;
  let delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Cap the delta so a tabbed-out browser doesn't cause a burst of updates.
  if (delta > MAX_DELTA_MS) delta = MAX_DELTA_MS;
  accumulator += delta;

  // Drain the accumulator with fixed-size steps.
  while (accumulator >= FIXED_STEP_MS) {
    if (currentScene) currentScene.update(FIXED_STEP_MS / 1000);
    accumulator -= FIXED_STEP_MS;
  }

  // Clear canvas and draw the current scene.
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (currentScene) currentScene.draw(ctx);

  requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────────────────────
// HUD renderer (shared across Playing scenes)
// ─────────────────────────────────────────────────────────────

function drawHUD(ctx) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';

  // Score — top-left
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${hud.score}`, 16, 24);

  // Hi-score — top-centre
  ctx.textAlign = 'center';
  ctx.fillText(`HI  ${hud.hiScore}`, CANVAS_WIDTH / 2, 24);

  // Lives — top-right
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES  ${hud.lives}`, CANVAS_WIDTH - 16, 24);

  // Level — second row, centred
  ctx.textAlign = 'center';
  ctx.fillText(`LEVEL  ${hud.level}`, CANVAS_WIDTH / 2, 44);

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// MenuScene (Title screen)
// ─────────────────────────────────────────────────────────────

class MenuScene {
  constructor() {
    this._blinkTimer  = 0;
    this._showPrompt  = true;
  }

  destroy() {}

  update(dt) {
    // Blink the prompt at ~1 Hz
    this._blinkTimer += dt;
    if (this._blinkTimer >= 0.5) {
      this._showPrompt  = !this._showPrompt;
      this._blinkTimer -= 0.5;
    }

    if (isKeyHeld('Enter')) {
      switchScene('level1');
    }
  }

  draw(ctx) {
    ctx.save();

    // Title
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    // Prompt (blinking)
    if (this._showPrompt) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
// Level1Scene
// ─────────────────────────────────────────────────────────────

class Level1Scene {
  constructor() {
    hud.level = 1;
    hud.lives = STARTING_LIVES;
    // NOTE: score is NOT reset here; it carries over from previous scenes
    // (For a fresh game the score is already 0 from MenuScene startup)
    this._player = new Player();
    this._grid   = new InvaderGrid();
  }

  destroy() {}

  update(dt) {
    this._player.update(dt);
    this._grid.update(dt);

    // ── Player bullet vs invaders ──────────────────────────────
    if (this._player.bullet) {
      const result = checkBulletInvaderCollisions(this._player.bullet, this._grid);
      if (result.hit) {
        hud.score += result.points;
        if (hud.score > hud.hiScore) hud.hiScore = hud.score;
        this._player.bullet = null;
      }
    }

    // ── Invader bullets vs player ──────────────────────────────
    const invBullets = this._grid.bullets || [];
    for (let i = invBullets.length - 1; i >= 0; i--) {
      const b = invBullets[i];
      const result = checkInvaderBulletPlayerCollision(b, this._player);
      if (result.hit) {
        invBullets.splice(i, 1);
        hud.lives--;
        if (hud.lives <= 0) {
          switchScene('gameover');
          return;
        }
        // restart level
        switchScene('level1');
        return;
      }
    }

    // ── Invader reaches player row → lose a life ───────────────
    if (this._grid.hasReachedPlayer(this._player.y)) {
      hud.lives--;
      if (hud.lives <= 0) {
        switchScene('gameover');
        return;
      }
      switchScene('level1');
      return;
    }

    // ── Win condition ──────────────────────────────────────────
    if (this._grid.allDefeated()) {
      switchScene('level2');
    }
  }

  draw(ctx) {
    drawHUD(ctx);
    this._player.draw(ctx);
    this._grid.draw(ctx);
  }
}

// ─────────────────────────────────────────────────────────────
// Level2Scene
// ─────────────────────────────────────────────────────────────

class Level2Scene {
  constructor() {
    hud.level = 2;
    // lives carry over from Level 1
    this._player = new Player();
    this._player.lives = hud.lives;
    this._grid   = new InvaderGrid({ speedMultiplier: 1.5 });

    // UFO state
    this._ufo        = null;   // { x, y, points }
    this._ufoTimer   = 0;
    this._ufoInterval= 15 + Math.random() * 10; // seconds between UFOs
    this._shotCount  = 0;
    this._ufoPoints  = [50, 100, 150, 300];

    // Invulnerability after hit
    this._invulnTimer = 0;
    this._invulnDuration = 1.5;
  }

  destroy() {}

  update(dt) {
    // Invulnerability countdown
    if (this._invulnTimer > 0) this._invulnTimer -= dt;

    this._player.update(dt);
    this._grid.update(dt);

    // Track shots for UFO scoring
    if (this._player.bullet && !this._lastBulletState) this._shotCount++;
    this._lastBulletState = !!this._player.bullet;

    // ── UFO logic ──────────────────────────────────────────────
    this._ufoTimer += dt;
    if (!this._ufo && this._ufoTimer >= this._ufoInterval) {
      this._ufo = { x: -60, y: 40, width: 60, height: 20 };
      this._ufoTimer = 0;
      this._ufoInterval = 15 + Math.random() * 10;
    }
    if (this._ufo) {
      this._ufo.x += 120 * dt;
      if (this._ufo.x > CANVAS_WIDTH + 80) this._ufo = null;
    }

    // ── Player bullet vs invaders ──────────────────────────────
    if (this._player.bullet) {
      // Check UFO
      if (this._ufo) {
        const b = this._player.bullet;
        if (
          b.x < this._ufo.x + this._ufo.width  &&
          b.x + 4 > this._ufo.x &&
          b.y < this._ufo.y + this._ufo.height &&
          b.y + 14 > this._ufo.y
        ) {
          const pts = this._ufoPoints[this._shotCount % 4];
          hud.score += pts;
          if (hud.score > hud.hiScore) hud.hiScore = hud.score;
          this._player.bullet = null;
          this._ufo = null;
        }
      }

      if (this._player.bullet) {
        const result = checkBulletInvaderCollisions(this._player.bullet, this._grid);
        if (result.hit) {
          hud.score += result.points;
          if (hud.score > hud.hiScore) hud.hiScore = hud.score;
          this._player.bullet = null;
        }
      }
    }

    // ── Invader bullets vs player ──────────────────────────────
    if (this._invulnTimer <= 0) {
      const invBullets = this._grid.bullets || [];
      for (let i = invBullets.length - 1; i >= 0; i--) {
        const b = invBullets[i];
        const result = checkInvaderBulletPlayerCollision(b, this._player);
        if (result.hit) {
          invBullets.splice(i, 1);
          hud.lives--;
          hud.lives = Math.max(hud.lives, 0);
          if (hud.lives <= 0) {
            switchScene('gameover');
            return;
          }
          this._invulnTimer = this._invulnDuration;
          break;
        }
      }
    }

    // ── Invader reaches player row → lose a life ───────────────
    if (this._grid.hasReachedPlayer(this._player.y)) {
      hud.lives--;
      if (hud.lives <= 0) {
        switchScene('gameover');
        return;
      }
      switchScene('level2');
      return;
    }

    // ── Win condition ──────────────────────────────────────────
    if (this._grid.allDefeated()) {
      switchScene('level3');
    }
  }

  draw(ctx) {
    drawHUD(ctx);

    // Draw UFO
    if (this._ufo) {
      ctx.save();
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(this._ufo.x, this._ufo.y, this._ufo.width, this._ufo.height);
      ctx.restore();
    }

    // Player (flashing when invulnerable)
    const showPlayer = this._invulnTimer <= 0 || Math.floor(this._invulnTimer * 8) % 2 === 0;
    if (showPlayer) this._player.draw(ctx);

    this._grid.draw(ctx);
  }
}

// ─────────────────────────────────────────────────────────────
// Level3Scene
// ─────────────────────────────────────────────────────────────

class Level3Scene {
  constructor() {
    hud.level = 3;
    this._player = new Player();
    this._player.lives = hud.lives;
    this._grid   = new SplitInvaderGrid();
    this._shields = new ShieldManager();

    // Invulnerability after hit
    this._invulnTimer    = 0;
    this._invulnDuration = 1.5;
  }

  destroy() {}

  update(dt) {
    if (this._invulnTimer > 0) this._invulnTimer -= dt;

    this._player.update(dt);
    this._grid.update(dt);

    // ── Player bullet vs bunkers ───────────────────────────────
    if (this._player.bullet) {
      const hit = checkBulletBunkerCollisions(
        this._player.bullet, 4, 14, this._shields
      );
      if (hit.hit) {
        this._player.bullet = null;
      }
    }

    // ── Player bullet vs invaders ──────────────────────────────
    if (this._player.bullet) {
      const result = checkBulletInvaderCollisions(this._player.bullet, this._grid);
      if (result.hit) {
        hud.score += result.points;
        if (hud.score > hud.hiScore) hud.hiScore = hud.score;
        this._player.bullet = null;
        // Trigger split if threshold reached
        if (typeof this._grid.maybeSplit === 'function') {
          this._grid.maybeSplit();
        }
      }
    }

    // ── Invader bullets vs bunkers ─────────────────────────────
    const invBullets = this._grid.bullets || [];
    for (let i = invBullets.length - 1; i >= 0; i--) {
      const b = invBullets[i];
      const hit = checkBulletBunkerCollisions(b, 4, 10, this._shields);
      if (hit.hit) {
        invBullets.splice(i, 1);
      }
    }

    // ── Invader bullets vs player ──────────────────────────────
    if (this._invulnTimer <= 0) {
      for (let i = invBullets.length - 1; i >= 0; i--) {
        const b = invBullets[i];
        const result = checkInvaderBulletPlayerCollision(b, this._player);
        if (result.hit) {
          invBullets.splice(i, 1);
          hud.lives--;
          hud.lives = Math.max(hud.lives, 0);
          if (hud.lives <= 0) {
            switchScene('gameover');
            return;
          }
          this._invulnTimer = this._invulnDuration;
          break;
        }
      }
    }

    // ── Invader reaches player row → lose a life ───────────────
    if (this._grid.hasReachedPlayer && this._grid.hasReachedPlayer(this._player.y)) {
      hud.lives--;
      if (hud.lives <= 0) {
        switchScene('gameover');
        return;
      }
      this._shields.reset();
      switchScene('level3');
      return;
    }

    // ── Win condition ──────────────────────────────────────────
    if (this._grid.allDefeated()) {
      switchScene('boss');
    }
  }

  draw(ctx) {
    drawHUD(ctx);
    this._shields.draw(ctx);
    this._player.draw(ctx);
    this._grid.draw(ctx);
  }
}

// ─────────────────────────────────────────────────────────────
// BossScene
// ─────────────────────────────────────────────────────────────

/** Boss dimensions */
const BOSS_W = 120;
const BOSS_H = 60;
/** Boss horizontal centre position */
const BOSS_X = CANVAS_WIDTH / 2 - BOSS_W / 2;
/** Boss Y position (upper portion of screen) */
const BOSS_Y = 80;
/** Boss starting HP */
const BOSS_MAX_HP = 10;
/** Boss bullet dimensions */
const BOSS_BULLET_W = 6;
const BOSS_BULLET_H = 16;
/** Boss bullet speed (pixels per second, downward) */
const BOSS_BULLET_SPEED = 300;
/** Health bar layout */
const HP_BAR_X = CANVAS_WIDTH / 2 - 150;
const HP_BAR_Y = BOSS_Y + BOSS_H + 10;
const HP_BAR_W = 300;
const HP_BAR_H = 14;

class BossScene {
  constructor() {
    hud.level = 4;
    // Carry score and lives from previous scenes
    this._player = new Player();
    this._player.lives = hud.lives;

    this._hp = BOSS_MAX_HP;
    this._phase = 1;          // 1 or 2

    // Accumulated fire timer
    this._fireTimer = 0;

    // Active boss bullets: array of { x, y }
    this._bossBullets = [];
  }

  destroy() {
    // Clear boss bullets so none survive the scene transition
    this._bossBullets = [];
  }

  /**
   * Returns the current fire interval in milliseconds based on phase.
   * Phase 1 (HP 10–6): 2000 ms
   * Phase 2 (HP 5–0):  1000 ms
   * @returns {number}
   */
  _currentFireInterval() {
    return this._phase === 1 ? 2000 : 1000;
  }

  update(dt) {
    // ── Phase transition check ─────────────────────────────────
    if (this._hp <= 5 && this._phase === 1) {
      this._phase = 2;
    }

    // ── Player update ──────────────────────────────────────────
    this._player.update(dt);

    // ── Player bullet vs boss ──────────────────────────────────
    if (this._player.bullet) {
      const bx = this._player.bullet.x;
      const by = this._player.bullet.y;
      const bw = 4;
      const bh = 14;
      if (
        bx        < BOSS_X + BOSS_W &&
        bx + bw   > BOSS_X         &&
        by        < BOSS_Y + BOSS_H &&
        by + bh   > BOSS_Y
      ) {
        this._player.bullet = null;
        this._hp--;
        if (this._hp <= 0) {
          switchScene('win');
          return;
        }
      }
    }

    // ── Boss fire timer ────────────────────────────────────────
    // Convert interval from ms to seconds for comparison with dt accumulation
    this._fireTimer += dt * 1000; // accumulate in ms
    if (this._fireTimer >= this._currentFireInterval()) {
      this._fireTimer -= this._currentFireInterval();
      this._fireBossPattern();
    }

    // ── Move boss bullets ──────────────────────────────────────
    for (const b of this._bossBullets) {
      b.y += BOSS_BULLET_SPEED * dt;
    }
    // Remove bullets that have exited the canvas
    this._bossBullets = this._bossBullets.filter(b => b.y < CANVAS_HEIGHT + BOSS_BULLET_H);

    // ── Boss bullets vs player ─────────────────────────────────
    const pw = 50; // player ship width (matches player.js SHIP_W)
    const ph = 30; // player ship height (matches player.js SHIP_H)
    for (let i = this._bossBullets.length - 1; i >= 0; i--) {
      const b = this._bossBullets[i];
      if (
        b.x               < this._player.x + pw  &&
        b.x + BOSS_BULLET_W > this._player.x     &&
        b.y               < this._player.y + ph  &&
        b.y + BOSS_BULLET_H > this._player.y
      ) {
        // Sudden death — clear bullets and navigate to menu
        this._bossBullets = [];
        switchScene('menu');
        return;
      }
    }
  }

  /**
   * Fire a single boss bullet aimed at the player's current X centre.
   */
  _fireBossPattern() {
    // Aim toward the horizontal centre of the player ship
    const targetX = this._player.x + 25; // 25 = half of SHIP_W (50)
    const bulletX = targetX - BOSS_BULLET_W / 2;
    const bulletY = BOSS_Y + BOSS_H; // bottom edge of boss
    this._bossBullets.push({ x: bulletX, y: bulletY });
  }

  draw(ctx) {
    drawHUD(ctx);
    this._drawBoss(ctx);
    this._drawHealthBar(ctx);
    this._player.draw(ctx);

    // Draw boss bullets
    ctx.save();
    ctx.fillStyle = '#ff4400';
    for (const b of this._bossBullets) {
      ctx.fillRect(b.x, b.y, BOSS_BULLET_W, BOSS_BULLET_H);
    }
    ctx.restore();
  }

  /**
   * Draw the boss entity using canvas 2D primitives only.
   * Phase 1: grey. Phase 2: red.
   */
  _drawBoss(ctx) {
    ctx.save();

    const mainColour = this._phase === 1 ? '#888888' : '#cc0000';
    const accentColour = this._phase === 1 ? '#aaaaaa' : '#ff4444';
    const eyeColour = this._phase === 1 ? '#00ffff' : '#ffff00';

    // Main body rectangle
    ctx.fillStyle = mainColour;
    ctx.fillRect(BOSS_X, BOSS_Y, BOSS_W, BOSS_H);

    // Top turret / dome — trapezoid-like shape using a polygon
    ctx.fillStyle = accentColour;
    ctx.beginPath();
    ctx.moveTo(BOSS_X + BOSS_W * 0.3, BOSS_Y);
    ctx.lineTo(BOSS_X + BOSS_W * 0.7, BOSS_Y);
    ctx.lineTo(BOSS_X + BOSS_W * 0.6, BOSS_Y - 20);
    ctx.lineTo(BOSS_X + BOSS_W * 0.4, BOSS_Y - 20);
    ctx.closePath();
    ctx.fill();

    // Left wing extension
    ctx.fillStyle = mainColour;
    ctx.fillRect(BOSS_X - 30, BOSS_Y + BOSS_H * 0.3, 30, BOSS_H * 0.4);

    // Right wing extension
    ctx.fillRect(BOSS_X + BOSS_W, BOSS_Y + BOSS_H * 0.3, 30, BOSS_H * 0.4);

    // Eyes (two glowing rects)
    ctx.fillStyle = eyeColour;
    ctx.fillRect(BOSS_X + BOSS_W * 0.2, BOSS_Y + BOSS_H * 0.25, 16, 10);
    ctx.fillRect(BOSS_X + BOSS_W * 0.65, BOSS_Y + BOSS_H * 0.25, 16, 10);

    // Mouth / vent grille — three small dark rectangles
    ctx.fillStyle = '#000000';
    ctx.fillRect(BOSS_X + BOSS_W * 0.25, BOSS_Y + BOSS_H * 0.6, 10, 8);
    ctx.fillRect(BOSS_X + BOSS_W * 0.45, BOSS_Y + BOSS_H * 0.6, 10, 8);
    ctx.fillRect(BOSS_X + BOSS_W * 0.65, BOSS_Y + BOSS_H * 0.6, 10, 8);

    ctx.restore();
  }

  /**
   * Draw the health bar above the boss.
   * Background bar (dark red) + foreground bar (green/red proportional to HP).
   */
  _drawHealthBar(ctx) {
    ctx.save();

    // Background bar
    ctx.fillStyle = '#440000';
    ctx.fillRect(HP_BAR_X, HP_BAR_Y, HP_BAR_W, HP_BAR_H);

    // Foreground bar (proportional to remaining HP)
    const fillW = Math.max(0, (this._hp / BOSS_MAX_HP) * HP_BAR_W);
    ctx.fillStyle = this._phase === 1 ? '#00cc44' : '#ff2200';
    ctx.fillRect(HP_BAR_X, HP_BAR_Y, fillW, HP_BAR_H);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(HP_BAR_X, HP_BAR_Y, HP_BAR_W, HP_BAR_H);

    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HP  ${this._hp} / ${BOSS_MAX_HP}`, CANVAS_WIDTH / 2, HP_BAR_Y - 4);

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
// WinScene
// ─────────────────────────────────────────────────────────────

class WinScene {
  constructor() {
    // Capture the final score at the moment we enter this scene
    this._finalScore = hud.score;
    this._blinkTimer = 0;
    this._showPrompt = true;
  }

  destroy() {}

  _restart() {
    // Reset hud for a fresh game
    hud.score = 0;
    hud.lives = STARTING_LIVES;
    hud.level = 1;
    switchScene('menu');
  }

  update(dt) {
    // Blink the restart prompt
    this._blinkTimer += dt;
    if (this._blinkTimer >= 0.5) {
      this._showPrompt  = !this._showPrompt;
      this._blinkTimer -= 0.5;
    }

    if (isKeyHeld('Enter')) {
      this._restart();
    }
  }

  draw(ctx) {
    ctx.save();

    // Victory heading
    ctx.fillStyle = '#ffdd00';
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);

    // Final score
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px monospace';
    ctx.fillText(`FINAL SCORE: ${this._finalScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    // Hi-score
    ctx.font = '20px monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(`HI-SCORE: ${hud.hiScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    // Restart prompt (blinking)
    if (this._showPrompt) {
      ctx.fillStyle = '#00ff00';
      ctx.font = '22px monospace';
      ctx.fillText('Press ENTER to return to Menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    }

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
// GameOverScene
// ─────────────────────────────────────────────────────────────

class GameOverScene {
  constructor() {
    this._finalScore = hud.score;
    this._blinkTimer = 0;
    this._showPrompt = true;
  }

  destroy() {}

  update(dt) {
    this._blinkTimer += dt;
    if (this._blinkTimer >= 0.5) {
      this._showPrompt  = !this._showPrompt;
      this._blinkTimer -= 0.5;
    }
    if (isKeyHeld('Enter')) {
      hud.score = 0;
      hud.lives = STARTING_LIVES;
      hud.level = 1;
      switchScene('menu');
    }
  }

  draw(ctx) {
    ctx.save();

    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.fillText(`SCORE: ${this._finalScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

    if (this._showPrompt) {
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '20px monospace';
      ctx.fillText('Press ENTER to return to Menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    }

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
// Scene registration & bootstrap
// ─────────────────────────────────────────────────────────────

registerScene('menu',     () => new MenuScene());
registerScene('level1',   () => new Level1Scene());
registerScene('level2',   () => new Level2Scene());
registerScene('level3',   () => new Level3Scene());
registerScene('boss',     () => new BossScene());
registerScene('win',      () => new WinScene());
registerScene('gameover', () => new GameOverScene());

// Initialise input and start from the menu
initInput();
switchScene('menu');
requestAnimationFrame(loop);
