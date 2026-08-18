// Level 2: they shoot back.
// Added by "Level 2: they shoot back".
//
// The first difficulty escalation, built by EXTENDING Level1 (level1.js) —
// nothing of the grid/march implementation is duplicated:
//
//   grid     inherited: the same shared InvaderFormation (invaders.js)
//            spawns the classic 11-column x 5-row grid — 55 invaders
//   march    inherited step/acceleration curve, every interval x 0.67
//            (~1.5x faster at every point): the stepIntervalMs() override
//   breach   inherited from Level 1: the lowest invader reaching the
//            player's row costs one life and restarts the level
//   clear    inherited: the 55th kill sets `cleared` and game.js hands
//            off to the next registered level through the registry
//   fire     NEW: one global timer fires one invader bullet every
//            800–2000 ms (re-randomized after each shot) from the lowest
//            living invader of a random still-populated column; bullets
//            fly straight down at 300 px/s, several at once
//   ufo      NEW: every 20 s a bonus saucer crosses the top of the screen
//            at 120 px/s, entering from alternating sides; shooting it
//            awards 50/100/150/300 by session shot count mod 4
//   respawn  NEW: a lost life (invader bullet via collision.js, or a
//            breach) respawns the ship at its bottom-centre start with
//            2 s of flashing invulnerability
//
// Lives, score and the session shot count are NOT touched here: they live
// in game.js's shared context (hud) and in player.js, so they carry over
// from Level 1 exactly as they stood. Game over at 0 lives stays owned by
// game.js; invader kills/score/explosions stay owned by collision.js.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { INVADER_COLS } from './invaders.js';
import { overlaps } from './collision.js';
import { Level1 } from './level1.js';
import { registerLevel } from './levels.js';

// March speed-up: every step interval of Level 1's acceleration curve is
// multiplied by this factor (e.g. a 600 ms Level 1 interval becomes
// 402 ms here).
const MARCH_INTERVAL_FACTOR = 0.67;

// Enemy fire: one bullet per volley on a single global timer (shared, not
// per column), the next volley due in a fresh random 800–2000 ms drawn
// after each shot.
const FIRE_INTERVAL_MIN_MS = 800;
const FIRE_INTERVAL_MAX_MS = 2000;

// Invader bullet geometry/motion: straight down at 300 px/s. Several may
// be on screen at once; they live in game.js's shared hostileBullets list
// so the existing collision pass consumes them.
const INVADER_BULLET_WIDTH = 4;
const INVADER_BULLET_HEIGHT = 14;
const INVADER_BULLET_SPEED = 300;
const INVADER_BULLET_COLOR = '#ff5555';

// Bonus UFO: one appearance every 20 s, timed from level start with the
// timer re-armed by each appearance. The saucer crosses the top band —
// below the HUD text (ends at y = 52), above the formation's home row
// (y = 112) — at a constant 120 px/s, and each entry starts from the
// opposite side to the previous appearance.
const UFO_INTERVAL_MS = 20000;
const UFO_SPEED = 120;
const UFO_WIDTH = 44;
const UFO_HEIGHT = 16;
const UFO_Y = 64;
const UFO_COLOR = '#ff3333';
const UFO_DOME_RADIUS = 6;

// Classic fixed bonus tiers, picked by (session shot count mod 4):
// 0 -> 50, 1 -> 100, 2 -> 150, 3 -> 300. The shot count lives in
// player.js and accumulates across the whole session (both levels) — it
// is not reset by the level transition.
const UFO_SCORE_TIERS = [50, 100, 150, 300];

// Post-respawn protection: 2 s of flashing invulnerability.
const RESPAWN_INVULNERABILITY_S = 2;

// A fresh random delay until the next volley, in [800, 2000) ms.
function randomFireIntervalMs() {
  return (
    FIRE_INTERVAL_MIN_MS +
    Math.random() * (FIRE_INTERVAL_MAX_MS - FIRE_INTERVAL_MIN_MS)
  );
}

