// level2.js
// Level 2: they shoot back. Reuses Level 1's 11x5 InvaderFormation and
// march/step mechanic, but at 0.67x the step interval (faster), adds a
// single global invader-fire timer (lowest surviving invader per column
// only), a periodic bonus UFO with tiered score-on-kill, and player
// hit/respawn/invulnerability. game.js owns the Level 1 -> Level 2
// transition (instantiating this class once Level 1 reports 'cleared',
// carrying over the existing player/hud state unchanged) and wiring this
// class's update()/draw() into its loop in place of Level 1's, exactly as
// it already wires Level 1 in. Level 2 does not report being cleared and
// does not transition anywhere on its own -- the Level 2 -> Level 3
// handoff belongs to "Level 3: shields and formations".

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { InvaderFormation } from './invaders.js';
import { aabbIntersects } from './collision.js';
import { hud } from './game.js';
import { SHIP_MARGIN_BOTTOM } from './player.js';

const TOTAL_INVADERS = 55; // 11 columns x 5 rows, same starting formation as Level 1
const STEP_INTERVAL_MAX = 0.8; // Level 1's slowest step interval (55 alive)
const STEP_INTERVAL_MIN = 0.1; // Level 1's fastest step interval (1 alive)
const SPEED_MULTIPLIER = 0.67; // Level 2 raises the stakes: every interval x0.67
const HORIZONTAL_STEP = 8; // px the formation advances on each step, same as Level 1

const FIRE_DELAY_MIN = 0.8; // seconds, global invader-fire timer re-arm range
const FIRE_DELAY_MAX = 2.0;
const INVADER_BULLET_WIDTH = 4;
const INVADER_BULLET_HEIGHT = 12;
const INVADER_BULLET_SPEED = 300; // px/sec, straight down
const INVADER_BULLET_COLOR = '#ffff66';

const UFO_SPAWN_INTERVAL = 20; // seconds of level time between spawns
const UFO_SPEED = 120; // px/sec
const UFO_WIDTH = 48;
const UFO_HEIGHT = 20;
const UFO_Y = 20;
const UFO_COLOR = '#cc44ff';
const UFO_SCORE_TIERS = [50, 100, 150, 300]; // indexed by cumulative shot count mod 4

const SCORE_PER_KILL = 10; // matches Level 1's per-invader score via collision.js

// Mirrors the bullet rectangle player.js draws (BULLET_WIDTH/BULLET_HEIGHT
// there); player.bullet only carries { x, y }, so the collision box is
// reconstructed here rather than redefining the bullet entity.
const PLAYER_BULLET_WIDTH = 4;
const PLAYER_BULLET_HEIGHT = 16;

const INVULNERABILITY_DURATION = 2; // seconds after a respawn

// Linear interpolation between Level 1's slowest/fastest step interval by
// invaders currently alive, then scaled by Level 2's speed multiplier.
function stepInterval(aliveCount) {
  const t = (aliveCount - 1) / (TOTAL_INVADERS - 1);
  const level1Interval = STEP_INTERVAL_MIN + (STEP_INTERVAL_MAX - STEP_INTERVAL_MIN) * t;
  return level1Interval * SPEED_MULTIPLIER;
}

function randomFireDelay() {
  return FIRE_DELAY_MIN + Math.random() * (FIRE_DELAY_MAX - FIRE_DELAY_MIN);
}

export class Level2 {
  constructor() {
    this.formation = new InvaderFormation();
    this.stepTimer = 0;
    this.fireTimer = randomFireDelay();
    this.ufo = null;
    this.ufoTimer = 0;
    this.nextUfoSideLeft = true; // first UFO of the level starts from the left edge
    this.playerInvulnerableTimer = 0;
  }

  update(dt, player) {
    this.updateFormationMarch(dt);
    this.updateInvaderFire(dt);
    this.updateInvaderBullets(dt);
    this.updateUfo(dt);

    if (this.playerInvulnerableTimer > 0) {
      this.playerInvulnerableTimer = Math.max(0, this.playerInvulnerableTimer - dt);
    }

    this.checkPlayerBulletHits(player);
    this.checkInvaderBulletHits(player);
  }

  updateFormationMarch(dt) {
    const invaders = this.formation.invaders;
    if (invaders.length === 0) return;

    this.stepTimer += dt;
    const interval = stepInterval(invaders.length);
    if (this.stepTimer >= interval) {
      this.stepTimer -= interval;
      this.step();
    }
  }

  step() {
    const invaders = this.formation.invaders;
    const direction = this.formation.direction;

    let hitEdge = false;
    for (const invader of invaders) {
      const nextX = invader.x + HORIZONTAL_STEP * direction;
      if (nextX < 0 || nextX + invader.width > CANVAS_WIDTH) {
        hitEdge = true;
        break;
      }
    }

    if (hitEdge) {
      this.formation.direction *= -1;
      for (const invader of invaders) {
        invader.y += invader.height;
      }
    } else {
      for (const invader of invaders) {
        invader.x += HORIZONTAL_STEP * direction;
      }
    }
  }

