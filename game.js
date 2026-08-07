// game.js — Game controller for Space Invaders
// ES module; no bundler, no npm, runs from file:// URL.
//
// Responsibilities:
//   • Canvas / context setup
//   • Game loop (requestAnimationFrame + fixed-timestep update)
//   • Level dispatch (Level 1 → Level 2 → Level 3 → Level 4 boss)
//   • HUD (score, lives)
//   • CollisionSystem wiring
//   • Input initialisation

import { initInput } from './input.js';
import { Player }   from './player.js';
import { Level1 }   from './level1.js';
import { Level2 }   from './level2.js';
import { Level3 }   from './level3.js';
import { Boss }     from './boss.js';
import { CollisionSystem } from './collision.js';
import { state }    from './state.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_LIVES,
} from './gameConfig.js';

// ---------------------------------------------------------------------------
// Fixed timestep
// ---------------------------------------------------------------------------
const FIXED_DT      = 1 / 60;  // seconds
const MAX_CATCHUP   = 5;       // maximum fixed steps per frame

// ---------------------------------------------------------------------------
// HUD constants
// ---------------------------------------------------------------------------
const HUD_COLOR  = '#0f0';
const HUD_FONT   = '18px monospace';

// ---------------------------------------------------------------------------
// Game controller
// ---------------------------------------------------------------------------
class Game {
  constructor() {
    // Canvas
    this._canvas = document.getElementById('gameCanvas');
    this._ctx    = this._canvas.getContext('2d');

    // Ensure canvas dimensions match config
    this._canvas.width  = CANVAS_WIDTH;
    this._canvas.height = CANVAS_HEIGHT;

    // Input
    initInput();

    // Collision
    this._collision = new CollisionSystem();

    // Player
    this._player = new Player(CANVAS_HEIGHT);

    // Current level number (1-indexed)
    this._levelNum = 1;

    // Active level object
    this._level = null;

    // Game-loop timing
    this._accumulator  = 0;  // seconds
    this._lastTime     = null;

    // Start
    this._startLevel(1);
    this._rafId = requestAnimationFrame((t) => this._loop(t));
  }

  // -------------------------------------------------------------------------
  // Start a specific level (1-4)
  // -------------------------------------------------------------------------
  _startLevel(n) {
    this._levelNum = n;

    // Reset collision system for the new level but preserve score for levels 2+
    // Score accumulates across levels via CollisionSystem instance.
    // For level 1 start (or reset), we create a fresh CollisionSystem.
    if (n === 1) {
      this._collision = new CollisionSystem();
      // Reset shared state
      state.sessionShotCount = 0;
      state.lives = PLAYER_LIVES;
      // Reset player
      this._player = new Player(CANVAS_HEIGHT);
    }

    const deps = {
      ctx:    this._ctx,
      player: this._player,
      hud:    null,          // game.js itself draws the HUD
      game:   this,
    };

    switch (n) {
      case 1:
        this._level = new Level1(deps);
        break;
      case 2:
        this._level = new Level2(deps);
        break;
      case 3:
        this._level = new Level3(deps);
        break;
      case 4:
        // Boss level — collision wiring handled inside Boss itself
        // (boss bullets use CollisionSystem for player hit detection)
        this._level = new Boss(deps);
        break;
      default:
        // If somehow we go beyond level 4, loop back to 1
        this._startLevel(1);
        return;
    }
  }

  // -------------------------------------------------------------------------
  // Called by level objects to advance to the next level
  // -------------------------------------------------------------------------
  nextLevel() {
    this._startLevel(this._levelNum + 1);
  }

  // -------------------------------------------------------------------------
  // Called by level objects (or boss) to jump to a specific level
  // -------------------------------------------------------------------------
  setLevel(n) {
    this._startLevel(n);
  }

  // -------------------------------------------------------------------------
  // Called by boss on sudden-death or restart to reset to level 1
  // -------------------------------------------------------------------------
  resetToLevel1() {
    this._startLevel(1);
  }

  // -------------------------------------------------------------------------
  // Return the current score (from the collision system)
  // -------------------------------------------------------------------------
  getScore() {
    return this._collision.getScore();
  }