export class Level2 extends Level1 {
  // context is game.js's shared slice of game state:
  // { player, hud, hostileBullets }.
  constructor(context) {
    super(context); // player, the classic formation, march timer, cleared

    this.hud = context.hud;
    // The shared invader-bullet list: this level pushes bullets in, and
    // the collision pass (collision.js) removes the ones that hit the
    // ship and applies the life loss through player.loseLife().
    this.hostileBullets = context.hostileBullets;

    // Enemy-fire state: time accumulated toward the next volley and the
    // (randomized) delay the current volley is waiting for.
    this.fireTimerMs = 0;
    this.nextFireMs = randomFireIntervalMs();

    // UFO state: ms accumulated toward the next appearance (level start
    // is t0), the active saucer rect { x, y, width, height, direction }
    // or null, and the side the NEXT saucer enters from. Consecutive
    // appearances alternate sides; the first one of the level may be
    // either side — this one enters from the left.
    this.ufoTimerMs = 0;
    this.ufo = null;
    this.ufoFromLeft = true;

    // Life-loss detection: collision.js applies bullet damage through
    // player.loseLife() in the collision pass AFTER the levels update, so
    // a lost life is observed here one fixed step later and answered with
    // the respawn. The same path covers the inherited breach loss.
    this.lastLives = this.player.lives;
  }

  // Level 1's step interval at the current body count x 0.67 — ~1.5x
  // faster at every equivalent point of the march (same number of
  // remaining invaders).
  stepIntervalMs() {
    return super.stepIntervalMs() * MARCH_INTERVAL_FACTOR;
  }

  // Breach restart: Level 1's initial state (full formation, zeroed march
  // timer, ship back home) plus Level 2's initial state — no volley
  // pending, no hostile bullets in flight, no UFO, the 20 s UFO cadence
  // restarted. Lives, score and the session shot count stay untouched.
  restart() {
    super.restart();
    this.hostileBullets.length = 0;
    this.fireTimerMs = 0;
    this.nextFireMs = randomFireIntervalMs();
    this.ufoTimerMs = 0;
    this.ufo = null;
  }

  update(dt) {
    // March (x 0.67), edge drops, breach -> lose-one-life + restart and
    // clear detection — all inherited from Level 1.
    super.update(dt);

    // On the clear frame: drop any in-flight hostile bullets so nothing
    // leaks into the next level, then stop — the level is over and
    // game.js hands off through the registry.
    if (this.cleared) {
      this.hostileBullets.length = 0;
      return;
    }

    this.updateEnemyFire(dt);
    this.updateHostileBullets(dt);
    this.updateUfo(dt);
    this.updateRespawn();
  }

  // One global volley timer: while at least one invader remains, exactly
  // one bullet is fired every 800–2000 ms, the delay re-randomized after
  // each shot. The timer keeps its remainder (rather than being zeroed)
  // so the average volley rate stays exact at the 60 steps/s fixed
  // timestep.
  updateEnemyFire(dt) {
    if (this.formation.aliveCount() === 0) return;

    this.fireTimerMs += dt * 1000;
    if (this.fireTimerMs < this.nextFireMs) return;
    this.fireTimerMs -= this.nextFireMs;
    this.nextFireMs = randomFireIntervalMs();

    const shooter = this.pickShooter();
    if (shooter === null) return; // defensive; aliveCount() was checked
    this.hostileBullets.push({
      x: shooter.x + shooter.width / 2 - INVADER_BULLET_WIDTH / 2,
      y: shooter.y + shooter.height,
      width: INVADER_BULLET_WIDTH,
      height: INVADER_BULLET_HEIGHT,
    });
  }

