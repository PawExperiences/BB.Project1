// boss.js — Level 4: Boss Fight
// ES module; no bundler, no npm, runs from file:// URL.
//
// Implements the final boss encounter:
//   • Boss rendered with Canvas 2D primitives at 160×80 px
//   • Health bar at top of canvas
//   • Horizontal movement at 90 px/s, reverses at edges
//   • Three-bullet spread (0°, ±20°) at 260 px/s
//   • Phase 1 (HP 10→6): fires every 1500 ms
//   • Phase 2 (HP 5→0): fires every 700 ms
//   • Sudden-death on player hit: reset to Level 1
//   • Win screen on boss death

import { CollisionSystem } from './collision.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { state } from './state.js';

// ---------------------------------------------------------------------------
// Named constants
// ---------------------------------------------------------------------------
const BOSS_WIDTH       = 160;   // px
const BOSS_HEIGHT      = 80;    // px
const BOSS_Y           = 120;   // fixed Y position (top edge)
const BOSS_SPEED       = 90;    // px/s horizontal drift
const BOSS_MAX_HP      = 10;
const PHASE2_THRESHOLD = 5;     // HP at which Phase 2 begins
const FIRE_INTERVAL_P1 = 1500;  // ms — Phase 1
const FIRE_INTERVAL_P2 = 700;   // ms — Phase 2
const BULLET_SPEED     = 260;   // px/s
const SPREAD_ANGLE_DEG = 20;    // degrees left/right of straight down

// Bullet dimensions for AABB
const BULLET_WIDTH_PX  = 6;     // px
const BULLET_HEIGHT_PX = 14;    // px

// Health bar
const HEALTH_BAR_HEIGHT = 12;   // px
const HEALTH_BAR_TOP    = 8;    // px from top of canvas
const HEALTH_BAR_MARGIN = 20;   // px from each side

// Visual
const BOSS_BODY_COLOR   = '#c00';
const BOSS_ACCENT_COLOR = '#f44';
const BOSS_EYE_COLOR    = '#ff0';
const BULLET_COLOR      = '#f0f';
const HEALTH_BAR_BG     = '#333';
const HEALTH_BAR_FG     = '#f00';
const HEALTH_BAR_FG_LOW = '#ff0';  // turns yellow in Phase 2

// Spread angles in radians
const SPREAD_RAD = SPREAD_ANGLE_DEG * Math.PI / 180;

// ---------------------------------------------------------------------------
// Boss class
// ---------------------------------------------------------------------------
export class Boss {
  /**
   * @param {object} deps
   * @param {CanvasRenderingContext2D} deps.ctx
   * @param {object} deps.player  — must expose getBounds(), onHit(), lives
   * @param {object} deps.hud     — HUD object (optional)
   * @param {object} deps.game    — game controller; must expose setLevel(n) and getScore()
   */
  constructor({ ctx, player, hud, game }) {
    this._ctx    = ctx;
    this._player = player;
    this._hud    = hud;
    this._game   = game;

    this._canvasWidth  = ctx.canvas.width;
    this._canvasHeight = ctx.canvas.height;

    // Boss position (top-left corner)
    this._bossX  = (this._canvasWidth - BOSS_WIDTH) / 2;
    this._bossY  = BOSS_Y;
    this._dirX   = 1;  // +1 = right, -1 = left

    // Health
    this._hp = BOSS_MAX_HP;

    // Firing
    this._fireAccum = 0;  // ms accumulated since last shot

    // Active boss bullets: [{x, y, vx, vy, removed}]
    this._bullets = [];

    // Win / lose state
    this._won    = false;
    this._done   = false;  // true once transition away from level is triggered

    // Final score captured at win
    this._finalScore = 0;

    // Restart button hit area (populated in drawWinScreen)
    this._restartBtn = { x: 0, y: 0, width: 0, height: 0 };

    // Click listener for win screen
    this._clickHandler = null;
  }

  // -------------------------------------------------------------------------
  // Public: expose boss bullet list for collision wiring
  // -------------------------------------------------------------------------
  getBullets() {
    return this._bullets;
  }

  // -------------------------------------------------------------------------
  // Public: expose boss AABB for player-bullet hit detection
  // -------------------------------------------------------------------------
  getBounds() {
    return {
      x:      this._bossX,
      y:      this._bossY,
      width:  BOSS_WIDTH,
      height: BOSS_HEIGHT,
    };
  }

