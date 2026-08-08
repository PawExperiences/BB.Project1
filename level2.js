// level2.js — Level 2: They Shoot Back
// Owned by card: "Level 2: they shoot back"

import {
  initInvaders,
  invaders,
  INVADER_HEIGHT,
  INVADER_WIDTH,
  INVADER_ROWS,
  INVADER_COLS,
} from './invaders.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOTAL_INVADERS     = INVADER_ROWS * INVADER_COLS;  // 55
const INTERVAL_MAX_MS    = 800  * 0.67;  // ≈ 536 ms when all 55 alive
const INTERVAL_MIN_MS    = 100  * 0.67;  // ≈  67 ms when 1 alive

const ENEMY_FIRE_MIN_MS  = 800;   // minimum fire interval
const ENEMY_FIRE_MAX_MS  = 2000;  // maximum fire interval
const ENEMY_BULLET_SPEED = 300;   // px/s downward
const ENEMY_BULLET_W     = 4;
const ENEMY_BULLET_H     = 12;

const UFO_INTERVAL_MS    = 20000; // 20 s between UFO entries
const UFO_SPEED          = 120;   // px/s horizontal
const UFO_WIDTH          = 48;
const UFO_HEIGHT         = 20;
const UFO_Y              = 44;    // y position (below HUD)

const INVULN_DURATION_MS = 2000;  // 2 s of invulnerability after hit
const FLASH_INTERVAL_MS  = 100;   // flash toggle period

// The player ship's top-edge Y — matches Player constructor in player.js
const PLAYER_ROW_Y       = CANVAS_HEIGHT - 60;

// UFO score tiers indexed by (session_shot_count mod 4)
const UFO_SCORE_TIERS    = [50, 100, 150, 300];

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------
let _ctx         = null;
let _hud         = null;
let _running     = false;

// March (formation step) timer
let _marchTimer  = null;
let _aliveCount  = 0;

// Enemy bullet pool — array of { x, y, active }
let _enemyBullets = [];

// Enemy fire timer
let _fireTimer   = null;

// UFO state
let _ufoTimer    = null;       // interval handle for 20 s UFO entry
let _ufoActive   = false;
let _ufoX        = 0;
let _ufoDir      = 1;          // +1 = left→right, -1 = right→left
let _ufoEntry    = 0;          // counts entries so far (0 = not yet entered)

// Player invulnerability state
let _invulnActive     = false;
let _invulnEndTime    = 0;     // performance.now() timestamp
let _flashVisible     = true;  // current flash state for the ship
let _flashTimer       = null;

// Callback refs set by start()
let _getSessionShotCount = null;
let _onPlayerHit         = null;  // () => void — called when enemy bullet hits
let _getPlayer           = null;  // () => Player

// ---------------------------------------------------------------------------
// Public API: expose enemy bullets for game.js collision pass
// ---------------------------------------------------------------------------
export function getEnemyBullets() {
  return _enemyBullets;
}

/**
 * playerIsInvulnerable()
 * Returns true during the 2-second respawn window.
 */
export function playerIsInvulnerable() {
  return _invulnActive;
}

/**
 * playerFlashVisible()
 * Returns false during flash-off frames so game.js can skip drawing the ship.
 */
export function playerFlashVisible() {
  return _flashVisible;
}

// ---------------------------------------------------------------------------
// notifyKill()
// Called by game.js each time the player destroys an invader so the march
// interval recalculates immediately.
// ---------------------------------------------------------------------------
export function notifyKill() {
  if (!_running) return;

  if (_marchTimer !== null) {
    clearTimeout(_marchTimer);
    _marchTimer = null;
  }

  _aliveCount = _countAlive();

  if (_aliveCount === 0) {
    _running = false;
    _stopTimers();
    window.dispatchEvent(new CustomEvent('levelComplete', { detail: { nextLevel: 3 } }));
    return;
  }

  const interval = _stepInterval(_aliveCount);
  _marchTimer = setTimeout(_marchStep, interval);
}

/**
 * notifyEnemyBulletHit()
 * Called by game.js when an enemy bullet has hit the player.
 * Decrements lives, triggers respawn invulnerability.
 */
