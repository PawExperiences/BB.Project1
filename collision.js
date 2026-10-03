import { EXPLOSION_DURATION, INVADER_KILL_SCORE } from './gameConfig.js';

// Short-lived rectangles spawned on a kill or a player hit. Deliberately no
// canvas calls in this module -- game.js reads this list via getExplosions()
// and draws it itself every render pass, so the hit-detection this module
// owns stays reusable without a 2d context in scope.
const explosions = [];

// Reusable axis-aligned bounding-box overlap test. Both arguments are any
// `{ x, y, width, height }` shape -- invaders, the player, and bullets all
// satisfy it already.
export function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function spawnExplosion(bounds) {
  explosions.push({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    remaining: EXPLOSION_DURATION,
  });
}

// Checks the player's single in-flight bullet (player.js only ever has one)
// against every live invader. On a hit both disappear this frame: the
// invader is marked dead and the bullet is deactivated, so neither is drawn
// again.
export function checkPlayerBulletVsInvaders(player, fleet, hud) {
  const bulletBounds = player.getBulletBounds();
  if (!bulletBounds) {
    return;
  }

  for (const invader of fleet) {
    if (invader.alive && aabbOverlap(bulletBounds, invader)) {
      invader.alive = false;
      player.deactivateBullet();
      spawnExplosion(invader);
      hud.score += INVADER_KILL_SCORE;
      return;
    }
  }
}

// Checks every bullet in the invader-bullet list (populated by the later
// "they shoot back" card; empty here) against the player. hud.playerHit is
// overwritten every call to reflect only this frame's outcome -- nothing
// downstream latches it yet.
export function checkInvaderBulletsVsPlayer(invaderBullets, player, hud) {
  let hit = false;

  for (let i = invaderBullets.length - 1; i >= 0; i--) {
    const bullet = invaderBullets[i];
    if (aabbOverlap(bullet, player)) {
      hit = true;
      spawnExplosion(player);
      invaderBullets.splice(i, 1);
    }
  }

  hud.playerHit = hit;
}

// Ticks every live explosion's remaining time down by dt and drops the ones
// that have expired. Called once per fixed update step, same as the two
// checks above.
export function updateExplosions(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].remaining -= dt;
    if (explosions[i].remaining <= 0) {
      explosions.splice(i, 1);
    }
  }
}

// Read-only list of current explosion rectangles for game.js to draw.
export function getExplosions() {
  return explosions;
}
