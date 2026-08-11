// level3.js
// Level 3: shields and formations, the last level before the boss. Reuses
// InvaderFormation (from the Sprite rendering and collision detection card)
// purely for its 11x5 starting-grid layout math -- identical to Level 1's
// starting formation -- then tags each invader with its original 0-indexed
// column (0-10), derived from its shared per-column x, the same grouping
// trick Level 2 uses to pick a shooter per column. Before the split the
// formation marches as a single rigid unit exactly like Level 1's step/edge/
// reverse/step-down march. Once 27 of the 55 starting invaders are
// destroyed, the formation splits into two independently marching groups
// (original columns 1-6 left, 7-11 right) that diverge in direction and
// keep sweeping edge-to-edge at whatever step speed the formation had at
// the instant of the split. Also reimplements Level 2's local
// invader-fire/bullet pattern (global fire timer, lowest survivor per
// column) as the "shared level mechanics" the brief calls out, and adds
// four destructible shield bunkers with per-cell erosion from either
// bullet type or invader contact, using collision.js's aabbIntersects for
// every hit test. game.js owns the Level 2 -> Level 3 handoff and the
// Level 3 -> boss handoff (not wired here; both are out of this card's
// scope), and wiring this class's update()/draw() into its loop.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { InvaderFormation } from './invaders.js';
import { aabbIntersects } from './collision.js';
import { hud } from './game.js';
import { SHIP_MARGIN_BOTTOM } from './player.js';

const TOTAL_INVADERS = 55; // 11 columns x 5 rows, same starting formation as Level 1
const SPLIT_THRESHOLD = Math.floor(TOTAL_INVADERS / 2); // 27: floor of half
const STEP_INTERVAL_MAX = 0.8; // Level 1's slowest step interval (55 alive)
const STEP_INTERVAL_MIN = 0.1; // Level 1's fastest step interval (1 alive)
const HORIZONTAL_STEP = 8; // px the formation advances on each step, same as Level 1

const LEFT_SPLIT_COLUMNS = 6; // 0-indexed cols 0-5 (original columns 1-6) go left; 6-10 (7-11) go right

// Mirrors invaders.js's private INVADER_COLOR -- not exported there, so
// duplicated here rather than reaching into that module's internals.
const INVADER_COLOR = '#ff4444';

const FIRE_DELAY_MIN = 0.8; // seconds, global invader-fire timer re-arm range
const FIRE_DELAY_MAX = 2.0;
const INVADER_BULLET_WIDTH = 4;
const INVADER_BULLET_HEIGHT = 12;
const INVADER_BULLET_SPEED = 300; // px/sec, straight down
const INVADER_BULLET_COLOR = '#ffff66';

const SCORE_PER_KILL = 10; // matches Level 1/2's per-invader score

// Mirrors the bullet rectangle player.js draws (BULLET_WIDTH/BULLET_HEIGHT
// there); player.bullet only carries { x, y }, so the collision box is
// reconstructed here rather than redefining the bullet entity.
const PLAYER_BULLET_WIDTH = 4;
const PLAYER_BULLET_HEIGHT = 16;

const INVULNERABILITY_DURATION = 2; // seconds after a respawn

const BUNKER_COUNT = 4;
const BUNKER_GRID = 4; // 4x4 cells per bunker
const CELL_SIZE = 8; // px per cell
const BUNKER_SIZE = BUNKER_GRID * CELL_SIZE;
const BUNKER_Y = CANVAS_HEIGHT * 0.8; // classic arcade placement
const BUNKER_COLOR = '#33cc33';

// Linear interpolation between Level 1's slowest/fastest step interval by
// invaders currently alive -- identical formula to Level 1/2.
function stepInterval(aliveCount) {
  const t = (aliveCount - 1) / (TOTAL_INVADERS - 1);
  return STEP_INTERVAL_MIN + (STEP_INTERVAL_MAX - STEP_INTERVAL_MIN) * t;
}

function randomFireDelay() {
  return FIRE_DELAY_MIN + Math.random() * (FIRE_DELAY_MAX - FIRE_DELAY_MIN);
}

// Four bunkers, evenly spaced across the canvas width, each a 4x4 grid of
// individually-destructible cells centered at ~80% of canvas height.
function buildBunkers() {
  const bunkers = [];
  for (let i = 0; i < BUNKER_COUNT; i++) {
    const centerX = CANVAS_WIDTH * ((i + 1) / (BUNKER_COUNT + 1));
    const originX = centerX - BUNKER_SIZE / 2;
    const cells = [];
    for (let row = 0; row < BUNKER_GRID; row++) {
      for (let col = 0; col < BUNKER_GRID; col++) {
        cells.push({
          x: originX + col * CELL_SIZE,
          y: BUNKER_Y + row * CELL_SIZE,
          width: CELL_SIZE,
          height: CELL_SIZE,
        });
      }
    }
    bunkers.push({ cells });
  }
  return bunkers;
}

