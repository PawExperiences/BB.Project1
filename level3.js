// Level 3: shields and formations. Starts with the same 11x5/55-invader
// formation and step-speed curve as Level 1 (stepIntervalForAliveCount, see
// level1.js), plus Level 2's single-timer invader return fire and
// invulnerability-aware player-hit/respawn handling (level2.js) — both
// reused as-is, not reinvented, since neither is new scope here.
//
// What's new: four destructible shield bunkers between the invaders and the
// player, and a formation split. The `Invaders` class in invaders.js only
// ever moves its whole grid through one shared offsetX/offsetY/direction, so
// it can't represent two halves sweeping independently once split — this
// module therefore owns a small formation/stepping implementation of its
// own, mirroring invaders.js's spacing, step and drop constants exactly so
// the pre-split grid is visually identical to Level 1/2's. Before the split
// threshold, every invader is driven by one shared "group" (offsetX/offsetY/
// direction/stepTimer), exactly like invaders.js; once triggered, the
// invaders left of the split column and those at/right of it are driven by
// two independent group objects instead.
//
// Not in scope here (left to a future integration card, matching the
// "Planned future cards" note in README.md): wiring level2 -> level3 into
// game.js (which needs a win condition added to level2.js first) and the
// boss level itself. This file is self-contained and does not import from
// or get imported by game.js yet.

import { overlaps } from './collision.js';
import { stepIntervalForAliveCount } from './level1.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';

export const LEVEL_NUMBER = 3;
export const NEXT_LEVEL_NUMBER = 4;

const GRID_COLS = 11;
const GRID_ROWS = 5;
const INVADER_COUNT = GRID_COLS * GRID_ROWS; // 55

// Documented rounding assumption: 55 has no exact half, so "once half the
// starting invaders are dead" fires on the 28th death (ceil(55 / 2)).
const SPLIT_DEATH_THRESHOLD = Math.ceil(INVADER_COUNT / 2); // 28

// Left group = original columns 1-6 (0-indexed 0-5); right group = original
// columns 7-11 (0-indexed 6-10).
const LEFT_GROUP_MAX_COL = 5;

// Mirrors invaders.js's grid spacing/step/drop constants exactly, so the
// pre-split formation lines up pixel-for-pixel with Level 1/2's.
const INVADER_WIDTH = 32;
const INVADER_HEIGHT = 24;
const INVADER_H_SPACING = 48;
const INVADER_V_SPACING = 40;
const INVADER_START_X = (CANVAS_WIDTH - ((GRID_COLS - 1) * INVADER_H_SPACING + INVADER_WIDTH)) / 2;
const INVADER_START_Y = 80;
const H_STEP = 12;
const DROP_STEP = INVADER_V_SPACING;
const EXPLOSION_DURATION = 0.2;
const INVADER_COLOR = '#ff3b3b';
const EXPLOSION_COLOR = '#ffcc00';
const INVADER_KILL_SCORE = 10;

// Bunkers: four evenly-spaced 4x4 grids of 8px cells, sitting at ~80% of
// canvas height (between the invaders and the player).
const BUNKER_COUNT = 4;
const BUNKER_COLS = 4;
const BUNKER_ROWS = 4;
const BUNKER_CELL_SIZE = 8;
const BUNKER_WIDTH = BUNKER_COLS * BUNKER_CELL_SIZE;
const BUNKER_HEIGHT = BUNKER_ROWS * BUNKER_CELL_SIZE;
const BUNKER_Y = Math.round(CANVAS_HEIGHT * 0.8 - BUNKER_HEIGHT / 2);
const BUNKER_COLOR = '#33cc33';

// Mirrors the player bullet's fixed size defined in player.js, the same way
// collision.js and level2.js already mirror it.
const PLAYER_BULLET_WIDTH = 4;
const PLAYER_BULLET_HEIGHT = 14;

// Invader return fire: identical single re-rolling global timer and
// lowest-alive-per-column targeting as level2.js.
const FIRE_DELAY_MIN_MS = 800;
const FIRE_DELAY_MAX_MS = 2000;
const INVADER_BULLET_WIDTH = 4;
const INVADER_BULLET_HEIGHT = 14;
const INVADER_BULLET_SPEED = 300; // px/s, straight down
const INVADER_BULLET_COLOR = '#ff6666';

