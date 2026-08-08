// level3.js — Level 3: Shields and Split Formations
// Introduces destructible shield bunkers and a mid-level formation split.

import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_SPEED } from './gameConfig.js';
import { Player } from './player.js';
import { initInput, isKeyHeld } from './input.js';

// ─── Formation constants (mirrored from invaders.js for self-contained logic) ──
const COLS      = 11;
const ROWS      = 5;
const INV_W     = 32;
const INV_H     = 24;
const H_GAP     = 8;
const V_GAP     = 8;
const CELL_W    = INV_W + H_GAP;   // 40 px
const CELL_H    = INV_H + V_GAP;   // 32 px
const STEP_PX   = 8;               // pixels per discrete step

// ─── Bunker constants ──────────────────────────────────────────────────────────
const BUNKER_COUNT      = 4;
const BUNKER_CELL_SIZE  = 8;        // px per cell
const BUNKER_GRID       = 4;        // 4×4 cells
const BUNKER_SIZE       = BUNKER_CELL_SIZE * BUNKER_GRID; // 32 px
const BUNKER_Y          = Math.floor(CANVAS_HEIGHT * 0.80);

// ─── Bullet dimensions (mirrors collision.js / player.js) ────────────────────
const BULLET_W = 4;
const BULLET_H = 12;
const INV_BULLET_SPEED = 240; // px/s downward

// ─── Explosion constants ──────────────────────────────────────────────────────
const EXPLOSION_FRAMES = 8;

// ─── Interval formula (identical to level1.js) ────────────────────────────────
function stepInterval(aliveCount) {
  const clamped = Math.max(1, Math.min(55, aliveCount));
  const aliveFraction = (clamped - 1) / 54;
  return (100 + aliveFraction * 700) / 1000;
}

// ─── AABB helper ──────────────────────────────────────────────────────────────
function aabb(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function bulletRect(bullet) {
  return { x: bullet.x - BULLET_W / 2, y: bullet.y - BULLET_H, width: BULLET_W, height: BULLET_H };
}

// ─── Build bunkers ────────────────────────────────────────────────────────────
/**
 * Returns an array of 4 bunkers, each bunker is:
 *   { x, y, cells: 4×4 boolean array (true = alive) }
 */
function buildBunkers() {
  const bunkers = [];
  // Evenly space 4 bunkers across the canvas width with equal margins.
  // spacing = CANVAS_WIDTH / (BUNKER_COUNT + 1) centres them.
  const spacing = CANVAS_WIDTH / (BUNKER_COUNT + 1);
  for (let i = 0; i < BUNKER_COUNT; i++) {
    const cx = Math.round(spacing * (i + 1));
    const x  = cx - Math.floor(BUNKER_SIZE / 2);
    const cells = [];
    for (let r = 0; r < BUNKER_GRID; r++) {
      const row = [];
      for (let c = 0; c < BUNKER_GRID; c++) {
        row.push(true);
      }
      cells.push(row);
    }
    bunkers.push({ x, y: BUNKER_Y, cells });
  }
  return bunkers;
}

// ─── Build invader formation ──────────────────────────────────────────────────
const FORMATION_W = COLS * CELL_W - H_GAP;
const START_X     = Math.floor((CANVAS_WIDTH - FORMATION_W) / 2);
const START_Y     = 80;

function buildFormation() {
  const list = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      list.push({
        x:         START_X + col * CELL_W,
        y:         START_Y + row * CELL_H,
        width:     INV_W,
        height:    INV_H,
        alive:     true,
        explosion: null,
        row,
        col,
      });
    }
  }
  return list;
}

// ─── Sub-formation helper ─────────────────────────────────────────────────────
/**
 * A SubFormation manages an independent group of invaders with its own
 * direction and step timer.
 */
class SubFormation {
  constructor(invaders, initialDirection) {
    this.invaders  = invaders;        // references into the shared invader list
    this.direction = initialDirection; // +1 right, -1 left
    this.stepTimer = 0;
  }

  /** @returns {object[]} living invaders in this sub-formation */
  alive() {
    return this.invaders.filter(i => i.alive);
  }