export class Level3 {
  constructor() {
    const seed = new InvaderFormation();
    const columnXs = [...new Set(seed.invaders.map((invader) => invader.x))].sort((a, b) => a - b);
    for (const invader of seed.invaders) {
      invader.col = columnXs.indexOf(invader.x);
    }

    // formations holds one entry pre-split (the whole rigid grid) and two
    // entries post-split (independent left/right groups). Each entry is
    // { invaders, direction, stepTimer }.
    this.formations = [{ invaders: seed.invaders, direction: 1, stepTimer: 0 }];
    this.destroyedCount = 0;
    this.split = false;
    this.frozenInterval = null; // captured at split time, shared by both groups from then on

    this.bunkers = buildBunkers();
    this.bullets = []; // invader bullets in flight
    this.fireTimer = randomFireDelay();
    this.playerInvulnerableTimer = 0;
  }

  aliveCount() {
    return this.formations.reduce((sum, formation) => sum + formation.invaders.length, 0);
  }

  // Advances the level by dt. Returns 'cleared' once every starting
  // invader is destroyed, otherwise null.
  update(dt, player) {
    this.updateMarch(dt);
    this.updateInvaderFire(dt);
    this.updateInvaderBullets(dt);

    if (this.playerInvulnerableTimer > 0) {
      this.playerInvulnerableTimer = Math.max(0, this.playerInvulnerableTimer - dt);
    }

    this.checkPlayerBulletHits(player);
    this.checkInvaderBulletHits(player);
    this.checkInvaderBunkerContact();

    return this.aliveCount() === 0 ? 'cleared' : null;
  }

  currentStepInterval() {
    return this.split ? this.frozenInterval : stepInterval(this.aliveCount());
  }

  updateMarch(dt) {
    const interval = this.currentStepInterval();
    for (const formation of this.formations) {
      if (formation.invaders.length === 0) continue;
      formation.stepTimer += dt;
      if (formation.stepTimer >= interval) {
        formation.stepTimer -= interval;
        this.step(formation);
      }
    }
  }

  step(formation) {
    const invaders = formation.invaders;
    const direction = formation.direction;

    let hitEdge = false;
    for (const invader of invaders) {
      const nextX = invader.x + HORIZONTAL_STEP * direction;
      if (nextX < 0 || nextX + invader.width > CANVAS_WIDTH) {
        hitEdge = true;
        break;
      }
    }

    if (hitEdge) {
      formation.direction *= -1;
      for (const invader of invaders) {
        invader.y += invader.height;
      }
    } else {
      for (const invader of invaders) {
        invader.x += HORIZONTAL_STEP * direction;
      }
    }
  }

  // Splits the still-single formation into independently marching left
  // (original columns 1-6) and right (7-11) groups, freezing the step
  // speed the formation had at this instant for both groups going
  // forward, and diverging their initial directions away from centre.
  performSplit() {
    const [formation] = this.formations;
    this.frozenInterval = stepInterval(this.aliveCount());

    const left = { invaders: [], direction: -1, stepTimer: formation.stepTimer };
    const right = { invaders: [], direction: 1, stepTimer: formation.stepTimer };
    for (const invader of formation.invaders) {
      if (invader.col < LEFT_SPLIT_COLUMNS) {
        left.invaders.push(invader);
      } else {
        right.invaders.push(invader);
      }
    }

    this.formations = [left, right];
    this.split = true;
  }

  registerKill() {
    this.destroyedCount += 1;
    if (!this.split && this.destroyedCount >= SPLIT_THRESHOLD) {
      this.performSplit();
    }
  }

