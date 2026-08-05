// boss.js — Boss Level: Multi-Phase Finale
//
// Exports:
//   initBoss(opts)              — initialise boss state and wire callbacks.
//   updateBoss(dt)              — advance boss state by dt seconds.
//   drawBoss(ctx)               — render boss, health bar, and projectiles.
//   resetBoss()                 — reset all boss state (called on full game reset).
//   checkPlayerBulletVsBoss(b)  — test player bullet rect against boss AABB.
//   isBossDefeated()            — returns true when boss HP reached 0.
//   drawWinScreen(ctx, score)   — render the win-screen overlay.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { checkCollision } from './collision.js';

// ---------------------------------------------------------------------------
// Boss dimensions — substantially larger than invaders (24×16 px)
// ---------------------------------------------------------------------------
const BOSS_WIDTH  = 120;  // px
const BOSS_HEIGHT = 80;   // px
const BOSS_X      = (CANVAS_WIDTH - BOSS_WIDTH) / 2;  // 324 px — centred, stationary
const BOSS_Y      = 60;   // near the top

// ---------------------------------------------------------------------------
// Boss projectile dimensions
// ---------------------------------------------------------------------------
const PROJ_WIDTH  = 8;
const PROJ_HEIGHT = 20;
const PROJ_SPEED  = 280;  // px per second, downward

// ---------------------------------------------------------------------------
// Player ship dimensions (mirrors player.js — used for collision only)
// ---------------------------------------------------------------------------
const SHIP_WIDTH  = 40;
const SHIP_HEIGHT = 32;

// Player bullet dimensions (mirrors player.js)
const BULLET_WIDTH  = 4;
const BULLET_HEIGHT = 12;

// ---------------------------------------------------------------------------
// Phase thresholds and firing intervals
// ---------------------------------------------------------------------------
const MAX_HP               = 10;
const PHASE2_HP_THRESHOLD  = 5;    // Phase 2 activates when HP drops to this value
const PHASE1_FIRE_INTERVAL = 2.0;  // seconds between shots in Phase 1
const PHASE2_FIRE_INTERVAL = 1.0;  // seconds between shots in Phase 2

// ---------------------------------------------------------------------------
// Boss module state (reset by resetBoss / initBoss)
// ---------------------------------------------------------------------------
let bossHP       = MAX_HP;
let bossPhase    = 1;       // 1 or 2
let fireTimer    = 0;       // seconds accumulated since last shot
let projectiles  = [];      // array of { x, y } top-left of each projectile
let bossDefeated = false;
let bossActive   = false;

// Callbacks wired by initBoss()
let _onPlayerHit    = null;  // () => void — instant-death handler
let _onBossDefeated = null;  // () => void — victory handler
let _getPlayer      = null;  // () => Player — returns the live player instance

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * initBoss — set up the boss fight and wire callbacks from game.js.
 *
 * @param {object}   opts
 * @param {Function} opts.onPlayerHit    — called when a boss projectile hits the player (instant death).
 * @param {Function} opts.onBossDefeated — called when boss HP reaches 0 (show win screen).
 * @param {Function} opts.getPlayer      — returns the live Player instance.
 */
export function initBoss(opts) {
  _onPlayerHit    = opts.onPlayerHit;
  _onBossDefeated = opts.onBossDefeated;
  _getPlayer      = opts.getPlayer;
  resetBoss();
  bossActive = true;
}

/**
 * resetBoss — reset all boss state to initial values.
 * Called by initBoss() and on full game reset.
 */
export function resetBoss() {
  bossHP       = MAX_HP;
  bossPhase    = 1;
  fireTimer    = 0;
  projectiles  = [];
  bossDefeated = false;
  bossActive   = false;
}

/**
 * isBossDefeated — returns true after boss HP reached 0.
 * @returns {boolean}
 */
export function isBossDefeated() {
  return bossDefeated;
}

/**
 * checkPlayerBulletVsBoss — AABB test of the player bullet against the boss.
 * If it hits, deals 1 damage and returns true so the caller can null the bullet.
 *
 * @param {{ x: number, y: number } | null} bullet — player bullet (top-left), or null.
 * @returns {boolean} true if the bullet hit the boss.
 */
export function checkPlayerBulletVsBoss(bullet) {
  if (!bossActive || bossDefeated || !bullet) return false;

  const bulletRect = {
    x: bullet.x, y: bullet.y,
    width: BULLET_WIDTH, height: BULLET_HEIGHT,
  };
  const bossRect = {
    x: BOSS_X, y: BOSS_Y,
    width: BOSS_WIDTH, height: BOSS_HEIGHT,
  };

  if (checkCollision(bulletRect, bossRect)) {
    _applyDamage();
    return true;
  }
  return false;
}

