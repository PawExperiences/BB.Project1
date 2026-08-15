// Level 2: they shoot back.
//
// Owns the level-2-specific formation lifecycle (same 11x5 grid as Level 1,
// marching 1.5x faster), invader return fire, the bonus UFO, and the
// player hit/respawn/invulnerability state machine that Level 1 doesn't
// need. Reuses InvaderFormation from invaders.js for the grid data/draw()
// and BULLET_WIDTH/BULLET_HEIGHT from player.js for bullet AABBs, instead
// of redefining any of it here.
//
// Invader bullets and the UFO are handled entirely inside this module
// (never written into `formation.bullets`, which collision.js also reads)
// so that Level 1's shared collision.js pass -- still used here only for
// player-bullet-vs-invader -- is not affected by Level 2's respawn/
// invulnerability rules.

import { InvaderFormation } from './invaders.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { BULLET_WIDTH, BULLET_HEIGHT } from './player.js';
import { hud, triggerGameOver } from './game.js';

const TOTAL_INVADERS = 55; // 11 columns x 5 rows
const MAX_STEP_INTERVAL = 800; // ms, with all 55 invaders alive (Level 1's ramp)
const MIN_STEP_INTERVAL = 100; // ms, with 1 invader alive (Level 1's ramp)
const SPEED_MULTIPLIER = 0.67; // every step interval is 1.5x faster than Level 1
const STEP_X = 8; // px, per horizontal step

const FIRE_MIN_MS = 800; // global invader-fire timer re-arm range
const FIRE_MAX_MS = 2000;
const BULLET_FALL_SPEED = 300; // px/sec, invader bullets straight down
const BULLET_COLOR = '#ff5252';

const UFO_SPAWN_INTERVAL_MS = 20000;
const UFO_SPEED = 120; // px/sec
const UFO_WIDTH = 40;
const UFO_HEIGHT = 20;
const UFO_Y = 40;
const UFO_COLOR = '#e040fb';
const UFO_SCORE_TIERS = [50, 100, 150, 300]; // tiers[cumulativeShotCount % 4]

const INVULNERABLE_MS = 2000; // post-respawn invulnerability window

// Same linear ramp as Level 1 (100ms .. 800ms based on alive count), with
// every resulting interval multiplied by 0.67 so the whole curve is 1.5x
// faster throughout, not just at its endpoints.
function stepIntervalFor(aliveCount) {
  const level1Interval =
    MIN_STEP_INTERVAL +
    ((aliveCount - 1) * (MAX_STEP_INTERVAL - MIN_STEP_INTERVAL)) / (TOTAL_INVADERS - 1);
  return level1Interval * SPEED_MULTIPLIER;
}

