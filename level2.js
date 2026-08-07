// level2.js — Level 2: They Shoot Back
// ES module; no bundler, no npm, runs from file:// URL.
//
// Implements the second playable level of Space Invaders:
//   • 11-column × 5-row invader formation (same grid as Level 1)
//   • Movement at 0.67× the step intervals of Level 1 (faster)
//   • Global random-interval invader shooting (800–2000 ms)
//   • Lowest-alive-in-column rule for invader fire
//   • Invader bullet: downward at 300 px/s, disappears at canvas bottom
//   • Player hit: life lost, respawn at bottom-centre, 2 s invulnerability
//   • Game Over transition when lives reach 0
//   • Bonus UFO every 20 s, alternating sides, 120 px/s, fixed-tier scoring

import {
  INVADER_WIDTH,
  INVADER_HEIGHT,
  CELL_W,
  CELL_H,
  COLS,
  ROWS,
  TOTAL_INVADERS,
  ROW_TYPES,
  FORMATION_TOP,
  FORMATION_WIDTH,
} from './formation.js';
import { state } from './state.js';

// ---------------------------------------------------------------------------
// Level 1 step-interval constants (mirrored here to compute Level 2 values)
// ---------------------------------------------------------------------------
const L1_INTERVAL_MAX  = 800;  // ms at 55 invaders
const L1_INTERVAL_MIN  = 100;  // ms at  1 invader
const L1_INTERVAL_SPAN = L1_INTERVAL_MAX - L1_INTERVAL_MIN; // 700 ms
const COUNT_SPAN       = TOTAL_INVADERS - 1;                  // 54

// Level 2 speed multiplier applied to Level 1 intervals
const L2_SPEED_FACTOR  = 0.67;

/**
 * Compute Level 2 step interval (ms) for a given alive-invader count.
 * = Level1 interval × 0.67 (shorter interval = faster movement).
 * @param {number} aliveCount
 * @returns {number}
 */
function computeInterval(aliveCount) {
  const n = Math.max(1, Math.min(TOTAL_INVADERS, aliveCount));
  const l1Interval = L1_INTERVAL_MIN + (n - 1) * (L1_INTERVAL_SPAN / COUNT_SPAN);
  return l1Interval * L2_SPEED_FACTOR;
}

// ---------------------------------------------------------------------------
// Invader-shooting constants
// ---------------------------------------------------------------------------
const FIRE_INTERVAL_MIN = 800;   // ms
const FIRE_INTERVAL_MAX = 2000;  // ms
const INV_BULLET_SPEED  = 300;   // px/s downward
const INV_BULLET_W      = 4;     // px wide
const INV_BULLET_H      = 12;    // px tall
const INV_BULLET_COLOR  = '#f44'; // red invader bullets

// ---------------------------------------------------------------------------
// UFO constants
// ---------------------------------------------------------------------------
const UFO_INTERVAL    = 20000; // ms between UFO appearances
const UFO_SPEED       = 120;   // px/s horizontal
const UFO_WIDTH       = 48;    // px
const UFO_HEIGHT      = 20;    // px
const UFO_Y           = 48;    // px from top of canvas
const UFO_COLOR       = '#f0f'; // magenta
const UFO_SCORE_TIERS = [50, 100, 150, 300];

// ---------------------------------------------------------------------------
// Invader color
// ---------------------------------------------------------------------------
const INVADER_COLOR = '#6f6';

// ---------------------------------------------------------------------------
// Level2 class
// ---------------------------------------------------------------------------
export class Level2 {
  /**
   * @param {object} deps
   * @param {CanvasRenderingContext2D} deps.ctx
   * @param {object} deps.player  — player object; exposes .lives, .onHit(), .getBounds(), .isInvulnerable
   * @param {object} deps.hud     — HUD object (optional)
   * @param {object} deps.game    — game controller; must expose .gameOver()
   */
  constructor({ ctx, player, hud, game }) {
    this._ctx    = ctx;
    this._player = player;
    this._hud    = hud;
    this._game   = game;

    this._canvasWidth  = ctx.canvas.width;
    this._canvasHeight = ctx.canvas.height;

    // Breach threshold — same as Level 1
    this._breachY = this._canvasHeight - CELL_H;

    // Read lives from shared state (carried over from Level 1)
    this._player.lives = state.lives;

    // Initialise the formation
    this._reset();

    // Invader bullets — array of {x, y, removed}
    this._invaderBullets = [];

    // Fire timer — starts with a random interval
    this._fireTimer = this._randomFireInterval();

    // UFO state
    this._ufoTimer    = UFO_INTERVAL; // ms until next UFO appearance
    this._ufoActive   = false;
    this._ufoX        = 0;
    this._ufoY        = UFO_Y;
    this._ufoDirX     = 1;   // +1 = moving right (from left), -1 = moving left (from right)
    this._ufoFromLeft = true; // tracks which side the NEXT UFO enters from

    // Level-completion guard
    this._levelCompleted = false;
  }

