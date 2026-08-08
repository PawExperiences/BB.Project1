// collision.js — AABB collision detection between bullets, invaders, and player
// ES module; performs NO canvas draw calls for game entities.

const EXPLOSION_TTL = 0.3; // seconds (~300 ms)

/**
 * AABB overlap test.
 * Rects are { x, y, width, height } where x,y is the top-left corner.
 *
 * @param {{x:number,y:number,width:number,height:number}} a
 * @param {{x:number,y:number,width:number,height:number}} b
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

/**
 * runCollisions — tests all bullet/entity pairs and mutates state.
 *
 * Accepts the shared state object:
 *   state.playerBullets   — array of { x, y, width, height, ... }
 *   state.invaderBullets  — array of { x, y, width, height, ... }
 *   state.invaders        — flat array of Invader instances
 *   state.player          — Player instance (has x, y, width, height, lives)
 *   state.score           — number
 *   state.explosions      — array of { x, y, ttl }
 *
 * Returns nothing; all side-effects are mutations on state.
 *
 * @param {object} state
 */
export function runCollisions(state) {
  const {
    playerBullets,
    invaderBullets,
    invaders,
    player,
    explosions,
  } = state;

  // -----------------------------------------------------------------------
  // Player bullets vs live invaders
  // -----------------------------------------------------------------------
  // Iterate bullets in reverse so splice indices stay stable
  for (let bi = playerBullets.length - 1; bi >= 0; bi--) {
    const bullet = playerBullets[bi];
    let hit = false;

    for (const inv of invaders) {
      if (!inv.alive) continue;

      if (aabb(bullet, inv)) {
        // Kill invader
        inv.alive = false;

        // Score
        state.score += 10;

        // Explosion at invader centre
        explosions.push({
          x:   inv.x + inv.width  / 2,
          y:   inv.y + inv.height / 2,
          ttl: EXPLOSION_TTL,
        });

        hit = true;
        break; // one bullet can only hit one invader
      }
    }

    if (hit) {
      playerBullets.splice(bi, 1);
    }
  }

  // -----------------------------------------------------------------------
  // Invader bullets vs player
  // -----------------------------------------------------------------------
  if (player) {
    // Build a rect for the player (player.x/y is centre; derive top-left)
    const playerRect = {
      x:      player.x - player.width  / 2,
      y:      player.y - player.height / 2,
      width:  player.width,
      height: player.height,
    };

    for (let bi = invaderBullets.length - 1; bi >= 0; bi--) {
      const bullet = invaderBullets[bi];

      if (aabb(bullet, playerRect)) {
        player.lives -= 1;
        invaderBullets.splice(bi, 1);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Age / remove expired explosions  (could also live in update, but
  // keeping it here avoids needing dt; game.js advances ttl in update)
  // -----------------------------------------------------------------------
  // NOTE: ttl decrement is done in game.js update(); we only purge here
  // to keep this function's contract clean.  game.js also calls the purge,
  // so this is intentionally left out — see game.js.
}
