// game.js — Game loop, scene state machine, HUD renderer.
// Exports: hud, switchScene, renderHUD

import { initInput, isKeyHeld } from './input.js';
import { Player } from './player.js';
import { InvaderGrid } from './invaders.js';
import {
  checkBulletInvaderCollisions,
  checkInvaderBulletPlayerCollision,
} from './collision.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STARTING_LIVES,
} from './gameConfig.js';

// ─────────────────────────────────────────────
// Canvas setup
// ─────────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ─────────────────────────────────────────────
// Shared HUD state (exported for external inspection)
// ─────────────────────────────────────────────

export const hud = {
  score:   0,
  lives:   STARTING_LIVES,
  hiScore: 0,
};

// ─────────────────────────────────────────────
// Scene registry
// ─────────────────────────────────────────────

/** @type {string} */
let currentScene = 'title';

/** @type {Object<string, { enter?:()=>void, update:(dt:number)=>void, draw:()=>void, exit?:()=>void }>} */
const scenes = {};

/**
 * Switch to a named scene.
 * @param {string} name
 */
export function switchScene(name) {
  const prev = scenes[currentScene];
  if (prev && prev.exit) prev.exit();
  currentScene = name;
  const next = scenes[name];
  if (next && next.enter) next.enter();
}

// ─────────────────────────────────────────────
// HUD renderer (exported)
// ─────────────────────────────────────────────

/**
 * Render the HUD (score, hi-score, lives) on the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} lives
 */
export function renderHUD(ctx, lives) {
  ctx.save();
  ctx.font      = 'bold 18px monospace';
  ctx.fillStyle = '#ffffff';

  // Score — top left
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${hud.score}`, 16, 30);

  // Hi-score — top centre
  ctx.textAlign = 'center';
  ctx.fillText(`HI  ${hud.hiScore}`, CANVAS_WIDTH / 2, 30);

  // Lives — top right
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES  ${lives}`, CANVAS_WIDTH - 16, 30);

  ctx.restore();
}

// ─────────────────────────────────────────────
// Title Scene
// ─────────────────────────────────────────────

let titleBlink = 0;
let titleShow  = true;

scenes['title'] = {
  enter() {
    titleBlink = 0;
    titleShow  = true;
  },
  update(dt) {
    titleBlink += dt;
    if (titleBlink >= 0.5) {
      titleBlink = 0;
      titleShow  = !titleShow;
    }
    if (isKeyHeld('Enter')) {
      // Reset hud for a new game
      hud.score = 0;
      hud.lives = STARTING_LIVES;
      switchScene('level1');
    }
  },
  draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.textAlign = 'center';

    ctx.font      = 'bold 56px monospace';
    ctx.fillStyle = '#00ff00';
    ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    if (titleShow) {
      ctx.font      = 'bold 24px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    ctx.restore();
  },
};

// ─────────────────────────────────────────────
// Game Over Scene
// ─────────────────────────────────────────────

scenes['gameover'] = {
  enter() {},
  update(dt) {
    if (isKeyHeld('Enter')) {
      hud.score = 0;
      hud.lives = STARTING_LIVES;
      switchScene('title');
    }
  },
  draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.save();
    ctx.textAlign = 'center';

    ctx.font      = 'bold 56px monospace';
    ctx.fillStyle = '#ff4444';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    ctx.font      = 'bold 24px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Final Score: ${hud.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    ctx.fillText('Press ENTER to return to Title', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);

    ctx.restore();
  },
};

// ─────────────────────────────────────────────
// Win / Level Complete Scene
// ─────────────────────────────────────────────

scenes['win'] = {
  enter() {},
  update(dt) {
    if (isKeyHeld('Enter')) {
      hud.score = 0;
      hud.lives = STARTING_LIVES;
      switchScene('title');
    }
  },
  draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.save();
    ctx.textAlign = 'center';

    ctx.font      = 'bold 48px monospace';
    ctx.fillStyle = '#00ff00';
    ctx.fillText('LEVEL COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    ctx.font      = 'bold 32px monospace';
    ctx.fillStyle = '#ffff00';
    ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    ctx.font      = 'bold 22px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Final Score: ${hud.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    ctx.fillText('Press ENTER to return to Title', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);

    ctx.restore();
  },
};

// ─────────────────────────────────────────────
// Level 1 Scene
// ─────────────────────────────────────────────

/** @type {Player|null} */
let l1Player = null;
/** @type {InvaderGrid|null} */
let l1Grid   = null;

