// collision.js — AABB collision detection: player bullets vs living invaders.
// Imported and called by game.js after each update step.

import { getLivingInvaders, killInvader, POINTS_PER_KILL } from './invaders.js';
import { hudState } from './game.js';

/**
 * Axis-aligned bounding-box intersection test.
 * Returns true if rect A and rect B overlap.
 *
 * @param {{ x: number, y: number, width: number, height: number }} a
 * @param {{ x: number, y: number, width: number, height: number }} b
 * @returns {boolean}
 */
function aabbIntersects(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Runs the collision pass for one frame.
 *
 * @param {Player} player — the Player instance from player.js
 */
export function checkCollisions(player) {
  // Only check when a bullet is in flight
  if (!player.bullet || !player.bullet.active) return;

  const bullet = player.bullet;

  // Bullet bounding rect (must match the dimensions used in player.js)
  const bulletRect = {
    x:      bullet.x,
    y:      bullet.y,
    width:  4,    // BULLET_WIDTH from player.js
    height: 10,   // BULLET_HEIGHT from player.js
  };

  const living = getLivingInvaders();

  for (const inv of living) {
    if (aabbIntersects(bulletRect, inv)) {
      // Deactivate bullet
      player.bullet.active = false;

      // Kill the invader and spawn explosion at its current world position
      killInvader(inv._ref, inv.x, inv.y);

      // Increment score
      hudState.score += POINTS_PER_KILL;

      // Only one hit per bullet — stop checking
      break;
    }
  }
}