  // -------------------------------------------------------------------------
  // Private: random fire interval between FIRE_INTERVAL_MIN and FIRE_INTERVAL_MAX
  // -------------------------------------------------------------------------
  _randomFireInterval() {
    return FIRE_INTERVAL_MIN + Math.random() * (FIRE_INTERVAL_MAX - FIRE_INTERVAL_MIN);
  }

  // -------------------------------------------------------------------------
  // Private: reset the formation to its initial state
  // -------------------------------------------------------------------------
  _reset() {
    this._originX = Math.round((this._canvasWidth - FORMATION_WIDTH) / 2);
    this._originY = FORMATION_TOP;
    this._dirX = 1;

    this._invaders = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        this._invaders.push({
          _col:   col,
          _row:   row,
          type:   ROW_TYPES[row],
          width:  INVADER_WIDTH,
          height: INVADER_HEIGHT,
          alive:  true,
        });
      }
    }

    // Attach getBounds via closure
    const self = this;
    for (const inv of this._invaders) {
      inv.getBounds = function () {
        return {
          x:      self._originX + inv._col * CELL_W,
          y:      self._originY + inv._row * CELL_H,
          width:  inv.width,
          height: inv.height,
        };
      };
    }

    this._stepAccumulator = 0;
    this._stepInterval    = computeInterval(TOTAL_INVADERS);
  }

  // -------------------------------------------------------------------------
  // Private: count alive invaders
  // -------------------------------------------------------------------------
  _aliveCount() {
    let n = 0;
    for (const inv of this._invaders) {
      if (inv.alive) n++;
    }
    return n;
  }

  // -------------------------------------------------------------------------
  // Private: perform one horizontal step of the formation
  // -------------------------------------------------------------------------
  _step() {
    let minCol = COLS;
    let maxCol = -1;
    for (const inv of this._invaders) {
      if (!inv.alive) continue;
      if (inv._col < minCol) minCol = inv._col;
      if (inv._col > maxCol) maxCol = inv._col;
    }
    if (minCol > maxCol) return;

    const leftEdge  = this._originX + minCol * CELL_W;
    const rightEdge = this._originX + maxCol * CELL_W + INVADER_WIDTH;

    if (this._dirX === 1) {
      if (rightEdge >= this._canvasWidth) {
        this._originX = this._canvasWidth - (maxCol * CELL_W + INVADER_WIDTH);
        this._originY += CELL_H;
        this._dirX = -1;
      } else {
        this._originX += CELL_W;
        const newRight = this._originX + maxCol * CELL_W + INVADER_WIDTH;
        if (newRight > this._canvasWidth) {
          this._originX = this._canvasWidth - (maxCol * CELL_W + INVADER_WIDTH);
          this._originY += CELL_H;
          this._dirX = -1;
        }
      }
    } else {
      if (leftEdge <= 0) {
        this._originX = -(minCol * CELL_W);
        this._originY += CELL_H;
        this._dirX = 1;
      } else {
        this._originX -= CELL_W;
        const newLeft = this._originX + minCol * CELL_W;
        if (newLeft < 0) {
          this._originX = -(minCol * CELL_W);
          this._originY += CELL_H;
          this._dirX = 1;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Private: fire one invader bullet from the lowest alive invader in a
  // randomly chosen column (skips columns with no alive invaders).
  // -------------------------------------------------------------------------
  _fireInvaderBullet() {
    // Build a list of columns that have at least one alive invader
    const aliveCols = [];
    for (let col = 0; col < COLS; col++) {
      const hasAlive = this._invaders.some(inv => inv.alive && inv._col === col);
      if (hasAlive) aliveCols.push(col);
    }
    if (aliveCols.length === 0) return; // no invaders left — nothing to fire

    // Pick a random column from those with alive invaders
    const col = aliveCols[Math.floor(Math.random() * aliveCols.length)];

    // Find the lowest alive invader in that column (highest _row index)
    let shooter = null;
    for (const inv of this._invaders) {
      if (!inv.alive || inv._col !== col) continue;
      if (shooter === null || inv._row > shooter._row) {
        shooter = inv;
      }
    }
    if (shooter === null) return;

    // Spawn bullet at the bottom-centre of the shooter
    const b = shooter.getBounds();
    this._invaderBullets.push({
      x:       b.x + b.width / 2 - INV_BULLET_W / 2,
      y:       b.y + b.height,
      removed: false,
      getBounds() {
        return {
          x:      this.x,
          y:      this.y,
          width:  INV_BULLET_W,
          height: INV_BULLET_H,
        };
      },
    });
  }

  // -------------------------------------------------------------------------
  // Private: update UFO logic
  // -------------------------------------------------------------------------
  _updateUFO(dtMs) {
    if (!this._ufoActive) {
      this._ufoTimer -= dtMs;
      if (this._ufoTimer <= 0) {
        // Spawn UFO
        this._ufoActive = true;
        if (this._ufoFromLeft) {
          // Enter from left edge, move right
          this._ufoX    = -UFO_WIDTH;
          this._ufoDirX = 1;
        } else {
          // Enter from right edge, move left
          this._ufoX    = this._canvasWidth;
          this._ufoDirX = -1;
        }
        // Alternate side for next appearance
        this._ufoFromLeft = !this._ufoFromLeft;
        // Reset timer for next UFO
        this._ufoTimer = UFO_INTERVAL;
      }
    } else {
      // Move UFO horizontally
      const dtSec = dtMs / 1000;
      this._ufoX += this._ufoDirX * UFO_SPEED * dtSec;

      // Check if UFO has exited the far edge
      if (this._ufoDirX === 1 && this._ufoX > this._canvasWidth) {
        this._ufoActive = false;
      } else if (this._ufoDirX === -1 && this._ufoX + UFO_WIDTH < 0) {
        this._ufoActive = false;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Private: check player-bullet vs UFO collision
  // Returns score if UFO was hit, 0 otherwise.
  // -------------------------------------------------------------------------
  _checkUFOCollision(playerBulletDescs) {
    if (!this._ufoActive) return 0;

    const ufoBounds = {
      x:      this._ufoX,
      y:      this._ufoY,
      width:  UFO_WIDTH,
      height: UFO_HEIGHT,
    };

    for (const bd of playerBulletDescs) {
      if (bd.removed) continue;
      const bb = bd.getBounds();
      // AABB overlap
      if (
        bb.x < ufoBounds.x + ufoBounds.width  &&
        bb.x + bb.width  > ufoBounds.x &&
        bb.y < ufoBounds.y + ufoBounds.height &&
        bb.y + bb.height > ufoBounds.y
      ) {
        // Hit!
        bd.removed = true;
        if (typeof bd.remove === 'function') bd.remove();
        this._ufoActive = false;
        // Award score based on sessionShotCount at moment of kill
        const tier = UFO_SCORE_TIERS[state.sessionShotCount % 4];
        return tier;
      }
    }
    return 0;
  }

  // -------------------------------------------------------------------------
  // Public: expose invader list for CollisionSystem
  // -------------------------------------------------------------------------
  getInvaders() {
    return this._invaders;
  }

  // -------------------------------------------------------------------------
  // Public: expose invader bullets for CollisionSystem
  // -------------------------------------------------------------------------
  getInvaderBullets() {
    return this._invaderBullets;
  }

  // -------------------------------------------------------------------------
  // Public: update — called every fixed-timestep tick (dt in seconds)
  //
  // Returns an object: { scoreGained: number, gameOver: boolean }
  // -------------------------------------------------------------------------
  update(dt, playerBulletDescs, addScore) {
    if (this._levelCompleted) return { scoreGained: 0, gameOver: false };

    const dtMs = dt * 1000;
    let scoreGained = 0;

    const alive = this._aliveCount();

    // ---- Level completion ------------------------------------------------
    if (alive === 0) {
      this._levelCompleted = true;
      // Level 2 is the final level in this build; no nextLevel call needed.
      // Could call game.nextLevel() if Level 3 were implemented.
      // For now, just mark complete (the caller can detect via isComplete()).
      return { scoreGained: 0, gameOver: false };
    }

    // ---- Step interval ---------------------------------------------------
    this._stepInterval = computeInterval(alive);

    // ---- Formation step --------------------------------------------------
    this._stepAccumulator += dtMs;
    if (this._stepAccumulator >= this._stepInterval) {
      this._stepAccumulator -= this._stepInterval;
      this._step();
    }

    // ---- Breach detection ------------------------------------------------
    for (const inv of this._invaders) {
      if (!inv.alive) continue;
      const b = inv.getBounds();
      if (b.y >= this._breachY) {
        // Player loses a life on breach
        if (this._player.lives > 0) {
          this._player.lives -= 1;
          state.lives = this._player.lives;
        }
        this._reset();
        this._invaderBullets = []; // clear bullets on reset
        if (this._player.lives <= 0) {
          return { scoreGained: 0, gameOver: true };
        }
        return { scoreGained: 0, gameOver: false };
      }
    }

    // ---- Invader bullet fire timer ---------------------------------------
    this._fireTimer -= dtMs;
    if (this._fireTimer <= 0) {
      this._fireInvaderBullet();
      this._fireTimer = this._randomFireInterval();
    }

    // ---- Move invader bullets -------------------------------------------
    for (const ib of this._invaderBullets) {
      if (ib.removed) continue;
      ib.y += INV_BULLET_SPEED * dt;
      // Disappear at canvas bottom
      if (ib.y > this._canvasHeight) {
        ib.removed = true;
      }
    }
    // Prune removed bullets
    this._invaderBullets = this._invaderBullets.filter(ib => !ib.removed);

    // ---- Invader bullet vs player collision ------------------------------
    if (!this._player.isInvulnerable) {
      const playerBounds = this._player.getBounds();
      for (const ib of this._invaderBullets) {
        if (ib.removed) continue;
        const ibb = ib.getBounds();
        if (
          ibb.x < playerBounds.x + playerBounds.width  &&
          ibb.x + ibb.width  > playerBounds.x &&
          ibb.y < playerBounds.y + playerBounds.height &&
          ibb.y + ibb.height > playerBounds.y
        ) {
          ib.removed = true;
          this._player.onHit();
          state.lives = this._player.lives;
          if (this._player.lives <= 0) {
            return { scoreGained: 0, gameOver: true };
          }
          break;
        }
      }
      // Prune again after hit check
      this._invaderBullets = this._invaderBullets.filter(ib => !ib.removed);
    }

    // ---- UFO update ------------------------------------------------------
    this._updateUFO(dtMs);

    // ---- UFO collision (player bullet vs UFO) ----------------------------
    if (playerBulletDescs && playerBulletDescs.length > 0) {
      scoreGained += this._checkUFOCollision(playerBulletDescs);
    }

    return { scoreGained, gameOver: false };
  }

  /**
   * Returns true when all invaders are defeated (level cleared).
   * @returns {boolean}
   */
  isComplete() {
    return this._levelCompleted;
  }

  // -------------------------------------------------------------------------
  // Public: draw — called once per animation frame
  // -------------------------------------------------------------------------
  draw() {
    const ctx = this._ctx;

    // ---- HUD: level number -----------------------------------------------
    if (this._hud) {
      if (typeof this._hud.setLevel === 'function') {
        this._hud.setLevel(2);
      } else if (typeof this._hud.drawLevel === 'function') {
        this._hud.drawLevel(ctx, 2);
      } else if (typeof this._hud.draw === 'function') {
        this._hud.draw(ctx, { level: 2 });
      } else {
        ctx.save();
        ctx.font      = '18px monospace';
        ctx.fillStyle = '#0f0';
        ctx.textAlign = 'center';
        ctx.fillText('Level 2', ctx.canvas.width / 2, 28);
        ctx.restore();
      }
    } else {
      ctx.save();
      ctx.font      = '18px monospace';
      ctx.fillStyle = '#0f0';
      ctx.textAlign = 'center';
      ctx.fillText('Level 2', ctx.canvas.width / 2, 28);
      ctx.restore();
    }

    // ---- Invader formation -----------------------------------------------
    ctx.save();
    ctx.fillStyle = INVADER_COLOR;
    for (const inv of this._invaders) {
      if (!inv.alive) continue;
      const b = inv.getBounds();
      ctx.fillRect(b.x, b.y, b.width, b.height);
    }
    ctx.restore();

    // ---- Invader bullets -------------------------------------------------
    ctx.save();
    ctx.fillStyle = INV_BULLET_COLOR;
    for (const ib of this._invaderBullets) {
      if (ib.removed) continue;
      ctx.fillRect(Math.round(ib.x), Math.round(ib.y), INV_BULLET_W, INV_BULLET_H);
    }
    ctx.restore();

    // ---- UFO -------------------------------------------------------------
    if (this._ufoActive) {
      ctx.save();
      ctx.fillStyle = UFO_COLOR;
      // Body — wide ellipse approximated by a rect with rounded corners
      const ux = Math.round(this._ufoX);
      const uy = this._ufoY;
      ctx.fillRect(ux, uy + 8, UFO_WIDTH, UFO_HEIGHT - 8);
      // Dome
      ctx.beginPath();
      ctx.ellipse(ux + UFO_WIDTH / 2, uy + 8, UFO_WIDTH / 3, 10, 0, Math.PI, 0);
      ctx.fill();
      // Score label on UFO
      const tier = UFO_SCORE_TIERS[state.sessionShotCount % 4];
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?' , ux + UFO_WIDTH / 2, uy + UFO_HEIGHT - 2);
      ctx.restore();
    }
  }
}
