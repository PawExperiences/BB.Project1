// explosion.js — Explosion pool, update, and render

import { INVADER_WIDTH, INVADER_HEIGHT } from './invaders.js';

// Duration of each explosion in frames (~20 frames ≈ 333 ms at 60 fps)
const EXPLOSION_DURATION_FRAMES = 20;

/** @type {Array<{x:number, y:number, framesLeft:number}>} */
let explosions = [];

/**
 * initExplosions()
 * Clears the pool. Call when entering the playing scene.
 */
export function initExplosions() {
  explosions = [];
}

/**
 * triggerExplosion(x, y)
 * Adds a new explosion at the given canvas position.
 * @param {number} x
 * @param {number} y
 */
export function triggerExplosion(x, y) {
  explosions.push({ x, y, framesLeft: EXPLOSION_DURATION_FRAMES });
}

/**
 * updateExplosions()
 * Counts down each explosion and removes expired ones.
 * Called once per game-loop update tick.
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
 * renderExplosions(ctx)
 * Draws a bright yellow rectangle for every active explosion.
 * @param {CanvasRenderingContext2D} ctx
 */
export function renderExplosions(ctx) {
  ctx.fillStyle = '#FFFF00';
  for (const exp of explosions) {
    ctx.fillRect(Math.round(exp.x), Math.round(exp.y), INVADER_WIDTH, INVADER_HEIGHT);
  }
}