function randomFireDelayMs() {
  return FIRE_DELAY_MIN_MS + Math.random() * (FIRE_DELAY_MAX_MS - FIRE_DELAY_MIN_MS);
}

function createBunkers() {
  const bunkers = [];
  const segmentWidth = CANVAS_WIDTH / BUNKER_COUNT;
  for (let i = 0; i < BUNKER_COUNT; i++) {
    const centerX = segmentWidth * i + segmentWidth / 2;
    const cells = [];
    for (let row = 0; row < BUNKER_ROWS; row++) {
      cells.push(new Array(BUNKER_COLS).fill(true));
    }
    bunkers.push({ x: Math.round(centerX - BUNKER_WIDTH / 2), y: BUNKER_Y, cells });
  }
  return bunkers;
}

function cellBounds(bunker, row, col) {
  return {
    x: bunker.x + col * BUNKER_CELL_SIZE,
    y: bunker.y + row * BUNKER_CELL_SIZE,
    width: BUNKER_CELL_SIZE,
    height: BUNKER_CELL_SIZE,
  };
}

// Destroys every alive cell overlapping `bounds` (a big sprite can span
// several cells at once); returns whether anything was destroyed. Used for
// the descending-invader erosion case.
function destroyOverlappingCells(bunkers, bounds) {
  let destroyed = false;
  for (const bunker of bunkers) {
    for (let row = 0; row < BUNKER_ROWS; row++) {
      for (let col = 0; col < BUNKER_COLS; col++) {
        if (!bunker.cells[row][col]) continue;
        if (overlaps(bounds, cellBounds(bunker, row, col))) {
          bunker.cells[row][col] = false;
          destroyed = true;
        }
      }
    }
  }
  return destroyed;
}

// Destroys at most the first alive cell overlapping `bounds` and stops, so a
// single projectile punches exactly one hole even though its height (14px)
// can straddle two 8px cell rows. Used for player/invader projectile hits.
function destroyFirstOverlappingCell(bunkers, bounds) {
  for (const bunker of bunkers) {
    for (let row = 0; row < BUNKER_ROWS; row++) {
      for (let col = 0; col < BUNKER_COLS; col++) {
        if (!bunker.cells[row][col]) continue;
        if (overlaps(bounds, cellBounds(bunker, row, col))) {
          bunker.cells[row][col] = false;
          return true;
        }
      }
    }
  }
  return false;
}

export class Level3 {
  constructor() {
    this.invaders = this._createFormation();
    this.deaths = 0;

    this.splitDone = false;
    this.singleGroup = this._createGroupState(1);
    this.leftGroup = null;
    this.rightGroup = null;

    this.bunkers = createBunkers();

    // Kept separate from any wrapped Invaders-style bullets array, same as
    // level2.js, so invulnerability/respawn handling stays local to this
    // level's own player-hit check.
    this.invaderBullets = [];
    this.fireTimer = 0;
    this.fireDelayMs = randomFireDelayMs();

    this.completed = false;
  }

