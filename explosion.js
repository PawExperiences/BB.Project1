// explosion.js — Explosion effect pool.
//
// Each explosion renders as a white (#FFFFFF) rectangle the same size as an
// invader for a fixed number of frames, then is removed.

import { INVADER_WIDTH, INVADER_HEIGHT } from './invaders.js';

// Duration of each explosion in frames.
const EXPLOSION_FRAMES = 4;

// Pool of active explosions: { x, y, framesLeft }
// x, y is the CENTRE of the exploded invader.
const explosions = [];

/**
 * addExplosion — create a new explosion at the given centre position.
 *
 * @param {number} cx - Centre x of the explosion.
 * @param {number} cy - Centre y of the explosion.
 */
export function addExplosion(cx, cy) {
  explosions.push({ x: cx, y: cy, framesLeft: EXPLOSION_FRAMES });
}

/**
 * updateExplosions — decrement frame counters and remove expired explosions.
 * Call once per fixed tick, before drawExplosions.
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
 * drawExplosions — render all active explosions as white rectangles.
 *
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawExplosions(ctx) {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  for (const exp of explosions) {
    // Draw centred on the stored centre position.
    ctx.fillRect(
      exp.x - INVADER_WIDTH  / 2,
      exp.y - INVADER_HEIGHT / 2,
      INVADER_WIDTH,
      INVADER_HEIGHT
    );
  }
  ctx.restore();
}
