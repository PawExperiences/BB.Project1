// collision.js — AABB collision detection pass
// Card: "Sprite rendering and collision detection"

import { addScore, triggerExplosion } from './invaders.js';

// ─── AABB overlap test ────────────────────────────────────────────────────────
/**
 * Returns true if rectangle A overlaps rectangle B.
 * All rectangles are { x, y, width, height } where x,y is the top-left corner.
 *
 * @param {{ x:number, y:number, width:number, height:number }} a
 * @param {{ x:number, y:number, width:number, height:number }} b
 * @returns {boolean}
 */
function aabb(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// ─── Bullet rectangle helper ─────────────────────────────────────────────────
/**
 * Convert a player bullet (centre-x, top-y) to a bounding-box rectangle.
 * Mirrors the rendering in player.js: width=4, height=12.
 */
const BULLET_W = 4;
const BULLET_H = 12;

function bulletRect(bullet) {
  return {
    x:      bullet.x - BULLET_W / 2,
    y:      bullet.y - BULLET_H,
    width:  BULLET_W,
    height: BULLET_H,
  };
}

// ─── Player bounding-box helper ───────────────────────────────────────────────
/**
 * Build a bounding-box rect for the player.
 * player.x/y is the centre; ship is 48×32 px (from player.js).
 */
const SHIP_W = 48;
const SHIP_H = 32;

function playerRect(player) {
  return {
    x:      player.x - SHIP_W / 2,
    y:      player.y - SHIP_H / 2,
    width:  SHIP_W,
    height: SHIP_H,
  };
}

// ─── Main collision pass ──────────────────────────────────────────────────────
/**
 * Run all AABB collision checks for one game-loop tick.
 * Must be called BEFORE any draw calls.
 *
 * @param {Array}  playerBullets   Array of active player bullets ({ x, y })
 *                                 Bullets are removed in-place when they hit.
 * @param {Array}  invaderBullets  Array of active invader bullets ({ x, y })
 *                                 (spawning is out of scope for this card)
 * @param {Array}  invaders        Live invader array from invaders.js
 * @param {object} player          Player instance with .x, .y, .hit property
 */
export function runCollisions(playerBullets, invaderBullets, invaders, player) {
  // ── 1. Player bullets vs. living invaders ──────────────────────────────────
  // Iterate bullets backwards so splice doesn't skip entries.
  for (let bi = playerBullets.length - 1; bi >= 0; bi--) {
    const bRect = bulletRect(playerBullets[bi]);

    for (const inv of invaders) {
      if (!inv.alive) continue;

      if (aabb(bRect, inv)) {
        // Kill invader
        inv.alive = false;
        triggerExplosion(inv);
        addScore(1);

        // Deactivate bullet
        playerBullets.splice(bi, 1);

        // One bullet can only hit one invader — stop checking this bullet
        break;
      }
    }
  }

  // ── 2. Invader bullets vs. player ─────────────────────────────────────────
  // Invader bullet spawning is out of scope for this card, but detection is
  // handled here so the infrastructure is ready for the next card.
  if (!player) return;

  const pRect = playerRect(player);

  for (let bi = invaderBullets.length - 1; bi >= 0; bi--) {
    const bRect = bulletRect(invaderBullets[bi]);

    if (aabb(bRect, pRect)) {
      // Flag the player as hit; damage/lives logic owned by a future card.
      player.hit = true;

      // Deactivate the invader bullet.
      invaderBullets.splice(bi, 1);
    }
  }
}
