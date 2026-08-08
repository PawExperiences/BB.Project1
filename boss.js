// boss.js — Boss Level (Level 4): Multi-Phase Finale
//
// Exports:
//   initBoss(ctx, player)  — call once when Level 4 starts
//   updateBoss(dt)         — call each logic tick
//   drawBoss(ctx)          — call each render frame
//   isBossDead()           — true once HP reaches 0
//   isBossWon()            — alias for isBossDead (win condition)
//   getBossState()         — returns { active, playerHit } for game.js

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { runCollisionPass } from './collision.js';

// ---------------------------------------------------------------------------
// Boss dimensions
// ---------------------------------------------------------------------------
const BOSS_WIDTH  = 160; // px
const BOSS_HEIGHT = 80;  // px

// Boss starts horizontally centred, fixed Y near top (below HUD)
const BOSS_START_X = (CANVAS_WIDTH - BOSS_WIDTH) / 2;
const BOSS_Y       = 60; // fixed Y, never changes

// Boss horizontal drift speed
const BOSS_SPEED = 90; // px/s

// Boss HP
const BOSS_MAX_HP   = 10;
const BOSS_PHASE2_HP = 5; // phase 2 starts at <= 5 HP

// Fire intervals (ms)
const PHASE1_FIRE_INTERVAL = 1500;
const PHASE2_FIRE_INTERVAL = 700;

// Boss bullet properties
const BOSS_BULLET_SPEED = 260; // px/s
const BOSS_BULLET_W = 5;
const BOSS_BULLET_H = 14;

// Spread angles: straight down = angle 90deg from x-axis (Math.PI/2)
// "down" in canvas coords = +Y direction
// Straight down: dx=0, dy=1
// -20 degrees from straight down: rotate spread left
// +20 degrees from straight down: rotate spread right
const SPREAD_ANGLE = 20 * (Math.PI / 180); // 20 degrees in radians

// Health bar
const HEALTH_BAR_HEIGHT = 14;
const HEALTH_BAR_Y      = 2;
const HEALTH_BAR_MARGIN = 8;

// ---------------------------------------------------------------------------
// Module-level state (reset by initBoss)
// ---------------------------------------------------------------------------
let bossX        = BOSS_START_X;
let bossHP       = BOSS_MAX_HP;
let dirX         = 1;           // +1 = right, -1 = left
let fireTimer    = 0;           // ms until next shot
let bossBullets  = [];          // array of { x, y, vx, vy, active }
let active       = false;       // true while boss fight is running
let playerHit    = false;       // set true when a boss bullet hits the player
let bossWon      = false;       // true when HP reaches 0
let _player      = null;        // reference to the Player instance

// ---------------------------------------------------------------------------
// initBoss(player)
// Reset all state and start the boss fight.
// ---------------------------------------------------------------------------
export function initBoss(player) {
  bossX       = BOSS_START_X;
  bossHP      = BOSS_MAX_HP;
  dirX        = 1;
  fireTimer   = currentFireInterval(); // start immediately on schedule
  bossBullets = [];
  active      = true;
  playerHit   = false;
  bossWon     = false;
  _player     = player;
}

// ---------------------------------------------------------------------------
// currentFireInterval() — returns ms between shots based on current phase
// ---------------------------------------------------------------------------
function currentFireInterval() {
  return bossHP <= BOSS_PHASE2_HP ? PHASE2_FIRE_INTERVAL : PHASE1_FIRE_INTERVAL;
}

// ---------------------------------------------------------------------------
// fireSalvo() — spawn three boss bullets in a spread from boss centre
// ---------------------------------------------------------------------------
function fireSalvo() {
  const originX = bossX + BOSS_WIDTH  / 2;
  const originY = bossY() + BOSS_HEIGHT;

  // Three directions: straight down, -20°, +20°
  const angles = [
    Math.PI / 2,                   // straight down (90° = +Y)
    Math.PI / 2 - SPREAD_ANGLE,    // 20° to the left of down
    Math.PI / 2 + SPREAD_ANGLE     // 20° to the right of down
  ];

  for (const angle of angles) {
    bossBullets.push({
      x:      originX - BOSS_BULLET_W / 2,
      y:      originY,
      vx:     Math.cos(angle) * BOSS_BULLET_SPEED,
      vy:     Math.sin(angle) * BOSS_BULLET_SPEED,
      active: true,
      // width/height needed for collision check
      width:  BOSS_BULLET_W,
      height: BOSS_BULLET_H
    });
  }
}

