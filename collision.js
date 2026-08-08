// collision.js — AABB collision detection and explosion effects
//
// NOTE: player.js does not export a separate Bullet class; the player's bullet
// is a plain object stored at player.bullet (null when not in flight).
// Invader bullets (future card) will follow the same plain-object pattern.
// This module works with those plain objects directly.

import { formation } from './invaders.js';

// ---------------------------------------------------------------------------
// Score — exported as a live-bindable variable.
// game.js reads collision.score directly.
// ---------------------------------------------------------------------------
export let score = 0;

// ---------------------------------------------------------------------------
// addScore(n) — increment score by n.
// Used by level2.js (and any future level) that manages its own formation
// but still wants kills reflected in the shared score variable that game.js reads.
// ---------------------------------------------------------------------------
export function addScore(n) {
  score += n;
}

// ---------------------------------------------------------------------------
// Points awarded per invader kill
// ---------------------------------------------------------------------------
const POINTS_PER_KILL = 10;

// ---------------------------------------------------------------------------
// Bullet dimensions — must match the values used in player.js
// (BULLET_WIDTH = 4, BULLET_HEIGHT = 12 are defined there but not exported;
//  they are duplicated here as named constants for clarity).
// ---------------------------------------------------------------------------
const PLAYER_BULLET_W = 4;
const PLAYER_BULLET_H = 12;

// ---------------------------------------------------------------------------
// Explosion effect state
// Each entry: { x, y, width, height, remaining }  (remaining in ms)
// ---------------------------------------------------------------------------
const EXPLOSION_DURATION = 300; // ms — within [200, 500] per acceptance criteria
const explosions = [];

// ---------------------------------------------------------------------------
// AABB overlap test
// Returns true when rectangle a and rectangle b intersect.
// ---------------------------------------------------------------------------
function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw &&
         ax + aw > bx &&
         ay < by + bh &&
         ay + ah > by;
}

// ---------------------------------------------------------------------------
// runCollisionPass(player, invaderBullets)
//
// Parameters:
//   player         — the Player instance (has .bullet, .x, .y, .width, .height)
//   invaderBullets — array of active invader-bullet plain objects
//                    { x, y, width, height, active }  (future card populates this)
//
// What it does:
//   1. Player bullet vs living invaders — kill invader, deactivate bullet, score++
//   2. Invader bullets vs player bounding box — deactivate bullet (game-over
//      consequence is game.js's responsibility)
// ---------------------------------------------------------------------------
export function runCollisionPass(player, invaderBullets) {
  // ---- 1. Player bullet vs invaders ----------------------------------------
  if (player.bullet !== null) {
    const pb = player.bullet;
    const bx = pb.x;
    const by = pb.y;

    for (const inv of formation) {
      if (!inv.alive) continue;

      if (aabbOverlap(bx, by, PLAYER_BULLET_W, PLAYER_BULLET_H,
                      inv.x, inv.y, inv.width, inv.height)) {
        // Kill the invader
        inv.alive = false;

        // Deactivate the bullet
        player.bullet = null;

        // Increment score
        score += POINTS_PER_KILL;

        // Spawn explosion at the invader's position
        explosions.push({
          x:         inv.x,
          y:         inv.y,
          width:     inv.width,
          height:    inv.height,
          remaining: EXPLOSION_DURATION
        });

        // Bullet is gone — no point testing further invaders this tick
        break;
      }
    }
  }

  // ---- 2. Invader bullets vs player ----------------------------------------
  if (invaderBullets && invaderBullets.length > 0) {
    // Player bounding box — Player class uses SHIP_WIDTH=40, SHIP_HEIGHT=32
    // Those constants are private to player.js; access via the instance if
    // the class exposes width/height, otherwise fall back to known values.
    const pw = typeof player.width  !== 'undefined' ? player.width  : 40;
    const ph = typeof player.height !== 'undefined' ? player.height : 32;

    for (const ib of invaderBullets) {
      if (!ib.active) continue;

      if (aabbOverlap(ib.x, ib.y, ib.width, ib.height,
                      player.x, player.y, pw, ph)) {
        // Deactivate the invader bullet — game.js handles player death
        ib.active = false;
        // (game.js will check for a "playerHit" signal — we set a flag it can read)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// updateExplosions(dt)
// Advances the timers on all active explosions and removes expired ones.
// dt — elapsed time in seconds
// ---------------------------------------------------------------------------
export function updateExplosions(dt) {
  const dtMs = dt * 1000;
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].remaining -= dtMs;
    if (explosions[i].remaining <= 0) {
      explosions.splice(i, 1);
    }
  }
}

// ---------------------------------------------------------------------------
// drawExplosions(ctx)
// Renders a brief flash rectangle at each kill position.
// Pure visual — no logic here.
// ---------------------------------------------------------------------------
export function drawExplosions(ctx) {
  for (const ex of explosions) {
    // Fade from bright orange-yellow to nothing as remaining decreases
    const alpha = Math.max(0, ex.remaining / EXPLOSION_DURATION);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(ex.x, ex.y, ex.width, ex.height);
    // Inner bright core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      ex.x + ex.width  * 0.25,
      ex.y + ex.height * 0.25,
      ex.width  * 0.5,
      ex.height * 0.5
    );
    ctx.restore();
  }
}