/**
 * updateBoss — advance boss state by dt seconds.
 * Call once per fixed tick from game.js when the boss level is active.
 *
 * @param {number} dt — fixed timestep in seconds (1/60).
 */
export function updateBoss(dt) {
  if (!bossActive) return;

  // -----------------------------------------------------------------------
  // 1. Fire timer — spawn a projectile at the appropriate interval.
  // -----------------------------------------------------------------------
  fireTimer += dt;
  const interval = bossPhase === 1 ? PHASE1_FIRE_INTERVAL : PHASE2_FIRE_INTERVAL;

  if (fireTimer >= interval) {
    fireTimer -= interval;
    // Spawn at the bottom-centre of the boss (the cannon nozzle).
    projectiles.push({
      x: BOSS_X + (BOSS_WIDTH - PROJ_WIDTH) / 2,
      y: BOSS_Y + BOSS_HEIGHT,
    });
  }

  // -----------------------------------------------------------------------
  // 2. Move projectiles downward and check collision with the player.
  // -----------------------------------------------------------------------
  const player = _getPlayer ? _getPlayer() : null;

  for (let i = projectiles.length - 1; i >= 0; i--) {
    projectiles[i].y += PROJ_SPEED * dt;

    // Remove if off-screen.
    if (projectiles[i].y > CANVAS_HEIGHT) {
      projectiles.splice(i, 1);
      continue;
    }

    // Collision with player ship — instant death.
    if (player !== null) {
      const projRect = {
        x: projectiles[i].x, y: projectiles[i].y,
        width: PROJ_WIDTH, height: PROJ_HEIGHT,
      };
      const playerRect = {
        x: player.x, y: player.y,
        width: SHIP_WIDTH, height: SHIP_HEIGHT,
      };
      if (checkCollision(projRect, playerRect)) {
        projectiles.splice(i, 1);
        if (_onPlayerHit) _onPlayerHit();
        // Game is resetting — stop processing.
        return;
      }
    }
  }
}

