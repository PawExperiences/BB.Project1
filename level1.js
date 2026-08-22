// Level 1: the classic grid.
// Added by "Level 1: the classic grid".
//
// The level definition plus its lifecycle wiring on top of the shared
// modules — no new rendering code:
//
//   spawn   the shared InvaderFormation (invaders.js) spawns the classic
//           11-column x 5-row grid — 55 invaders — at its home position
//   march   the formation steps sideways in discrete steps; the step
//           interval scales LINEARLY with the body count, from ~800 ms
//           with all 55 alive down to ~100 ms with exactly one left
//   edge    handled inside the shared formation code: the edge-most
//           invader reaching a playfield edge drops the whole grid by
//           exactly one invader cell height and reverses its horizontal
//           direction
//   breach  the bottom of the lowest invader reaching the player's row
//           costs the player exactly one life and restarts the level in
//           its initial state (score and remaining lives carry over)
//   clear   destroying the 55th invader sets `cleared`; game.js then
//           increments the level counter and hands off to the next
//           registered level module through the registry (levels.js)
//
// Kills, score and explosions stay owned by collision.js; the ship and the
// lives counter stay owned by player.js; game-over at 0 lives stays owned
// by game.js.

import { InvaderFormation, INVADER_COLS, INVADER_ROWS } from './invaders.js';
import { registerLevel } from './levels.js';
import {
  LEVEL1_STEP_INTERVAL_MAX_MS,
  LEVEL1_STEP_INTERVAL_MIN_MS,
} from './gameConfig.js';

// Step pacing: one discrete formation step every STEP_INTERVAL_MAX_MS while
// all 55 invaders live, scaling linearly down to STEP_INTERVAL_MIN_MS with
// exactly one invader left:
//   interval = 800 - (55 - alive) * (700 / 54)   (ms)
const STEP_INTERVAL_MAX_MS = LEVEL1_STEP_INTERVAL_MAX_MS;
const STEP_INTERVAL_MIN_MS = LEVEL1_STEP_INTERVAL_MIN_MS;
const TOTAL_INVADERS = INVADER_COLS * INVADER_ROWS; // 55

export class Level1 {
  // context is game.js's shared slice of game state
  // ({ player, hud, hostileBullets }); Level 1 only needs the player — to
  // read the ship's row for the breach check and to apply the life loss +
  // ship reset when a breach happens.
  constructor(context) {
    this.player = context.player;

    // The classic formation, spawned through the shared formation code —
    // not a reimplementation.
    this.formation = new InvaderFormation();

    // Milliseconds accumulated toward the next discrete march step.
    this.stepTimerMs = 0;

    // Set once the 55th invader is destroyed; game.js reads this to run
    // the level-clear handoff.
    this.cleared = false;
  }

  // The current step interval in ms — linear in the number of invaders
  // still alive: 800 ms at 55, 100 ms at 1.
  stepIntervalMs() {
    const alive = this.formation.aliveCount();
    return (
      STEP_INTERVAL_MAX_MS -
      (TOTAL_INVADERS - alive) *
        ((STEP_INTERVAL_MAX_MS - STEP_INTERVAL_MIN_MS) / (TOTAL_INVADERS - 1))
    );
  }

  // Back to Level 1's initial state after a breach: the full 55-invader
  // formation at its start position, the step timer zeroed (so the next
  // step comes a full initial ~800 ms interval later) and the ship back at
  // its start position. Score and remaining lives are untouched — the one
  // lost life has already been deducted by the caller.
  restart() {
    this.formation.reset();
    this.stepTimerMs = 0;
    this.player.resetPosition();
  }

  update(dt) {
    if (this.cleared) return;

    // All 55 destroyed: level clear. game.js notices via `cleared`, bumps
    // the level counter and hands off to the next registered level module.
    if (this.formation.aliveCount() === 0) {
      this.cleared = true;
      return;
    }

    // Discrete-step marching: one formation step per interval. The
    // interval is re-read every update so each kill shortens it
    // immediately, and the timer keeps its remainder (rather than being
    // zeroed) so the average step rate stays exact at the 60 steps/s
    // fixed timestep.
    this.stepTimerMs += dt * 1000;
    const intervalMs = this.stepIntervalMs();
    if (this.stepTimerMs >= intervalMs) {
      this.stepTimerMs -= intervalMs;
      this.formation.step();
    }

    // Breach: the bottom edge of the lowest living invader has reached the
    // player's row. The player loses exactly one life through the
    // documented interface and the level restarts in its initial state;
    // what happens when lives reach 0 is owned by game.js.
    if (this.formation.lowestBottom() >= this.player.y) {
      this.player.loseLife();
      this.restart();
    }
  }

  draw(ctx) {
    // Pure delegation to the shared sprite/formation rendering.
    this.formation.draw(ctx);
  }
}

// Self-registration: game.js imports this module once so this line runs,
// and the level loader finds Level 1 with no further wiring. Sibling cards
// register their own levels (e.g. registerLevel(2, ...) in level2.js)
// without modifying this file.
registerLevel(1, (context) => new Level1(context));
