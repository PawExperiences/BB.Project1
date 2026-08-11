// boss.js
// Level 4: the final boss. A single large enemy drawn entirely with canvas
// primitives (no image assets) that drifts horizontally, reversing at the
// canvas edges, while holding a fixed vertical position for the whole
// fight. Fires a three-bullet spread from its center on a timer that speeds
// up once its HP drops to the Phase 2 threshold. Reuses collision.js's
// aabbIntersects for every hit test (player bullet vs. boss, boss bullet
// vs. player) rather than inventing parallel collision logic, exactly like
// level2.js/level3.js already do for their own bullet checks. game.js owns
// instantiating this class once Level 3 reports 'cleared' (the same
// level-number dispatch pattern used for levels 1-3) and reacting to the
// 'playerHit' / 'victory' results this class's update() returns -- sudden
// death and the win screen are both driven from there.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { aabbIntersects } from './collision.js';

const BOSS_WIDTH = 160;
const BOSS_HEIGHT = 80;
const BOSS_Y = 110; // fixed for the whole fight -- clear of the health bar and HUD text, never descends
const BOSS_SPEED = 90; // px/sec
const BOSS_MAX_HP = 10;
const BOSS_COLOR = '#ff44aa';
const BOSS_CORE_COLOR = '#220011';
const BOSS_EYE_COLOR = '#ffee55';
const BOSS_CANNON_COLOR = '#aa2266';

const HEALTH_BAR_HEIGHT = 10;
const HEALTH_BAR_BG_COLOR = '#333333';
const HEALTH_BAR_FILL_COLOR = '#ff2255';

// Phase 1 covers HP 10 down through 6; the instant HP reaches the Phase 2
// threshold (5), firing switches to the faster interval for the rest of the
// fight -- the intake's "HP 10 down to 5" range and its "the instant HP
// reaches 5" trigger read as contradictory at the HP=5 boundary itself, so
// this treats the explicit "instant it reaches 5" trigger (stated twice) as
// authoritative: HP<=5 is Phase 2. Flagged as an assumption in the PR notes.
const PHASE2_HP_THRESHOLD = 5;
const PHASE1_FIRE_INTERVAL = 1.5; // seconds
const PHASE2_FIRE_INTERVAL = 0.7; // seconds

const SPREAD_ANGLE = Math.PI / 9; // 20 degrees, either side of straight down
const BULLET_SPEED = 260; // px/sec
const BULLET_SIZE = 8; // square hitbox/visual for all three spread bullets
const BULLET_COLOR = '#ff66cc';

// Mirrors the bullet rectangle player.js draws (BULLET_WIDTH/BULLET_HEIGHT
// there); player.bullet only carries { x, y }, so the collision box is
// reconstructed here rather than redefining the bullet entity -- same
// pattern collision.js/level2.js/level3.js already use.
const PLAYER_BULLET_WIDTH = 4;
const PLAYER_BULLET_HEIGHT = 16;

export class Boss {
  constructor() {
    this.x = (CANVAS_WIDTH - BOSS_WIDTH) / 2;
    this.y = BOSS_Y;
    this.width = BOSS_WIDTH;
    this.height = BOSS_HEIGHT;
    this.direction = 1; // 1 = moving right, -1 = moving left
    this.hp = BOSS_MAX_HP;
    this.fireTimer = PHASE1_FIRE_INTERVAL;
    this.bullets = []; // boss bullets in flight: { x, y, vx, vy, width, height }
  }

  // Advances the fight by dt. Returns 'victory' the instant HP hits 0,
  // 'playerHit' the instant any boss bullet touches the player (sudden
  // death), otherwise null. game.js drives both endings from these results.
  update(dt, player) {
    this.updateMovement(dt);
    this.updateFiring(dt);
    this.updateBullets(dt);

    this.checkPlayerBulletHit(player);
    if (this.hp <= 0) {
      return 'victory';
    }

    if (this.checkBossBulletsHitPlayer(player)) {
      return 'playerHit';
    }

    return null;
  }

