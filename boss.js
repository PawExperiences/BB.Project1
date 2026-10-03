import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { aabbOverlap } from './collision.js';

export const BOSS_WIDTH = 160;
export const BOSS_HEIGHT = 80;
export const BOSS_MAX_HP = 10;
export const BOSS_SPEED = 90; // px/s, horizontal drift
export const BOSS_PROJECTILE_SPEED = 260; // px/s
export const BOSS_SPREAD_ANGLE_DEG = 20;
export const BOSS_PHASE_1_FIRE_INTERVAL_MS = 1500;
export const BOSS_PHASE_2_FIRE_INTERVAL_MS = 700;

// Phase 1 is HP 6-10 inclusive; the hit that brings the boss down to 5 HP
// is the one that drops it into Phase 2 (HP <= 5), per the resolved reading
// of the (self-contradictory) intake.
export const BOSS_PHASE_2_HP_THRESHOLD = 5;

const SPREAD_ANGLE_RAD = (BOSS_SPREAD_ANGLE_DEG * Math.PI) / 180;

const BOSS_COLOR = '#ff2a6d';
const BOSS_BULLET_COLOR = '#ff2a6d';
const BOSS_BULLET_WIDTH = 6;
const BOSS_BULLET_HEIGHT = 12;

const HEALTH_BAR_MARGIN_X = 16;
const HEALTH_BAR_Y = 8;
const HEALTH_BAR_HEIGHT = 16;
const HEALTH_BAR_SEGMENT_GAP = 2;

// Fixed for the whole fight: the boss drifts horizontally only, well below
// the health bar strip reserved above it, so the two never overlap.
const BOSS_TOP_MARGIN = 16;
const BOSS_Y = HEALTH_BAR_Y + HEALTH_BAR_HEIGHT + BOSS_TOP_MARGIN;

let x = (CANVAS_WIDTH - BOSS_WIDTH) / 2;
let direction = 1; // 1 moves right, -1 moves left
let hp = BOSS_MAX_HP;
let fireTimer = 0;
const bullets = [];

function fireIntervalSeconds() {
  const ms =
    hp <= BOSS_PHASE_2_HP_THRESHOLD
      ? BOSS_PHASE_2_FIRE_INTERVAL_MS
      : BOSS_PHASE_1_FIRE_INTERVAL_MS;
  return ms / 1000;
}

// Fixed three-bullet fan from the boss' geometric centre: straight down,
// and the same speed rotated +/-20 degrees from that down vector.
function spawnVolley() {
  const originX = x + BOSS_WIDTH / 2;
  const originY = BOSS_Y + BOSS_HEIGHT / 2;
  const angles = [0, -SPREAD_ANGLE_RAD, SPREAD_ANGLE_RAD];

  for (const angle of angles) {
    bullets.push({
      x: originX - BOSS_BULLET_WIDTH / 2,
      y: originY - BOSS_BULLET_HEIGHT / 2,
      width: BOSS_BULLET_WIDTH,
      height: BOSS_BULLET_HEIGHT,
      vx: Math.sin(angle) * BOSS_PROJECTILE_SPEED,
      vy: Math.cos(angle) * BOSS_PROJECTILE_SPEED,
    });
  }
}

// Continuous left/right drift, bouncing off both canvas edges. Only `x` is
// ever written here -- BOSS_Y is a module-level const set once above, so
// the boss never descends for the rest of the fight.
function updateMovement(dt) {
  x += direction * BOSS_SPEED * dt;

  if (x <= 0) {
    x = 0;
    direction = 1;
  } else if (x + BOSS_WIDTH >= CANVAS_WIDTH) {
    x = CANVAS_WIDTH - BOSS_WIDTH;
    direction = -1;
  }
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;

    if (
      bullet.y > CANVAS_HEIGHT ||
      bullet.x + bullet.width < 0 ||
      bullet.x > CANVAS_WIDTH
    ) {
      bullets.splice(i, 1);
    }
  }
}

function update(dt) {
  updateMovement(dt);
  updateBullets(dt);

  fireTimer += dt;
  const interval = fireIntervalSeconds();
  while (fireTimer >= interval) {
    fireTimer -= interval;
    spawnVolley();
  }
}

function draw(ctx) {
  const barWidth = CANVAS_WIDTH - HEALTH_BAR_MARGIN_X * 2;
  const segmentWidth =
    (barWidth - HEALTH_BAR_SEGMENT_GAP * (BOSS_MAX_HP - 1)) / BOSS_MAX_HP;

  for (let i = 0; i < BOSS_MAX_HP; i++) {
    const segmentX =
      HEALTH_BAR_MARGIN_X + i * (segmentWidth + HEALTH_BAR_SEGMENT_GAP);
    ctx.fillStyle = i < hp ? '#39ff14' : '#333333';
    ctx.fillRect(segmentX, HEALTH_BAR_Y, segmentWidth, HEALTH_BAR_HEIGHT);
  }

  ctx.fillStyle = BOSS_COLOR;
  ctx.fillRect(x, BOSS_Y, BOSS_WIDTH, BOSS_HEIGHT);

  ctx.fillStyle = BOSS_BULLET_COLOR;
  for (const bullet of bullets) {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }
}

// Tests the player's in-flight bullet (via collision.js's shared aabbOverlap
// -- no second overlap implementation here) against the boss' bounds. Each
// confirmed hit removes exactly 1 HP and deactivates the bullet.
function checkPlayerBulletHit(player) {
  const bulletBounds = player.getBulletBounds();
  if (!bulletBounds) {
    return;
  }

  const bossBounds = { x, y: BOSS_Y, width: BOSS_WIDTH, height: BOSS_HEIGHT };
  if (aabbOverlap(bulletBounds, bossBounds)) {
    player.deactivateBullet();
    hp -= 1;
  }
}

// Returns the boss to its starting state for the next time Level 4 is
// entered -- called by game.js whenever a fresh run starts.
function reset() {
  x = (CANVAS_WIDTH - BOSS_WIDTH) / 2;
  direction = 1;
  hp = BOSS_MAX_HP;
  fireTimer = 0;
  bullets.length = 0;
}

export const Boss = {
  bullets,
  update,
  draw,
  checkPlayerBulletHit,
  reset,
  get hp() {
    return hp;
  },
};