  /**
   * Advance movement for dt seconds.
   * @param {number} dt
   */
  update(dt) {
    const alive = this.alive();
    if (alive.length === 0) return;

    this.stepTimer += dt;
    const interval = stepInterval(alive.length);

    if (this.stepTimer >= interval) {
      this.stepTimer -= interval;
      this._step(alive);
    }
  }

  _step(alive) {
    let leadingEdge;
    if (this.direction > 0) {
      leadingEdge = Math.max(...alive.map(i => i.x + i.width));
    } else {
      leadingEdge = Math.min(...alive.map(i => i.x));
    }

    const proposed = leadingEdge + this.direction * STEP_PX;

    if (this.direction > 0 && proposed > CANVAS_WIDTH) {
      // Drop and reverse
      for (const inv of alive) inv.y += CELL_H;
      this.direction = -1;
    } else if (this.direction < 0 && proposed < 0) {
      for (const inv of alive) inv.y += CELL_H;
      this.direction = 1;
    } else {
      for (const inv of alive) inv.x += this.direction * STEP_PX;
    }
  }
}

// ─── Level 3 object ───────────────────────────────────────────────────────────
const level3 = {
  // Internal state — reset on init()
  _player:          null,
  _bunkers:         [],
  _invaders:        [],
  _subFormations:   [],      // after split: [leftSub, rightSub]
  _unified:         null,    // SubFormation used before split
  _split:           false,
  _killCount:       0,
  _invBullets:      [],      // active invader bullets [{x,y}]
  _invBulletTimer:  0,
  _invBulletInterval: 1.2,   // seconds between invader shots
  _score:           0,
  _gameState:       null,
  _done:            false,

  // ── Lifecycle: init ──────────────────────────────────────────────────────────
  init(gameState) {
    this._gameState = gameState;
    this._done      = false;
    this._split     = false;
    this._killCount = 0;
    this._invBullets      = [];
    this._invBulletTimer  = 0;
    this._score     = 0;

    // Build player at standard position
    const px = CANVAS_WIDTH / 2;
    const py = CANVAS_HEIGHT - 60;
    this._player = new Player(px, py);
    if (gameState.lives !== undefined) {
      this._player.lives = gameState.lives;
    }

    // Build formation
    this._invaders = buildFormation();

    // Single unified sub-formation moving right initially
    this._unified = new SubFormation(this._invaders, 1);
    this._subFormations = [];

    // Build bunkers
    this._bunkers = buildBunkers();

    initInput();
  },

  // ── Lifecycle: update ────────────────────────────────────────────────────────
  update(dt, gameState) {
    if (this._done) return;
    this._gameState = gameState;

    // Update player
    this._player.update(dt);
    // Sync lives to gameState
    gameState.lives = this._player.lives;

    // ── Formation movement ─────────────────────────────────────────────────
    if (!this._split) {
      this._unified.update(dt);
    } else {
      for (const sub of this._subFormations) {
        sub.update(dt);
      }
    }

    // Tick explosions
    for (const inv of this._invaders) {
      if (inv.explosion !== null) {
        inv.explosion.framesLeft -= 1;
        if (inv.explosion.framesLeft <= 0) inv.explosion = null;
      }
    }

    // ── Invader shooting ────────────────────────────────────────────────────
    this._invBulletTimer += dt;
    if (this._invBulletTimer >= this._invBulletInterval) {
      this._invBulletTimer -= this._invBulletInterval;
      this._spawnInvaderBullet();
    }

    // Move invader bullets
    for (let i = this._invBullets.length - 1; i >= 0; i--) {
      this._invBullets[i].y += INV_BULLET_SPEED * dt;
      if (this._invBullets[i].y > CANVAS_HEIGHT) {
        this._invBullets.splice(i, 1);
      }
    }

    // ── Collision detection ─────────────────────────────────────────────────
    this._runCollisions();

    // ── Bunker erosion by descending invaders ───────────────────────────────
    this._erodeByInvaders();

    // ── Split check ─────────────────────────────────────────────────────────
    if (!this._split && this._killCount >= 28) {
      this._doSplit();
    }

    // ── Win / lose conditions ───────────────────────────────────────────────
    const aliveInvaders = this._invaders.filter(i => i.alive);

    // Win: all invaders dead
    if (aliveInvaders.length === 0) {
      this._done = true;
      gameState.level = 'boss';
      return;
    }

    // Lose: invader reached player row
    const playerRowY = this._player.y;
    for (const inv of aliveInvaders) {
      if (inv.y + inv.height >= playerRowY) {
        this._done = true;
        if (typeof gameState.triggerGameOver === 'function') {
          gameState.triggerGameOver();
        } else {
          gameState.gameOver = true;
        }
        return;
      }
    }

    // Lose: player out of lives
    if (this._player.lives <= 0) {
      this._done = true;
      if (typeof gameState.triggerGameOver === 'function') {
        gameState.triggerGameOver();
      } else {
        gameState.gameOver = true;
      }
    }
  },

  // ── Lifecycle: render ────────────────────────────────────────────────────────
  render(ctx, gameState) {
    // Draw bunkers
    this._drawBunkers(ctx);

    // Draw invaders
    this._drawInvaders(ctx);

    // Draw invader bullets
    ctx.save();
    ctx.fillStyle = '#ff4444';
    for (const b of this._invBullets) {
      ctx.fillRect(b.x - BULLET_W / 2, b.y - BULLET_H, BULLET_W, BULLET_H);
    }
    ctx.restore();

    // Draw player
    if (this._player) this._player.draw(ctx);

    // HUD label
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.font         = '16px monospace';
    ctx.fillStyle    = '#aaffaa';
    ctx.fillText('LEVEL 3', CANVAS_WIDTH / 2, 44);
    if (this._split) {
      ctx.fillStyle = '#ffaa00';
      ctx.fillText('FORMATION SPLIT!', CANVAS_WIDTH / 2, 64);
    }
    ctx.restore();
  },

  // ── Private: spawn an invader bullet ────────────────────────────────────────
  _spawnInvaderBullet() {
    const alive = this._invaders.filter(i => i.alive);
    if (alive.length === 0) return;
    // Pick a random living invader as the shooter
    const shooter = alive[Math.floor(Math.random() * alive.length)];
    this._invBullets.push({
      x: shooter.x + shooter.width / 2,
      y: shooter.y + shooter.height,
    });
  },

  // ── Private: split the formation ────────────────────────────────────────────
  _doSplit() {
    this._split = true;

    // Left half: columns 0–5 (cols 1–6 in 1-based)
    const leftInvaders  = this._invaders.filter(i => i.col <= 5);
    // Right half: columns 6–10 (cols 7–11 in 1-based)
    const rightInvaders = this._invaders.filter(i => i.col >= 6);

    // Opposite initial directions
    const leftSub  = new SubFormation(leftInvaders,  -1); // sweeps left
    const rightSub = new SubFormation(rightInvaders,  1); // sweeps right

    this._subFormations = [leftSub, rightSub];
  },

  // ── Private: collision detection ────────────────────────────────────────────
  _runCollisions() {
    const player = this._player;
    const playerBullet = player ? player.bullet : null;

    // 1. Player bullet vs. invaders
    if (playerBullet) {
      const bRect = bulletRect(playerBullet);
      for (const inv of this._invaders) {
        if (!inv.alive) continue;
        if (aabb(bRect, inv)) {
          inv.alive = false;
          inv.explosion = { framesLeft: EXPLOSION_FRAMES };
          this._killCount += 1;
          this._score    += 1;
          // Remove bullet by nulling internal ref (Player exposes _bullet)
          player._bullet = null;
          break;
        }
      }
    }

    // 2. Player bullet vs. bunker cells
    if (player && player.bullet) {
      const bRect = bulletRect(player.bullet);
      outer:
      for (const bunker of this._bunkers) {
        for (let r = 0; r < BUNKER_GRID; r++) {
          for (let c = 0; c < BUNKER_GRID; c++) {
            if (!bunker.cells[r][c]) continue;
            const cellRect = {
              x:      bunker.x + c * BUNKER_CELL_SIZE,
              y:      bunker.y + r * BUNKER_CELL_SIZE,
              width:  BUNKER_CELL_SIZE,
              height: BUNKER_CELL_SIZE,
            };
            if (aabb(bRect, cellRect)) {
              bunker.cells[r][c] = false;
              player._bullet = null;
              break outer;
            }
          }
        }
      }
    }

    // 3. Invader bullets vs. player
    if (player) {
      const pRect = {
        x:      player.x - 24,
        y:      player.y - 16,
        width:  48,
        height: 32,
      };
      for (let i = this._invBullets.length - 1; i >= 0; i--) {
        const bRect = bulletRect(this._invBullets[i]);
        if (aabb(bRect, pRect)) {
          this._invBullets.splice(i, 1);
          player.lives -= 1;
          this._gameState.lives = player.lives;
        }
      }
    }

    // 4. Invader bullets vs. bunker cells
    for (let bi = this._invBullets.length - 1; bi >= 0; bi--) {
      const bRect = bulletRect(this._invBullets[bi]);
      let hit = false;
      outer2:
      for (const bunker of this._bunkers) {
        for (let r = 0; r < BUNKER_GRID; r++) {
          for (let c = 0; c < BUNKER_GRID; c++) {
            if (!bunker.cells[r][c]) continue;
            const cellRect = {
              x:      bunker.x + c * BUNKER_CELL_SIZE,
              y:      bunker.y + r * BUNKER_CELL_SIZE,
              width:  BUNKER_CELL_SIZE,
              height: BUNKER_CELL_SIZE,
            };
            if (aabb(bRect, cellRect)) {
              bunker.cells[r][c] = false;
              hit = true;
              break outer2;
            }
          }
        }
      }
      if (hit) {
        this._invBullets.splice(bi, 1);
      }
    }
  },

  // ── Private: erode bunkers by descending invaders ────────────────────────────
  _erodeByInvaders() {
    for (const inv of this._invaders) {
      if (!inv.alive) continue;
      const invRect = { x: inv.x, y: inv.y, width: inv.width, height: inv.height };
      for (const bunker of this._bunkers) {
        for (let r = 0; r < BUNKER_GRID; r++) {
          for (let c = 0; c < BUNKER_GRID; c++) {
            if (!bunker.cells[r][c]) continue;
            const cellRect = {
              x:      bunker.x + c * BUNKER_CELL_SIZE,
              y:      bunker.y + r * BUNKER_CELL_SIZE,
              width:  BUNKER_CELL_SIZE,
              height: BUNKER_CELL_SIZE,
            };
            if (aabb(invRect, cellRect)) {
              bunker.cells[r][c] = false;
              // Invader is NOT destroyed
            }
          }
        }
      }
    }
  },

  // ── Private: draw bunkers ────────────────────────────────────────────────────
  _drawBunkers(ctx) {
    ctx.save();
    ctx.fillStyle = '#00cc44';
    for (const bunker of this._bunkers) {
      for (let r = 0; r < BUNKER_GRID; r++) {
        for (let c = 0; c < BUNKER_GRID; c++) {
          if (!bunker.cells[r][c]) continue;
          ctx.fillRect(
            bunker.x + c * BUNKER_CELL_SIZE,
            bunker.y + r * BUNKER_CELL_SIZE,
            BUNKER_CELL_SIZE,
            BUNKER_CELL_SIZE
          );
        }
      }
    }
    ctx.restore();
  },

  // ── Private: draw invaders ───────────────────────────────────────────────────
  _drawInvaders(ctx) {
    const colours = ['#ff4444', '#ff8844', '#ffdd00', '#44ff44', '#44ccff'];
    ctx.save();
    for (const inv of this._invaders) {
      if (inv.alive) {
        ctx.fillStyle = colours[inv.row % colours.length];
        ctx.fillRect(inv.x, inv.y, inv.width, inv.height);
        // Simple eye detail
        ctx.fillStyle = '#000';
        ctx.fillRect(inv.x + 6,  inv.y + 6, 6, 6);
        ctx.fillRect(inv.x + 20, inv.y + 6, 6, 6);
      } else if (inv.explosion !== null) {
        const t      = inv.explosion.framesLeft / EXPLOSION_FRAMES;
        const spread = (1 - t) * 16;
        ctx.fillStyle = `rgba(255, 200, 0, ${t})`;
        ctx.fillRect(
          inv.x - spread, inv.y - spread,
          inv.width  + spread * 2,
          inv.height + spread * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${t * 0.8})`;
        ctx.fillRect(inv.x + 4, inv.y + 4, inv.width - 8, inv.height - 8);
      }
    }
    ctx.restore();
  },
};

export default level3;
