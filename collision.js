// collision.js — Collision detection helpers.

/**
 * Check whether the player's bullet has hit any invader in the grid.
 * Mutates the invader (sets alive = false) on a hit.
 *
 * @param {{ x: number, y: number }} bullet  The player's active bullet object.
 * @param {import('./invaders.js').InvaderGrid} grid
 * @returns {{ hit: boolean, points: number }}
 */
export function checkBulletInvaderCollisions(bullet, grid) {
  // Bullet dimensions (must match player.js)
  const BW = 4;
  const BH = 14;

  for (const row of grid.invaders) {
    for (const inv of row) {
      if (!inv.alive) continue;

      // AABB check
      if (
        bullet.x         < inv.x + inv.w &&
        bullet.x + BW    > inv.x         &&
        bullet.y         < inv.y + inv.h &&
        bullet.y + BH    > inv.y
      ) {
        inv.alive = false;
        return { hit: true, points: inv.points };
      }
    }
  }

  return { hit: false, points: 0 };
}
