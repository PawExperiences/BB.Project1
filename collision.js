// collision.js — AABB collision detection

/**
 * aabbOverlap(a, b)
 * Returns true if two axis-aligned bounding boxes overlap.
 * @param {{ x:number, y:number, width:number, height:number }} a
 * @param {{ x:number, y:number, width:number, height:number }} b
 * @returns {boolean}
 */
export function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * checkHit(a, b)
 * Alias for aabbOverlap — named interface used by level modules.
 * Returns true if the two axis-aligned bounding boxes overlap.
 * @param {{ x:number, y:number, width:number, height:number }} a
 * @param {{ x:number, y:number, width:number, height:number }} b
 * @returns {boolean}
 */
export function checkHit(a, b) {
  return aabbOverlap(a, b);
}

/**
 * onPlayerHit()
 * Stub — called when an enemy bullet overlaps the player AABB.
 * Level 2 card will add real lives/game-over logic here.
 */
export function onPlayerHit() {
  console.log('Player hit');
}

/**
 * collideBulletsWithInvaders(player, invaders, triggerExplosion, onKill)
 *
 * Tests the live player bullet against every live invader.
 * On hit: kills the invader, clears the bullet, triggers an explosion, calls onKill.
 *
 * @param {import('./player.js').Player} player
 * @param {Array}    invaders         — from getInvaders()
 * @param {Function} triggerExplosion — (x, y) => void
 * @param {Function} onKill           — () => void
 */
export function collideBulletsWithInvaders(player, invaders, triggerExplosion, onKill) {
  const bullet = player.getBullet();
  if (!bullet) return;

  for (const inv of invaders) {
    if (!inv.alive) continue;

    if (aabbOverlap(bullet, inv)) {
      inv.alive = false;
      player.clearBullet();
      triggerExplosion(inv.x, inv.y);
      onKill();
      // Bullet is consumed — stop testing
      break;
    }
  }
}

/**
 * collideEnemyBulletsWithPlayer(enemyBullets, player)
 *
 * STUB — enemy shooting is introduced in Level 2.
 * Wired into the collision pass now so Level 2 can fill in the body
 * without restructuring the game loop.
 *
 * @param {Array}  enemyBullets — array of enemy bullet objects (empty until Level 2)
 * @param {object} player       — player instance
 */
export function collideEnemyBulletsWithPlayer(enemyBullets, player) {
  // TODO (Level 2): iterate enemyBullets, test each against player AABB, call onPlayerHit()
}
