// level1.js
// Level 1: the classic 11x5 invader grid. Owns this level's march: the
// discrete step-and-pause movement that speeds up as invaders are
// destroyed, the edge-triggered reverse + one-cell drop, and the
// life-loss/restart when the formation reaches the player's row. Reuses
// InvaderFormation (grid layout + rendering) from the Sprite rendering and
// collision detection card as its underlying primitive; game.js owns
// wiring update()/draw() into the fixed-timestep loop and reading
// `.formation` for collide().

import { CANVAS_WIDTH } from './gameConfig.js';
import { InvaderFormation } from './invaders.js';

const TOTAL_INVADERS = 55; // 11 columns x 5 rows, the full starting formation
const STEP_INTERVAL_MAX = 0.8; // seconds per step with all 55 invaders alive
const STEP_INTERVAL_MIN = 0.1; // seconds per step with 1 invader remaining
const HORIZONTAL_STEP = 8; // px the formation advances on each step

// Linear interpolation between the slowest (full formation) and fastest
// (one invader left) step interval, by invaders currently alive.
function stepInterval(aliveCount) {
  const t = (aliveCount - 1) / (TOTAL_INVADERS - 1);
  return STEP_INTERVAL_MIN + (STEP_INTERVAL_MAX - STEP_INTERVAL_MIN) * t;
}

export class Level1 {
  constructor() {
    this.formation = new InvaderFormation();
    this.stepTimer = 0;
  }

  // Advances the march by dt and checks the player's row. Returns 'cleared'
  // once the last invader is destroyed, otherwise null. A formation that
  // reaches the player's row docks a life and restarts the level in place
  // (the caller keeps calling update() as normal).
  update(dt, player) {
    const invaders = this.formation.invaders;
    if (invaders.length === 0) {
      return 'cleared';
    }

    this.stepTimer += dt;
    const interval = stepInterval(invaders.length);
    if (this.stepTimer >= interval) {
      this.stepTimer -= interval;
      this.step();
    }

    for (const invader of invaders) {
      if (invader.y + invader.height >= player.y) {
        player.loseLife();
        this.formation = new InvaderFormation();
        this.stepTimer = 0;
        return null;
      }
    }

    return null;
  }

  step() {
    const invaders = this.formation.invaders;
    const direction = this.formation.direction;

    let hitEdge = false;
    for (const invader of invaders) {
      const nextX = invader.x + HORIZONTAL_STEP * direction;
      if (nextX < 0 || nextX + invader.width > CANVAS_WIDTH) {
        hitEdge = true;
        break;
      }
    }

    if (hitEdge) {
      this.formation.direction *= -1;
      for (const invader of invaders) {
        invader.y += invader.height;
      }
    } else {
      for (const invader of invaders) {
        invader.x += HORIZONTAL_STEP * direction;
      }
    }
  }

  draw(ctx) {
    this.formation.draw(ctx);
  }
}
