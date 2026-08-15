// Level 2: they shoot back. Reuses Level 1's 11x5 invader formation and its
// step-interval curve (see stepIntervalForAliveCount in level1.js), scaled
// to 1.5x speed. Adds invader return fire from a single re-rolling global
// timer, a periodic bonus UFO with deterministic score tiers keyed off the
// player's session-wide shot count, and the player hit/life-loss/respawn/
// invulnerability handling that collision.js and player.js deliberately
// leave to the Level card that owns detecting the hit.
//
// Lives (hudState.lives) and the player's cumulative shot counter
// (player.shotCount) are never touched at construction time: both already
// carry over unchanged from Level 1 because hudState is a single
// long-lived object and the Player instance is not recreated on the
// Level 1 -> Level 2 handoff (only on a fresh run from Title).

import { Invaders } from './invaders.js';
import { collide, overlaps } from './collision.js';
import { stepIntervalForAliveCount } from './level1.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';

export const LEVEL_NUMBER = 2;

// Level 1's step-interval curve, advanced at 1.5x pace.
const SPEED_MULTIPLIER = 0.67;

// Single global invader-fire timer: re-rolled after every shot.
const FIRE_DELAY_MIN_MS = 800;
const FIRE_DELAY_MAX_MS = 2000;

const INVADER_BULLET_WIDTH = 4;
const INVADER_BULLET_HEIGHT = 14;
const INVADER_BULLET_SPEED = 300; // px/s, straight down
const INVADER_BULLET_COLOR = '#ff6666';

// Mirrors the player bullet's fixed size defined in player.js, the same way
// collision.js already mirrors it (player.js doesn't export the constants).
const PLAYER_BULLET_WIDTH = 4;
const PLAYER_BULLET_HEIGHT = 14;

const UFO_SPAWN_INTERVAL_MS = 20000; // every 20s of level time
const UFO_SPEED = 120; // px/s
const UFO_WIDTH = 48;
const UFO_HEIGHT = 20;
const UFO_Y = 40;
const UFO_COLOR = '#00e5ff';
// tier = UFO_SCORE_TIERS[(N - 1) % 4], N = session-wide player shots fired
// so far (including the shot that lands the hit).
const UFO_SCORE_TIERS = [50, 100, 150, 300];

function randomFireDelayMs() {
  return FIRE_DELAY_MIN_MS + Math.random() * (FIRE_DELAY_MAX_MS - FIRE_DELAY_MIN_MS);
}

export class Level2 {
  constructor() {
    this.invaders = new Invaders();
    this._lastAliveCount = null;
    this._syncStepInterval();

    // Kept separate from this.invaders.bullets (which stays empty here) so
    // collide()'s own invader-bullet-vs-player pass — which knows nothing
    // about invulnerability or respawn — never touches these bullets.
    this.invaderBullets = [];
    this.fireTimer = 0;
    this.fireDelayMs = randomFireDelayMs();

    this.ufo = null;
    this.ufoTimer = 0;
    this.nextUfoFromLeft = true;
  }

  _syncStepInterval() {
    const aliveCount = this.invaders.getAliveInvaders().length;
    if (aliveCount !== this._lastAliveCount) {
      this._lastAliveCount = aliveCount;
      if (aliveCount > 0) {
        this.invaders.stepIntervalMs = stepIntervalForAliveCount(aliveCount) * SPEED_MULTIPLIER;
      }
    }
    return aliveCount;
  }

  update(dt, player, hudState) {
    const aliveCount = this._syncStepInterval();
    this.invaders.update(dt);

    this._updateInvaderFire(dt, aliveCount);
    this._updateInvaderBullets(dt);
    this._updateUfo(dt);

    collide(player, this.invaders, hudState);
    this._handleUfoHit(player, hudState);
    this._handlePlayerHit(player, hudState);
  }

  _updateInvaderFire(dt, aliveCount) {
    this.fireTimer += dt * 1000;
    if (this.fireTimer < this.fireDelayMs) return;

    this.fireTimer -= this.fireDelayMs;
    this.fireDelayMs = randomFireDelayMs();

    if (aliveCount === 0) return;

    const shooter = this._pickRandomColumnShooter();
    if (!shooter) return;

    const bounds = this.invaders.getBounds(shooter);
    this.invaderBullets.push({
      x: bounds.x + bounds.width / 2 - INVADER_BULLET_WIDTH / 2,
      y: bounds.y + bounds.height,
    });
  }

