import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, BULLET_SPEED } from './gameConfig.js';
import { isKeyHeld } from './input.js';

const SHIP_WIDTH = 48;
const SHIP_HEIGHT = 32;
const SHIP_MARGIN_BOTTOM = 24;

const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 16;

// Not exported -- other modules read/clear it only through
// getBulletBounds()/deactivateBullet() below, so the fire gate and the
// bullet's lifetime stay keyed off this one flag rather than its position.
const bullet = {
  x: 0,
  y: 0,
  active: false,
};

function update(dt) {
  let dx = 0;
  if (isKeyHeld('ArrowLeft') || isKeyHeld('a')) {
    dx -= PLAYER_SPEED * dt;
  }
  if (isKeyHeld('ArrowRight') || isKeyHeld('d')) {
    dx += PLAYER_SPEED * dt;
  }
  Player.x = Math.min(Math.max(Player.x + dx, 0), CANVAS_WIDTH - SHIP_WIDTH);

  if (bullet.active) {
    bullet.y -= BULLET_SPEED * dt;
    if (bullet.y + BULLET_HEIGHT < 0) {
      bullet.active = false;
    }
  } else if (isKeyHeld(' ')) {
    bullet.active = true;
    bullet.x = Player.x + SHIP_WIDTH / 2 - BULLET_WIDTH / 2;
    bullet.y = Player.y - BULLET_HEIGHT;
  }
}

function draw(ctx) {
  const { x, y } = Player;

  ctx.fillStyle = '#39ff14';

  // Cannon body.
  ctx.fillRect(x + SHIP_WIDTH * 0.1, y + SHIP_HEIGHT * 0.5, SHIP_WIDTH * 0.8, SHIP_HEIGHT * 0.5);

  // Rounded turret.
  ctx.beginPath();
  ctx.arc(x + SHIP_WIDTH / 2, y + SHIP_HEIGHT * 0.5, SHIP_WIDTH * 0.3, Math.PI, 0, false);
  ctx.fill();

  if (bullet.active) {
    ctx.fillRect(bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT);
  }
}

// Read-only snapshot of the in-flight bullet for other modules (the
// collision card). Returns null when no bullet is active -- callers must
// not infer "in flight" from position.
function getBulletBounds() {
  if (!bullet.active) {
    return null;
  }
  return { x: bullet.x, y: bullet.y, width: BULLET_WIDTH, height: BULLET_HEIGHT };
}

// Lets other modules (the collision card) end the bullet's flight on
// impact. This clears the same flag update(dt) checks, so the next shot
// unlocks immediately.
function deactivateBullet() {
  bullet.active = false;
}

export const Player = {
  x: (CANVAS_WIDTH - SHIP_WIDTH) / 2,
  y: CANVAS_HEIGHT - SHIP_HEIGHT - SHIP_MARGIN_BOTTOM,
  width: SHIP_WIDTH,
  height: SHIP_HEIGHT,
  update,
  draw,
  getBulletBounds,
  deactivateBullet,
};