export function notifyEnemyBulletHit() {
  if (!_running) return;
  if (_invulnActive) return;  // already invulnerable — ignore

  if (_hud) {
    _hud.lives -= 1;
  }

  // Respawn player at bottom-centre
  const player = _getPlayer ? _getPlayer() : null;
  if (player) {
    player.x = (CANVAS_WIDTH - player.width) / 2;
    player.y = CANVAS_HEIGHT - 60;
    player.bullet = null;
  }

  // Trigger invulnerability window
  _startInvulnerability();
}

// ---------------------------------------------------------------------------
// stop() — halt all Level 2 timers (called by game.js on scene change)
// ---------------------------------------------------------------------------
export function stop() {
  _running = false;
  _stopTimers();
  _enemyBullets = [];
  _ufoActive = false;
  _invulnActive = false;
  _flashVisible = true;
}

// ---------------------------------------------------------------------------
// start(ctx, hud, getPlayer, getSessionShotCount)
// Entry point called by game.js when Level 2 begins.
//   ctx                  — CanvasRenderingContext2D
//   hud                  — hudState object with .lives, .set()
//   getPlayer            — () => Player instance (live reference)
//   getSessionShotCount  — () => number — cumulative shots this session
// ---------------------------------------------------------------------------
export function start(ctx, hud, getPlayer, getSessionShotCount) {
  stop();

  _ctx                 = ctx;
  _hud                 = hud;
  _getPlayer           = getPlayer;
  _getSessionShotCount = getSessionShotCount;
  _running             = true;

  // Reset UFO state for this level load
  _ufoEntry   = 0;
  _ufoActive  = false;
  _ufoDir     = 1;
  _enemyBullets = [];
  _invulnActive = false;
  _flashVisible = true;

  // Announce level in HUD
  if (_hud && typeof _hud.set === 'function') {
    _hud.set('level', 2);
  }

  // Reset invader formation
  initInvaders();
  _aliveCount = TOTAL_INVADERS;

  // Kick off the march
  const interval = _stepInterval(_aliveCount);
  _marchTimer = setTimeout(_marchStep, interval);

  // Kick off enemy fire
  _scheduleNextFire();

  // Kick off UFO timer
  _ufoTimer = setInterval(_spawnUfo, UFO_INTERVAL_MS);
}

/**
 * update(dt)
 * Advance Level 2 per-frame logic.
 * Called from game.js update() when Level 2 is active.
 * @param {number} dt — delta time in seconds
 */
export function update(dt) {
  if (!_running) return;

  // Advance enemy bullets
  for (const b of _enemyBullets) {
    if (!b.active) continue;
    b.y += ENEMY_BULLET_SPEED * dt;
    // Deactivate if it leaves the bottom of the canvas
    if (b.y > CANVAS_HEIGHT) {
      b.active = false;
    }
  }

  // Prune spent bullets (keep array small)
  if (_enemyBullets.length > 20) {
    _enemyBullets = _enemyBullets.filter(b => b.active);
  }

  // Advance UFO
  if (_ufoActive) {
    _ufoX += UFO_SPEED * _ufoDir * dt;
    // Check if UFO has exited the screen
    if (_ufoDir > 0 && _ufoX > CANVAS_WIDTH + UFO_WIDTH) {
      _ufoActive = false;
    } else if (_ufoDir < 0 && _ufoX < -UFO_WIDTH) {
      _ufoActive = false;
    }
  }

  // Tick invulnerability
  if (_invulnActive) {
    if (performance.now() >= _invulnEndTime) {
      _endInvulnerability();
    }
  }
}

/**
 * draw(ctx)
 * Render Level 2 elements: enemy bullets, UFO.
 * Called from game.js renderPlaying().
 * @param {CanvasRenderingContext2D} ctx
 */