scenes['level1'] = {
  enter() {
    l1Player = new Player();
    l1Player.lives = hud.lives;
    l1Grid   = new InvaderGrid({ speedMultiplier: 1.0, startY: 80 });
  },
  exit() {
    hud.lives = l1Player ? l1Player.lives : hud.lives;
  },
  update(dt) {
    if (!l1Player || !l1Grid) return;

    l1Player.update(dt);
    l1Grid.update(dt);

    // Bullet vs invaders
    const result = checkBulletInvaderCollisions(l1Player.bullet, l1Grid);
    if (result.hit) {
      hud.score += result.points;
      if (hud.score > hud.hiScore) hud.hiScore = hud.score;
      l1Player.bullet = null;
    }

    // Win condition — all invaders defeated
    if (l1Grid.allDefeated()) {
      hud.lives = l1Player.lives;
      switchScene('level2');
      return;
    }

    // Lose condition — invaders reach player
    const playerTop = l1Player.y;
    if (l1Grid.bottomY() >= playerTop) {
      l1Player.lives -= 1;
      hud.lives = l1Player.lives;
      if (l1Player.lives <= 0) {
        switchScene('gameover');
      } else {
        // Restart level with same lives
        l1Grid   = new InvaderGrid({ speedMultiplier: 1.0, startY: 80 });
        l1Player = new Player();
        l1Player.lives = hud.lives;
      }
    }
  },
  draw() {
    if (!l1Player || !l1Grid) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Level label
    ctx.save();
    ctx.font      = 'bold 16px monospace';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL 1', CANVAS_WIDTH / 2, 55);
    ctx.restore();

    renderHUD(ctx, l1Player.lives);
    l1Grid.draw(ctx);
    l1Player.draw(ctx);
  },
};

// ─────────────────────────────────────────────
// Level 2 Scene
// ─────────────────────────────────────────────

/**
 * Level2Scene — encapsulates all Level 2 state and logic.
 * Invader return fire, UFO bonus, player respawn/invulnerability.
 */
class Level2Scene {
  constructor() {
    /** @type {Player} */
    this.player = null;
    /** @type {InvaderGrid} */
    this.grid   = null;

    // ── Invader bullets ──────────────────────────────────────────────────
    /** @type {Array<{x:number, y:number}>} */
    this.invaderBullets = [];
    /** Timer until next invader shot (seconds). */
    this._nextFireTimer = this._randomFireInterval();

    // ── UFO ──────────────────────────────────────────────────────────────
    /** @type {{x:number, y:number, active:boolean}|null} */
    this.ufo = null;
    /** Timer until the next UFO spawn (seconds). */
    this._ufoTimer = this._randomUFOInterval();
    /** UFO width in pixels. */
    this._ufoW = 60;
    /** UFO height in pixels. */
    this._ufoH = 22;
    /** UFO vertical position (top of the saucer). */
    this._ufoY = 48;
    /** UFO horizontal speed (px/s). */
    this._ufoSpeed = 120;
    /** Score popup: {x, y, text, timer} after UFO is shot. */
    this._ufoPopup = null;

    // ── Shot count ───────────────────────────────────────────────────────
    /** Incremented every time the player fires; reset at Level 2 entry. */
    this.shotCount = 0;

    // ── Player death / respawn / invulnerability ──────────────────────────
    /** True while the player is in the 1-second death pause. */
    this._dead      = false;
    /** Countdown timer for the death pause (seconds). */
    this._deadTimer = 0;
    /** True while the player is blinking (invulnerable after respawn). */
    this._invuln     = false;
    /** Countdown for the invulnerability window (seconds). */
    this._invulnTimer = 0;
    /** Blink toggle — flips every BLINK_INTERVAL seconds. */
    this._blinkVisible = true;
    /** Accumulated time for blink toggling (seconds). */
    this._blinkAccum   = 0;
  }

  // ── Interval helpers ───────────────────────────────────────────────────

  /** Random fire interval for invaders: 0.8–2.0 s. */
  _randomFireInterval() {
    return 0.8 + Math.random() * 1.2;
  }

  /** Random UFO spawn interval: 15–30 s. */
  _randomUFOInterval() {
    return 15 + Math.random() * 15;
  }

  // ── Scene lifecycle ────────────────────────────────────────────────────

