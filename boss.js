// boss.js — Boss fight: multi-phase finale for Space Invaders
// ES module. No external assets; drawn entirely with canvas 2D primitives.
// Integrated with game.js scene state machine via hudState and transitionTo.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { isKeyHeld }                   from './input.js';
import { hudState, transitionTo }      from './game.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BOSS_W        = 80;   // boss width in px
const BOSS_H        = 56;   // boss height in px
const BOSS_START_HP = 10;
const PHASE2_HP     = 5;    // HP at which Phase 2 begins (inclusive)

const BOSS_SPEED    = 100;  // px/s horizontal movement
const FIRE_INTERVAL_P1 = 2.0;  // seconds between shots in Phase 1
const FIRE_INTERVAL_P2 = 1.0;  // seconds between shots in Phase 2

const BOSS_Y        = 60;   // top edge of boss (below HUD)

// Projectile dimensions and speed
const PROJ_W     = 6;
const PROJ_H     = 18;
const PROJ_SPEED = 320;  // px/s downward

// Health bar layout
const BAR_W      = 200;
const BAR_H      = 16;
const BAR_X      = (CANVAS_WIDTH - BAR_W) / 2;
const BAR_Y      = 10;   // top of canvas

// Player dimensions (must match player.js)
const PLAYER_W = 40;
const PLAYER_H = 32;

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/** @type {{ x:number, y:number, vx:number, hp:number }} */
let boss = null;

/**
 * A single boss projectile (at most one in flight at a time).
 * @type {{ x:number, y:number }|null}
 */
let projectile = null;

/** Seconds accumulated since last boss shot. */
let shotTimer = 0;

/** True once the boss has been defeated and the win screen is showing. */
let won = false;

/** True once the level is fully over (won or returning to title). */
let levelDone = false;

// We need a reference to the player for aiming and collision.
// game.js will call initBoss(player) each time the boss scene starts.
/** @type {import('./player.js').Player|null} */
let _player = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise the boss level.
 * Called by game.js when entering the 'boss' scene.
 * @param {import('./player.js').Player} player
 */
export function initBoss(player) {
  _player = player;

  boss = {
    x:  (CANVAS_WIDTH - BOSS_W) / 2,  // horizontally centred
    y:  BOSS_Y,
    vx: BOSS_SPEED,                    // start moving right
    hp: BOSS_START_HP,
  };

  projectile = null;
  shotTimer  = FIRE_INTERVAL_P1 * 0.5; // first shot arrives ~halfway through P1 interval
  won        = false;
  levelDone  = false;

  hudState.level = 4; // boss is the 4th level
}

/**
 * Update the boss level for one fixed-timestep tick.
 * @param {number} dt  Delta time in seconds.
 */