// ---------------------------------------------------------------------------
// bossY() — always returns the fixed Y position
// ---------------------------------------------------------------------------
function bossY() {
  return BOSS_Y;
}

// ---------------------------------------------------------------------------
// updateBoss(dt)
// dt — elapsed time in seconds
// ---------------------------------------------------------------------------
export function updateBoss(dt) {
  if (!active) return;

  // -- Boss horizontal movement --------------------------------------------
  const dx = BOSS_SPEED * dirX * dt;
  bossX += dx;

  // Reverse at edges
  if (bossX + BOSS_WIDTH >= CANVAS_WIDTH) {
    bossX = CANVAS_WIDTH - BOSS_WIDTH;
    dirX  = -1;
  }
  if (bossX <= 0) {
    bossX = 0;
    dirX  = 1;
  }

  // -- Fire timer ----------------------------------------------------------
  fireTimer -= dt * 1000; // convert dt to ms
  if (fireTimer <= 0) {
    fireSalvo();
    fireTimer = currentFireInterval();
  }

  // -- Move boss bullets ---------------------------------------------------
  for (const b of bossBullets) {
    if (!b.active) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // Deactivate if off-screen
    if (b.y > CANVAS_HEIGHT + BOSS_BULLET_H ||
        b.x < -BOSS_BULLET_W ||
        b.x > CANVAS_WIDTH + BOSS_BULLET_W) {
      b.active = false;
    }
  }

  // Prune inactive bullets periodically
  if (bossBullets.length > 60) {
    bossBullets = bossBullets.filter(b => b.active);
  }

  // -- Collision: player bullet vs boss ------------------------------------
  if (_player && _player.bullet !== null) {
    const pb = _player.bullet;
    const pbW = 4;  // matches player.js BULLET_WIDTH
    const pbH = 12; // matches player.js BULLET_HEIGHT

    if (aabbOverlap(
          pb.x, pb.y, pbW, pbH,
          bossX, bossY(), BOSS_WIDTH, BOSS_HEIGHT)) {
      _player.bullet = null;
      bossHP -= 1;

      // Immediate phase transition check — adjust timer only if crossing phase boundary
      // (no grace period; just ensure next interval uses new rate)
      // We do NOT reset fireTimer here — the boss fires at its current schedule;
      // on the very next shot it will use the new interval.
      // However per spec "immediately transitions" means the *next* fire uses
      // the shorter interval. fireTimer was already set with old interval;
      // we clamp it so it doesn't exceed the new interval.
      if (bossHP <= BOSS_PHASE2_HP) {
        if (fireTimer > PHASE2_FIRE_INTERVAL) {
          fireTimer = PHASE2_FIRE_INTERVAL;
        }
      }

      if (bossHP <= 0) {
        bossHP  = 0;
        active  = false;
        bossWon = true;
      }
    }
  }

  // -- Collision: boss bullets vs player -----------------------------------
  // Use collision.js for boss-bullet-vs-player via runCollisionPass.
  // runCollisionPass checks invaderBullets (plain objects with .active,
  // .x, .y, .width, .height) against the player bounding box and
  // deactivates bullets that hit. We pass bossBullets as the invaderBullets array.
  if (_player) {
    const activeBefore = bossBullets.filter(b => b.active).length;
    runCollisionPass(_player, bossBullets);
    const activeAfter = bossBullets.filter(b => b.active).length;

    // If any bullet was deactivated by the collision pass, the player was hit
    if (activeAfter < activeBefore) {
      playerHit = true;
      active    = false;
    }
  }
}

// ---------------------------------------------------------------------------
// AABB overlap helper — used only for player bullet vs boss rectangle
// (boss-bullet vs player uses collision.js as required by spec)
// ---------------------------------------------------------------------------
function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw &&
         ax + aw > bx &&
         ay < by + bh &&
         ay + ah > by;
}