  enter() {
    // Carry over lives and score from hud (set by Level 1 exit)
    this.player       = new Player();
    this.player.lives = hud.lives; // carry over
    // score already in hud — do not reset

    // Reset shot count (classic arcade behaviour)
    this.shotCount = 0;

    // Faster grid
    this.grid = new InvaderGrid({ speedMultiplier: 1.5, startY: 80 });

    // Reset invader bullets
    this.invaderBullets  = [];
    this._nextFireTimer  = this._randomFireInterval();

    // Reset UFO state
    this.ufo       = null;
    this._ufoTimer = this._randomUFOInterval();
    this._ufoPopup = null;

    // Reset death state
    this._dead        = false;
    this._deadTimer   = 0;
    this._invuln      = false;
    this._invulnTimer = 0;
    this._blinkVisible = true;
    this._blinkAccum   = 0;
  }

  exit() {
    hud.lives = this.player ? this.player.lives : hud.lives;
  }

  // ── Update ─────────────────────────────────────────────────────────────

  update(dt) {
    // ── Death pause ──────────────────────────────────────────────────────
    if (this._dead) {
      this._deadTimer -= dt;
      if (this._deadTimer <= 0) {
        // Respawn
        this._dead = false;
        this._respawnPlayer();
        this._invuln      = true;
        this._invulnTimer = 2.0;   // 2-second invulnerability
        this._blinkVisible = true;
        this._blinkAccum   = 0;
      }
      // During death pause: still update grid and bullets, but not player
      this.grid.update(dt);
      this._updateInvaderBullets(dt);
      this._updateUFO(dt);
      return;
    }

    // ── Invulnerability blink ─────────────────────────────────────────────
    if (this._invuln) {
      this._invulnTimer -= dt;
      this._blinkAccum  += dt;
      if (this._blinkAccum >= 0.15) {  // toggle every 150 ms
        this._blinkAccum   = 0;
        this._blinkVisible = !this._blinkVisible;
      }
      if (this._invulnTimer <= 0) {
        this._invuln       = false;
        this._blinkVisible = true;
      }
    }

    // ── Player update ─────────────────────────────────────────────────────
    const bulletWasFired = this._updatePlayerWithShotCount(dt);
    _ = bulletWasFired; // suppress unused warning

    // ── Grid update ───────────────────────────────────────────────────────
    this.grid.update(dt);

    // ── Player bullet vs invaders ─────────────────────────────────────────
    const result = checkBulletInvaderCollisions(this.player.bullet, this.grid);
    if (result.hit) {
      hud.score += result.points;
      if (hud.score > hud.hiScore) hud.hiScore = hud.score;
      this.player.bullet = null;
    }

    // ── Player bullet vs UFO ──────────────────────────────────────────────
    if (this.player.bullet && this.ufo && this.ufo.active) {
      if (this._bulletHitsUFO(this.player.bullet)) {
        const pts = this._ufoPoints();
        hud.score += pts;
        if (hud.score > hud.hiScore) hud.hiScore = hud.score;
        this._ufoPopup = {
          x:     this.ufo.x + this._ufoW / 2,
          y:     this.ufo.y,
          text:  String(pts),
          timer: 1.2,  // seconds to display
        };
        this.ufo.active = false;
        this.ufo        = null;
        this.player.bullet = null;
      }
    }

    // ── Invader bullets ───────────────────────────────────────────────────
    this._updateInvaderFire(dt);
    this._updateInvaderBullets(dt);

    // ── UFO update ────────────────────────────────────────────────────────
    this._updateUFO(dt);

    // ── UFO popup timer ───────────────────────────────────────────────────
    if (this._ufoPopup) {
      this._ufoPopup.timer -= dt;
      if (this._ufoPopup.timer <= 0) this._ufoPopup = null;
    }

    // ── Win condition ─────────────────────────────────────────────────────
    if (this.grid.allDefeated()) {
      hud.lives = this.player.lives;
      switchScene('win');
      return;
    }

    // ── Invaders reaching player (lose condition) ─────────────────────────
    if (this.grid.bottomY() >= this.player.y && !this._dead) {
      this._hitPlayer();
    }
  }

  // ── Player input/update with shotCount tracking ────────────────────────

  /**
   * Update the player, detect new bullet being fired, increment shotCount.
   * @param {number} dt
   */
  _updatePlayerWithShotCount(dt) {
    const hadBullet = this.player.bullet !== null;
    this.player.update(dt);
    const hasBullet = this.player.bullet !== null;
    // A bullet was newly created if we went from no-bullet to bullet
    if (!hadBullet && hasBullet) {
      this.shotCount++;
    }
  }