  _createFormation() {
    const invaders = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        invaders.push({ col, row, alive: true, exploding: false, explodeTimer: 0 });
      }
    }
    return invaders;
  }

  _createGroupState(direction) {
    return { offsetX: 0, offsetY: 0, direction, stepTimer: 0, stepIntervalMs: 500, lastAliveCount: null };
  }

  _groupFor(inv) {
    if (!this.splitDone) return this.singleGroup;
    return inv.col <= LEFT_GROUP_MAX_COL ? this.leftGroup : this.rightGroup;
  }

  _boundsFor(inv) {
    const group = this._groupFor(inv);
    return {
      x: INVADER_START_X + group.offsetX + inv.col * INVADER_H_SPACING,
      y: INVADER_START_Y + group.offsetY + inv.row * INVADER_V_SPACING,
      width: INVADER_WIDTH,
      height: INVADER_HEIGHT,
    };
  }

  _aliveCount() {
    return this.invaders.filter((inv) => inv.alive).length;
  }

  update(dt, player, hudState) {
    if (this.completed) return;

    this._updateExplosions(dt);
    this._updateFormation(dt);
    this._updateInvaderFire(dt);
    this._updateInvaderBullets(dt);

    this._handlePlayerBulletVsBunkers(player);
    this._handlePlayerBulletVsInvaders(player, hudState);
    this._handleInvaderBulletsVsBunkers();
    this._handlePlayerHit(player, hudState);

    if (this._aliveCount() === 0) {
      this.completed = true;
      hudState.level = NEXT_LEVEL_NUMBER;
    }
  }

  _updateExplosions(dt) {
    for (const inv of this.invaders) {
      if (!inv.exploding) continue;
      inv.explodeTimer -= dt;
      if (inv.explodeTimer <= 0) {
        inv.exploding = false;
      }
    }
  }

  _updateFormation(dt) {
    if (!this.splitDone) {
      this._updateGroup(this.singleGroup, dt, this.invaders);
      return;
    }

    const leftInvaders = this.invaders.filter((inv) => inv.col <= LEFT_GROUP_MAX_COL);
    const rightInvaders = this.invaders.filter((inv) => inv.col > LEFT_GROUP_MAX_COL);
    this._updateGroup(this.leftGroup, dt, leftInvaders);
    this._updateGroup(this.rightGroup, dt, rightInvaders);
  }

  _updateGroup(group, dt, groupInvaders) {
    const aliveInvaders = groupInvaders.filter((inv) => inv.alive);

    if (aliveInvaders.length !== group.lastAliveCount) {
      group.lastAliveCount = aliveInvaders.length;
      if (aliveInvaders.length > 0) {
        group.stepIntervalMs = stepIntervalForAliveCount(aliveInvaders.length);
      }
    }
    if (aliveInvaders.length === 0) return;

    const stepIntervalSeconds = group.stepIntervalMs / 1000;
    group.stepTimer += dt;
    if (group.stepTimer >= stepIntervalSeconds) {
      group.stepTimer -= stepIntervalSeconds;
      this._stepGroup(group, aliveInvaders);
    }
  }

  // Mirrors invaders.js's _step/_aliveHorizontalBounds: edge-triggered
  // reverse+drop, computed from this group's own alive invaders only.
  _stepGroup(group, aliveInvaders) {
    let minCol = null;
    let maxCol = null;
    for (const inv of aliveInvaders) {
      if (minCol === null || inv.col < minCol) minCol = inv.col;
      if (maxCol === null || inv.col > maxCol) maxCol = inv.col;
    }

    const left = INVADER_START_X + group.offsetX + minCol * INVADER_H_SPACING;
    const right = INVADER_START_X + group.offsetX + maxCol * INVADER_H_SPACING + INVADER_WIDTH;
    const nextLeft = left + group.direction * H_STEP;
    const nextRight = right + group.direction * H_STEP;

    if (nextLeft < 0 || nextRight > CANVAS_WIDTH) {
      group.offsetY += DROP_STEP;
      group.direction *= -1;
    } else {
      group.offsetX += group.direction * H_STEP;
    }

    for (const inv of aliveInvaders) {
      destroyOverlappingCells(this.bunkers, this._boundsFor(inv));
    }
  }

  _kill(inv) {
    inv.alive = false;
    inv.exploding = true;
    inv.explodeTimer = EXPLOSION_DURATION;
    this.deaths += 1;

    if (!this.splitDone && this.deaths >= SPLIT_DEATH_THRESHOLD) {
      this._performSplit();
    }
  }

  // Left group's next move is leftward, right group's next move is
  // rightward (per the resolved clarification), diverging outward from the
  // shared position/speed the single group had reached at split time.
  _performSplit() {
    const { offsetX, offsetY, stepIntervalMs } = this.singleGroup;
    this.leftGroup = { offsetX, offsetY, direction: -1, stepTimer: 0, stepIntervalMs, lastAliveCount: null };
    this.rightGroup = { offsetX, offsetY, direction: 1, stepTimer: 0, stepIntervalMs, lastAliveCount: null };
    this.splitDone = true;
  }

  _updateInvaderFire(dt) {
    this.fireTimer += dt * 1000;
    if (this.fireTimer < this.fireDelayMs) return;

    this.fireTimer -= this.fireDelayMs;
    this.fireDelayMs = randomFireDelayMs();

    const shooter = this._pickRandomColumnShooter();
    if (!shooter) return;

    const bounds = this._boundsFor(shooter);
    this.invaderBullets.push({
      x: bounds.x + bounds.width / 2 - INVADER_BULLET_WIDTH / 2,
      y: bounds.y + bounds.height,
    });
  }

  _pickRandomColumnShooter() {
    const lowestByColumn = new Map();
    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      const current = lowestByColumn.get(inv.col);
      if (!current || inv.row > current.row) {
        lowestByColumn.set(inv.col, inv);
      }
    }

    const shooters = Array.from(lowestByColumn.values());
    if (shooters.length === 0) return null;
    return shooters[Math.floor(Math.random() * shooters.length)];
  }

  _updateInvaderBullets(dt) {
    for (const bullet of this.invaderBullets) {
      bullet.y += INVADER_BULLET_SPEED * dt;
    }
    this.invaderBullets = this.invaderBullets.filter((b) => b.y < CANVAS_HEIGHT);
  }

  _handlePlayerBulletVsBunkers(player) {
    if (!player.bullet) return;
    const bounds = { x: player.bullet.x, y: player.bullet.y, width: PLAYER_BULLET_WIDTH, height: PLAYER_BULLET_HEIGHT };
    if (destroyFirstOverlappingCell(this.bunkers, bounds)) {
      player.bullet = null;
    }
  }

  _handlePlayerBulletVsInvaders(player, hudState) {
    if (!player.bullet) return;
    const bounds = { x: player.bullet.x, y: player.bullet.y, width: PLAYER_BULLET_WIDTH, height: PLAYER_BULLET_HEIGHT };
    const hit = this.invaders.find((inv) => inv.alive && overlaps(bounds, this._boundsFor(inv)));
    if (!hit) return;

    player.bullet = null;
    this._kill(hit);
    hudState.score += INVADER_KILL_SCORE;
  }

  _handleInvaderBulletsVsBunkers() {
    this.invaderBullets = this.invaderBullets.filter((b) => {
      const bounds = { x: b.x, y: b.y, width: INVADER_BULLET_WIDTH, height: INVADER_BULLET_HEIGHT };
      return !destroyFirstOverlappingCell(this.bunkers, bounds);
    });
  }

  _handlePlayerHit(player, hudState) {
    if (player.isInvulnerable()) return;

    const playerBounds = { x: player.x, y: player.y, width: player.width, height: player.height };

    const hitBullets = this.invaderBullets.filter((b) =>
      overlaps({ x: b.x, y: b.y, width: INVADER_BULLET_WIDTH, height: INVADER_BULLET_HEIGHT }, playerBounds)
    );
    const hitByInvader = this.invaders.some((inv) => inv.alive && overlaps(this._boundsFor(inv), playerBounds));

    if (hitBullets.length === 0 && !hitByInvader) return;

    if (hitBullets.length > 0) {
      this.invaderBullets = this.invaderBullets.filter((b) => !hitBullets.includes(b));
    }

    hudState.lives = Math.max(0, hudState.lives - 1);
    player.respawn();
  }

  draw(ctx) {
    this._drawBunkers(ctx);
    this._drawInvaders(ctx);
    this._drawInvaderBullets(ctx);
  }

  _drawBunkers(ctx) {
    ctx.fillStyle = BUNKER_COLOR;
    for (const bunker of this.bunkers) {
      for (let row = 0; row < BUNKER_ROWS; row++) {
        for (let col = 0; col < BUNKER_COLS; col++) {
          if (!bunker.cells[row][col]) continue;
          const b = cellBounds(bunker, row, col);
          ctx.fillRect(b.x, b.y, b.width, b.height);
        }
      }
    }
  }

  _drawInvaders(ctx) {
    ctx.fillStyle = INVADER_COLOR;
    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      const b = this._boundsFor(inv);
      ctx.fillRect(b.x, b.y, b.width, b.height);
    }

    ctx.fillStyle = EXPLOSION_COLOR;
    for (const inv of this.invaders) {
      if (!inv.exploding) continue;
      const b = this._boundsFor(inv);
      ctx.fillRect(b.x, b.y, b.width, b.height);
    }
  }

  _drawInvaderBullets(ctx) {
    ctx.fillStyle = INVADER_BULLET_COLOR;
    for (const b of this.invaderBullets) {
      ctx.fillRect(b.x, b.y, INVADER_BULLET_WIDTH, INVADER_BULLET_HEIGHT);
    }
  }
}