  // The lowest living invader in a column chosen at random among the
  // columns that still have invaders, or null when none are alive.
  // invaders.js builds its flat array row-major and never reorders it, so
  // the column of entry i is i % INVADER_COLS; the max-y comparison picks
  // the lowest living invader within each column.
  pickShooter() {
    const lowestByColumn = new Array(INVADER_COLS).fill(null);
    const invaders = this.formation.invaders;
    for (let i = 0; i < invaders.length; i++) {
      const invader = invaders[i];
      if (!invader.alive) continue;
      const column = i % INVADER_COLS;
      const current = lowestByColumn[column];
      if (current === null || invader.y > current.y) {
        lowestByColumn[column] = invader;
      }
    }
    const candidates = lowestByColumn.filter((invader) => invader !== null);
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // Bullet flight: straight down at 300 px/s; a bullet leaves the list
  // when its top edge passes the bottom of the playfield. (The ones that
  // hit the ship are removed by the collision pass.)
  updateHostileBullets(dt) {
    for (let i = this.hostileBullets.length - 1; i >= 0; i--) {
      const bullet = this.hostileBullets[i];
      bullet.y += INVADER_BULLET_SPEED * dt;
      if (bullet.y >= CANVAS_HEIGHT) this.hostileBullets.splice(i, 1);
    }
  }

  // The 20 s UFO cadence and the crossing saucer. The timer runs from
  // level start and is re-armed by every appearance (keeping its
  // remainder, so the cadence stays exact at the fixed timestep); each
  // entry starts from the opposite side to the previous one. A saucer
  // leaves when it has crossed the whole screen, or when the player's
  // bullet kills it — tested with the shared AABB overlap from
  // collision.js — which awards the fixed tier picked by the session shot
  // count mod 4 (0 -> 50, 1 -> 100, 2 -> 150, 3 -> 300).
  updateUfo(dt) {
    this.ufoTimerMs += dt * 1000;
    if (this.ufoTimerMs >= UFO_INTERVAL_MS) {
      this.ufoTimerMs -= UFO_INTERVAL_MS;
      if (this.ufo === null) this.spawnUfo();
    }

    if (this.ufo === null) return;

    this.ufo.x += this.ufo.direction * UFO_SPEED * dt;
    const goneRight = this.ufo.direction > 0 && this.ufo.x >= CANVAS_WIDTH;
    const goneLeft = this.ufo.direction < 0 && this.ufo.x + this.ufo.width <= 0;
    if (goneRight || goneLeft) {
      this.ufo = null;
      return;
    }

    const bullet = this.player.bullet;
    if (bullet !== null && overlaps(bullet, this.ufo)) {
      this.hud.score +=
        UFO_SCORE_TIERS[this.player.shotsFired % UFO_SCORE_TIERS.length];
      this.player.bullet = null;
      this.ufo = null;
    }
  }

  spawnUfo() {
    const fromLeft = this.ufoFromLeft;
    this.ufoFromLeft = !this.ufoFromLeft; // next entry: the opposite side
    this.ufo = {
      x: fromLeft ? -UFO_WIDTH : CANVAS_WIDTH,
      y: UFO_Y,
      width: UFO_WIDTH,
      height: UFO_HEIGHT,
      direction: fromLeft ? 1 : -1,
    };
  }

  // A lost life — an invader bullet (applied by collision.js after the
  // levels update) or the inherited breach — respawns the ship at its
  // fixed bottom-centre start position with 2 s of flashing
  // invulnerability; further hits during the window deduct nothing
  // (player.js gates loseLife() on the window).
  updateRespawn() {
    if (this.player.lives < this.lastLives) {
      this.player.resetPosition();
      this.player.grantInvulnerability(RESPAWN_INVULNERABILITY_S);
    }
    this.lastLives = this.player.lives;
  }

  draw(ctx) {
    // The formation, drawn by the shared sprite code via Level 1.
    super.draw(ctx);

    // In-flight invader bullets: small filled rectangles.
    ctx.fillStyle = INVADER_BULLET_COLOR;
    for (const bullet of this.hostileBullets) {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // The bonus saucer: a dome on a hull, one flat colour, no assets.
    if (this.ufo !== null) {
      const centerX = this.ufo.x + this.ufo.width / 2;
      const hullY = this.ufo.y + UFO_DOME_RADIUS;
      ctx.fillStyle = UFO_COLOR;
      ctx.beginPath();
      ctx.arc(centerX, hullY, UFO_DOME_RADIUS, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(this.ufo.x, hullY, this.ufo.width, this.ufo.height - UFO_DOME_RADIUS);
    }
  }
}

// Self-registration: game.js imports this module once so this line runs,
// and clearing Level 1 hands off to Level 2 with no further wiring.
registerLevel(2, (context) => new Level2(context));
