import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, BULLET_SPEED } from './gameConfig.js';
import { isKeyHeld } from './input.js';

const SHIP_WIDTH = 48;
const SHIP_HEIGHT = 32;
const SHIP_MARGIN_BOTTOM = 24;

const START_X = (CANVAS_WIDTH - SHIP_WIDTH) / 2;
const START_Y = CANVAS_HEIGHT - SHIP_HEIGHT - SHIP_MARGIN_BOTTOM;

const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 16;

// How long the ship stays invulnerable and visibly flashing after
// respawn() below, and how fast it toggles on/off while flashing. Only
// levels with their own death handling call respawn() -- Level 2 onward;
// Level 1's invasion-reset path never does.
const INVULNERABLE_DURATION = 2; // seconds
const FLASH_INTERVAL = 0.1; // seconds per on/off toggle

// Not exported -- other modules read/clear it only through
// getBulletBounds()/deactivateBullet() below, so the fire gate and the
// bullet's lifetime stay keyed off this one flag rather than its position.
const bullet = {
  x: 0,
  y: 0,
  active: false,
};

// Cumulative count of bullets actually fired this session (incremented at
// fire time, not key-press time). Carries across every level transition --
// only a brand new run (game.js's startRun(), via resetShotCount() below)
// zeroes it. The Level 2 UFO reads it through the shotCount getter below to
// pick its score tier.
let shotCount = 0;

let invulnerableTimer = 0;

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
    shotCount += 1;
  }

  if (invulnerableTimer > 0) {
    invulnerableTimer = Math.max(0, invulnerableTimer - dt);
  }
}

function draw(ctx) {
  const { x, y } = Player;

  // While invulnerable, skip drawing the ship body on alternating
  // FLASH_INTERVAL windows so it blinks instead of just vanishing for the
  // whole 2 seconds. The bullet (if any) still draws every frame.
  const hideShip =
    invulnerableTimer > 0 &&
    Math.floor(invulnerableTimer / FLASH_INTERVAL) % 2 === 0;

  if (!hideShip) {
    ctx.fillStyle = '#39ff14';

    // Cannon body.
    ctx.fillRect(x + SHIP_WIDTH * 0.1, y + SHIP_HEIGHT * 0.5, SHIP_WIDTH * 0.8, SHIP_HEIGHT * 0.5);

    // Rounded turret.
    ctx.beginPath();
    ctx.arc(x + SHIP_WIDTH / 2, y + SHIP_HEIGHT * 0.5, SHIP_WIDTH * 0.3, Math.PI, 0, false);
    ctx.fill();
  }

  if (bullet.active) {
    ctx.fillStyle = '#39ff14';
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

// Snaps the ship back to its fixed bottom-centre start position and opens a
// fresh INVULNERABLE_DURATION window. Called by levels that implement their
// own death handling (Level 2 onward) -- Level 1's invasion-reset path
// never calls this.
function respawn() {
  Player.x = START_X;
  Player.y = START_Y;
  invulnerableTimer = INVULNERABLE_DURATION;
}

// Zeroes the session-cumulative shot counter. Called only by game.js's
// startRun(), so a brand new run starts the UFO tier sequence over, while
// level transitions within the same run never call it.
function resetShotCount() {
  shotCount = 0;
}

export const Player = {
  x: START_X,
  y: START_Y,
  width: SHIP_WIDTH,
  height: SHIP_HEIGHT,
  update,
  draw,
  getBulletBounds,
  deactivateBullet,
  respawn,
  resetShotCount,
  get shotCount() {
    return shotCount;
  },
  get invulnerable() {
    return invulnerableTimer > 0;
  },
};
