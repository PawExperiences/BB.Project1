// explosions.js — Explosion effect pool.
// Each entry flashes a filled rectangle (same size as an invader) for 8 ticks.

import { INVADER_W, INVADER_H } from './invaders.js';

const FLASH_FRAMES = 8;             // total frames the flash is visible
const FLASH_COLOUR = '#FFFF00';    // yellow flash

export class ExplosionPool {
  constructor() {
    /** @type {Array<{x: number, y: number, framesLeft: number}>} */
    this.explosions = [];
  }

  /**
   * Spawn a new explosion at the given canvas position.
   * @param {number} x  Left edge of the invader that died.
   * @param {number} y  Top edge of the invader that died.
   */
  spawn(x, y) {
    this.explosions.push({ x, y, framesLeft: FLASH_FRAMES });
  }

  /**
   * Decrement frame counters and remove expired entries.
   * Call once per game-loop tick, before the draw pass.
   */
  tick() {
    for (const exp of this.explosions) {
      exp.framesLeft--;
    }
    this.explosions = this.explosions.filter(exp => exp.framesLeft > 0);
  }

  /**
   * Render all active explosions.
   * Call during the draw pass.
   */
  draw(ctx) {
    ctx.fillStyle = FLASH_COLOUR;
    for (const exp of this.explosions) {
      ctx.fillRect(Math.round(exp.x), Math.round(exp.y), INVADER_W, INVADER_H);
    }
  }
}
