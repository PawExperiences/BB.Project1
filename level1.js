// Level 1: the classic 11x5 grid.
//
// Owns formation spawn/restart, the step-interval difficulty ramp, and
// edge-drop + direction reversal. Reuses InvaderFormation from invaders.js
// (built by the "Sprite rendering and collision detection" card) for the
// actual invader data/rendering instead of re-implementing the grid or its
// draw() -- this card only replaces *how often* the formation steps, not
// what an invader looks like or how collisions are detected.

import { InvaderFormation } from './invaders.js';
import { CANVAS_WIDTH } from './gameConfig.js';
import { hud, triggerGameOver } from './game.js';

const TOTAL_INVADERS = 55; // 11 columns x 5 rows
const MAX_STEP_INTERVAL = 800; // ms, with all 55 invaders alive
const MIN_STEP_INTERVAL = 100; // ms, with 1 invader alive
const STEP_X = 8; // px, per horizontal step

// interval = 100 + (aliveCount - 1) * 700 / 54 -- linear, monotonically
// decreasing as invaders are destroyed (55 alive -> 800ms, 1 alive -> 100ms).
function stepIntervalFor(aliveCount) {
  return (
    MIN_STEP_INTERVAL +
    ((aliveCount - 1) * (MAX_STEP_INTERVAL - MIN_STEP_INTERVAL)) / (TOTAL_INVADERS - 1)
  );
}

export class Level1 {
  constructor() {
    this.spawn();
  }

  // (Re)spawns a fresh full 11x5 formation and resets the step timer/ramp.
  // Used both on first construction and every restart after a life is lost.
  spawn() {
    this.formation = new InvaderFormation();
    this.stepTimerMs = 0;
    this.cleared = false;
  }

  step() {
    const invaders = this.formation.invaders;
    if (invaders.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    for (const invader of invaders) {
      minX = Math.min(minX, invader.x);
      maxX = Math.max(maxX, invader.x + invader.width);
    }

    const dx = STEP_X * this.formation.direction;
    const hitsRightEdge = this.formation.direction > 0 && maxX + dx > CANVAS_WIDTH;
    const hitsLeftEdge = this.formation.direction < 0 && minX + dx < 0;

    if (hitsRightEdge || hitsLeftEdge) {
      this.formation.direction *= -1;
      const cellHeight = invaders[0].height; // one invader-cell height
      for (const invader of invaders) {
        invader.y += cellHeight;
      }
    } else {
      for (const invader of invaders) {
        invader.x += dx;
      }
    }
  }

  reachesPlayerRow(player) {
    return this.formation.invaders.some((invader) => invader.y + invader.height >= player.y);
  }

  update(dt, player) {
    if (this.cleared) return;

    const invaders = this.formation.invaders;
    if (invaders.length === 0) {
      this.cleared = true;
      return;
    }

    this.stepTimerMs += dt * 1000;
    const interval = stepIntervalFor(invaders.length);
    while (this.stepTimerMs >= interval && this.formation.invaders.length > 0) {
      this.stepTimerMs -= interval;
      this.step();
    }

    if (this.formation.invaders.length === 0) {
      this.cleared = true;
      return;
    }

    if (this.reachesPlayerRow(player)) {
      // Existing life/game-state hook, mirroring the pattern already
      // established by collision.js's invader-bullet-vs-player check.
      player.loseLife();
      hud.lives = player.lives;
      if (player.lives <= 0) {
        triggerGameOver();
      }
      this.spawn();
    }
  }

  draw(ctx) {
    this.formation.draw(ctx);
  }
}
