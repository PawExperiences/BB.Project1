/**
 * collision.js — AABB collision detection for Space Invaders.
 * ES module; exports rectsOverlap() and runCollisionPass().
 *
 * Depends on:
 *   invaders.js   — invaders array, invaderRect(), INVADER_WIDTH, INVADER_HEIGHT
 *   explosion.js  — spawnExplosion()
 *   game.js       — hudState (score)
 */

import { invaders, invaderRect, INVADER_WIDTH, INVADER_HEIGHT } from './invaders.js';
import { spawnExplosion } from './explosion.js';
import { hudState }       from './game.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Points awarded per invader kill. Named and exported for external use. */
export const SCORE_PER_KILL = 10;

// ---------------------------------------------------------------------------
// Pure AABB helper
// ---------------------------------------------------------------------------

/**
 * Returns true iff rect a and rect b overlap (axis-aligned bounding boxes).
 * Each rect must be { x, y, width, height }.
 *
 * @param {{ x: number, y: number, width: number, height: number }} a
 * @param {{ x: number, y: number, width: number, height: number }} b
 * @returns {boolean}
 */
export function rectsOverlap(a, b) {
  return (
    a.x             < b.x + b.width  &&
    a.x + a.width   > b.x            &&
    a.y             < b.y + b.height &&
    a.y + a.height  > b.y
  );
}

// ---------------------------------------------------------------------------
// Collision pass
// ---------------------------------------------------------------------------

/**
 * Run the full collision pass for the current frame.
 *
 * Checks every active player bullet against every surviving invader.
 * On overlap:
 *   - invader is marked destroyed.
 *   - bullet is deactivated.
 *   - explosion spawned at invader centre.
 *   - score incremented by SCORE_PER_KILL.
 *
 * The function accepts the player object so it can reach player.bullet;
 * this keeps the signature open for future invader-bullet collisions without
 * restructuring (scope note: invader bullets belong to a later card).
 *
 * @param {object} player  The Player instance (has .bullet property).
 */
export function runCollisionPass(player) {
  // Player bullet vs invaders
  if (player.bullet !== null) {
    const bulletWidth  = 4;   // must match player.js BULLET_WIDTH
    const bulletHeight = 10;  // must match player.js BULLET_HEIGHT

    const bulletRect = {
      x:      player.bullet.x - bulletWidth / 2,
      y:      player.bullet.y,
      width:  bulletWidth,
      height: bulletHeight,
    };

    for (const inv of invaders) {
      if (!inv.alive) continue;

      const invRect = invaderRect(inv);

      if (rectsOverlap(bulletRect, invRect)) {
        // Mark invader destroyed
        inv.alive = false;

        // Deactivate bullet (prevents re-processing same frame)
        player.bullet = null;

        // Spawn explosion at invader centre
        spawnExplosion(
          invRect.x + INVADER_WIDTH  / 2,
          invRect.y + INVADER_HEIGHT / 2,
          INVADER_WIDTH,
          INVADER_HEIGHT
        );

        // Increment score
        hudState.score += SCORE_PER_KILL;

        // Bullet is gone — no point checking further invaders
        break;
      }
    }
  }
}
