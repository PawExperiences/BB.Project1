// collision.js — CollisionSystem: AABB collision detection, explosions, score

// ---------------------------------------------------------------------------
// Named constants
// ---------------------------------------------------------------------------
const SCORE_PER_KILL     = 10;
const EXPLOSION_LIFETIME = 0.45;  // seconds
const EXPLOSION_COLOR    = '#f80'; // orange — distinct from green invaders and yellow bullet
const EXPLOSION_SIZE     = 36;    // px square for the main flash rect
const EXPLOSION_DOT_SIZE = 8;     // px for corner dot accents

/**
 * Simple AABB overlap test.
 * @param {{x,y,width,height}} a
 * @param {{x,y,width,height}} b
 * @returns {boolean}
 */
function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export class CollisionSystem {
  constructor() {
    this._score      = 0;
    this._explosions = []; // [{x, y, life}]  life counts down from EXPLOSION_LIFETIME
  }

  /**
   * Run all collision passes.  Mutates bullet/invader state; no drawing.
   *
   * @param {Array}  playerBullets  — array of player bullet objects (from player.getBullets() or
   *                                  wrapped single bullet); each must expose getBounds().
   *                                  Bullets that hit are removed via the supplied removeFn or
   *                                  via a `dead` flag — see wiring note in game.js.
   * @param {Array}  invaders       — flat array returned by InvaderGrid.getInvaders()
   * @param {Array}  invaderBullets — invader bullet array (may be empty; Level 2 populates it)
   * @param {Object} player         — player object; must expose getBounds() and a `hit` flag
   *                                  or callback; this card only reads getBounds().
   *
   * NOTE: playerBullets here is an array of {bounds, remove} descriptor objects built by
   * game.js so we avoid coupling this module to the internals of player.js.
   * Each descriptor: { getBounds(): {x,y,width,height}, remove(): void }
   */
  update(playerBullets, invaders, invaderBullets, player) {
    // ------------------------------------------------------------------
    // Pass 1 — player bullet vs invaders
    // ------------------------------------------------------------------
    for (const bulletDesc of playerBullets) {
      if (bulletDesc.removed) continue; // already consumed this tick
      const bBounds = bulletDesc.getBounds();

      for (const inv of invaders) {
        if (!inv.alive) continue; // dead invaders do not participate

        if (aabbOverlap(bBounds, inv.getBounds())) {
          // Kill the invader
          inv.alive = false;

          // Remove the bullet
          bulletDesc.removed = true;
          if (typeof bulletDesc.remove === 'function') {
            bulletDesc.remove();
          }

          // Score
          this._score += SCORE_PER_KILL;

          // Explosion at invader centre
          const b = inv.getBounds();
          this._explosions.push({
            x:    b.x + b.width  / 2,
            y:    b.y + b.height / 2,
            life: EXPLOSION_LIFETIME,
          });

          break; // one bullet can only hit one invader
        }
      }
    }

    // ------------------------------------------------------------------
    // Pass 2 — invader bullets vs player (wired now; firing logic is Level 2)
    // ------------------------------------------------------------------
    if (invaderBullets && invaderBullets.length > 0 && player) {
      const playerBounds = player.getBounds();
      for (const invBullet of invaderBullets) {
        if (invBullet.removed) continue;
        const ib = typeof invBullet.getBounds === 'function'
          ? invBullet.getBounds()
          : invBullet; // allow plain {x,y,width,height} as well

        if (aabbOverlap(ib, playerBounds)) {
          invBullet.removed = true;
          // Signal player hit — set a flag that game.js / player can check
          if (typeof player.onHit === 'function') {
            player.onHit();
          } else {
            player.hit = true;
          }
          break; // one frame, one hit
        }
      }
    }

    // ------------------------------------------------------------------
    // Advance explosion lifetimes (dt not passed here; use fixed timestep
    // constant to keep the interface simple — the game loop calls update
    // once per fixed timestep of 1/60 s)
    // ------------------------------------------------------------------
    const FIXED_DT = 1 / 60;
    this._explosions = this._explosions.filter(ex => {
      ex.life -= FIXED_DT;
      return ex.life > 0;
    });
  }

  /**
   * Draw active explosion effects.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();
    for (const ex of this._explosions) {
      // Fade alpha proportional to remaining life
      const alpha = Math.min(1, ex.life / (EXPLOSION_LIFETIME * 0.5));
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = EXPLOSION_COLOR;

      // Central flash rectangle
      ctx.fillRect(
        Math.round(ex.x - EXPLOSION_SIZE / 2),
        Math.round(ex.y - EXPLOSION_SIZE / 2),
        EXPLOSION_SIZE,
        EXPLOSION_SIZE
      );

      // Corner dot accents for a burst look
      const r = EXPLOSION_SIZE / 2 + 4;
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        ctx.fillRect(
          Math.round(ex.x + dx * r - EXPLOSION_DOT_SIZE / 2),
          Math.round(ex.y + dy * r - EXPLOSION_DOT_SIZE / 2),
          EXPLOSION_DOT_SIZE,
          EXPLOSION_DOT_SIZE
        );
      }
    }
    ctx.restore();
  }

  /**
   * Returns the current score.
   * @returns {number}
   */
  getScore() {
    return this._score;
  }
}