/**
 * drawBoss — render the boss body, health bar, phase indicator, and projectiles.
 * Uses only canvas 2D API primitives (no image assets).
 *
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawBoss(ctx) {
  if (!bossActive && !bossDefeated) return;
  // After defeat the boss is hidden (win screen takes over); only draw while active.
  if (!bossActive) return;

  const phase2 = bossPhase === 2;

  // Colour scheme: Phase 1 = cyan/teal; Phase 2 = orange/red (visual phase cue).
  const primaryColour = phase2 ? '#ff4400' : '#00ccff';
  const accentColour  = phase2 ? '#ff9900' : '#0088aa';
  const cockpitColour = phase2 ? '#ffcc00' : '#aaffff';
  const glowColour    = phase2 ? 'rgba(255, 80, 0, 0.30)' : 'rgba(0, 200, 255, 0.18)';

  ctx.save();

  // --- Glow halo (semi-transparent larger rect behind the boss) ---
  ctx.fillStyle = glowColour;
  ctx.fillRect(BOSS_X - 14, BOSS_Y - 14, BOSS_WIDTH + 28, BOSS_HEIGHT + 28);

  // --- Left wing ---
  ctx.fillStyle = accentColour;
  ctx.fillRect(BOSS_X, BOSS_Y + 36, 22, 32);
  ctx.fillStyle = primaryColour;
  ctx.fillRect(BOSS_X, BOSS_Y + 36, 8, 32);

  // --- Right wing ---
  ctx.fillStyle = accentColour;
  ctx.fillRect(BOSS_X + BOSS_WIDTH - 22, BOSS_Y + 36, 22, 32);
  ctx.fillStyle = primaryColour;
  ctx.fillRect(BOSS_X + BOSS_WIDTH - 8, BOSS_Y + 36, 8, 32);

  // --- Main hull body ---
  ctx.fillStyle = primaryColour;
  ctx.fillRect(BOSS_X + 10, BOSS_Y + 22, BOSS_WIDTH - 20, BOSS_HEIGHT - 22);

  // --- Top dome / cockpit (half-circle) ---
  ctx.beginPath();
  ctx.arc(
    BOSS_X + BOSS_WIDTH / 2,  // centre x
    BOSS_Y + 28,               // centre y
    30,                        // radius
    Math.PI, 0,                // left → right (upper half)
    false
  );
  ctx.fillStyle = cockpitColour;
  ctx.fill();

  // --- Inner dome detail ---
  ctx.beginPath();
  ctx.arc(
    BOSS_X + BOSS_WIDTH / 2,
    BOSS_Y + 28,
    16,
    Math.PI, 0,
    false
  );
  ctx.fillStyle = accentColour;
  ctx.fill();

  // --- Bottom cannon nozzle ---
  ctx.fillStyle = phase2 ? '#ffff00' : '#00ffcc';
  ctx.fillRect(BOSS_X + BOSS_WIDTH / 2 - 6, BOSS_Y + BOSS_HEIGHT - 8, 12, 14);

  // --- Phase 2 extra: bright eye in dome centre ---
  if (phase2) {
    ctx.beginPath();
    ctx.arc(
      BOSS_X + BOSS_WIDTH / 2,
      BOSS_Y + 28,
      8,
      0, Math.PI * 2
    );
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      BOSS_X + BOSS_WIDTH / 2,
      BOSS_Y + 28,
      4,
      0, Math.PI * 2
    );
    ctx.fillStyle = '#ff0000';
    ctx.fill();
  }

  // -----------------------------------------------------------------------
  // Health bar
  // -----------------------------------------------------------------------
  const BAR_W = 200;
  const BAR_H = 16;
  const BAR_X = (CANVAS_WIDTH - BAR_W) / 2;
  const BAR_Y = BOSS_Y + BOSS_HEIGHT + 14;

  // Empty bar background.
  ctx.fillStyle = '#333333';
  ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);

  // Filled portion.
  const fillRatio  = Math.max(0, bossHP / MAX_HP);
  ctx.fillStyle    = phase2 ? '#ff4400' : '#00cc44';
  ctx.fillRect(BAR_X, BAR_Y, BAR_W * fillRatio, BAR_H);

  // Border.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(BAR_X, BAR_Y, BAR_W, BAR_H);

  // HP label.
  ctx.fillStyle = '#ffffff';
  ctx.font      = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`BOSS  HP: ${bossHP} / ${MAX_HP}`, CANVAS_WIDTH / 2, BAR_Y + BAR_H + 14);

  // Phase 2 indicator.
  if (phase2) {
    ctx.fillStyle = '#ff9900';
    ctx.font      = 'bold 13px monospace';
    ctx.fillText('\u26A1 PHASE 2 \u26A1', CANVAS_WIDTH / 2, BAR_Y + BAR_H + 32);
  }

  ctx.restore();

  // -----------------------------------------------------------------------
  // Boss projectiles
  // -----------------------------------------------------------------------
  ctx.save();
  ctx.fillStyle = phase2 ? '#ff6600' : '#ff0055';
  for (const proj of projectiles) {
    ctx.fillRect(proj.x, proj.y, PROJ_WIDTH, PROJ_HEIGHT);
  }
  ctx.restore();
}

/**
 * drawWinScreen — render the Win Screen overlay.
 * Called from game.js when the boss has been defeated.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} finalScore — score at the moment of victory.
 */
export function drawWinScreen(ctx, finalScore) {
  ctx.save();

  // Dark overlay.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.84)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title.
  ctx.fillStyle  = '#ffd700';
  ctx.font       = 'bold 56px monospace';
  ctx.textAlign  = 'center';
  ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 90);

  // Congratulatory message.
  ctx.fillStyle = '#ffffff';
  ctx.font      = '24px monospace';
  ctx.fillText('The boss has been defeated!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 34);

  // Final score.
  ctx.fillStyle = '#00ffcc';
  ctx.font      = 'bold 32px monospace';
  ctx.fillText(`Final Score: ${finalScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 26);

  // Restart prompt.
  ctx.fillStyle = '#aaaaaa';
  ctx.font      = '18px monospace';
  ctx.fillText('Press any key to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 96);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Private helper
// ---------------------------------------------------------------------------

/**
 * _applyDamage — reduce boss HP by 1, handle phase transition and defeat.
 */
function _applyDamage() {
  if (!bossActive || bossDefeated) return;

  bossHP -= 1;

  // Phase transition: activate Phase 2 exactly when HP drops to the threshold.
  if (bossHP <= PHASE2_HP_THRESHOLD && bossPhase === 1) {
    bossPhase = 2;
    fireTimer = 0;  // Start fresh on the faster interval.
  }

  // Defeat check.
  if (bossHP <= 0) {
    bossHP       = 0;
    bossDefeated = true;
    bossActive   = false;
    projectiles  = [];
    if (_onBossDefeated) _onBossDefeated();
  }
}