  // Groups alive invaders by column, keeping only each column's lowest
  // (highest row index, i.e. closest to the player) survivor, then picks
  // uniformly at random among those columns.
  _pickRandomColumnShooter() {
    const lowestByColumn = new Map();
    for (const inv of this.invaders.invaders) {
      if (!inv.alive) continue;
      const current = lowestByColumn.get(inv.col);
      if (!current || inv.row > current.row) {
        lowestByColumn.set(inv.col, inv);
      }
    }

    const shooters = Array.from(lowestByColumn.values());
    if (shooters.length === 0) return null;
    return shooters[Math.floor(Math.random() * shooters.length)];
  }

  _updateInvaderBullets(dt) {
    for (const bullet of this.invaderBullets) {
      bullet.y += INVADER_BULLET_SPEED * dt;
    }
    this.invaderBullets = this.invaderBullets.filter((b) => b.y < CANVAS_HEIGHT);
  }

  _updateUfo(dt) {
    this.ufoTimer += dt * 1000;
    if (this.ufoTimer >= UFO_SPAWN_INTERVAL_MS && !this.ufo) {
      this.ufoTimer -= UFO_SPAWN_INTERVAL_MS;
      this._spawnUfo();
    }

    if (!this.ufo) return;

    this.ufo.x += this.ufo.direction * UFO_SPEED * dt;
    if (this.ufo.x + this.ufo.width < 0 || this.ufo.x > CANVAS_WIDTH) {
      this.ufo = null;
    }
  }

  _spawnUfo() {
    const fromLeft = this.nextUfoFromLeft;
    this.nextUfoFromLeft = !this.nextUfoFromLeft;
    this.ufo = {
      x: fromLeft ? -UFO_WIDTH : CANVAS_WIDTH,
      y: UFO_Y,
      width: UFO_WIDTH,
      height: UFO_HEIGHT,
      direction: fromLeft ? 1 : -1,
    };
  }

  _handleUfoHit(player, hudState) {
    if (!this.ufo || !player.bullet) return;

    const bulletBounds = {
      x: player.bullet.x,
      y: player.bullet.y,
      width: PLAYER_BULLET_WIDTH,
      height: PLAYER_BULLET_HEIGHT,
    };
    if (!overlaps(bulletBounds, this.ufo)) return;

    player.bullet = null;
    hudState.score += UFO_SCORE_TIERS[(player.shotCount - 1) % 4];
    this.ufo = null;
  }

  _handlePlayerHit(player, hudState) {
    if (player.isInvulnerable()) return;

    const playerBounds = { x: player.x, y: player.y, width: player.width, height: player.height };

    const hitBullets = this.invaderBullets.filter((b) =>
      overlaps({ x: b.x, y: b.y, width: INVADER_BULLET_WIDTH, height: INVADER_BULLET_HEIGHT }, playerBounds)
    );
    const hitByInvader = this.invaders
      .getAliveInvaders()
      .some((inv) => overlaps(this.invaders.getBounds(inv), playerBounds));

    if (hitBullets.length === 0 && !hitByInvader) return;

    if (hitBullets.length > 0) {
      this.invaderBullets = this.invaderBullets.filter((b) => !hitBullets.includes(b));
    }

    hudState.lives = Math.max(0, hudState.lives - 1);
    player.respawn();
  }

  draw(ctx) {
    this.invaders.draw(ctx);
    this._drawInvaderBullets(ctx);
    this._drawUfo(ctx);
  }

  _drawInvaderBullets(ctx) {
    ctx.fillStyle = INVADER_BULLET_COLOR;
    for (const b of this.invaderBullets) {
      ctx.fillRect(b.x, b.y, INVADER_BULLET_WIDTH, INVADER_BULLET_HEIGHT);
    }
  }

  _drawUfo(ctx) {
    if (!this.ufo) return;
    ctx.fillStyle = UFO_COLOR;
    ctx.fillRect(this.ufo.x, this.ufo.y, this.ufo.width, this.ufo.height);
  }
}