  updateInvaderFire(dt) {
    if (this.aliveCount() === 0) return;

    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireInvaderShot();
      this.fireTimer = randomFireDelay();
    }
  }

  // Only the lowest surviving invader in each column (per formation) may
  // fire: group survivors by their shared column x-coordinate -- each
  // formation still moves rigidly, so this grouping trick from Level 2
  // holds within each group even after the split.
  fireInvaderShot() {
    const candidates = [];
    for (const formation of this.formations) {
      const lowestByColumn = new Map();
      for (const invader of formation.invaders) {
        const current = lowestByColumn.get(invader.x);
        if (!current || invader.y > current.y) {
          lowestByColumn.set(invader.x, invader);
        }
      }
      candidates.push(...lowestByColumn.values());
    }

    if (candidates.length === 0) return;
    const shooter = candidates[Math.floor(Math.random() * candidates.length)];
    this.bullets.push({
      x: shooter.x + shooter.width / 2 - INVADER_BULLET_WIDTH / 2,
      y: shooter.y + shooter.height,
      width: INVADER_BULLET_WIDTH,
      height: INVADER_BULLET_HEIGHT,
    });
  }

  // Removes and returns true for the first bunker cell the given rect
  // overlaps, or false if none -- used by both bullet types so a bullet
  // erodes exactly one cell and stops there.
  destroyFirstCell(rect) {
    for (const bunker of this.bunkers) {
      for (let i = bunker.cells.length - 1; i >= 0; i--) {
        if (aabbIntersects(rect, bunker.cells[i])) {
          bunker.cells.splice(i, 1);
          return true;
        }
      }
    }
    return false;
  }

  // Removes every bunker cell the given rect overlaps -- used for invader
  // contact, since an invader sprite is larger than a single cell and
  // isn't blocked or stopped by touching one.
  destroyOverlappingCells(rect) {
    for (const bunker of this.bunkers) {
      for (let i = bunker.cells.length - 1; i >= 0; i--) {
        if (aabbIntersects(rect, bunker.cells[i])) {
          bunker.cells.splice(i, 1);
        }
      }
    }
  }

  updateInvaderBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.y += INVADER_BULLET_SPEED * dt;

      if (this.destroyFirstCell(bullet)) {
        this.bullets.splice(i, 1);
        continue;
      }

      if (bullet.y > CANVAS_HEIGHT) {
        this.bullets.splice(i, 1);
      }
    }
  }

  checkPlayerBulletHits(player) {
    const bullet = player.bullet;
    if (!bullet) return;

    const bulletRect = {
      x: bullet.x,
      y: bullet.y,
      width: PLAYER_BULLET_WIDTH,
      height: PLAYER_BULLET_HEIGHT,
    };

    if (this.destroyFirstCell(bulletRect)) {
      player.bullet = null;
      return;
    }

    for (const formation of this.formations) {
      const invaders = formation.invaders;
      for (let i = 0; i < invaders.length; i++) {
        if (aabbIntersects(bulletRect, invaders[i])) {
          invaders.splice(i, 1);
          player.bullet = null;
          hud.score += SCORE_PER_KILL;
          this.registerKill();
          return;
        }
      }
    }
  }

  // A hit costs a life and respawns the player only when not already
  // invulnerable; hits landing during the invulnerability window still
  // consume the bullet but cause no extra life loss or respawn.
  checkInvaderBulletHits(player) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      if (aabbIntersects(this.bullets[i], player)) {
        this.bullets.splice(i, 1);
        if (this.playerInvulnerableTimer <= 0) {
          player.loseLife();
          this.respawnPlayer(player);
          this.playerInvulnerableTimer = INVULNERABILITY_DURATION;
        }
      }
    }
  }

  // Contact erosion only -- invaders are never blocked, deflected, or
  // removed by touching a bunker; they keep marching normally.
  checkInvaderBunkerContact() {
    for (const formation of this.formations) {
      for (const invader of formation.invaders) {
        this.destroyOverlappingCells(invader);
      }
    }
  }

  respawnPlayer(player) {
    player.x = (CANVAS_WIDTH - player.width) / 2;
    player.y = CANVAS_HEIGHT - player.height - SHIP_MARGIN_BOTTOM;
  }

  // Blinks the ship during the invulnerability window instead of hiding it
  // outright the whole time, so the flash reads as a flash.
  isPlayerVisible() {
    if (this.playerInvulnerableTimer <= 0) return true;
    return Math.floor(this.playerInvulnerableTimer * 10) % 2 === 0;
  }

  draw(ctx, player) {
    this.drawInvaders(ctx);
    this.drawBunkers(ctx);
    this.drawInvaderBullets(ctx);
    if (this.isPlayerVisible()) {
      player.draw(ctx);
    }
  }

  drawInvaders(ctx) {
    ctx.fillStyle = INVADER_COLOR;
    for (const formation of this.formations) {
      for (const invader of formation.invaders) {
        ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
      }
    }
  }

  drawBunkers(ctx) {
    ctx.fillStyle = BUNKER_COLOR;
    for (const bunker of this.bunkers) {
      for (const cell of bunker.cells) {
        ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
      }
    }
  }

  drawInvaderBullets(ctx) {
    ctx.fillStyle = INVADER_BULLET_COLOR;
    for (const bullet of this.bullets) {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
  }
}