export function draw(ctx) {
  if (!_running) return;

  // Draw enemy bullets (red rectangle — same sprite sheet stand-in)
  ctx.save();
  ctx.fillStyle = '#ff4444';
  for (const b of _enemyBullets) {
    if (!b.active) continue;
    ctx.fillRect(b.x - ENEMY_BULLET_W / 2, b.y, ENEMY_BULLET_W, ENEMY_BULLET_H);
  }
  ctx.restore();

  // Draw UFO
  if (_ufoActive) {
    _drawUfo(ctx);
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Calculate march step interval for given alive count. */
function _stepInterval(aliveCount) {
  const raw = INTERVAL_MIN_MS + (aliveCount / TOTAL_INVADERS) * (INTERVAL_MAX_MS - INTERVAL_MIN_MS);
  console.log('[level2] aliveCount=' + aliveCount + ' interval=' + raw.toFixed(1) + 'ms');
  return raw;
}

/** Count live invaders. */
function _countAlive() {
  let n = 0;
  for (const inv of invaders) {
    if (inv.alive) n++;
  }
  return n;
}

/**
 * Find the bottommost Y of any live invader (bottom edge).
 * Returns -Infinity if no invaders alive.
 */
function _bottomMostY() {
  let maxY = -Infinity;
  for (const inv of invaders) {
    if (!inv.alive) continue;
    const bottom = inv.y + INVADER_HEIGHT;
    if (bottom > maxY) maxY = bottom;
  }
  return maxY;
}

/** March step — called on each timer tick. */
function _marchStep() {
  if (!_running) return;

  _aliveCount = _countAlive();

  if (_aliveCount === 0) {
    _running = false;
    _stopTimers();
    window.dispatchEvent(new CustomEvent('levelComplete', { detail: { nextLevel: 3 } }));
    return;
  }

  // Breach check
  if (_bottomMostY() >= PLAYER_ROW_Y) {
    if (_hud) _hud.lives -= 1;
    // Respawn player
    const player = _getPlayer ? _getPlayer() : null;
    if (player) {
      player.x = (CANVAS_WIDTH - player.width) / 2;
      player.y = CANVAS_HEIGHT - 60;
      player.bullet = null;
    }
    _startInvulnerability();
    _restartFormation();
    return;
  }

  const interval = _stepInterval(_aliveCount);
  _marchTimer = setTimeout(_marchStep, interval);
}

/** Reset formation and restart march (keeps running). */
function _restartFormation() {
  if (_marchTimer !== null) {
    clearTimeout(_marchTimer);
    _marchTimer = null;
  }
  initInvaders();
  _aliveCount = TOTAL_INVADERS;
  if (_hud && typeof _hud.set === 'function') {
    _hud.set('level', 2);
  }
  const interval = _stepInterval(_aliveCount);
  _marchTimer = setTimeout(_marchStep, interval);
}

/** Stop all timers (does not reset _running — caller does that). */
function _stopTimers() {
  if (_marchTimer !== null) {
    clearTimeout(_marchTimer);
    _marchTimer = null;
  }
  if (_fireTimer !== null) {
    clearTimeout(_fireTimer);
    _fireTimer = null;
  }
  if (_ufoTimer !== null) {
    clearInterval(_ufoTimer);
    _ufoTimer = null;
  }
  if (_flashTimer !== null) {
    clearInterval(_flashTimer);
    _flashTimer = null;
  }
}

// ---------------------------------------------------------------------------
// Enemy fire
// ---------------------------------------------------------------------------

/** Schedule the next enemy fire event at a random interval. */
function _scheduleNextFire() {
  if (!_running) return;
  const delay = ENEMY_FIRE_MIN_MS + Math.random() * (ENEMY_FIRE_MAX_MS - ENEMY_FIRE_MIN_MS);
  _fireTimer = setTimeout(_fireEvent, delay);
}

/** Fire event: pick a random non-empty column, bottom invader fires. */
function _fireEvent() {
  if (!_running) return;

  // Build list of non-empty columns
  const nonEmptyCols = [];
  for (let col = 0; col < INVADER_COLS; col++) {
    for (let row = 0; row < INVADER_ROWS; row++) {
      const idx = row * INVADER_COLS + col;
      if (invaders[idx] && invaders[idx].alive) {
        nonEmptyCols.push(col);
        break;  // only need to know col is non-empty
      }
    }
  }

  if (nonEmptyCols.length > 0) {
    // Pick a random non-empty column
    const col = nonEmptyCols[Math.floor(Math.random() * nonEmptyCols.length)];

    // Find the bottom-most live invader in that column
    let shooter = null;
    for (let row = INVADER_ROWS - 1; row >= 0; row--) {
      const idx = row * INVADER_COLS + col;
      if (invaders[idx] && invaders[idx].alive) {
        shooter = invaders[idx];
        break;
      }
    }

    if (shooter) {
      // Bullet starts at the centre-bottom of the shooter
      _enemyBullets.push({
        x:      shooter.x + INVADER_WIDTH  / 2,
        y:      shooter.y + INVADER_HEIGHT,
        active: true,
      });
    }
  }

  // Schedule the next fire
  _scheduleNextFire();
}

// ---------------------------------------------------------------------------
// UFO
// ---------------------------------------------------------------------------

/** Spawn a UFO. Called every 20 seconds by setInterval. */
function _spawnUfo() {
  if (!_running) return;
  if (_ufoActive) return;  // previous UFO still crossing — skip this tick

  _ufoEntry++;  // 1-based entry count

  // Alternate sides: odd entries go left→right, even go right→left
  if (_ufoEntry % 2 === 1) {
    _ufoDir = 1;              // left to right
    _ufoX   = -UFO_WIDTH;    // start off-screen left
  } else {
    _ufoDir = -1;             // right to left
    _ufoX   = CANVAS_WIDTH;  // start off-screen right
  }

  _ufoActive = true;
}

/**
 * tryShootUfo(bulletRect)
 * Call from game.js collision pass with the player bullet rect.
 * Returns the score awarded (0 if no hit).
 * @param {{ x, y, w, h }} bulletRect
 * @param {number} sessionShotCount
 */
export function tryShootUfo(bulletRect, sessionShotCount) {
  if (!_ufoActive) return 0;

  const ufoRect = { x: _ufoX, y: UFO_Y, w: UFO_WIDTH, h: UFO_HEIGHT };

  // Simple AABB test inline (avoid circular import of collision.js)
  const overlap =
    bulletRect.x         < ufoRect.x + ufoRect.w &&
    bulletRect.x + bulletRect.w > ufoRect.x       &&
    bulletRect.y         < ufoRect.y + ufoRect.h  &&
    bulletRect.y + bulletRect.h > ufoRect.y;

  if (!overlap) return 0;

  // UFO hit
  _ufoActive = false;
  const tier  = sessionShotCount % 4;
  const score = UFO_SCORE_TIERS[tier];
  return score;
}

/** Draw the UFO as a simple rectangle with a dome. */
function _drawUfo(ctx) {
  const x = _ufoX;
  const y = UFO_Y;

  ctx.save();

  // Body — wide flat rectangle
  ctx.fillStyle = '#dd2222';
  ctx.fillRect(x, y + 8, UFO_WIDTH, UFO_HEIGHT - 8);

  // Dome — upper semicircle
  ctx.beginPath();
  ctx.arc(x + UFO_WIDTH / 2, y + 8, UFO_WIDTH / 4, Math.PI, 0, false);
  ctx.fillStyle = '#ff6666';
  ctx.fill();

  // Underside lights — 3 small circles
  ctx.fillStyle = '#ffff44';
  const lightY = y + UFO_HEIGHT - 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x + 10 + i * (UFO_WIDTH - 20) / 2, lightY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Invulnerability / flash
// ---------------------------------------------------------------------------

function _startInvulnerability() {
  _invulnActive  = true;
  _invulnEndTime = performance.now() + INVULN_DURATION_MS;
  _flashVisible  = true;

  // Toggle flash on/off every FLASH_INTERVAL_MS
  if (_flashTimer !== null) {
    clearInterval(_flashTimer);
  }
  _flashTimer = setInterval(() => {
    if (!_invulnActive) {
      clearInterval(_flashTimer);
      _flashTimer   = null;
      _flashVisible = true;
      return;
    }
    _flashVisible = !_flashVisible;
  }, FLASH_INTERVAL_MS);
}

function _endInvulnerability() {
  _invulnActive  = false;
  _flashVisible  = true;
  if (_flashTimer !== null) {
    clearInterval(_flashTimer);
    _flashTimer = null;
  }
}