  // -------------------------------------------------------------------------
  // Main game loop
  // -------------------------------------------------------------------------
  _loop(timestamp) {
    this._rafId = requestAnimationFrame((t) => this._loop(t));

    // Delta time
    if (this._lastTime === null) {
      this._lastTime = timestamp;
    }
    let elapsed = (timestamp - this._lastTime) / 1000; // seconds
    this._lastTime = timestamp;

    // Clamp to avoid spiral of death on tab-switch / slow frames
    if (elapsed > 0.25) elapsed = 0.25;

    this._accumulator += elapsed;

    // Fixed-timestep updates
    let steps = 0;
    while (this._accumulator >= FIXED_DT && steps < MAX_CATCHUP) {
      this._update(FIXED_DT);
      this._accumulator -= FIXED_DT;
      steps++;
    }

    // Draw
    this._draw();
  }

  // -------------------------------------------------------------------------
  // Fixed-timestep update
  // -------------------------------------------------------------------------
  _update(dt) {
    // Player update (movement, shooting)
    this._player.update(dt);

    // Level update
    if (this._level && typeof this._level.update === 'function') {
      this._level.update(dt);
    }

    // Collision detection — only for levels 1-3 (boss handles its own)
    if (this._levelNum <= 3) {
      this._runCollision();
    }

    // Life-loss check (invader bullets hitting player, set by CollisionSystem)
    if (this._player.hit) {
      this._player.hit = false;
      // lives already decremented by player.onHit() if wired,
      // or we decrement here if hit flag was set directly
    }

    // Game-over check (lives exhausted) for levels 1-3
    if (this._levelNum <= 3 && this._player.lives <= 0) {
      this._startLevel(1);
    }
  }

  // -------------------------------------------------------------------------
  // Run CollisionSystem for levels 1-3
  // -------------------------------------------------------------------------
  _runCollision() {
    // Build player bullet descriptor
    const playerBullets = [];
    if (this._player.bullet !== null) {
      playerBullets.push({
        getBounds: () => ({
          x:      this._player.bullet.x - 2,
          y:      this._player.bullet.y,
          width:  4,
          height: 10,
        }),
        remove: () => this._player.clearBullet(),
        removed: false,
      });
    }

    // Invaders (from current level)
    const invaders = (this._level && typeof this._level.getInvaders === 'function')
      ? this._level.getInvaders()
      : [];

    // Invader bullets (from current level, if it provides them)
    const invaderBullets = (this._level && typeof this._level.getInvaderBullets === 'function')
      ? this._level.getInvaderBullets()
      : [];

    this._collision.update(playerBullets, invaders, invaderBullets, this._player);
  }

  // -------------------------------------------------------------------------
  // Draw everything
  // -------------------------------------------------------------------------
  _draw() {
    const ctx = this._ctx;
    const cw  = CANVAS_WIDTH;
    const ch  = CANVAS_HEIGHT;

    // Clear canvas
    ctx.clearRect(0, 0, cw, ch);

    // Draw the level (handles its own content + level HUD text)
    if (this._level && typeof this._level.draw === 'function') {
      this._level.draw();
    }

    // For levels 1-3, draw the player and collision effects
    if (this._levelNum <= 3) {
      // Collision explosions
      this._collision.draw(ctx);

      // Player ship
      this._player.draw(ctx);

      // HUD: score and lives
      this._drawHUD();
    } else {
      // Level 4 (boss): still draw player and HUD,
      // but collision effects are handled by boss internals
      this._player.draw(ctx);
      this._drawHUD();
    }
  }

  // -------------------------------------------------------------------------
  // HUD: score (top-left) and lives (top-right)
  // -------------------------------------------------------------------------
  _drawHUD() {
    const ctx = this._ctx;
    ctx.save();
    ctx.font      = HUD_FONT;
    ctx.fillStyle = HUD_COLOR;
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this._collision.getScore()}`, 12, 50);
    ctx.textAlign = 'right';
    ctx.fillText(`Lives: ${this._player.lives}`, CANVAS_WIDTH - 12, 50);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