  updateMovement(dt) {
    this.x += this.direction * BOSS_SPEED * dt;
    if (this.x <= 0) {
      this.x = 0;
      this.direction = 1;
    } else if (this.x + BOSS_WIDTH >= CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - BOSS_WIDTH;
      this.direction = -1;
    }
  }

  currentFireInterval() {
    return this.hp <= PHASE2_HP_THRESHOLD ? PHASE2_FIRE_INTERVAL : PHASE1_FIRE_INTERVAL;
  }

  updateFiring(dt) {
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireSpread();
      this.fireTimer = this.currentFireInterval();
    }
  }

  // Three bullets from the boss's center point: straight down, and one each
  // 20 degrees left/right of straight down, all at the same speed.
  fireSpread() {
    const centerX = this.x + BOSS_WIDTH / 2;
    const centerY = this.y + BOSS_HEIGHT / 2;

    for (const angle of [-SPREAD_ANGLE, 0, SPREAD_ANGLE]) {
      this.bullets.push({
        x: centerX - BULLET_SIZE / 2,
        y: centerY - BULLET_SIZE / 2,
        vx: Math.sin(angle) * BULLET_SPEED,
        vy: Math.cos(angle) * BULLET_SPEED,
        width: BULLET_SIZE,
        height: BULLET_SIZE,
      });
    }
  }

  updateBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;

      if (
        bullet.y > CANVAS_HEIGHT ||
        bullet.x + bullet.width < 0 ||
        bullet.x > CANVAS_WIDTH
      ) {
        this.bullets.splice(i, 1);
      }
    }
  }

  checkPlayerBulletHit(player) {
    const bullet = player.bullet;
    if (!bullet) return;

    const bulletRect = {
      x: bullet.x,
      y: bullet.y,
      width: PLAYER_BULLET_WIDTH,
      height: PLAYER_BULLET_HEIGHT,
    };

    if (aabbIntersects(bulletRect, this)) {
      player.bullet = null;
      this.hp = Math.max(0, this.hp - 1);
    }
  }

  checkBossBulletsHitPlayer(player) {
    for (const bullet of this.bullets) {
      if (aabbIntersects(bullet, player)) {
        return true;
      }
    }
    return false;
  }

  draw(ctx, player) {
    this.drawHealthBar(ctx);
    this.drawBody(ctx);
    this.drawBullets(ctx);
    player.draw(ctx);
  }

  drawHealthBar(ctx) {
    ctx.fillStyle = HEALTH_BAR_BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, HEALTH_BAR_HEIGHT);

    const fillWidth = CANVAS_WIDTH * (this.hp / BOSS_MAX_HP);
    ctx.fillStyle = HEALTH_BAR_FILL_COLOR;
    ctx.fillRect(0, 0, fillWidth, HEALTH_BAR_HEIGHT);
  }

  drawBody(ctx) {
    const { x, y } = this;
    const centerX = x + BOSS_WIDTH / 2;
    const centerY = y + BOSS_HEIGHT / 2;

    ctx.fillStyle = BOSS_COLOR;
    ctx.fillRect(x, y, BOSS_WIDTH, BOSS_HEIGHT);

    ctx.fillStyle = BOSS_CANNON_COLOR;
    ctx.fillRect(x, y + BOSS_HEIGHT * 0.7, BOSS_WIDTH * 0.15, BOSS_HEIGHT * 0.3);
    ctx.fillRect(x + BOSS_WIDTH * 0.85, y + BOSS_HEIGHT * 0.7, BOSS_WIDTH * 0.15, BOSS_HEIGHT * 0.3);

    ctx.fillStyle = BOSS_CORE_COLOR;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = BOSS_EYE_COLOR;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBullets(ctx) {
    ctx.fillStyle = BULLET_COLOR;
    for (const bullet of this.bullets) {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
  }
}