export function updateBoss(dt) {
  if (levelDone) return;

  if (won) {
    // Win screen is visible; wait for Enter to restart
    if (_enterJustPressed()) {
      levelDone = true;
      transitionTo('playing');
    }
    return;
  }

  // --- Boss horizontal movement ---
  boss.x += boss.vx * dt;

  // Bounce off canvas edges (left and right)
  if (boss.vx > 0 && boss.x + BOSS_W >= CANVAS_WIDTH) {
    boss.x = CANVAS_WIDTH - BOSS_W;
    boss.vx = -BOSS_SPEED;
  } else if (boss.vx < 0 && boss.x <= 0) {
    boss.x = 0;
    boss.vx = BOSS_SPEED;
  }

  // --- Boss shooting ---
  const fireInterval = boss.hp >= PHASE2_HP + 1 ? FIRE_INTERVAL_P1 : FIRE_INTERVAL_P2;
  // Phase 1: hp 10–6 (>= 6), Phase 2: hp 5–1 (<= 5)
  // FIRE_INTERVAL_P1 when hp >= 6, FIRE_INTERVAL_P2 when hp <= 5
  shotTimer += dt;
  if (shotTimer >= fireInterval) {
    shotTimer -= fireInterval;
    // Only fire if no projectile already in flight
    if (projectile === null) {
      _fireProjectile();
    }
  }

  // --- Projectile movement ---
  if (projectile !== null) {
    projectile.y += PROJ_SPEED * dt;

    // Remove projectile if it exits the canvas bottom
    if (projectile.y > CANVAS_HEIGHT) {
      projectile = null;
    } else {
      // Collision: boss projectile vs player
      const px = _player.x;
      const py = _player.y;
      const overlap =
        projectile.x < px + PLAYER_W &&
        projectile.x + PROJ_W > px &&
        projectile.y < py + PLAYER_H &&
        projectile.y + PROJ_H > py;

      if (overlap) {
        // Sudden death — restart from Level 1 with score reset
        projectile = null;
        levelDone  = true;
        hudState.score = 0;
        hudState.lives = 0;  // signal game-over state
        transitionTo('playing');
        return;
      }
    }
  }

  // --- Player bullet vs boss collision ---
  const bullet = _player.bullet;
  if (bullet !== null) {
    const bx = bullet.x;
    const by = bullet.y;
    const bw = bullet.width;
    const bh = bullet.height;

    const overlap =
      bx < boss.x + BOSS_W &&
      bx + bw > boss.x &&
      by < boss.y + BOSS_H &&
      by + bh > boss.y;

    if (overlap) {
      // Consume the bullet
      _player._bullet = null;

      // Award points
      hudState.score += 100;
      if (hudState.score > hudState.hiScore) {
        hudState.hiScore = hudState.score;
      }

      // Damage boss
      boss.hp -= 1;

      if (boss.hp <= 0) {
        // Boss defeated!
        boss.hp = 0;
        hudState.score += 500;
        if (hudState.score > hudState.hiScore) {
          hudState.hiScore = hudState.score;
        }
        won = true;
      }
    }
  }
}

/**
 * Render the boss level.
 * @param {CanvasRenderingContext2D} ctx
 */
