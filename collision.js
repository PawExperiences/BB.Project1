// collision.js — Collision detection helpers.
// The collision pass MUST run before the draw pass every frame.
// No rendering is performed here.

/** Bullet width in pixels — must match the value used in player.js. */
const BULLET_W = 4;
/** Bullet height in pixels — must match the value used in player.js. */
const BULLET_H = 14;

/** Player ship width in pixels — must match the value used in player.js. */
const SHIP_W = 50;
/** Player ship height in pixels — must match the value used in player.js. */
const SHIP_H = 30;

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
 * Check whether an invader bullet has hit the player ship.
 * Uses AABB collision detection.
 *
 * @param {{ x: number, y: number } | null} invaderBullet
 *   An active invader projectile, or null.
 * @param {{ x: number, y: number, w?: number, h?: number }} player
 *   The player object (must expose x, y and optionally w, h).
 * @returns {{ hit: boolean }}
 */
export function checkInvaderBulletPlayerCollision(invaderBullet, player) {
  if (!invaderBullet || !player) return { hit: false };

  const INV_BULLET_W = 4;
  const INV_BULLET_H = 10;
  const pw = player.w !== undefined ? player.w : SHIP_W;
  const ph = player.h !== undefined ? player.h : SHIP_H;

  const hit = (
    invaderBullet.x               < player.x + pw         &&
    invaderBullet.x + INV_BULLET_W > player.x             &&
    invaderBullet.y               < player.y + ph         &&
    invaderBullet.y + INV_BULLET_H > player.y
  );

  return { hit };
}