function overlaps(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function randomFireInterval() {
  return FIRE_MIN_MS + Math.random() * (FIRE_MAX_MS - FIRE_MIN_MS);
}

export class Level2 {
  constructor() {
    this.spawn();
    this.bullets = []; // invader bullets: { x, y }
    this.fireTimerMs = randomFireInterval();
    this.ufo = null; // { x, y, width, height, direction } while crossing, else null
    this.ufoTimerMs = 0;
    this.ufoNextSide = 'left'; // alternates on every successive spawn
  }

  // (Re)spawns a fresh full 11x5 formation and resets the step timer/ramp.
  // Mirrors Level1.spawn() -- deliberately leaves bullets/UFO/fire-timer
  // state untouched, same as Level 1 only resets the grid on a restart.
  spawn() {
    this.formation = new InvaderFormation();
    this.stepTimerMs = 0;
    this.cleared = false;
  }

  step() {
    const invaders = this.formation.invaders;
    if (invaders.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    for (const invader of invaders) {
      minX = Math.min(minX, invader.x);
      maxX = Math.max(maxX, invader.x + invader.width);
    }

    const dx = STEP_X * this.formation.direction;
    const hitsRightEdge = this.formation.direction > 0 && maxX + dx > CANVAS_WIDTH;
    const hitsLeftEdge = this.formation.direction < 0 && minX + dx < 0;

    if (hitsRightEdge || hitsLeftEdge) {
      this.formation.direction *= -1;
      const cellHeight = invaders[0].height; // one invader-cell height
      for (const invader of invaders) {
        invader.y += cellHeight;
      }
    } else {
      for (const invader of invaders) {
        invader.x += dx;
      }
    }
  }

  reachesPlayerRow(player) {
    return this.formation.invaders.some((invader) => invader.y + invader.height >= player.y);
  }

  // Groups surviving invaders by column (their shared x, since the whole
  // formation always moves rigidly together) so firing can pick a column
  // uniformly at random among columns that still have survivors.
  columns() {
    const columns = new Map();
    for (const invader of this.formation.invaders) {
      const key = Math.round(invader.x);
      if (!columns.has(key)) columns.set(key, []);
      columns.get(key).push(invader);
    }
    return columns;
  }

  updateFiring(dt) {
    this.fireTimerMs -= dt * 1000;
    if (this.fireTimerMs > 0) return;
    this.fireTimerMs = randomFireInterval();

    const columns = this.columns();
    const keys = Array.from(columns.keys());
    if (keys.length === 0) return;

    const chosenColumn = columns.get(keys[Math.floor(Math.random() * keys.length)]);
    let lowest = chosenColumn[0];
    for (const invader of chosenColumn) {
      if (invader.y > lowest.y) lowest = invader;
    }

    this.bullets.push({
      x: lowest.x + lowest.width / 2 - BULLET_WIDTH / 2,
      y: lowest.y + lowest.height,
    });
  }

  updateBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].y += BULLET_FALL_SPEED * dt;
      if (this.bullets[i].y > CANVAS_HEIGHT) {
        this.bullets.splice(i, 1);
      }
    }
  }

  updateUfo(dt) {
    if (!this.ufo) {
      this.ufoTimerMs += dt * 1000;
      if (this.ufoTimerMs >= UFO_SPAWN_INTERVAL_MS) {
        this.ufoTimerMs = 0;
        this.spawnUfo();
      }
      return;
    }

    this.ufo.x += UFO_SPEED * this.ufo.direction * dt;
    if (this.ufo.x + this.ufo.width < 0 || this.ufo.x > CANVAS_WIDTH) {
      this.ufo = null;
    }
  }

  spawnUfo() {
    const fromLeft = this.ufoNextSide === 'left';
    this.ufo = {
      x: fromLeft ? -UFO_WIDTH : CANVAS_WIDTH,
      y: UFO_Y,
      width: UFO_WIDTH,
      height: UFO_HEIGHT,
      direction: fromLeft ? 1 : -1,
    };
    this.ufoNextSide = fromLeft ? 'right' : 'left';
  }

  // Player bullet vs the bonus UFO. Checked ahead of collision.js's
  // player-bullet-vs-invader pass (run by game.js right after this
  // update()) so a bullet that hits the UFO is consumed here and can't
  // also register as an invader hit the same frame.
  checkUfoHit(player) {
    if (!this.ufo || !player.bullet) return;

    const bulletBox = { x: player.bullet.x, y: player.bullet.y, width: BULLET_WIDTH, height: BULLET_HEIGHT };
    if (overlaps(bulletBox, this.ufo)) {
      hud.score += UFO_SCORE_TIERS[player.shotsFired % UFO_SCORE_TIERS.length];
      player.bullet = null;
      this.ufo = null;
    }
  }

  // Costs one life and respawns the player (fixed start position, 2s
  // invulnerability) -- unless the player is already invulnerable, in
  // which case the hit is ignored outright: no life lost, no restart of
  // the invulnerability timer.
  handlePlayerHit(player) {
    if (player.invulnerable) return;

    player.loseLife();
    hud.lives = player.lives;
    if (player.lives <= 0) {
      triggerGameOver();
      return;
    }
    player.respawn(INVULNERABLE_MS);
  }

  checkPlayerHit(player) {
    const playerBox = { x: player.x, y: player.y, width: player.width, height: player.height };

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      const bulletBox = { x: bullet.x, y: bullet.y, width: BULLET_WIDTH, height: BULLET_HEIGHT };
      if (overlaps(bulletBox, playerBox)) {
        this.bullets.splice(i, 1);
        this.handlePlayerHit(player);
      }
    }
  }

  update(dt, player) {
    if (this.cleared) return;

    const invaders = this.formation.invaders;
    if (invaders.length === 0) {
      this.cleared = true;
      return;
    }

    this.stepTimerMs += dt * 1000;
    const interval = stepIntervalFor(invaders.length);
    while (this.stepTimerMs >= interval && this.formation.invaders.length > 0) {
      this.stepTimerMs -= interval;
      this.step();
    }

    if (this.formation.invaders.length === 0) {
      this.cleared = true;
      return;
    }

    this.updateFiring(dt);
    this.updateBullets(dt);
    this.updateUfo(dt);
    this.checkUfoHit(player);
    this.checkPlayerHit(player);

    if (player.lives <= 0) return;

    if (this.reachesPlayerRow(player)) {
      this.handlePlayerHit(player);
      if (player.lives > 0) {
        this.spawn();
      }
    }
  }

  draw(ctx) {
    this.formation.draw(ctx);

    ctx.fillStyle = BULLET_COLOR;
    for (const bullet of this.bullets) {
      ctx.fillRect(bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT);
    }

    if (this.ufo) {
      ctx.fillStyle = UFO_COLOR;
      ctx.fillRect(this.ufo.x, this.ufo.y, this.ufo.width, this.ufo.height);
    }
  }
}
