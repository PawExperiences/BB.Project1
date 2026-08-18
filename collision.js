// Collision detection: one shared axis-aligned bounding-box (AABB) overlap
// test plus the per-frame collision pass (player bullet vs invader,
// invader bullet vs player), the kill handling, the explosion lifecycle
// and the score increment.
// Added by "Sprite rendering and collision detection".
//
// game.js invokes the pass exactly once per animation frame, after the
// world updates and before any drawing; no overlap checks live in any
// draw/render code.

// Score awarded per invader destroyed.
const SCORE_PER_INVADER = 10;

// Explosion: a short, purely visual effect at a kill position — an
// expanding, fading filled rectangle visible for EXPLOSION_DURATION
// seconds (spec: roughly 0.2–0.4 s). Explosions have no hitbox: they never
// take part in any overlap test. Several may be visible concurrently.
const EXPLOSION_DURATION = 0.3;
const EXPLOSION_MIN_SIZE = 8;
const EXPLOSION_MAX_SIZE = 48;
const EXPLOSION_COLOR = '#ffaa33';

// The live explosions, owned by this module: { x, y, age } with x/y the
// center of the effect in canvas coordinates and age in seconds.
const explosions = [];

function spawnExplosion(centerX, centerY) {
  explosions.push({ x: centerX, y: centerY, age: 0 });
}

// Age every live explosion and remove the ones whose brief flash is over.
// Called from game.js's Playing-scene update so lifetimes follow the same
// fixed timestep as the rest of the world.
export function updateExplosions(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].age += dt;
    if (explosions[i].age >= EXPLOSION_DURATION) explosions.splice(i, 1);
  }
}

// Pure drawing — no overlap checks here. Each explosion grows from
// EXPLOSION_MIN_SIZE to EXPLOSION_MAX_SIZE while fading out.
export function drawExplosions(ctx) {
  for (const explosion of explosions) {
    const t = explosion.age / EXPLOSION_DURATION; // 0 at birth .. 1 at expiry
    const size = EXPLOSION_MIN_SIZE + (EXPLOSION_MAX_SIZE - EXPLOSION_MIN_SIZE) * t;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = EXPLOSION_COLOR;
    ctx.fillRect(explosion.x - size / 2, explosion.y - size / 2, size, size);
  }
  ctx.globalAlpha = 1;
}

// Drop any leftover effects; game.js calls this when a new game starts.
export function clearExplosions() {
  explosions.length = 0;
}

// Axis-aligned bounding-box overlap: true when rects a and b (plain
// { x, y, width, height } objects, x/y = top-left) intersect. This is the
// single shared test used by every check in the collision pass below —
// player bullet vs invader and invader bullet vs player alike.
export function overlaps(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// The per-frame collision pass. `state` is the slice of game state the
// pass works on, supplied by game.js:
//   state.player         the Player ship (player.js); player.bullet is the
//                        in-flight player bullet rect, or null
//   state.formation      the InvaderFormation (invaders.js)
//   state.hostileBullets the game state's invader-bullet list — always
//                        empty until "Level 2: they shoot back" starts
//                        pushing bullets into it; the pass consumes
//                        whatever it holds (today: nothing)
//   state.hud            the HUD state (game.js); hud.score is incremented
//                        here on each kill
export function collide(state) {
  const { player, formation, hostileBullets, hud } = state;

  // Player bullet vs invader: on overlap both the bullet and the invader
  // are removed, an explosion spawns at the invader's position and the
  // score increases. One bullet kills one invader, then it is gone.
  const bullet = player.bullet;
  if (bullet !== null) {
    for (const invader of formation.invaders) {
      if (!invader.alive) continue;
      if (overlaps(bullet, invader)) {
        invader.alive = false;
        player.bullet = null;
        spawnExplosion(
          invader.x + invader.width / 2,
          invader.y + invader.height / 2,
        );
        hud.score += SCORE_PER_INVADER;
        break;
      }
    }
  }

  // Invader bullet vs player: the same shared AABB test, applied from the
  // game state's hostile-bullet list against the player's bounding box
  // (the Player object already exposes x/y/width/height). On a hit the
  // bullet is spent and the player loses a life through the documented
  // loseLife() interface (player.js); what happens at 0 lives is owned by
  // game.js, not here. No hostile bullets exist until "Level 2: they shoot
  // back", so this loop currently iterates zero times.
  for (let i = hostileBullets.length - 1; i >= 0; i--) {
    if (overlaps(hostileBullets[i], player)) {
      hostileBullets.splice(i, 1);
      player.loseLife();
    }
  }
}
