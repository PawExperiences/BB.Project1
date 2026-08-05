// collision.js — Axis-Aligned Bounding Box (AABB) collision detection
import { INVADER_WIDTH, INVADER_HEIGHT, INVADER_POINT_VALUE } from './gameConfig.js';
import { getInvaders, triggerExplosion } from './invaders.js';

// ---------------------------------------------------------------------------
// AABB primitive — exported so level2.js and game.js can reuse it
// ---------------------------------------------------------------------------

/**
 * Returns true when two axis-aligned rectangles overlap.
 * Each rect must have { x, y, width, height }.
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

// ---------------------------------------------------------------------------
// Bullet-vs-invader collision
// ---------------------------------------------------------------------------

/**
 * Check every player bullet against every living invader.
 * When a hit is detected:
 *   - the bullet is marked inactive (bullet.active = false)
 *   - the invader is marked dead  (invader.alive = false)
 *   - an explosion effect is triggered at the invader's position
 *   - hudState.score is incremented by INVADER_POINT_VALUE
 *
 * @param {Array<{x:number, y:number, width:number, height:number, active:boolean, fromPlayer:boolean}>} bullets
 * @param {{ score: number }} hudState  — mutable HUD state exported from game.js
 */
export function checkBulletInvaderCollisions(bullets, hudState) {
  const livingInvaders = getInvaders().filter(inv => inv.alive);

  for (const bullet of bullets) {
    if (!bullet.active || !bullet.fromPlayer) continue;

    for (const inv of livingInvaders) {
      if (!inv.alive) continue; // may have been killed by an earlier bullet this tick

      const bulletRect   = { x: bullet.x, y: bullet.y, width: bullet.width, height: bullet.height };
      const invaderRect  = { x: inv.x,    y: inv.y,    width: INVADER_WIDTH, height: INVADER_HEIGHT };

      if (aabbOverlap(bulletRect, invaderRect)) {
        bullet.active = false;
        inv.alive     = false;
        triggerExplosion(inv);
        hudState.score += INVADER_POINT_VALUE;
        break; // one bullet can only kill one invader
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Invader-bullet-vs-player collision (stub — game.js handles Level 2 variant
// that respects the invulnerability window; this is retained for API compat)
// ---------------------------------------------------------------------------

/**
 * Check every invader bullet against the player.
 * NOTE: game.js uses its own handler in Level 2 to support the invulnerability
 * window.  This function is kept for backward compatibility / future use.
 *
 * @param {Array<{x:number, y:number, width:number, height:number, active:boolean}>} invaderBullets
 * @param {{ x:number, y:number, width:number, height:number }} player
 * @param {{ lives: number }} hudState
 * @returns {boolean} true if the player was hit this tick
 */
export function checkInvaderBulletPlayerCollisions(invaderBullets, player, hudState) {
  if (!invaderBullets || invaderBullets.length === 0) return false;

  for (const bullet of invaderBullets) {
    if (!bullet.active) continue;

    const bulletRect = { x: bullet.x, y: bullet.y, width: bullet.width, height: bullet.height };
    const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };

    if (aabbOverlap(bulletRect, playerRect)) {
      bullet.active  = false;
      hudState.lives -= 1;
      return true;
    }
  }
  return false;
}
