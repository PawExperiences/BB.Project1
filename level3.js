// Level 3: shields and formations.
//
// Starts from the same 11x5 grid and sweep-and-descend pattern as Level 1
// (reusing InvaderFormation from invaders.js exactly like Level 1 and
// Level 2 do), adds four destructible shield bunkers, and -- once half the
// starting invaders are destroyed -- splits the surviving formation into two
// independently moving groups. Invader return fire reuses Level 2's
// established column-fire pattern, but bullets are pushed into
// `formation.bullets` (rather than a level-owned array) so the existing
// generic `collision.js` invader-bullet-vs-player pass -- already written
// to handle exactly this shape -- can be reused unmodified instead of
// re-implementing Level 2's player-hit/respawn state machine here.

import { InvaderFormation } from './invaders.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { BULLET_WIDTH, BULLET_HEIGHT } from './player.js';
import { hud, triggerGameOver } from './game.js';

const COLUMNS = 11; // matches invaders.js's grid layout
const TOTAL_INVADERS = 55; // 11 columns x 5 rows
const MAX_STEP_INTERVAL = 800; // ms, with all 55 invaders alive (Level 1's ramp)
const MIN_STEP_INTERVAL = 100; // ms, with 1 invader alive (Level 1's ramp)
const STEP_X = 8; // px, per horizontal step
const SPLIT_THRESHOLD = 28; // ceil(55 / 2) -- destroyed-count that triggers the split

const FIRE_MIN_MS = 800; // global invader-fire timer re-arm range (Level 2's pattern)
const FIRE_MAX_MS = 2000;
const BULLET_FALL_SPEED = 300; // px/sec, invader bullets straight down
const BULLET_COLOR = '#ff5252';

const BUNKER_COLS = 4;
const BUNKER_ROWS = 4;
const CELL_SIZE = 8; // px, per bunker cell
const BUNKER_WIDTH = BUNKER_COLS * CELL_SIZE;
const BUNKER_HEIGHT = BUNKER_ROWS * CELL_SIZE;
const BUNKER_COUNT = 4;
const BUNKER_Y = Math.round(CANVAS_HEIGHT * 0.8); // ~80% of canvas height, classic arcade placement
const BUNKER_COLOR = '#26a69a';

// Same linear ramp as Level 1 (100ms .. 800ms based on alive count).
function stepIntervalFor(aliveCount) {
  return (
    MIN_STEP_INTERVAL +
    ((aliveCount - 1) * (MAX_STEP_INTERVAL - MIN_STEP_INTERVAL)) / (TOTAL_INVADERS - 1)
  );
}

