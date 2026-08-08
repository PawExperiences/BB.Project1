// boss.js — Boss Level (Level 4): multi-phase finale
// Owned by card: "Boss level: multi-phase finale"

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { checkCollision } from './collision.js';
import { hudState } from './game.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BOSS_WIDTH        = 160;
const BOSS_HEIGHT       = 80;
const BOSS_Y            = 60;
const BOSS_SPEED        = 90;          // px/s horizontal drift
const BOSS_MAX_HP       = 10;
const BULLET_SPEED_BOSS = 260;         // px/s along trajectory
const FIRE_INTERVAL_P1  = 1500;        // ms, Phase 1 (HP > 5)
const FIRE_INTERVAL_P2  = 700;         // ms, Phase 2 (HP <= 5)
const SPREAD_ANGLE_DEG  = 20;          // ± degrees from vertical

const BULLET_W = 6;
const BULLET_H = 14;

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------
let boss       = null;   // { x, y, hp, dirX, fireTimer }
let bullets    = [];     // [{ x, y, vx, vy, active }]
let _player    = null;
let _running   = false;
let _won       = false;
let _animFrame = null;
let _lastTime  = null;
let _ctx       = null;
let _hud       = null;
let _onRestart = null;   // callback to return to Level 1

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function bossRect() {
  return { x: boss.x, y: boss.y, w: BOSS_WIDTH, h: BOSS_HEIGHT };
}

function phase() {
  return boss.hp <= 5 ? 2 : 1;
}

function fireInterval() {
  return phase() === 1 ? FIRE_INTERVAL_P1 : FIRE_INTERVAL_P2;
}

