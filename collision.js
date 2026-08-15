// Generic AABB collision pass, reused for both combat pairings this game
// currently needs: player bullet vs invader, and invader-owned bullet vs
// player. One overlap function, no per-pairing duplication.

const INVADER_KILL_SCORE = 10;

// Mirrors the player bullet's fixed size defined in player.js. collision.js
// reuses the bullet entity as-is (it does not spawn or move bullets); this
// is only the bounding box needed to test overlap.
const PLAYER_BULLET_WIDTH = 4;
const PLAYER_BULLET_HEIGHT = 14;

function overlaps(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function collide(player, invaders, hudState) {
  if (player.bullet) {
    const bulletBounds = {
      x: player.bullet.x,
      y: player.bullet.y,
      width: PLAYER_BULLET_WIDTH,
      height: PLAYER_BULLET_HEIGHT,
    };

    const hit = invaders.getAliveInvaders().find((inv) => overlaps(bulletBounds, invaders.getBounds(inv)));
    if (hit) {
      player.bullet = null;
      invaders.kill(hit);
      hudState.score += INVADER_KILL_SCORE;
    }
  }

  const playerBounds = { x: player.x, y: player.y, width: player.width, height: player.height };
  for (let i = invaders.bullets.length - 1; i >= 0; i--) {
    if (overlaps(invaders.bullets[i], playerBounds)) {
      invaders.bullets.splice(i, 1);
      player.decrementLives();
    }
  }
}
