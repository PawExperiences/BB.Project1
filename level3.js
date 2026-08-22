// Level 3: shields and formations.
// Added by "Level 3: shields and formations".
//
// The second (and last, before the boss) difficulty escalation, built by
// EXTENDING Level2 (level2.js) — enemy fire, the bonus UFO and the
// respawn/invulnerability behaviour are inherited, not reimplemented:
//
//   grid     inherited: the same 11x5 InvaderFormation (invaders.js) — 55
//             invaders — at Level 1's classic starting position
//   march    inherited step/acceleration curve and Level 2's x0.67 speed-up
//   fire     inherited: Level 2's single global volley timer
//   ufo      inherited: Level 2's 20 s bonus saucer
//   respawn  inherited: Level 2's lost-life -> reset position + 2 s
//             invulnerability
//   breach   inherited concept (Level 1): the lowest invader reaching the
//             player's row costs one life and restarts the level in its
//             initial state — extended here to also undo the split and
//             refresh the bunkers, since a breach restart is "starting the
//             level from scratch"
//
// On top of that inheritance Level 3 adds two new mechanics:
//
//   bunkers  NEW: four destructible shield bunkers, each a 4x4 grid of 8 px
//             cells, sitting between the player and the invaders. Any of a
//             player bullet, a hostile bullet or a descending invader that
//             touches an intact cell destroys that cell; bullets are
//             consumed by the hit, invaders are not. Erosion is permanent
//             for the level — only a from-scratch restart rebuilds them.
//   split    NEW: once 28 of the 55 invaders are dead (27 or fewer alive),
//             the survivors split into a left half (original columns 1-6)
//             and a right half (columns 7-11), which from that instant
//             march, bounce off the canvas edges and drop independently of
//             one another — starting in opposite directions (left half:
//             left, right half: right). The level clears only once both
//             halves are empty.
//
// Lives, score and the session shot count stay owned by game.js/player.js
// exactly as for Level 1 and Level 2; invader kills/score/explosions stay
// owned by collision.js.