// ---------------------------------------------------------------------------
// drawBoss(ctx)
// Renders the boss, boss bullets, and the health bar.
// ---------------------------------------------------------------------------
export function drawBoss(ctx) {
  if (bossHP <= 0 && !active) {
    // Boss is dead — draw nothing (win screen handled by game.js)
    return;
  }

  const x = bossX;
  const y = bossY();

  // -- Draw boss body (canvas 2D primitives only) --------------------------
  ctx.save();

  // Outer hull — dark red/maroon base
  ctx.fillStyle = '#8b0000';
  ctx.fillRect(x, y, BOSS_WIDTH, BOSS_HEIGHT);

  // Central cockpit dome
  ctx.fillStyle = '#cc0000';
  ctx.beginPath();
  ctx.ellipse(
    x + BOSS_WIDTH / 2,
    y + BOSS_HEIGHT / 2,
    BOSS_WIDTH * 0.25,
    BOSS_HEIGHT * 0.35,
    0, 0, Math.PI * 2
  );
  ctx.fill();

  // Left cannon
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(x + 10, y + BOSS_HEIGHT - 18, 18, 18);

  // Right cannon
  ctx.fillRect(x + BOSS_WIDTH - 28, y + BOSS_HEIGHT - 18, 18, 18);

  // Left wing accent
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(x, y + 20, 30, 10);

  // Right wing accent
  ctx.fillRect(x + BOSS_WIDTH - 30, y + 20, 30, 10);

  // Eye glow (phase 2 is brighter)
  ctx.fillStyle = bossHP <= BOSS_PHASE2_HP ? '#ff0000' : '#ff9900';
  ctx.beginPath();
  ctx.arc(x + BOSS_WIDTH / 2, y + BOSS_HEIGHT / 2, 10, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, BOSS_WIDTH - 2, BOSS_HEIGHT - 2);

  ctx.restore();

  // -- Draw boss bullets ---------------------------------------------------
  ctx.fillStyle = '#ff4444';
  for (const b of bossBullets) {
    if (!b.active) continue;
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(b.x, b.y, BOSS_BULLET_W, BOSS_BULLET_H);
    // Bright core
    ctx.fillStyle = '#ffaaaa';
    ctx.fillRect(b.x + 1, b.y + 2, BOSS_BULLET_W - 2, BOSS_BULLET_H - 4);
  }

  // -- Draw health bar at top of canvas ------------------------------------
  drawHealthBar(ctx);
}

// ---------------------------------------------------------------------------
// drawHealthBar(ctx)
// Renders a full-width HP indicator at the top of the canvas.
// ---------------------------------------------------------------------------
function drawHealthBar(ctx) {
  const barX = HEALTH_BAR_MARGIN;
  const barY = HEALTH_BAR_Y;
  const barW = CANVAS_WIDTH - HEALTH_BAR_MARGIN * 2;
  const barH = HEALTH_BAR_HEIGHT;

  // Background
  ctx.fillStyle = '#330000';
  ctx.fillRect(barX, barY, barW, barH);

  // HP fill
  const hpFraction = Math.max(0, bossHP / BOSS_MAX_HP);
  const fillW = Math.floor(barW * hpFraction);

  // Colour shifts red->yellow as HP decreases
  const r = 255;
  const g = Math.floor(hpFraction * 200);
  ctx.fillStyle = `rgb(${r},${g},0)`;
  ctx.fillRect(barX, barY, fillW, barH);

  // Border
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`BOSS HP: ${bossHP} / ${BOSS_MAX_HP}`, CANVAS_WIDTH / 2, barY + barH / 2);
}

// ---------------------------------------------------------------------------
// Accessors used by game.js
// ---------------------------------------------------------------------------
export function isBossWon()  { return bossWon;    }
export function isBossAlive() { return active;    }

/**
 * Returns a snapshot of the boss fight state for game.js to act on.
 * After reading, game.js should call resetBossFlags() to clear one-shot flags.
 */
export function getBossState() {
  return {
    active,
    playerHit,
    won: bossWon,
    hp:  bossHP
  };
}

/**
 * Clear one-shot flags after game.js has handled them.
 */
export function resetBossFlags() {
  playerHit = false;
}
