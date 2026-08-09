// collision.js — AABB collision detection
import { addExplosion, addScore } from './invaders.js';

// Points awarded per invader kill
const POINTS_PER_KILL = 10;

// ---------------------------------------------------------------------------
// AABB overlap helper
// rect shape: { x (left), y (top), width, height }
// ---------------------------------------------------------------------------
function aabbOverlap(a, b) {
  return (
    a.x         < b.x + b.width  &&
    a.x + a.width  > b.x          &&
    a.y         < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// ---------------------------------------------------------------------------
// runCollisions — one pass per frame; call BEFORE any draw calls
//
// @param {Array}  invaders  — array of { x, y, width, height, alive }
// @param {Array}  bullets   — array of bullet objects with { x (centre), y (top), width, height, active }
// @param {Object} player    — player instance (unused this card; reserved for Level 2)
// ---------------------------------------------------------------------------
export function runCollisions(invaders, bullets, player) {
  // -------------------------------------------------------------------------
  // Pass 1: player bullet vs invaders
  // -------------------------------------------------------------------------
  for (const bullet of bullets) {
    if (!bullet.active) continue;

    // Build an axis-aligned rect for the bullet.
    // bullet.x is the horizontal CENTRE, so we shift to get the left edge.
    const bulletRect = {
      x:      bullet.x - bullet.width / 2,
      y:      bullet.y,
      width:  bullet.width,
      height: bullet.height,
    };

    for (const inv of invaders) {
      if (!inv.alive) continue;

      if (aabbOverlap(bulletRect, inv)) {
        // Hit!
        bullet.active = false;
        inv.alive     = false;
        addScore(POINTS_PER_KILL);
        addExplosion(inv.x, inv.y, inv.width, inv.height);
        break; // one bullet can only hit one invader per frame
      }
    }
  }

  // -------------------------------------------------------------------------
  // TODO: invader bullet vs player — implemented in Level 2
  // -------------------------------------------------------------------------
}