/** Spawn three bullets from boss centre in a spread. */
function fireBullets() {
  const cx = boss.x + BOSS_WIDTH  / 2;
  const cy = boss.y + BOSS_HEIGHT;

  const angles = [
    -SPREAD_ANGLE_DEG,
    0,
    SPREAD_ANGLE_DEG,
  ];

  for (const deg of angles) {
    const rad = (deg * Math.PI) / 180;
    // "straight down" is +Y; ±20° from vertical
    bullets.push({
      x:      cx,
      y:      cy,
      vx:     BULLET_SPEED_BOSS * Math.sin(rad),
      vy:     BULLET_SPEED_BOSS * Math.cos(rad),
      active: true,
    });
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
function update(dt) {
  if (!_running || _won) return;

  // --- Move boss ---
  boss.x += BOSS_SPEED * boss.dirX * dt;

  // Reverse at canvas edges (boss body stays within canvas)
  if (boss.dirX > 0 && boss.x + BOSS_WIDTH >= CANVAS_WIDTH) {
    boss.x    = CANVAS_WIDTH - BOSS_WIDTH;
    boss.dirX = -1;
  } else if (boss.dirX < 0 && boss.x <= 0) {
    boss.x    = 0;
    boss.dirX = 1;
  }
  // Y is always locked
  boss.y = BOSS_Y;

  // --- Fire timer ---
  boss.fireTimer -= dt * 1000; // convert to ms
  if (boss.fireTimer <= 0) {
    fireBullets();
    boss.fireTimer = fireInterval();
  }

  // --- Move bullets ---
  for (const b of bullets) {
    if (!b.active) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // Deactivate if off-canvas
    if (b.y > CANVAS_HEIGHT + 20 || b.y < -20 || b.x < -20 || b.x > CANVAS_WIDTH + 20) {
      b.active = false;
    }
  }

  // --- Player bullet vs boss collision ---
  if (_player && _player.bullet) {
    const pb = _player.bullet;
    // active check: player.bullet is null when inactive, but check coords
    const pbRect = {
      x: pb.x - 2,
      y: pb.y,
      w: 4,
      h: 12,
    };
    if (checkCollision(pbRect, bossRect())) {
      // Hit! Remove player bullet
      _player.bullet = null;
      const prevHp  = boss.hp;
      boss.hp      -= 1;

      // Update HUD score
      if (hudState) hudState.score += 100;
      if (_hud && typeof _hud.set === 'function') {
        _hud.set('score', hudState ? hudState.score : 0);
      }

      // Check win
      if (boss.hp <= 0) {
        _won     = true;
        _running = false;
        // Draw final frame then show win screen on next frame
        return;
      }

      // Immediate phase transition check (no additional action needed;
      // fireInterval() reads boss.hp live)
      // If this hit dropped HP to exactly 5, phase 2 begins immediately.
      // Reset fire timer to new interval so next shot uses Phase 2 cadence.
      if (prevHp > 5 && boss.hp <= 5) {
        boss.fireTimer = FIRE_INTERVAL_P2;
      }
    }
  }

  // --- Boss bullets vs player (sudden death) ---
  if (_player) {
    const pRect = {
      x: _player.x,
      y: _player.y,
      w: _player.width,
      h: _player.height,
    };
    for (const b of bullets) {
      if (!b.active) continue;
      const bRect = {
        x: b.x - BULLET_W / 2,
        y: b.y,
        w: BULLET_W,
        h: BULLET_H,
      };
      if (checkCollision(bRect, pRect)) {
        // Sudden death — restart from Level 1 immediately
        b.active = false;
        _running = false;
        if (typeof _onRestart === 'function') {
          _onRestart();
        }
        return;
      }
    }
  }

  // Clean up inactive bullets periodically
  if (bullets.length > 200) {
    bullets = bullets.filter(b => b.active);
  }
}

// ---------------------------------------------------------------------------
// Draw
// ---------------------------------------------------------------------------
function draw(ctx) {
  if (!boss) return;

  // --- Health bar (top of canvas, above boss body) ---
  const barW = CANVAS_WIDTH;
  const barH = 18;
  const fillW = Math.max(0, (boss.hp / BOSS_MAX_HP) * barW);

  // Background
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, barW, barH);

  // Fill — green when healthy, yellow mid, red low
  const hpFraction = boss.hp / BOSS_MAX_HP;
  if (hpFraction > 0.6) {
    ctx.fillStyle = '#22cc22';
  } else if (hpFraction > 0.3) {
    ctx.fillStyle = '#ddcc00';
  } else {
    ctx.fillStyle = '#dd2222';
  }
  ctx.fillRect(0, 0, fillW, barH);

  // Bar border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 2;
  ctx.strokeRect(1, 1, barW - 2, barH - 2);

  // HP label
  ctx.fillStyle  = '#fff';
  ctx.font       = 'bold 13px monospace';
  ctx.textAlign  = 'center';
  ctx.fillText(`HP: ${boss.hp} / ${BOSS_MAX_HP}`, barW / 2, 13);

  // --- Boss body ---
  const bx = boss.x;
  const by = boss.y; // always BOSS_Y

  // Main hull — dark metallic rectangle
  ctx.fillStyle = '#556677';
  ctx.fillRect(bx, by + 20, BOSS_WIDTH, BOSS_HEIGHT - 20);

  // Top turret dome
  ctx.beginPath();
  ctx.ellipse(
    bx + BOSS_WIDTH / 2,
    by + 25,
    BOSS_WIDTH / 2 - 10,
    28,
    0, Math.PI, 0, true  // upper half
  );
  ctx.fillStyle = '#778899';
  ctx.fill();

  // Cockpit window
  ctx.beginPath();
  ctx.ellipse(bx + BOSS_WIDTH / 2, by + 22, 18, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#88ddff';
  ctx.fill();
  ctx.strokeStyle = '#cceeff';
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Left wing
  ctx.fillStyle = '#445566';
  ctx.beginPath();
  ctx.moveTo(bx,           by + 40);
  ctx.lineTo(bx - 20,      by + 70);
  ctx.lineTo(bx + 20,      by + BOSS_HEIGHT);
  ctx.closePath();
  ctx.fill();

  // Right wing
  ctx.beginPath();
  ctx.moveTo(bx + BOSS_WIDTH,      by + 40);
  ctx.lineTo(bx + BOSS_WIDTH + 20, by + 70);
  ctx.lineTo(bx + BOSS_WIDTH - 20, by + BOSS_HEIGHT);
  ctx.closePath();
  ctx.fill();

  // Phase 2 indicator — pulsing red core
  if (phase() === 2) {
    ctx.beginPath();
    ctx.arc(bx + BOSS_WIDTH / 2, by + 50, 10, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 60, 60, ${0.6 + 0.4 * Math.sin(Date.now() / 150)})`;
    ctx.fill();
  }

  // --- Cannon barrels ---
  ctx.fillStyle = '#99aabb';
  // Left cannon
  ctx.fillRect(bx + 30, by + BOSS_HEIGHT - 10, 10, 16);
  // Centre cannon
  ctx.fillRect(bx + BOSS_WIDTH / 2 - 5, by + BOSS_HEIGHT - 10, 10, 18);
  // Right cannon
  ctx.fillRect(bx + BOSS_WIDTH - 40, by + BOSS_HEIGHT - 10, 10, 16);

  // --- Boss bullets ---
  ctx.fillStyle = '#ff6600';
  for (const b of bullets) {
    if (!b.active) continue;
    ctx.save();
    ctx.translate(b.x, b.y);
    // Rotate to match trajectory
    const angle = Math.atan2(b.vx, b.vy); // angle from down
    ctx.rotate(angle);
    ctx.fillRect(-BULLET_W / 2, 0, BULLET_W, BULLET_H);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Win screen
// ---------------------------------------------------------------------------
function drawWinScreen(ctx) {
  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const cx = CANVAS_WIDTH  / 2;
  const cy = CANVAS_HEIGHT / 2;

  // Victory banner
  ctx.fillStyle  = '#ffdd00';
  ctx.font       = 'bold 56px monospace';
  ctx.textAlign  = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('YOU WIN!', cx, cy - 80);

  // Score
  const score = hudState ? hudState.score : 0;
  ctx.fillStyle = '#ffffff';
  ctx.font      = 'bold 30px monospace';
  ctx.fillText(`Final Score: ${score}`, cx, cy - 20);

  // Subtitle
  ctx.fillStyle = '#aaddff';
  ctx.font      = '22px monospace';
  ctx.fillText('The galaxy is saved!', cx, cy + 30);

  // Restart prompt
  ctx.fillStyle = '#88ff88';
  ctx.font      = 'bold 24px monospace';
  ctx.fillText('Press  R  or click  [ RESTART ]  to play again', cx, cy + 90);

  // Restart button
  const btnW = 200;
  const btnH = 48;
  const btnX = cx - btnW / 2;
  const btnY = cy + 120;

  ctx.fillStyle   = '#226622';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = '#88ff88';
  ctx.lineWidth   = 3;
  ctx.strokeRect(btnX, btnY, btnW, btnH);

  ctx.fillStyle    = '#ffffff';
  ctx.font         = 'bold 22px monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText('RESTART', cx, btnY + btnH / 2);

  // Store button coords for click detection
  _winBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
}

// Win screen button rect (module-level so click handler can read it)
let _winBtn = null;

// ---------------------------------------------------------------------------
// Game loop (rAF)
// ---------------------------------------------------------------------------
function loop(timestamp) {
  if (!_ctx) return;

  if (_lastTime === null) _lastTime = timestamp;
  const dt = Math.min((timestamp - _lastTime) / 1000, 0.05); // cap at 50 ms
  _lastTime = timestamp;

  // Clear
  _ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (_won) {
    // Draw static boss scene behind win screen
    draw(_ctx);
    drawWinScreen(_ctx);

    // Keep looping so the win screen stays rendered
    _animFrame = requestAnimationFrame(loop);
    return;
  }

  if (_player) {
    _player.update(dt);
    _player.draw(_ctx);
  }

  update(dt);
  draw(_ctx);

  _animFrame = requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Event listeners (attached once, removed on stop)
// ---------------------------------------------------------------------------
function _onKeyDown(e) {
  if (_won && (e.key === 'r' || e.key === 'R')) {
    _triggerRestart();
  }
}

function _onCanvasClick(e) {
  if (!_won || !_winBtn) return;
  const rect  = _ctx.canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH  / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;
  const mx     = (e.clientX - rect.left) * scaleX;
  const my     = (e.clientY - rect.top)  * scaleY;

  if (
    mx >= _winBtn.x && mx <= _winBtn.x + _winBtn.w &&
    my >= _winBtn.y && my <= _winBtn.y + _winBtn.h
  ) {
    _triggerRestart();
  }
}

function _triggerRestart() {
  if (typeof _onRestart === 'function') {
    _onRestart();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * start(ctx, hud, player, onRestart)
 * Entry point called by game.js level-dispatch when Level 4 begins.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object}   hud        — { set(key, value) } HUD controller
 * @param {object}   player     — live Player instance from game.js
 * @param {function} onRestart  — callback that restarts the game from Level 1
 */
export function start(ctx, hud, player, onRestart) {
  // Clean up any previous run
  stop();

  _ctx       = ctx;
  _hud       = hud;
  _player    = player;
  _onRestart = onRestart;
  _won       = false;
  _running   = true;
  _lastTime  = null;
  _winBtn    = null;
  bullets    = [];

  // Initialise boss centred horizontally
  boss = {
    x:         (CANVAS_WIDTH - BOSS_WIDTH) / 2,
    y:         BOSS_Y,
    hp:        BOSS_MAX_HP,
    dirX:      1,
    fireTimer: FIRE_INTERVAL_P1,
  };

  // Announce level in HUD
  if (_hud && typeof _hud.set === 'function') {
    _hud.set('level', 4);
  }

  // Attach win-screen interaction listeners
  window.addEventListener('keydown', _onKeyDown);
  if (ctx.canvas) ctx.canvas.addEventListener('click', _onCanvasClick);

  // Start rAF loop
  _animFrame = requestAnimationFrame(loop);
}

/**
 * stop()
 * Halts the boss loop (called by game.js on scene change).
 */
export function stop() {
  _running = false;
  _won     = false;
  if (_animFrame !== null) {
    cancelAnimationFrame(_animFrame);
    _animFrame = null;
  }
  _lastTime = null;

  // Remove event listeners
  window.removeEventListener('keydown', _onKeyDown);
  if (_ctx && _ctx.canvas) {
    _ctx.canvas.removeEventListener('click', _onCanvasClick);
  }
}
