/**
 * boss.js — Boss fight: multi-phase finale for Space Invaders.
 * ES module; file:// compatible — no fetch, no bundler, no npm.
 *
 * Exports:
 *   Boss class — instantiate and drive from game.js after Level 3 clears.
 *
 * The Boss reads hudState.score from game.js (read-only).
 * Boss projectiles participate in the same collision pipeline.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { hudState } from './game.js';
import { rectsOverlap } from './collision.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BOSS_WIDTH        = 96;   // px — much larger than the 24px invader
const BOSS_HEIGHT       = 64;   // px
const BOSS_Y            = 60;   // px from canvas top (top portion of screen)
const BOSS_SPEED        = 120;  // px/s horizontal sweep
const BOSS_MAX_HP       = 10;
const PHASE2_HP         = 5;    // enter phase 2 when HP drops to this value

const FIRE_RATE_PHASE1  = 1.5;  // seconds between shots in phase 1
const FIRE_RATE_PHASE2  = 0.6;  // seconds between shots in phase 2

const PROJECTILE_WIDTH  = 6;    // px
const PROJECTILE_HEIGHT = 14;   // px
const PROJECTILE_SPEED  = 280;  // px/s downward

const HEALTH_BAR_WIDTH  = 200;  // px
const HEALTH_BAR_HEIGHT = 14;   // px
const HEALTH_BAR_X      = (CANVAS_WIDTH - HEALTH_BAR_WIDTH) / 2;
const HEALTH_BAR_Y      = BOSS_Y + BOSS_HEIGHT + 8; // below the boss

// ---------------------------------------------------------------------------
// Boss class
// ---------------------------------------------------------------------------

export class Boss {
  /**
   * @param {object} callbacks
   * @param {Function} callbacks.onPlayerHit   — called when a boss projectile hits the player
   * @param {Function} callbacks.onBossDefeated — called when boss HP reaches 0
   */
  constructor({ onPlayerHit, onBossDefeated }) {
    this._onPlayerHit    = onPlayerHit;
    this._onBossDefeated = onBossDefeated;

    this.hp          = BOSS_MAX_HP;
    this.x           = (CANVAS_WIDTH - BOSS_WIDTH) / 2;  // start centred
    this.y           = BOSS_Y;
    this.direction   = 1;   // +1 right, -1 left
    this.fireTimer   = 0;   // seconds until next shot
    this.defeated    = false;

    /** @type {Array<{x: number, y: number}>} active boss projectiles */
    this.projectiles = [];
  }

  // --------------------------------------------------------------------------
  // Phase helper
  // --------------------------------------------------------------------------

  get phase() {
    return this.hp >= PHASE2_HP + 1 ? 1 : 2;
  }

  get fireRate() {
    return this.phase === 1 ? FIRE_RATE_PHASE1 : FIRE_RATE_PHASE2;
  }

  // --------------------------------------------------------------------------
  // Rect helpers
  // --------------------------------------------------------------------------

  /** Bounding rect of the boss sprite. */
  get rect() {
    return { x: this.x, y: this.y, width: BOSS_WIDTH, height: BOSS_HEIGHT };
  }

  // --------------------------------------------------------------------------
  // Update
  // --------------------------------------------------------------------------

  /**
   * Update boss logic for one fixed-timestep frame.
   * @param {number} dt   Fixed timestep in seconds.
   * @param {object} player  Player instance (has .x, .y, .bullet).
   */
  update(dt, player) {
    if (this.defeated) return;

    // -- Movement (horizontal sweep) ----------------------------------------
    this.x += BOSS_SPEED * this.direction * dt;

    if (this.direction === 1 && this.x + BOSS_WIDTH >= CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - BOSS_WIDTH;
      this.direction = -1;
    } else if (this.direction === -1 && this.x <= 0) {
      this.x = 0;
      this.direction = 1;
    }

    // -- Firing ---------------------------------------------------------------
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = this.fireRate;
      // Fire straight down from the centre of the boss
      this.projectiles.push({
        x: this.x + BOSS_WIDTH / 2 - PROJECTILE_WIDTH / 2,
        y: this.y + BOSS_HEIGHT,
      });
    }

    // -- Projectile movement & collision with player --------------------------
    const playerRect = {
      x:      player.x,
      y:      player.y,
      width:  48,   // must match player.js SHIP_WIDTH
      height: 32,   // must match player.js SHIP_HEIGHT
    };

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.y += PROJECTILE_SPEED * dt;

      // Remove if off-screen
      if (p.y > CANVAS_HEIGHT) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with player
      const projRect = { x: p.x, y: p.y, width: PROJECTILE_WIDTH, height: PROJECTILE_HEIGHT };
      if (rectsOverlap(projRect, playerRect)) {
        this.projectiles.splice(i, 1);
        this._onPlayerHit();
        return; // run ends; no further processing needed this frame
      }
    }

    // -- Check player bullet vs boss ------------------------------------------
    if (player.bullet !== null) {
      const bulletWidth  = 4;   // must match player.js BULLET_WIDTH
      const bulletHeight = 10;  // must match player.js BULLET_HEIGHT
      const bulletRect = {
        x:      player.bullet.x - bulletWidth / 2,
        y:      player.bullet.y,
        width:  bulletWidth,
        height: bulletHeight,
      };

      if (rectsOverlap(bulletRect, this.rect)) {
        player.bullet = null;
        this.hp -= 1;

        if (this.hp <= 0) {
          this.hp = 0;
          this.defeated = true;
          this.projectiles = [];
          this._onBossDefeated();
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // Draw
  // --------------------------------------------------------------------------

  /**
   * Draw the boss, its projectiles, and its health bar.
   * Uses only canvas 2D primitives — no images.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (this.defeated) return;

    const bx = Math.round(this.x);
    const by = Math.round(this.y);

    // ---- Boss body (main hull) — large dark-red rectangle ----
    ctx.fillStyle = '#cc2200';
    ctx.fillRect(bx, by + 16, BOSS_WIDTH, BOSS_HEIGHT - 16);

    // ---- Boss cockpit dome (arc) centred on top of hull ----
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.arc(bx + BOSS_WIDTH / 2, by + 20, 28, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // ---- Eye / viewport — inner arc ----
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(bx + BOSS_WIDTH / 2, by + 20, 14, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // ---- Central pupil ----
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(bx + BOSS_WIDTH / 2, by + 20, 6, 0, Math.PI * 2);
    ctx.fill();

    // ---- Left wing ----
    ctx.fillStyle = '#882200';
    ctx.fillRect(bx - 20, by + 28, 24, 20);
    // wing tip
    ctx.fillStyle = '#cc2200';
    ctx.fillRect(bx - 28, by + 34, 12, 10);

    // ---- Right wing ----
    ctx.fillStyle = '#882200';
    ctx.fillRect(bx + BOSS_WIDTH - 4, by + 28, 24, 20);
    // wing tip
    ctx.fillStyle = '#cc2200';
    ctx.fillRect(bx + BOSS_WIDTH + 16, by + 34, 12, 10);

    // ---- Cannon nozzles (two rectangles at the bottom) ----
    ctx.fillStyle = '#440000';
    ctx.fillRect(bx + 16, by + BOSS_HEIGHT - 6, 10, 10);
    ctx.fillRect(bx + BOSS_WIDTH - 26, by + BOSS_HEIGHT - 6, 10, 10);

    // ---- Health bar ----
    const barX = HEALTH_BAR_X;
    const barY = Math.round(this.y + BOSS_HEIGHT + 8);

    // Background (empty bar)
    ctx.fillStyle = '#440000';
    ctx.fillRect(barX, barY, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);

    // Filled portion — proportional to current HP
    const fillW = Math.round((this.hp / BOSS_MAX_HP) * HEALTH_BAR_WIDTH);
    ctx.fillStyle = this.phase === 1 ? '#00ff44' : '#ff4400';
    ctx.fillRect(barX, barY, fillW, HEALTH_BAR_HEIGHT);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 1;
    ctx.strokeRect(barX, barY, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);

    // HP label
    ctx.fillStyle    = '#ffffff';
    ctx.font         = '12px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOSS HP: ' + this.hp + ' / ' + BOSS_MAX_HP,
      CANVAS_WIDTH / 2, barY + HEALTH_BAR_HEIGHT / 2);

    // ---- Projectiles ----
    ctx.fillStyle = '#ff4400';
    for (const p of this.projectiles) {
      ctx.fillRect(Math.round(p.x), Math.round(p.y), PROJECTILE_WIDTH, PROJECTILE_HEIGHT);
    }
  }
}