function overlaps(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function randomFireInterval() {
  return FIRE_MIN_MS + Math.random() * (FIRE_MAX_MS - FIRE_MIN_MS);
}

function cellBox(bunker, row, col) {
  return { x: bunker.x + col * CELL_SIZE, y: bunker.y + row * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE };
}

// Four bunkers, evenly spaced across the canvas width. Built once (in the
// constructor, not `spawn()`) since bunker damage persists across a
// life-loss respawn -- bunkers never regenerate mid-level.
function createBunkers() {
  const bunkers = [];
  const segment = CANVAS_WIDTH / BUNKER_COUNT;
  for (let i = 0; i < BUNKER_COUNT; i++) {
    const cells = [];
    for (let row = 0; row < BUNKER_ROWS; row++) {
      cells.push(new Array(BUNKER_COLS).fill(true));
    }
    bunkers.push({
      x: segment * i + segment / 2 - BUNKER_WIDTH / 2,
      y: BUNKER_Y,
      cells,
    });
  }
  return bunkers;
}

export class Level3 {
  constructor() {
    this.bunkers = createBunkers();
    this.spawn();
  }

  // (Re)spawns a fresh full 11x5 formation and resets the step/split state.
  // Mirrors Level1.spawn()/Level2.spawn() -- deliberately leaves `bunkers`
  // untouched, so bunker erosion carries over across a life-loss restart.
  spawn() {
    this.formation = new InvaderFormation();
    this.formation.invaders.forEach((invader, i) => {
      invader.col = i % COLUMNS; // tracked for the eventual left/right split
    });
    this.stepTimerMs = 0;
    this.cleared = false;
    this.split = false;
    this.leftDirection = -1;
    this.rightDirection = 1;
    this.fireTimerMs = randomFireInterval();
  }

  // Once at least SPLIT_THRESHOLD invaders are destroyed, tags every
  // survivor with its group and sets each group's initial sweep direction
  // outward (left group leftward, right group rightward). One-time.
  maybeSplit() {
    if (this.split) return;
    const destroyed = TOTAL_INVADERS - this.formation.invaders.length;
    if (destroyed < SPLIT_THRESHOLD) return;

    this.split = true;
    for (const invader of this.formation.invaders) {
      invader.group = invader.col <= 5 ? 'left' : 'right'; // columns 1-6 vs 7-11 (1-indexed)
    }
    this.leftDirection = -1;
    this.rightDirection = 1;
  }

  // Pre-split: the whole formation steps together, identical to Level1.step().
  stepUnified() {
    const invaders = this.formation.invaders;
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
      const cellHeight = invaders[0].height;
      for (const invader of invaders) {
        invader.y += cellHeight;
      }
    } else {
      for (const invader of invaders) {
        invader.x += dx;
      }
    }
  }

  // Post-split: `groupName`'s invaders reverse/descend based only on their
  // own edge, independent of the other group.
  stepGroup(groupName) {
    const groupInvaders = this.formation.invaders.filter((invader) => invader.group === groupName);
    if (groupInvaders.length === 0) return;

    const directionKey = groupName === 'left' ? 'leftDirection' : 'rightDirection';
    const direction = this[directionKey];

    let minX = Infinity;
    let maxX = -Infinity;
    for (const invader of groupInvaders) {
      minX = Math.min(minX, invader.x);
      maxX = Math.max(maxX, invader.x + invader.width);
    }

    const dx = STEP_X * direction;
    const hitsRightEdge = direction > 0 && maxX + dx > CANVAS_WIDTH;
    const hitsLeftEdge = direction < 0 && minX + dx < 0;

    if (hitsRightEdge || hitsLeftEdge) {
      this[directionKey] *= -1;
      const cellHeight = groupInvaders[0].height;
      for (const invader of groupInvaders) {
        invader.y += cellHeight;
      }
    } else {
      for (const invader of groupInvaders) {
        invader.x += dx;
      }
    }
  }

  step() {
    if (this.formation.invaders.length === 0) return;
    if (!this.split) {
      this.stepUnified();
    } else {
      this.stepGroup('left');
      this.stepGroup('right');
    }
  }

  reachesPlayerRow(player) {
    return this.formation.invaders.some((invader) => invader.y + invader.height >= player.y);
  }

  // Any invader body overlapping a live bunker cell destroys that cell,
  // independent of whether the invader itself survives.
  checkInvaderBodyVsBunkers() {
    for (const invader of this.formation.invaders) {
      for (const bunker of this.bunkers) {
        for (let row = 0; row < BUNKER_ROWS; row++) {
          for (let col = 0; col < BUNKER_COLS; col++) {
            if (bunker.cells[row][col] && overlaps(invader, cellBox(bunker, row, col))) {
              bunker.cells[row][col] = false;
            }
          }
        }
      }
    }
  }

  // Groups surviving invaders by their shared x (columns still line up
  // within each group even after the split, since a group always moves
  // rigidly together) so firing can pick a column uniformly at random.
  columns() {
    const columns = new Map();
    for (const invader of this.formation.invaders) {
      const key = Math.round(invader.x);
      if (!columns.has(key)) columns.set(key, []);
      columns.get(key).push(invader);
    }
    return columns;
  }

  updateFiring(dt) {
    this.fireTimerMs -= dt * 1000;
    if (this.fireTimerMs > 0) return;
    this.fireTimerMs = randomFireInterval();

    const columns = this.columns();
    const keys = Array.from(columns.keys());
    if (keys.length === 0) return;

    const chosenColumn = columns.get(keys[Math.floor(Math.random() * keys.length)]);
    let lowest = chosenColumn[0];
    for (const invader of chosenColumn) {
      if (invader.y > lowest.y) lowest = invader;
    }

    this.formation.bullets.push({
      x: lowest.x + lowest.width / 2 - BULLET_WIDTH / 2,
      y: lowest.y + lowest.height,
    });
  }

  updateBullets(dt) {
    const bullets = this.formation.bullets;
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y += BULLET_FALL_SPEED * dt;
      if (bullets[i].y > CANVAS_HEIGHT) {
        bullets.splice(i, 1);
      }
    }
  }

  // An invader bullet that hits a live bunker cell is consumed here, before
  // `collision.js`'s invader-bullet-vs-player pass ever sees it.
  checkInvaderBulletsVsBunkers() {
    const bullets = this.formation.bullets;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bulletBox = { x: bullets[i].x, y: bullets[i].y, width: BULLET_WIDTH, height: BULLET_HEIGHT };
      if (this.consumeBunkerCellAt(bulletBox)) {
        bullets.splice(i, 1);
      }
    }
  }

  // A player bullet that hits a live bunker cell is consumed here, before
  // `collision.js`'s player-bullet-vs-invader pass ever sees it.
  checkPlayerBulletVsBunkers(player) {
    if (!player.bullet) return;
    const bulletBox = { x: player.bullet.x, y: player.bullet.y, width: BULLET_WIDTH, height: BULLET_HEIGHT };
    if (this.consumeBunkerCellAt(bulletBox)) {
      player.bullet = null;
    }
  }

  // Destroys the first live cell that overlaps `box`, if any. Returns
  // whether a cell was destroyed, so callers can consume the projectile.
  consumeBunkerCellAt(box) {
    for (const bunker of this.bunkers) {
      for (let row = 0; row < BUNKER_ROWS; row++) {
        for (let col = 0; col < BUNKER_COLS; col++) {
          if (bunker.cells[row][col] && overlaps(box, cellBox(bunker, row, col))) {
            bunker.cells[row][col] = false;
            return true;
          }
        }
      }
    }
    return false;
  }

  update(dt, player) {
    if (this.cleared) return;

    const invaders = this.formation.invaders;
    if (invaders.length === 0) {
      this.cleared = true;
      return;
    }

    this.maybeSplit();

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

    this.checkInvaderBodyVsBunkers();
    this.updateFiring(dt);
    this.updateBullets(dt);
    this.checkInvaderBulletsVsBunkers();
    this.checkPlayerBulletVsBunkers(player);

    if (this.reachesPlayerRow(player)) {
      // Existing life/game-state hook, mirroring Level 1's pattern.
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

    ctx.fillStyle = BULLET_COLOR;
    for (const bullet of this.formation.bullets) {
      ctx.fillRect(bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT);
    }

    ctx.fillStyle = BUNKER_COLOR;
    for (const bunker of this.bunkers) {
      for (let row = 0; row < BUNKER_ROWS; row++) {
        for (let col = 0; col < BUNKER_COLS; col++) {
          if (bunker.cells[row][col]) {
            ctx.fillRect(bunker.x + col * CELL_SIZE, bunker.y + row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }
      }
    }
  }
}