  // -------------------------------------------------------------------------
  // Private: AABB overlap helper
  // -------------------------------------------------------------------------
  _aabb(a, b) {
    return (
      a.x < b.x + b.width  &&
      a.x + a.width  > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // -------------------------------------------------------------------------
  // Private: fire a three-bullet spread from boss centre
  // -------------------------------------------------------------------------
  _fire() {
    const cx = this._bossX + BOSS_WIDTH / 2;   // horizontal centre
    const cy = this._bossY + BOSS_HEIGHT;       // bottom edge of boss

    // Three angles: straight down, 20° left of down, 20° right of down
    // "Down" in canvas coords is +Y, angle measured from +Y axis.
    // straight down: vx=0, vy=BULLET_SPEED
    // left  of down: angle = -SPREAD_RAD from +Y  → vx = -sin(SPREAD_RAD)*SPEED, vy = cos(SPREAD_RAD)*SPEED
    // right of down: angle = +SPREAD_RAD from +Y  → vx = +sin(SPREAD_RAD)*SPEED, vy = cos(SPREAD_RAD)*SPEED
    const angles = [
      0,
      -SPREAD_RAD,
      +SPREAD_RAD,
    ];

    for (const ang of angles) {
      const vx = Math.sin(ang) * BULLET_SPEED;
      const vy = Math.cos(ang) * BULLET_SPEED;
      this._bullets.push({
        x:       cx - BULLET_WIDTH_PX / 2,
        y:       cy,
        vx,
        vy,
        removed: false,
        getBounds() {
          return {
            x:      this.x,
            y:      this.y,
            width:  BULLET_WIDTH_PX,
            height: BULLET_HEIGHT_PX,
          };
        },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Public: update — called every fixed-timestep tick (dt in seconds)
  // -------------------------------------------------------------------------
  update(dt) {
    if (this._won || this._done) return;

    const dtMs = dt * 1000;

    // ---- Boss horizontal movement ----------------------------------------
    this._bossX += this._dirX * BOSS_SPEED * dt;

    // Clamp and reverse
    if (this._dirX === 1 && this._bossX + BOSS_WIDTH >= this._canvasWidth) {
      this._bossX = this._canvasWidth - BOSS_WIDTH;
      this._dirX = -1;
    } else if (this._dirX === -1 && this._bossX <= 0) {
      this._bossX = 0;
      this._dirX = 1;
    }

    // ---- Firing phase determination --------------------------------------
    // Phase 1: HP 10 down to 6 (> PHASE2_THRESHOLD)
    // Phase 2: HP 5 down to 0 (<= PHASE2_THRESHOLD)
    const fireInterval = this._hp > PHASE2_THRESHOLD
      ? FIRE_INTERVAL_P1
      : FIRE_INTERVAL_P2;

    this._fireAccum += dtMs;
    if (this._fireAccum >= fireInterval) {
      this._fireAccum -= fireInterval;
      this._fire();
    }

    // ---- Move boss bullets -----------------------------------------------
    for (const b of this._bullets) {
      if (b.removed) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      // Remove bullets that leave the canvas
      if (b.y > this._canvasHeight + 20 ||
          b.x < -20 ||
          b.x > this._canvasWidth + 20) {
        b.removed = true;
      }
    }
    // Prune fully-removed bullets to avoid unbounded growth
    this._bullets = this._bullets.filter(b => !b.removed);

    // ---- Boss bullet vs player collision (sudden death) ------------------
    // We use collision.js's aabbOverlap logic by calling CollisionSystem
    // indirectly: build a minimal descriptor and let the imported module handle it.
    // Actually: per acceptance criteria we must USE collision.js.
    // We wire it here directly via a temporary CollisionSystem pass.
    this._checkBossBulletsVsPlayer();

    // ---- Player bullet vs boss hit detection -----------------------------
    this._checkPlayerBulletVsBoss();
  }

  // -------------------------------------------------------------------------
  // Private: use CollisionSystem to check boss bullets vs player
  // -------------------------------------------------------------------------
  _checkBossBulletsVsPlayer() {
    if (this._bullets.length === 0) return;

    const player = this._player;
    if (!player) return;

    // Build a temporary CollisionSystem and run only Pass 2
    // (invaderBullets vs player).
    // We pass our boss bullets as the "invaderBullets" array.
    // playerBullets and invaders are empty to skip Pass 1.
    const cs = new CollisionSystem();

    // Intercept player.onHit to implement sudden-death
    const originalOnHit = player.onHit ? player.onHit.bind(player) : null;
    let wasHit = false;

    // Temporarily override to detect hit
    player.onHit = () => {
      wasHit = true;
    };

    cs.update([], [], this._bullets, player);

    // Restore original onHit
    if (originalOnHit) {
      player.onHit = originalOnHit;
    } else {
      delete player.onHit;
    }

    if (wasHit) {
      // Sudden death: reset game to Level 1 with score reset
      this._done = true;
      state.sessionShotCount = 0;
      state.lives = 3;
      // Reset player lives
      player.lives = 3;
      if (typeof this._game.resetToLevel1 === 'function') {
        this._game.resetToLevel1();
      } else if (typeof this._game.setLevel === 'function') {
        this._game.setLevel(1);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Private: check player bullet vs boss (damage)
  // -------------------------------------------------------------------------
  _checkPlayerBulletVsBoss() {
    const player = this._player;
    if (!player) return;

    const bullet = player.bullet;
    if (!bullet) return;

    // Bullet bounds
    const bBounds = {
      x:      bullet.x - 2,  // 4px wide bullet centred on x
      y:      bullet.y,
      width:  4,
      height: 10,
    };

    const bossBounds = this.getBounds();

    if (this._aabb(bBounds, bossBounds)) {
      // Hit!
      player.clearBullet();
      this._hp -= 1;

      if (this._hp <= 0) {
        this._hp = 0;
        this._triggerWin();
      }
    }
  }

  // -------------------------------------------------------------------------
  // Private: trigger win state
  // -------------------------------------------------------------------------
  _triggerWin() {
    this._won = true;
    // Capture final score from game
    if (typeof this._game.getScore === 'function') {
      this._finalScore = this._game.getScore();
    } else {
      this._finalScore = 0;
    }
    // Register click handler for restart
    this._clickHandler = (e) => this._onCanvasClick(e);
    const canvas = this._ctx.canvas;
    canvas.addEventListener('click', this._clickHandler);
  }

  // -------------------------------------------------------------------------
  // Private: handle canvas click on win screen
  // -------------------------------------------------------------------------
  _onCanvasClick(e) {
    const canvas = this._ctx.canvas;
    const rect   = canvas.getBoundingClientRect();
    // Scale click coordinates to canvas space
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top)  * scaleY;

    const btn = this._restartBtn;
    if (cx >= btn.x && cx <= btn.x + btn.width &&
        cy >= btn.y && cy <= btn.y + btn.height) {
      // Clean up listener
      canvas.removeEventListener('click', this._clickHandler);
      this._clickHandler = null;
      // Reset to Level 1
      this._done = true;
      state.sessionShotCount = 0;
      state.lives = 3;
      if (this._player) this._player.lives = 3;
      if (typeof this._game.resetToLevel1 === 'function') {
        this._game.resetToLevel1();
      } else if (typeof this._game.setLevel === 'function') {
        this._game.setLevel(1);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Public: draw — called once per animation frame
  // -------------------------------------------------------------------------
  draw() {
    if (this._won) {
      this._drawWinScreen();
      return;
    }

    const ctx = this._ctx;

    // ---- HUD: level number -----------------------------------------------
    ctx.save();
    ctx.font      = '18px monospace';
    ctx.fillStyle = '#0f0';
    ctx.textAlign = 'center';
    ctx.fillText('Level 4 — BOSS', this._canvasWidth / 2, 28);
    ctx.restore();

    // ---- Health bar ------------------------------------------------------
    this._drawHealthBar();

    // ---- Boss sprite (Canvas 2D primitives only) -------------------------
    this._drawBoss();

    // ---- Boss bullets ----------------------------------------------------
    this._drawBullets();
  }

  // -------------------------------------------------------------------------
  // Private: draw health bar
  // -------------------------------------------------------------------------
  _drawHealthBar() {
    const ctx    = this._ctx;
    const barW   = this._canvasWidth - HEALTH_BAR_MARGIN * 2;
    const barX   = HEALTH_BAR_MARGIN;
    const barY   = HEALTH_BAR_TOP;
    const fillW  = Math.round(barW * (this._hp / BOSS_MAX_HP));
    const isLow  = this._hp <= PHASE2_THRESHOLD;

    ctx.save();

    // Background
    ctx.fillStyle = HEALTH_BAR_BG;
    ctx.fillRect(barX, barY, barW, HEALTH_BAR_HEIGHT);

    // Foreground (filled portion)
    ctx.fillStyle = isLow ? HEALTH_BAR_FG_LOW : HEALTH_BAR_FG;
    ctx.fillRect(barX, barY, fillW, HEALTH_BAR_HEIGHT);

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1;
    ctx.strokeRect(barX, barY, barW, HEALTH_BAR_HEIGHT);

    // Label
    ctx.font      = '10px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`BOSS HP: ${this._hp} / ${BOSS_MAX_HP}`,
      this._canvasWidth / 2,
      barY + HEALTH_BAR_HEIGHT - 2
    );

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Private: draw boss using Canvas 2D primitives (no images)
  // 160×80 px bounding box
  // -------------------------------------------------------------------------
  _drawBoss() {
    const ctx = this._ctx;
    const bx  = Math.round(this._bossX);
    const by  = Math.round(this._bossY);
    const bw  = BOSS_WIDTH;   // 160
    const bh  = BOSS_HEIGHT;  // 80

    ctx.save();

    // --- Main body (central rectangle) ---
    ctx.fillStyle = BOSS_BODY_COLOR;
    ctx.fillRect(bx + 20, by + 10, bw - 40, bh - 20);

    // --- Side wings ---
    ctx.fillStyle = BOSS_BODY_COLOR;
    // Left wing
    ctx.fillRect(bx, by + 30, 24, 30);
    // Right wing
    ctx.fillRect(bx + bw - 24, by + 30, 24, 30);

    // --- Wing tips (darker accent) ---
    ctx.fillStyle = BOSS_ACCENT_COLOR;
    ctx.fillRect(bx, by + 30, 10, 30);
    ctx.fillRect(bx + bw - 10, by + 30, 10, 30);

    // --- Top dome ---
    ctx.fillStyle = BOSS_ACCENT_COLOR;
    ctx.beginPath();
    ctx.arc(bx + bw / 2, by + 14, 22, Math.PI, 0);
    ctx.fill();

    // --- Eyes (two yellow rectangles) ---
    ctx.fillStyle = BOSS_EYE_COLOR;
    ctx.fillRect(bx + 48, by + 22, 14, 10);
    ctx.fillRect(bx + 98, by + 22, 14, 10);

    // --- Cannon nubs (bottom centre) ---
    ctx.fillStyle = '#800';
    ctx.fillRect(bx + bw / 2 - 5, by + bh - 10, 10, 12);
    // Side cannons
    ctx.fillRect(bx + 30, by + bh - 6, 6, 8);
    ctx.fillRect(bx + bw - 36, by + bh - 6, 6, 8);

    // --- Outline for clarity ---
    ctx.strokeStyle = '#f88';
    ctx.lineWidth   = 2;
    ctx.strokeRect(bx + 20, by + 10, bw - 40, bh - 20);

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Private: draw boss bullets
  // -------------------------------------------------------------------------
  _drawBullets() {
    const ctx = this._ctx;
    ctx.save();
    ctx.fillStyle = BULLET_COLOR;
    for (const b of this._bullets) {
      if (b.removed) continue;
      ctx.fillRect(
        Math.round(b.x),
        Math.round(b.y),
        BULLET_WIDTH_PX,
        BULLET_HEIGHT_PX
      );
    }
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Private: draw win screen
  // -------------------------------------------------------------------------
  _drawWinScreen() {
    const ctx = this._ctx;
    const cw  = this._canvasWidth;
    const ch  = this._canvasHeight;
    const cx  = cw / 2;

    ctx.save();

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, cw, ch);

    // Title
    ctx.font      = 'bold 56px monospace';
    ctx.fillStyle = '#ff0';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', cx, ch / 2 - 100);

    // Score
    ctx.font      = '32px monospace';
    ctx.fillStyle = '#0f0';
    ctx.fillText(`Final Score: ${this._finalScore}`, cx, ch / 2 - 30);

    // Phase indicator (flavour)
    ctx.font      = '20px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Boss Defeated!', cx, ch / 2 + 20);

    // Restart button
    const btnW  = 220;
    const btnH  = 56;
    const btnX  = Math.round(cx - btnW / 2);
    const btnY  = Math.round(ch / 2 + 70);

    // Store for click detection
    this._restartBtn = { x: btnX, y: btnY, width: btnW, height: btnH };

    ctx.fillStyle = '#0a0';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth   = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.font      = '24px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('[ RESTART ]', cx, btnY + 36);

    // Sub-hint
    ctx.font      = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Click RESTART to play again from Level 1', cx, btnY + btnH + 28);

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Public: returns true when this level is fully done (transition fired)
  // -------------------------------------------------------------------------
  isDone() {
    return this._done;
  }
}
