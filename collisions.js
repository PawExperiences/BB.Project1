// collisions.js — Collision detection pass for Space Invaders.
//
// The collision pass MUST run before the draw pass every tick.
// No collision logic should live inside any draw/render function.

/**
 * Run all collision checks for one game-loop tick.
 *
 * @param {import('./player.js').Player}       player      - The player instance.
 * @param {import('./invaders.js').InvaderGrid} invaderGrid - The invader formation.
 * @param {import('./explosions.js').ExplosionPool} explosions - Explosion pool.
 * @param {{ score: number }}                  hudState    - Mutable score container.
 */
export function collide(player, invaderGrid, explosions, hudState) {
  // -------------------------------------------------------------------------
  // 1. Bullet-vs-Invader collision
  // -------------------------------------------------------------------------
  // Retrieve the current player bullet (null if none in flight).
  // player.bullet returns a COPY: { x, y, width, height } or null.
  const bulletSnapshot = player.bullet;

  if (bulletSnapshot !== null) {
    const bx = bulletSnapshot.x;
    const by = bulletSnapshot.y;
    const bw = bulletSnapshot.width;
    const bh = bulletSnapshot.height;

    for (const inv of invaderGrid.liveInvaders()) {
      const { x: ix, y: iy, w: iw, h: ih } = invaderGrid.invaderRect(inv);

      // AABB overlap test
      const overlap =
        bx < ix + iw &&
        bx + bw > ix &&
        by < iy + ih &&
        by + bh > iy;

      if (overlap) {
        // Mark invader dead
        inv.alive = false;

        // Consume the bullet by nulling the internal bullet reference.
        // player._bullet is the backing field for the bullet getter in player.js.
        // We access it directly here because the Player class does not expose
        // a consumeBullet() method, and modifying player.js is out of scope.
        player._bullet = null;

        // Spawn explosion flash at the invader's canvas position
        explosions.spawn(ix, iy);

        // Award points
        hudState.score += 10;

        // A bullet can only kill one invader — stop checking after a hit
        // (bullet is already consumed).
        break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // 2. Invader-Bullet-vs-Player  [STUB — reserved for Level 2: they shoot back]
  //
  // When invader bullets are introduced (Level 2 card), add the check here:
  //
  //   for (const invBullet of invaderGrid.bullets) {
  //     const playerRect = { x: player.x, y: player.y,
  //                          w: player.width, h: player.height };
  //     if (aabbOverlap(invBullet, playerRect)) {
  //       // consume invBullet, decrement player.lives, etc.
  //     }
  //   }
  //
  // DO NOT implement invader firing here — that belongs to the Level 2 card.
  // -------------------------------------------------------------------------
}
