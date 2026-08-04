// collision.js — Collision detection helpers.
// The collision pass MUST run before the draw pass every frame.
// No rendering is performed here.

/** Bullet width in pixels — must match the value used in player.js. */
const BULLET_W = 4;
/** Bullet height in pixels — must match the value used in player.js. */
const BULLET_H = 14;

/**
 * Check whether the player's bullet has hit any live invader in the grid.
 * Performs an AABB intersection test against every live invader.
 * On a confirmed hit the invader is killed via grid.killInvader() which
 * removes it from the live set and spawns the explosion effect.
 *
 * This function NEVER calls any draw() or rendering function.
 *
 * @param {{ x: number, y: number } | null} bullet
 *   The player's active bullet object, or null when no bullet is in flight.
 * @param {import('./invaders.js').InvaderGrid} grid
 * @returns {{ hit: boolean, points: number, invader: object|null }}
 *   hit     — true when a collision was detected this call.
 *   points  — point value of the destroyed invader (0 when no hit).
 *   invader — the hit invader object, or null.
 */
export function checkBulletInvaderCollisions(bullet, grid) {
  if (!bullet) return { hit: false, points: 0, invader: null };

  for (const row of grid.invaders) {
    for (const inv of row) {
      if (!inv.alive) continue;

      // AABB intersection
      if (
        bullet.x          < inv.x + inv.w &&
        bullet.x + BULLET_W > inv.x       &&
        bullet.y          < inv.y + inv.h &&
        bullet.y + BULLET_H > inv.y
      ) {
        // Kill the invader (marks alive=false, spawns explosion)
        grid.killInvader(inv);
        return { hit: true, points: inv.points, invader: inv };
      }
    }
  }

  return { hit: false, points: 0, invader: null };
}

/**
 * Stub: check whether an invader bullet has hit the player ship.
 * Body is a no-op until Level 2 adds invader projectiles.
 * Exported now so the function can be wired into the game loop without
 * breaking changes when the full implementation lands.
 *
 * @param {{ x: number, y: number } | null} invaderBullet
 *   An active invader projectile, or null.
 * @param {{ x: number, y: number, w?: number, h?: number }} player
 *   The player object (must expose x, y and optionally w, h).
 * @returns {{ hit: boolean }}
 */
export function checkInvaderBulletPlayerCollision(invaderBullet, player) {
  // No-op stub — invader bullets are introduced in Level 2.
  return { hit: false };
}