  updateInvaderFire(dt) {
    if (this.formation.invaders.length === 0) return;

    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireInvaderShot();
      this.fireTimer = randomFireDelay();
    }
  }

  // Only the lowest surviving invader in each column may fire: group
  // survivors by their (shared, since the formation moves rigidly)
  // column x-coordinate and keep the one furthest down per column.
  fireInvaderShot() {
    const invaders = this.formation.invaders;
    const lowestByColumn = new Map();
    for (const invader of invaders) {
      const current = lowestByColumn.get(invader.x);
      if (!current || invader.y > current.y) {
        lowestByColumn.set(invader.x, invader);
      }
    }

    const shooters = Array.from(lowestByColumn.values());
    const shooter = shooters[Math.floor(Math.random() * shooters.length)];
    this.formation.bullets.push({
      x: shooter.x + shooter.width / 2 - INVADER_BULLET_WIDTH / 2,
      y: shooter.y + shooter.height,
      width: INVADER_BULLET_WIDTH,
      height: INVADER_BULLET_HEIGHT,
    });
  }

  updateInvaderBullets(dt) {
    const bullets = this.formation.bullets;
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y += INVADER_BULLET_SPEED * dt;
      if (bullets[i].y > CANVAS_HEIGHT) {
        bullets.splice(i, 1);
      }
    }
  }

  updateUfo(dt) {
    if (this.ufo) {
      this.ufo.x += this.ufo.direction * UFO_SPEED * dt;
      if (this.ufo.x + this.ufo.width < 0 || this.ufo.x > CANVAS_WIDTH) {
        this.ufo = null;
      }
      return;
    }

    this.ufoTimer += dt;
    if (this.ufoTimer >= UFO_SPAWN_INTERVAL) {
      this.ufoTimer -= UFO_SPAWN_INTERVAL;
      this.spawnUfo();
    }
  }

  spawnUfo() {
    const startFromLeft = this.nextUfoSideLeft;
    this.ufo = {
      x: startFromLeft ? -UFO_WIDTH : CANVAS_WIDTH,
      y: UFO_Y,
      width: UFO_WIDTH,
      height: UFO_HEIGHT,
      direction: startFromLeft ? 1 : -1,
    };
    this.nextUfoSideLeft = !startFromLeft;
  }

  checkPlayerBulletHits(player) {
    const bullet = player.bullet;
    if (!bullet) return;

    const bulletRect = {
      x: bullet.x,
      y: bullet.y,
      width: PLAYER_BULLET_WIDTH,
      height: PLAYER_BULLET_HEIGHT,
    };

    const invaders = this.formation.invaders;
    for (let i = 0; i < invaders.length; i++) {
      if (aabbIntersects(bulletRect, invaders[i])) {
        invaders.splice(i, 1);
        player.bullet = null;
        hud.score += SCORE_PER_KILL;
        return;
      }
    }

    if (this.ufo && aabbIntersects(bulletRect, this.ufo)) {
      const tier = UFO_SCORE_TIERS[hud.shotsFired % 4];
      hud.score += tier;
      this.ufo = null;
      player.bullet = null;
    }
  }

  // A hit costs a life and respawns the player only when not already
  // invulnerable; hits landing during the invulnerability window still
  // consume the bullet but cause no extra life loss or respawn.
  checkInvaderBulletHits(player) {
    const bullets = this.formation.bullets;
    for (let i = bullets.length - 1; i >= 0; i--) {
      if (aabbIntersects(bullets[i], player)) {
        bullets.splice(i, 1);
        if (this.playerInvulnerableTimer <= 0) {
          player.loseLife();
          this.respawnPlayer(player);
          this.playerInvulnerableTimer = INVULNERABILITY_DURATION;
        }
      }
    }
  }

  respawnPlayer(player) {
    player.x = (CANVAS_WIDTH - player.width) / 2;
    player.y = CANVAS_HEIGHT - player.height - SHIP_MARGIN_BOTTOM;
  }

  // Blinks the ship during the invulnerability window instead of hiding it
  // outright the whole time, so the flash reads as a flash.
  isPlayerVisible() {
    if (this.playerInvulnerableTimer <= 0) return true;
    return Math.floor(this.playerInvulnerableTimer * 10) % 2 === 0;
  }

  draw(ctx, player) {
    this.formation.draw(ctx);
    this.drawInvaderBullets(ctx);
    if (this.ufo) {
      this.drawUfo(ctx);
    }
    if (this.isPlayerVisible()) {
      player.draw(ctx);
    }
  }

  drawInvaderBullets(ctx) {
    ctx.fillStyle = INVADER_BULLET_COLOR;
    for (const bullet of this.formation.bullets) {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
  }

  drawUfo(ctx) {
    ctx.fillStyle = UFO_COLOR;
    ctx.fillRect(this.ufo.x, this.ufo.y, this.ufo.width, this.ufo.height);
  }
}
