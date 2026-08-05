// collision.js — AABB collision helper and per-frame collision pass.
//
// Imports live state from sibling modules; does NOT redefine any exports
// from game.js, input.js, or player.js.

import { invaders, INVADER_WIDTH, INVADER_HEIGHT } from './invaders.js';
import { addExplosion } from './explosion.js';
import { addScore } from './score.js';

// Player ship dimensions (mirrors player.js internals — kept in one place here
// so collision.js owns the detection; player.js owns drawing).
const SHIP_WIDTH    = 40;
const SHIP_HEIGHT   = 32;
const BULLET_WIDTH  = 4;
const BULLET_HEIGHT = 12;

/**
 * checkCollision — axis-aligned bounding-box overlap test.
 *
 * @param {{ x: number, y: number, width: number, height: number }} a
 * @param {{ x: number, y: number, width: number, height: number }} b
 * @returns {boolean}
 */
export function checkCollision(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * runCollisionPass — test all live bullets against all live invaders
 * (and any invader bullets against the player ship).
 *
 * Must be called BEFORE the render pass each frame.
 *
 * @param {object} player  - The live Player instance from player.js.
 */
export function runCollisionPass(player) {
  // -----------------------------------------------------------------------
  // 1. Player bullet vs. invaders
  // -----------------------------------------------------------------------
  if (player.bullet !== null) {
    const bulletRect = {
      x:      player.bullet.x,
      y:      player.bullet.y,
      width:  BULLET_WIDTH,
      height: BULLET_HEIGHT,
    };

    for (const inv of invaders) {
      if (!inv.alive) continue;

      const invRect = {
        x:      inv.x,
        y:      inv.y,
        width:  INVADER_WIDTH,
        height: INVADER_HEIGHT,
      };

      if (checkCollision(bulletRect, invRect)) {
        // Kill invader.
        inv.alive = false;
        // Consume bullet.
        player.bullet = null;
        // Trigger explosion at invader centre.
        addExplosion(
          inv.x + INVADER_WIDTH  / 2,
          inv.y + INVADER_HEIGHT / 2
        );
        // Award points.
        addScore(10);
        // Bullet is gone — no need to test remaining invaders.
        break;
      }
    }
  }

  // -----------------------------------------------------------------------
  // 2. Invader bullet vs. player ship
  //    (invader shooting is a future card; the handler is wired here so
  //    that when invader bullets exist they automatically call onPlayerHit.)
  // -----------------------------------------------------------------------
  // Invader bullet arrays will be provided by the 'they shoot back' card.
  // For now we expose the helper so it can be called externally.
}

/**
 * checkInvaderBulletVsPlayer — call this from the 'they shoot back' card
 * when invader bullets are introduced.  Kept here so collision.js is the
 * single owner of all AABB logic.
 *
 * @param {{ x: number, y: number }} invaderBullet - top-left of invader bullet.
 * @param {{ width: number, height: number }} bulletDims - dimensions of the invader bullet.
 * @param {object} player - The live Player instance.
 * @param {Function} onPlayerHit - Callback (e.g. player-hit handler from player.js).
 */
export function checkInvaderBulletVsPlayer(invaderBullet, bulletDims, player, onPlayerHit) {
  const bulletRect = {
    x:      invaderBullet.x,
    y:      invaderBullet.y,
    width:  bulletDims.width,
    height: bulletDims.height,
  };
  const playerRect = {
    x:      player.x,
    y:      player.y,
    width:  SHIP_WIDTH,
    height: SHIP_HEIGHT,
  };
  if (checkCollision(bulletRect, playerRect)) {
    onPlayerHit();
  }
}