  // ── Invader return fire ────────────────────────────────────────────────

  /** @param {number} dt */
  _updateInvaderFire(dt) {
    this._nextFireTimer -= dt;
    if (this._nextFireTimer <= 0) {
      this._nextFireTimer = this._randomFireInterval();
      this._fireInvaderBullet();
    }
  }

  /** Fire a bullet from a random bottom-row invader. */
  _fireInvaderBullet() {
    // Find the bottom-most alive invader per column
    const shooters = [];
    for (let c = 0; c < 11; c++) {
      for (let r = 4; r >= 0; r--) {
        const inv = this.grid.invaders[r][c];
        if (inv.alive) {
          shooters.push(inv);
          break;
        }
      }
    }
    if (shooters.length === 0) return;
    const inv = shooters[Math.floor(Math.random() * shooters.length)];
    this.invaderBullets.push({
      x: inv.x + inv.w / 2 - 2,
      y: inv.y + inv.h,
    });
  }

  /**
   * Move invader bullets downward; check collision with player; remove off-screen.
   * @param {number} dt
   */
  _updateInvaderBullets(dt) {
    const SPEED = 180; // px/s
    const toRemove = [];

    for (let i = 0; i < this.invaderBullets.length; i++) {
      const b = this.invaderBullets[i];
      b.y += SPEED * dt;

      // Destroy if past bottom of canvas
      if (b.y > CANVAS_HEIGHT) {
        toRemove.push(i);
        continue;
      }

      // Collision with player (only if not dead and not invulnerable)
      if (!this._dead && !this._invuln) {
        if (this._bulletHitsPlayer(b)) {
          toRemove.push(i);
          this._hitPlayer();
          // Only one hit per frame matters
          break;
        }
      }
    }

    // Remove bullets in reverse index order
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.invaderBullets.splice(toRemove[i], 1);
    }
  }

  /**
   * AABB check: invader bullet vs player ship.
   * Player ship is 50×30 px.
   * @param {{x:number, y:number}} bullet
   * @returns {boolean}
   */
  _bulletHitsPlayer(bullet) {
    const BULLET_W = 4;
    const BULLET_H = 10;
    const SHIP_W   = 50;
    const SHIP_H   = 30;
    const px = this.player.x;
    const py = this.player.y;
    return (
      bullet.x          < px + SHIP_W &&
      bullet.x + BULLET_W > px       &&
      bullet.y          < py + SHIP_H &&
      bullet.y + BULLET_H > py
    );
  }

  // ── Player hit / respawn ───────────────────────────────────────────────

  /** Handle a player hit: deduct life, check game-over, or start death sequence. */
  _hitPlayer() {
    this.player.lives -= 1;
    hud.lives = this.player.lives;
    if (hud.score > hud.hiScore) hud.hiScore = hud.score;

    if (this.player.lives <= 0) {
      switchScene('gameover');
      return;
    }

    // Start 1-second death pause
    this._dead      = true;
    this._deadTimer = 1.0;
    this._invuln    = false;
    // Clear all invader bullets to give player a fair respawn
    this.invaderBullets = [];
  }

  /** Move player back to starting position. */
  _respawnPlayer() {
    const SHIP_W = 50;
    const SHIP_H = 30;
    this.player.x      = CANVAS_WIDTH  / 2 - SHIP_W / 2;
    this.player.y      = CANVAS_HEIGHT - 60 - SHIP_H;
    this.player.bullet = null;
  }

  // ── UFO ────────────────────────────────────────────────────────────────

  /** @param {number} dt */
  _updateUFO(dt) {
    if (!this.ufo) {
      this._ufoTimer -= dt;
      if (this._ufoTimer <= 0) {
        this._spawnUFO();
        this._ufoTimer = this._randomUFOInterval();
      }
      return;
    }

    // Move UFO left→right
    this.ufo.x += this._ufoSpeed * dt;

    // Despawn when fully off-screen
    if (this.ufo.x > CANVAS_WIDTH + this._ufoW) {
      this.ufo = null;
    }
  }

  _spawnUFO() {
    this.ufo = {
      x:      -this._ufoW,
      y:      this._ufoY,
      active: true,
    };
  }

  /**
   * AABB bullet vs UFO hit test.
   * @param {{x:number, y:number}} bullet
   * @returns {boolean}
   */
  _bulletHitsUFO(bullet) {
    const BULLET_W = 4;
    const BULLET_H = 14;
    return (
      bullet.x          < this.ufo.x + this._ufoW &&
      bullet.x + BULLET_W > this.ufo.x            &&
      bullet.y          < this.ufo.y + this._ufoH  &&
      bullet.y + BULLET_H > this.ufo.y
    );
  }

  /**
   * Points for hitting UFO based on shotCount.
   * shotCount % 4: 0→100, 1→50, 2→150, 3→300
   * @returns {number}
   */
  _ufoPoints() {
    const TABLE = [100, 50, 150, 300];
    return TABLE[this.shotCount % 4];
  }

  // ── Draw ───────────────────────────────────────────────────────────────

  draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Level label
    ctx.save();
    ctx.font      = 'bold 16px monospace';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL 2', CANVAS_WIDTH / 2, 55);
    ctx.restore();

    renderHUD(ctx, this.player ? this.player.lives : hud.lives);
    this.grid.draw(ctx);

    // Draw player (hidden during death pause; blink during invulnerability)
    if (!this._dead) {
      if (!this._invuln || this._blinkVisible) {
        this.player.draw(ctx);
      }
    }

    // Draw invader bullets
    ctx.save();
    ctx.fillStyle = '#ff4444';
    for (const b of this.invaderBullets) {
      ctx.fillRect(b.x, b.y, 4, 10);
    }
    ctx.restore();

    // Draw UFO
    if (this.ufo && this.ufo.active) {
      this._drawUFO(ctx, this.ufo.x, this.ufo.y);
    }

    // Draw UFO score popup
    if (this._ufoPopup) {
      const alpha = Math.min(1, this._ufoPopup.timer / 0.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font        = 'bold 22px monospace';
      ctx.fillStyle   = '#ffdd00';
      ctx.textAlign   = 'center';
      ctx.fillText(this._ufoPopup.text, this._ufoPopup.x, this._ufoPopup.y);
      ctx.restore();
    }
  }

  /**
   * Draw a saucer-shaped UFO using Canvas 2D API — distinct from invader rectangles.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x  Left edge of UFO bounding box
   * @param {number} y  Top edge of UFO bounding box
   */
  _drawUFO(ctx, x, y) {
    const w = this._ufoW;
    const h = this._ufoH;
    const cx = x + w / 2;

    ctx.save();

    // ── Main ellipse body (lower saucer disc) ──
    ctx.beginPath();
    ctx.ellipse(
      cx,          // centre x
      y + h * 0.7, // centre y — lower portion
      w / 2,       // x-radius
      h * 0.35,    // y-radius
      0,           // rotation
      0, Math.PI * 2
    );
    ctx.fillStyle   = '#dd2222';
    ctx.fill();
    ctx.strokeStyle = '#ff6666';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // ── Dome arc (upper hemisphere) ──
    ctx.beginPath();
    ctx.ellipse(
      cx,
      y + h * 0.55,
      w * 0.32,
      h * 0.42,
      0,
      Math.PI, 0   // upper half only
    );
    ctx.fillStyle = '#ff9999';
    ctx.fill();
    ctx.strokeStyle = '#ffcccc';
    ctx.lineWidth   = 1;
    ctx.stroke();

    // ── Portholes (three small circles) ──
    ctx.fillStyle = '#ffff88';
    const portY = y + h * 0.72;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(cx + i * (w * 0.22), portY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Instantiate Level2Scene and register it
const level2Scene = new Level2Scene();

scenes['level2'] = {
  enter()        { level2Scene.enter(); },
  exit()         { level2Scene.exit();  },
  update(dt)     { level2Scene.update(dt); },
  draw()         { level2Scene.draw();  },
};

// ─────────────────────────────────────────────
// Fixed-timestep game loop
// ─────────────────────────────────────────────

const STEP_MS  = 1000 / 60;   // ~16.67 ms
const CAP_MS   = 250;         // maximum accumulated delta before capping
let   lastTime = null;
let   accum    = 0;

function loop(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  let elapsed = timestamp - lastTime;
  lastTime = timestamp;

  // Cap to prevent spiral of death after tab backgrounding
  if (elapsed > CAP_MS) elapsed = CAP_MS;
  accum += elapsed;

  while (accum >= STEP_MS) {
    accum -= STEP_MS;
    const scene = scenes[currentScene];
    if (scene) scene.update(STEP_MS / 1000);
  }

  const scene = scenes[currentScene];
  if (scene) scene.draw();

  requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────

initInput();
switchScene('title');
requestAnimationFrame(loop);
