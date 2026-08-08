// collision.js — AABB collision detection helpers
// Owned by card: "Sprite rendering and collision detection"

/**
 * rectsOverlap(a, b)
 * Pure AABB overlap test. No side effects.
 * @param {{ x: number, y: number, w: number, h: number }} a
 * @param {{ x: number, y: number, w: number, h: number }} b
 * @returns {boolean}
 */
export function rectsOverlap(a, b) {
  return (
    a.x         < b.x + b.w &&
    a.x + a.w   > b.x       &&
    a.y         < b.y + b.h &&
    a.y + a.h   > b.y
  );
}

/**
 * checkBulletVsInvaders(bullet, invaders, onKill)
 * Tests the player bullet against every live invader.
 * On first overlap: marks invader alive=false, marks bullet active=false,
 * calls onKill(invader), and stops further testing for this bullet.
 *
 * @param {{ x: number, y: number, active: boolean }} bullet
 *   The player bullet object. Must have an `active` boolean flag.
 * @param {Array<{ x: number, y: number, alive: boolean }>} invaders
 * @param {function} onKill  — called with the killed invader object
 */
export function checkBulletVsInvaders(bullet, invaders, onKill) {
  if (!bullet || !bullet.active) return;

  const BULLET_W = 4;
  const BULLET_H = 12;
  const INV_W    = 32;
  const INV_H    = 24;

  const bRect = { x: bullet.x - BULLET_W / 2, y: bullet.y, w: BULLET_W, h: BULLET_H };

  for (const inv of invaders) {
    if (!inv.alive) continue;

    const iRect = { x: inv.x, y: inv.y, w: INV_W, h: INV_H };

    if (rectsOverlap(bRect, iRect)) {
      inv.alive      = false;
      bullet.active  = false;
      onKill(inv);
      return;   // bullet consumed — stop checking
    }
  }
}

/**
 * checkInvaderBulletsVsPlayer(invaderBullets, player, onHit)
 * Tests every active invader bullet against the player bounding box.
 * On first overlap: marks bullet active=false and calls onHit(bullet).
 * Accepts an empty array without throwing (Level 2 wiring stub).
 *
 * @param {Array<{ x: number, y: number, active: boolean }>} invaderBullets
 * @param {{ x: number, y: number, width: number, height: number }} player
 * @param {function} onHit — called with the hitting bullet object
 */
export function checkInvaderBulletsVsPlayer(invaderBullets, player, onHit) {
  if (!invaderBullets || invaderBullets.length === 0) return;

  const INV_BULLET_W = 4;
  const INV_BULLET_H = 12;

  const pRect = { x: player.x, y: player.y, w: player.width, h: player.height };

  for (const bullet of invaderBullets) {
    if (!bullet.active) continue;

    const bRect = {
      x: bullet.x - INV_BULLET_W / 2,
      y: bullet.y,
      w: INV_BULLET_W,
      h: INV_BULLET_H,
    };

    if (rectsOverlap(bRect, pRect)) {
      bullet.active = false;
      onHit(bullet);
      return;
    }
  }
}
