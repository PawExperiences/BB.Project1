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

/** Invader bullet dimensions (must match invader bullet rendering in game.js). */
const INV_BULLET_W = 4;
const INV_BULLET_H = 10;

/**
 * Check whether the player's bullet has hit any live invader in the grid.
 * Performs an AABB intersection test against every live invader.
 * On a confirmed hit the invader is killed via grid.killInvader() which
 * removes it from the live set and spawns the explosion effect.
 *
 * Works with both InvaderGrid and SplitInvaderGrid — for a SplitInvaderGrid
 * the method iterates `grid.invaders` (flat rows) normally before the split;
 * after the split collision.js uses checkBulletSplitInvaderCollisions instead.
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

  // SplitInvaderGrid exposes aliveInvadersList() which works across halves.
  const candidates = (typeof grid.aliveInvadersList === 'function')
    ? grid.aliveInvadersList()
    : grid.invaders.flat().filter(i => i.alive);

  for (const inv of candidates) {
    if (!inv.alive) continue;

    // AABB intersection
    if (
      bullet.x          < inv.x + inv.w &&
      bullet.x + BULLET_W > inv.x       &&
      bullet.y          < inv.y + inv.h &&
      bullet.y + BULLET_H > inv.y
    ) {
      grid.killInvader(inv);
      return { hit: true, points: inv.points, invader: inv };
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

/**
 * Check whether a bullet (player or invader) has hit any cell of any bunker.
 * On a hit, the individual cell is removed (set alive=false).
 * Consistent with the checkBulletInvaderCollisions pattern.
 *
 * @param {{ x: number, y: number } | null} bullet
 *   Any bullet object with x/y properties, or null.
 * @param {number} bulletW  Width  of the bullet in pixels.
 * @param {number} bulletH  Height of the bullet in pixels.
 * @param {import('./shields.js').ShieldManager} shieldManager
 *   The active ShieldManager instance.
 * @returns {{ hit: boolean, bunkerIndex: number, cellRow: number, cellCol: number }}
 *   hit        — true when a cell was destroyed this call.
 *   bunkerIndex — index (0–3) of the struck bunker, or -1.
 *   cellRow    — row of the struck cell within the bunker, or -1.
 *   cellCol    — column of the struck cell within the bunker, or -1.
 */
export function checkBulletBunkerCollisions(bullet, bulletW, bulletH, shieldManager) {
  if (!bullet || !shieldManager) {
    return { hit: false, bunkerIndex: -1, cellRow: -1, cellCol: -1 };
  }

  const bunkers = shieldManager.bunkers;
  for (let bi = 0; bi < bunkers.length; bi++) {
    const bunker = bunkers[bi];
    for (let r = 0; r < bunker.cells.length; r++) {
      const row = bunker.cells[r];
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (!cell.alive) continue;

        // AABB intersection
        if (
          bullet.x          < cell.x + cell.size &&
          bullet.x + bulletW > cell.x            &&
          bullet.y          < cell.y + cell.size &&
          bullet.y + bulletH > cell.y
        ) {
          cell.alive = false;
          return { hit: true, bunkerIndex: bi, cellRow: r, cellCol: c };
        }
      }
    }
  }

  return { hit: false, bunkerIndex: -1, cellRow: -1, cellCol: -1 };
}
