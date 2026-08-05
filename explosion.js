/**
 * explosion.js — Explosion visual effect for Space Invaders.
 * ES module; exports spawnExplosion(), updateExplosions(), drawExplosions().
 *
 * Explosions are purely visual: brief coloured rectangles that disappear
 * after a fixed number of frames. They have no gameplay effect.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const EXPLOSION_FRAMES = 10;          // frames the flash is visible (8-12 range)
const EXPLOSION_COLOR  = '#FFFF00';   // yellow flash

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/**
 * Active explosions: array of { x, y, width, height, framesLeft }.
 */
let explosions = [];

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Spawn an explosion centred at (cx, cy) with the given dimensions.
 * @param {number} cx      Centre x of the destroyed invader.
 * @param {number} cy      Centre y of the destroyed invader.
 * @param {number} width   Width of the explosion rect (matches invader width).
 * @param {number} height  Height of the explosion rect (matches invader height).
 */
export function spawnExplosion(cx, cy, width, height) {
  explosions.push({
    x:          cx - width  / 2,
    y:          cy - height / 2,
    width,
    height,
    framesLeft: EXPLOSION_FRAMES,
  });
}

/**
 * Decrement framesLeft for every active explosion and remove expired ones.
 * Call once per fixed-timestep update.
 */
export function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].framesLeft -= 1;
    if (explosions[i].framesLeft <= 0) {
      explosions.splice(i, 1);
    }
  }
}

/**
 * Draw all active explosions.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawExplosions(ctx) {
  ctx.fillStyle = EXPLOSION_COLOR;
  for (const exp of explosions) {
    ctx.fillRect(
      Math.round(exp.x),
      Math.round(exp.y),
      exp.width,
      exp.height
    );
  }
}

/**
 * Reset explosion list (call on game restart).
 */
export function clearExplosions() {
  explosions = [];
}