import {
  LEVEL3_BUNKER_COUNT,
  LEVEL3_BUNKER_GRID_SIZE,
  LEVEL3_BUNKER_CELL_SIZE,
  LEVEL3_BUNKER_TOP_RATIO,
  LEVEL3_BUNKER_COLOR,
  LEVEL3_SPLIT_SURVIVOR_THRESHOLD,
  LEVEL3_LEFT_GROUP_COLUMNS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './gameConfig.js';
import { InvaderFormation, INVADER_COLS } from './invaders.js';
import { overlaps } from './collision.js';
import { Level2 } from './level2.js';
import { registerLevel } from './levels.js';

// Bunker geometry: BUNKER_COUNT bunkers, evenly spaced across the canvas
// width, each a GRID_SIZE x GRID_SIZE block of CELL_SIZE px square cells
// with its top at TOP_RATIO of the canvas height.
const BUNKER_COUNT = LEVEL3_BUNKER_COUNT;
const BUNKER_GRID_SIZE = LEVEL3_BUNKER_GRID_SIZE;
const BUNKER_CELL_SIZE = LEVEL3_BUNKER_CELL_SIZE;
const BUNKER_TOP_Y = CANVAS_HEIGHT * LEVEL3_BUNKER_TOP_RATIO;
const BUNKER_COLOR = LEVEL3_BUNKER_COLOR;

// A fresh set of BUNKER_COUNT bunkers, each an array of GRID_SIZE x
// GRID_SIZE intact cells: { x, y, width, height, alive } rects in canvas
// coordinates, the same shape collision.js's shared overlaps() expects.
function createBunkers() {
  const segmentWidth = CANVAS_WIDTH / BUNKER_COUNT;
  const bunkerWidth = BUNKER_GRID_SIZE * BUNKER_CELL_SIZE;

  const bunkers = [];
  for (let b = 0; b < BUNKER_COUNT; b++) {
    const bunkerX = segmentWidth * b + segmentWidth / 2 - bunkerWidth / 2;
    const cells = [];
    for (let row = 0; row < BUNKER_GRID_SIZE; row++) {
      for (let col = 0; col < BUNKER_GRID_SIZE; col++) {
        cells.push({
          x: bunkerX + col * BUNKER_CELL_SIZE,
          y: BUNKER_TOP_Y + row * BUNKER_CELL_SIZE,
          width: BUNKER_CELL_SIZE,
          height: BUNKER_CELL_SIZE,
          alive: true,
        });
      }
    }
    bunkers.push(cells);
  }
  return bunkers;
}

export class Level3 extends Level2 {
  // context is game.js's shared slice of game state:
  // { player, hud, hostileBullets }.
  constructor(context) {
    super(context); // player, hud, hostileBullets, the 55-invader formation,
    // the march timer, enemy fire, the UFO and respawn tracking.

    // Each invader is tagged with its original (pre-split) column so the
    // split can partition the survivors correctly and so pickShooter() (see
    // below) can still pick one shooter per occupied column once the
    // formation is no longer a single row-major 11-wide grid.
    this.tagColumns();

    // Split state: unsplit at level start, as a single 11x5 formation.
    this.split = false;
    this.leftGroup = null;
    this.rightGroup = null;

    // Four fresh 4x4 shield bunkers, eroded permanently for the level.
    this.bunkers = createBunkers();
  }

  tagColumns() {
    const invaders = this.formation.invaders;
    for (let i = 0; i < invaders.length; i++) {
      invaders[i].column = i % INVADER_COLS;
    }
  }

  // Breach restart ("starting the level from scratch"): Level 2's restart
  // (full 55-invader formation, ship home, no bullets/fire timer/UFO in
  // flight) plus undoing the split and rebuilding fresh bunkers. If the
  // formation is currently split, this.formation is swapped back to a real
  // InvaderFormation first so the inherited restart()'s
  // this.formation.reset() call has a formation to reset.
  restart() {
    if (this.split) {
      this.formation = new InvaderFormation();
    }
    super.restart();
    this.tagColumns();
    this.split = false;
    this.leftGroup = null;
    this.rightGroup = null;
    this.bunkers = createBunkers();
  }

  update(dt) {
    if (this.cleared) return;

    if (!this.split && this.formation.aliveCount() <= LEVEL3_SPLIT_SURVIVOR_THRESHOLD) {
      this.performSplit();
    }

    if (!this.split) {
      // Unsplit: exactly Level 2's march/breach/clear plus fire/hostile
      // bullets/UFO/respawn.
      super.update(dt);
    } else {
      this.updateSplitFormations(dt);
      if (this.cleared) {
        this.hostileBullets.length = 0;
      } else {
        this.updateEnemyFire(dt);
        this.updateHostileBullets(dt);
        this.updateUfo(dt);
        this.updateRespawn();
      }
    }

    if (!this.cleared) {
      this.resolveBunkerCollisions();
    }
  }

  // The moment 28 invaders are dead: partition the 27-or-fewer survivors by
  // their tagged original column into a left half (columns 0..
  // LEFT_GROUP_COLUMNS - 1, i.e. original columns 1-6) and a right half
  // (the rest, original columns 7-11), with no invader changing position.
  // Each half becomes its own independent InvaderFormation-like march
  // (reusing invaders.js's step()/aliveCount()/lowestBottom()/draw(), which
  // only ever look at their own instance's `invaders`/`direction`), moving
  // apart from the instant of the split: left goes left, right goes right.
  performSplit() {
    const invaders = this.formation.invaders;
    const leftInvaders = invaders.filter((invader) => invader.column < LEVEL3_LEFT_GROUP_COLUMNS);
    const rightInvaders = invaders.filter((invader) => invader.column >= LEVEL3_LEFT_GROUP_COLUMNS);

    this.leftGroup = new InvaderFormation();
    this.leftGroup.invaders = leftInvaders;
    this.leftGroup.direction = -1;
    this.leftGroup.stepAccumulator = 0;

    this.rightGroup = new InvaderFormation();
    this.rightGroup.invaders = rightInvaders;
    this.rightGroup.direction = 1;
    this.rightGroup.stepAccumulator = 0;

    // A formation stand-in exposing exactly what the rest of the code needs
    // from it — aliveCount() (Level 1's stepIntervalMs() pacing formula),
    // draw() and the merged invaders list (collision.js's player-bullet
    // pass, run by game.js against currentLevel.formation) — transparently
    // delegating to both halves so no other inherited method needs to know
    // the formation split at all.
    const mergedInvaders = leftInvaders.concat(rightInvaders);
    this.formation = {
      invaders: mergedInvaders,
      aliveCount: () => this.leftGroup.aliveCount() + this.rightGroup.aliveCount(),
      draw: (ctx) => {
        this.leftGroup.draw(ctx);
        this.rightGroup.draw(ctx);
      },
    };

    this.split = true;
  }

  // Post-split march/breach/clear: one shared step timer (same interval as
  // the unsplit march, via the inherited stepIntervalMs() reading total
  // alive count through this.formation.aliveCount() above) steps each
  // still-populated half on its own schedule — each bounces off the canvas
  // edges independently, since step() only looks at its own invaders.
  updateSplitFormations(dt) {
    this.stepTimerMs += dt * 1000;
    const intervalMs = this.stepIntervalMs();
    if (this.stepTimerMs >= intervalMs) {
      this.stepTimerMs -= intervalMs;
      if (this.leftGroup.aliveCount() > 0) this.leftGroup.step();
      if (this.rightGroup.aliveCount() > 0) this.rightGroup.step();
    }

    // Breach: either half's lowest invader reaching the player's row costs
    // one life and restarts the level from scratch, same as Level 1/2.
    const lowestBottom = Math.max(this.leftGroup.lowestBottom(), this.rightGroup.lowestBottom());
    if (lowestBottom >= this.player.y) {
      this.player.loseLife();
      this.restart();
      return;
    }

    // Clear only once both halves are fully destroyed.
    if (this.leftGroup.aliveCount() === 0 && this.rightGroup.aliveCount() === 0) {
      this.cleared = true;
    }
  }

  // Per-fixed-step bunker erosion, checked after this frame's movement so a
  // bullet cannot visibly pass through an intact cell: the player's bullet
  // and every hostile bullet are consumed by the first intact cell they
  // overlap (destroying just that cell), and every living invader destroys
  // every intact cell its body currently overlaps without being affected
  // itself.
  resolveBunkerCollisions() {
    const bullet = this.player.bullet;
    if (bullet !== null) {
      const cell = this.findHitCell(bullet);
      if (cell !== null) {
        cell.alive = false;
        this.player.bullet = null;
      }
    }

    for (let i = this.hostileBullets.length - 1; i >= 0; i--) {
      const cell = this.findHitCell(this.hostileBullets[i]);
      if (cell !== null) {
        cell.alive = false;
        this.hostileBullets.splice(i, 1);
      }
    }

    for (const invader of this.formation.invaders) {
      if (!invader.alive) continue;
      this.destroyOverlappingCells(invader);
    }
  }

  // The first intact cell (any bunker) overlapping rect, or null.
  findHitCell(rect) {
    for (const bunker of this.bunkers) {
      for (const cell of bunker) {
        if (cell.alive && overlaps(rect, cell)) return cell;
      }
    }
    return null;
  }

  // Destroys every intact cell (any bunker) overlapping rect.
  destroyOverlappingCells(rect) {
    for (const bunker of this.bunkers) {
      for (const cell of bunker) {
        if (cell.alive && overlaps(rect, cell)) cell.alive = false;
      }
    }
  }

  // pickShooter() override (Level 2): Level 2's version derives an
  // invader's column from its index modulo INVADER_COLS, which only holds
  // while this.formation.invaders is the original row-major 11-wide array.
  // Once split, this.formation.invaders is the concatenation of the two
  // halves and that index arithmetic no longer matches a real column, so
  // this reads the column tagged at construction time instead — the same
  // "lowest living invader per occupied column, one column picked at
  // random" rule either way.
  pickShooter() {
    const lowestByColumn = new Map();
    for (const invader of this.formation.invaders) {
      if (!invader.alive) continue;
      const current = lowestByColumn.get(invader.column);
      if (current === undefined || invader.y > current.y) {
        lowestByColumn.set(invader.column, invader);
      }
    }
    const candidates = [...lowestByColumn.values()];
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  draw(ctx) {
    // Bunkers first (background scenery), then the formation (transparently
    // handling the split via this.formation.draw() above), hostile bullets
    // and the UFO — all inherited from Level 2/Level 1.
    this.drawBunkers(ctx);
    super.draw(ctx);
  }

  drawBunkers(ctx) {
    ctx.fillStyle = BUNKER_COLOR;
    for (const bunker of this.bunkers) {
      for (const cell of bunker) {
        if (cell.alive) ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
      }
    }
  }
}

// Self-registration: game.js imports this module once so this line runs,
// and clearing Level 2 hands off to Level 3 with no further wiring. The
// boss level (level4, registered by boss.js) takes over the same way when
// Level 3 clears.
registerLevel(3, (context) => new Level3(context));