export function renderBoss(ctx) {
  if (won) {
    _renderWinScreen(ctx);
    return;
  }

  // --- Health bar ---
  _renderHealthBar(ctx);

  // --- Boss body ---
  _renderBoss(ctx);

  // --- Projectile ---
  if (projectile !== null) {
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(
      Math.round(projectile.x),
      Math.round(projectile.y),
      PROJ_W,
      PROJ_H
    );
  }

  // --- Player ---
  _player.draw(ctx);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Fire a boss projectile aimed at the player's current X centre. */
function _fireProjectile() {
  // Aim at player centre X
  const targetX = _player.x + PLAYER_W / 2 - PROJ_W / 2;
  projectile = {
    x: boss.x + BOSS_W / 2 - PROJ_W / 2,  // starts from boss centre X initially
    y: boss.y + BOSS_H,                     // starts from boss bottom edge
  };
  // Override X to aim at player
  projectile.x = Math.round(targetX);
}

/** Render the boss as canvas primitives — no external assets. */
function _renderBoss(ctx) {
  const bx = Math.round(boss.x);
  const by = Math.round(boss.y);

  // Phase colour: Phase 1 = bright green, Phase 2 = orange/red
  const isPhase2 = boss.hp <= PHASE2_HP;
  const bodyColour = isPhase2 ? '#ff6600' : '#00ccff';
  const accentColour = isPhase2 ? '#ff0000' : '#0088ff';
  const eyeColour    = isPhase2 ? '#ffff00' : '#ffffff';

  // Main body — large rectangle
  ctx.fillStyle = bodyColour;
  ctx.fillRect(bx, by + 16, BOSS_W, 32);  // lower body

  // Head dome — arc
  ctx.fillStyle = bodyColour;
  ctx.beginPath();
  ctx.arc(bx + BOSS_W / 2, by + 16, BOSS_W / 2, Math.PI, 0, false);
  ctx.fill();

  // Centre stripe / cannon housing
  ctx.fillStyle = accentColour;
  ctx.fillRect(bx + BOSS_W / 2 - 10, by + 28, 20, 24);

  // Cannon barrel (bottom centre)
  ctx.fillStyle = '#888888';
  ctx.fillRect(bx + BOSS_W / 2 - 4, by + BOSS_H - 4, 8, 12);

  // Left eye
  ctx.fillStyle = eyeColour;
  ctx.beginPath();
  ctx.arc(bx + 22, by + 18, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(bx + 22, by + 18, 3, 0, Math.PI * 2);
  ctx.fill();

  // Right eye
  ctx.fillStyle = eyeColour;
  ctx.beginPath();
  ctx.arc(bx + BOSS_W - 22, by + 18, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(bx + BOSS_W - 22, by + 18, 3, 0, Math.PI * 2);
  ctx.fill();

  // Left arm / wing
  ctx.fillStyle = bodyColour;
  ctx.fillRect(bx - 18, by + 24, 20, 10);
  ctx.fillStyle = accentColour;
  ctx.fillRect(bx - 18, by + 24, 6, 10);

  // Right arm / wing
  ctx.fillStyle = bodyColour;
  ctx.fillRect(bx + BOSS_W - 2, by + 24, 20, 10);
  ctx.fillStyle = accentColour;
  ctx.fillRect(bx + BOSS_W + 12, by + 24, 6, 10);

  // Phase 2 extra detail: pulsing spikes on top (drawn as small triangles via lines)
  if (isPhase2) {
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    // Left spike
    ctx.beginPath();
    ctx.moveTo(bx + 18, by + 4);
    ctx.lineTo(bx + 14, by - 8);
    ctx.lineTo(bx + 22, by + 4);
    ctx.stroke();
    // Centre spike
    ctx.beginPath();
    ctx.moveTo(bx + BOSS_W / 2 - 4, by + 2);
    ctx.lineTo(bx + BOSS_W / 2, by - 10);
    ctx.lineTo(bx + BOSS_W / 2 + 4, by + 2);
    ctx.stroke();
    // Right spike
    ctx.beginPath();
    ctx.moveTo(bx + BOSS_W - 22, by + 4);
    ctx.lineTo(bx + BOSS_W - 14, by - 8);
    ctx.lineTo(bx + BOSS_W - 18, by + 4);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}

/** Render the health bar at the top of the canvas. */
function _renderHealthBar(ctx) {
  const isPhase2 = boss.hp <= PHASE2_HP;
  const fillColour   = isPhase2 ? '#ff4400' : '#00cc44';
  const borderColour = '#ffffff';

  // Background track
  ctx.fillStyle = '#333333';
  ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);

  // Filled portion (proportional to HP)
  const fillW = Math.round((boss.hp / BOSS_START_HP) * BAR_W);
  ctx.fillStyle = fillColour;
  ctx.fillRect(BAR_X, BAR_Y, fillW, BAR_H);

  // Border
  ctx.strokeStyle = borderColour;
  ctx.lineWidth = 2;
  ctx.strokeRect(BAR_X, BAR_Y, BAR_W, BAR_H);
  ctx.lineWidth = 1;

  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    isPhase2 ? 'BOSS  HP: ' + boss.hp + '  [PHASE 2]' : 'BOSS  HP: ' + boss.hp,
    CANVAS_WIDTH / 2,
    BAR_Y + BAR_H / 2
  );

  // Reset baseline
  ctx.textBaseline = 'alphabetic';
}

/** Render the win screen overlay. */
function _renderWinScreen(ctx) {
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  // Congratulations heading
  ctx.fillStyle = '#ffdd00';
  ctx.font      = 'bold 72px monospace';
  ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);

  // Sub-heading
  ctx.fillStyle = '#ffffff';
  ctx.font      = '32px monospace';
  ctx.fillText('CONGRATULATIONS!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 36);

  // Final score
  ctx.fillStyle = '#00ff88';
  ctx.font      = 'bold 36px monospace';
  ctx.fillText('FINAL SCORE: ' + hudState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

  // Restart prompt
  ctx.fillStyle = '#ffffff';
  ctx.font      = '26px monospace';
  ctx.fillText('Press ENTER to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);

  ctx.textBaseline = 'alphabetic';
}

// ---------------------------------------------------------------------------
// Enter-key edge-detection (local to boss.js — does not interfere with game.js)
// ---------------------------------------------------------------------------
let _enterWasDown = false;

function _enterJustPressed() {
  const down = isKeyHeld('Enter');
  const justPressed = down && !_enterWasDown;
  _enterWasDown = down;
  return justPressed;
}
