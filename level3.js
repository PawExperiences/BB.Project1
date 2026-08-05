// level3.js — Level 3: Shields and Formations
//
// Self-contained ES module implementing Level 3 of Space Invaders.
// Introduces destructible shield bunkers and a formation split mechanic.
//
// Public API:
//   level3.start(canvas, ctx, onLevelComplete)
//   level3.update(dt)
//   level3.draw()
//   level3.stop()

import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, BULLET_SPEED } from './gameConfig.js';
import { isKeyHeld } from './input.js';
import { addScore } from './score.js';
import { addExplosion, updateExplosions, drawExplosions } from './explosion.js';

// ---------------------------------------------------------------------------
// AABB Collision helper (local copy — does not modify collision.js)
// ---------------------------------------------------------------------------
function aabb(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// ---------------------------------------------------------------------------
// Invader grid constants
// ---------------------------------------------------------------------------
const COLS           = 11;
const ROWS           = 5;
const INVADER_WIDTH  = 24;
const INVADER_HEIGHT = 16;
const INVADER_GAP_X  = 12;
const INVADER_GAP_Y  = 8;
const DROP_Y         = INVADER_HEIGHT + INVADER_GAP_Y; // 24 px
const STEP_X         = 8;  // px per horizontal step

// Formation starting position (same as Level 1)
const FORMATION_WIDTH  = COLS * INVADER_WIDTH  + (COLS - 1) * INVADER_GAP_X; // 384
const FORMATION_HEIGHT = ROWS * INVADER_HEIGHT + (ROWS - 1) * INVADER_GAP_Y; // 112
const START_X = (CANVAS_WIDTH - FORMATION_WIDTH) / 2;  // 192
const START_Y = 48;

// Speed formula (same as Level 1 base; Level 3 uses same timing)
const INTERVAL_MIN    = 100;  // ms at 1 invader
const INTERVAL_MAX    = 800;  // ms at 55 invaders
const TOTAL_INVADERS  = COLS * ROWS; // 55

// Split threshold
const SPLIT_THRESHOLD = Math.floor(TOTAL_INVADERS / 2); // 28

// Split column: 0-4 → left half (col 5 included in left); 6-10 → right half
const SPLIT_COL = 5;

// ---------------------------------------------------------------------------
// Player / bullet constants
// ---------------------------------------------------------------------------
const SHIP_WIDTH    = 40;
const SHIP_HEIGHT   = 32;
const BULLET_WIDTH  = 4;
const BULLET_HEIGHT = 12;

// ---------------------------------------------------------------------------
// Bunker constants
// ---------------------------------------------------------------------------
const BUNKER_CELL_SIZE = 8;   // px
const BUNKER_CELL_GAP  = 1;   // px
const BUNKER_COLS      = 4;
const BUNKER_ROWS      = 4;
const BUNKER_WIDTH     = BUNKER_COLS * BUNKER_CELL_SIZE + (BUNKER_COLS - 1) * BUNKER_CELL_GAP; // 35 px
const BUNKER_HEIGHT    = BUNKER_ROWS * BUNKER_CELL_SIZE + (BUNKER_ROWS - 1) * BUNKER_CELL_GAP; // 35 px
const BUNKER_TOP_Y     = CANVAS_HEIGHT * 0.80;  // ~716.8

// Bunker horizontal centres
const BUNKER_CENTRES_X = [
  CANVAS_WIDTH * 0.15,
  CANVAS_WIDTH * 0.38,
  CANVAS_WIDTH * 0.62,
  CANVAS_WIDTH * 0.85,
];

// Enemy bullet settings
const ENEMY_BULLET_SPEED  = 200;  // px/s downward
const ENEMY_BULLET_WIDTH  = 3;
const ENEMY_BULLET_HEIGHT = 10;
const ENEMY_FIRE_INTERVAL = 1200; // ms between enemy shots

// ---------------------------------------------------------------------------
// Module-level state (reset on each start())
// ---------------------------------------------------------------------------
let _canvas  = null;
let _ctx     = null;
let _onLevelComplete = null;
let _rafId   = null;
let _running = false;
let _lastTime = 0;

// Invader state — each: { x, y, alive, row, col }
let _invaders = [];

// Formation state before split
let _splitFired   = false;
let _killedCount  = 0;
let _dirX         = 1;    // +1 right, -1 left
let _stepTimer    = 0;    // ms

// Sub-formation state after split
// Each sub-formation: { invaders: [...refs], dirX, stepTimer }
let _leftFormation  = null;
let _rightFormation = null;

// Bunkers — array of { topX, topY, cells: boolean[ROWS][COLS] }
let _bunkers = [];

// Player bullet
let _playerBullet = null;  // { x, y } or null

// Enemy bullets: [{ x, y }]
let _enemyBullets = [];
let _enemyFireTimer = 0;  // ms

// Player state (local, not from player.js — we render a simple ship)
// We re-use the actual player module for drawing / input.
// However the task says to reuse the keyboard module from input.js
// and we must not change player.js. We manage player state locally here
// so level3 is self-contained.
let _playerX = 0;
let _playerY = 0;
let _playerInvulnerable = false;
let _invulnTimer = 0;     // ms remaining
let _flashTimer  = 0;     // ms for alternating visibility
let _playerVisible = true;
let _lives = 3;

// ---------------------------------------------------------------------------
// Helper: build initial invader array
// ---------------------------------------------------------------------------
function buildInvaders() {
  const arr = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      arr.push({
        x:     START_X + col * (INVADER_WIDTH  + INVADER_GAP_X),
        y:     START_Y + row * (INVADER_HEIGHT + INVADER_GAP_Y),
        alive: true,
        row,
        col,
      });
    }
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Helper: build bunkers
// ---------------------------------------------------------------------------
function buildBunkers() {
  return BUNKER_CENTRES_X.map(cx => {
    const topX = Math.round(cx - BUNKER_WIDTH / 2);
    const topY = Math.round(BUNKER_TOP_Y);
    // cells[r][c] = true means cell is intact
    const cells = [];
    for (let r = 0; r < BUNKER_ROWS; r++) {
      cells.push(new Array(BUNKER_COLS).fill(true));
    }
    return { topX, topY, cells };
  });
}

// ---------------------------------------------------------------------------
// Helper: step interval formula (same as Level 1)
// ---------------------------------------------------------------------------
function stepInterval(alive) {
  const raw = INTERVAL_MIN + (alive / TOTAL_INVADERS) * (INTERVAL_MAX - INTERVAL_MIN);
  return Math.max(INTERVAL_MIN, Math.min(INTERVAL_MAX, raw));
}

// ---------------------------------------------------------------------------
// Helper: count all alive invaders across both (or combined) formations
// ---------------------------------------------------------------------------
function countAllAlive() {
  if (!_splitFired) {
    return _invaders.filter(i => i.alive).length;
  } else {
    return (
      _leftFormation.invaders.filter(i => i.alive).length +
      _rightFormation.invaders.filter(i => i.alive).length
    );
  }
}

// ---------------------------------------------------------------------------
// Helper: get rect for invader cell collision
// ---------------------------------------------------------------------------
function invRect(inv) {
  return { x: inv.x, y: inv.y, width: INVADER_WIDTH, height: INVADER_HEIGHT };
}

// ---------------------------------------------------------------------------
// Helper: check bullet vs bunker cells; remove hit cell.
// Returns true if bullet was consumed.
// ---------------------------------------------------------------------------
function checkBulletVsBunkers(bx, by, bw, bh) {
  const bulletRect = { x: bx, y: by, width: bw, height: bh };
  for (const bunker of _bunkers) {
    for (let r = 0; r < BUNKER_ROWS; r++) {
      for (let c = 0; c < BUNKER_COLS; c++) {
        if (!bunker.cells[r][c]) continue;
        const cellX = bunker.topX + c * (BUNKER_CELL_SIZE + BUNKER_CELL_GAP);
        const cellY = bunker.topY + r * (BUNKER_CELL_SIZE + BUNKER_CELL_GAP);
        const cellRect = { x: cellX, y: cellY, width: BUNKER_CELL_SIZE, height: BUNKER_CELL_SIZE };
        if (aabb(bulletRect, cellRect)) {
          bunker.cells[r][c] = false;
          return true; // bullet consumed
        }
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Helper: fire from a random bottom-most invader in a column set
// ---------------------------------------------------------------------------
function fireEnemyBullet(invaderList) {
  const alive = invaderList.filter(i => i.alive);
  if (alive.length === 0) return;

  // Group by column, find bottom-most per column
  const byCol = {};
  for (const inv of alive) {
    if (!byCol[inv.col] || inv.y > byCol[inv.col].y) {
      byCol[inv.col] = inv;
    }
  }
  const shooters = Object.values(byCol);
  if (shooters.length === 0) return;
  const shooter = shooters[Math.floor(Math.random() * shooters.length)];
  _enemyBullets.push({
    x: shooter.x + INVADER_WIDTH / 2 - ENEMY_BULLET_WIDTH / 2,
    y: shooter.y + INVADER_HEIGHT,
  });
}

// ---------------------------------------------------------------------------
// Sub-formation step (used after split)
// ---------------------------------------------------------------------------
function stepFormation(formation, dt) {
  const alive = formation.invaders.filter(i => i.alive);
  if (alive.length === 0) return;

  formation.stepTimer += dt * 1000;
  const interval = stepInterval(alive.length);
  if (formation.stepTimer < interval) return;
  formation.stepTimer -= interval;

  const rightEdge = Math.max(...alive.map(i => i.x + INVADER_WIDTH));
  const leftEdge  = Math.min(...alive.map(i => i.x));

  const hitRight = formation.dirX > 0 && rightEdge + STEP_X > CANVAS_WIDTH;
  const hitLeft  = formation.dirX < 0 && leftEdge  - STEP_X < 0;

  if (hitRight || hitLeft) {
    for (const inv of formation.invaders) {
      inv.y += DROP_Y;
    }
    formation.dirX = -formation.dirX;
  } else {
    for (const inv of formation.invaders) {
      inv.x += STEP_X * formation.dirX;
    }
  }
}

// ---------------------------------------------------------------------------
// Perform the split
// ---------------------------------------------------------------------------
function performSplit() {
  _splitFired = true;

  const leftInvaders  = _invaders.filter(i => i.col <= SPLIT_COL);
  const rightInvaders = _invaders.filter(i => i.col >  SPLIT_COL);

  _leftFormation = {
    invaders:  leftInvaders,
    dirX:     -1,          // initially moving left
    stepTimer: 0,
  };

  _rightFormation = {
    invaders:  rightInvaders,
    dirX:      1,          // initially moving right
    stepTimer: 0,
  };
}

// ---------------------------------------------------------------------------
// Pre-split combined formation step
// ---------------------------------------------------------------------------
function stepCombinedFormation(dt) {
  const alive = _invaders.filter(i => i.alive);
  if (alive.length === 0) return;

  _stepTimer += dt * 1000;
  const interval = stepInterval(alive.length);
  if (_stepTimer < interval) return;
  _stepTimer -= interval;

  const rightEdge = Math.max(...alive.map(i => i.x + INVADER_WIDTH));
  const leftEdge  = Math.min(...alive.map(i => i.x));

  const hitRight = _dirX > 0 && rightEdge + STEP_X > CANVAS_WIDTH;
  const hitLeft  = _dirX < 0 && leftEdge  - STEP_X < 0;

  if (hitRight || hitLeft) {
    for (const inv of _invaders) {
      inv.y += DROP_Y;
    }
    _dirX = -_dirX;
  } else {
    for (const inv of _invaders) {
      inv.x += STEP_X * _dirX;
    }
  }
}

// ---------------------------------------------------------------------------
// Draw player ship (simple procedural, mirrors player.js style)
// ---------------------------------------------------------------------------
function drawPlayer(ctx) {
  if (_playerInvulnerable && !_playerVisible) return;

  const x = _playerX;
  const y = _playerY;

  ctx.save();

  // Hull
  ctx.fillStyle = '#00e0ff';
  ctx.fillRect(x + 8, y + 10, SHIP_WIDTH - 16, SHIP_HEIGHT - 10);

  // Cockpit
  ctx.beginPath();
  ctx.arc(x + SHIP_WIDTH / 2, y + 10, 10, Math.PI, 0, false);
  ctx.fillStyle = '#80ffff';
  ctx.fill();

  // Left wing
  ctx.fillStyle = '#0090c0';
  ctx.fillRect(x, y + 18, 12, 14);

  // Right wing
  ctx.fillRect(x + SHIP_WIDTH - 12, y + 18, 12, 14);

  // Engine nozzle
  ctx.fillStyle = '#ff8800';
  ctx.fillRect(x + SHIP_WIDTH / 2 - 4, y + SHIP_HEIGHT - 2, 8, 6);

  ctx.restore();

  // Player bullet
  if (_playerBullet !== null) {
    ctx.save();
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(_playerBullet.x, _playerBullet.y, BULLET_WIDTH, BULLET_HEIGHT);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Draw invaders
// ---------------------------------------------------------------------------
function drawInvaderList(ctx, list) {
  ctx.save();
  ctx.fillStyle = '#00FF00';
  for (const inv of list) {
    if (!inv.alive) continue;
    ctx.fillRect(inv.x, inv.y, INVADER_WIDTH, INVADER_HEIGHT);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Draw bunkers
// ---------------------------------------------------------------------------
function drawBunkers(ctx) {
  ctx.save();
  ctx.fillStyle = '#00FF00';
  for (const bunker of _bunkers) {
    for (let r = 0; r < BUNKER_ROWS; r++) {
      for (let c = 0; c < BUNKER_COLS; c++) {
        if (!bunker.cells[r][c]) continue;
        const cellX = bunker.topX + c * (BUNKER_CELL_SIZE + BUNKER_CELL_GAP);
        const cellY = bunker.topY + r * (BUNKER_CELL_SIZE + BUNKER_CELL_GAP);
        ctx.fillRect(cellX, cellY, BUNKER_CELL_SIZE, BUNKER_CELL_SIZE);
      }
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Draw HUD
// ---------------------------------------------------------------------------
function drawHUD(ctx) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('LIVES: ' + _lives, 16, 28);
  ctx.textAlign = 'center';
  ctx.fillText('LEVEL 3', CANVAS_WIDTH / 2, 28);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Draw enemy bullets
// ---------------------------------------------------------------------------
function drawEnemyBullets(ctx) {
  ctx.save();
  ctx.fillStyle = '#ff4444';
  for (const b of _enemyBullets) {
    ctx.fillRect(b.x, b.y, ENEMY_BULLET_WIDTH, ENEMY_BULLET_HEIGHT);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Update — called each frame with dt in seconds
// ---------------------------------------------------------------------------
function update(dt) {
  // ---- Player movement ----
  if (isKeyHeld('ArrowLeft') || isKeyHeld('KeyA')) {
    _playerX -= PLAYER_SPEED * dt;
  }
  if (isKeyHeld('ArrowRight') || isKeyHeld('KeyD')) {
    _playerX += PLAYER_SPEED * dt;
  }
  if (_playerX < 0) _playerX = 0;
  if (_playerX + SHIP_WIDTH > CANVAS_WIDTH) _playerX = CANVAS_WIDTH - SHIP_WIDTH;

  // ---- Invulnerability flash ----
  if (_playerInvulnerable) {
    _invulnTimer -= dt * 1000;
    _flashTimer  -= dt * 1000;
    if (_flashTimer <= 0) {
      _flashTimer   = 200;
      _playerVisible = !_playerVisible;
    }
    if (_invulnTimer <= 0) {
      _playerInvulnerable = false;
      _playerVisible      = true;
    }
  }

  // ---- Firing ----
  if (isKeyHeld('Space') && _playerBullet === null) {
    _playerBullet = {
      x: _playerX + (SHIP_WIDTH  - BULLET_WIDTH)  / 2,
      y: _playerY - BULLET_HEIGHT,
    };
  }

  // ---- Player bullet movement ----
  if (_playerBullet !== null) {
    _playerBullet.y -= BULLET_SPEED * dt;
    if (_playerBullet.y + BULLET_HEIGHT < 0) {
      _playerBullet = null;
    }
  }

  // ---- Player bullet vs bunkers ----
  if (_playerBullet !== null) {
    const hit = checkBulletVsBunkers(
      _playerBullet.x, _playerBullet.y, BULLET_WIDTH, BULLET_HEIGHT
    );
    if (hit) _playerBullet = null;
  }

  // ---- Player bullet vs invaders ----
  if (_playerBullet !== null) {
    const bulletRect = {
      x: _playerBullet.x, y: _playerBullet.y,
      width: BULLET_WIDTH, height: BULLET_HEIGHT,
    };
    // Check all alive invaders across active formations
    const allInvaders = _splitFired
      ? [..._leftFormation.invaders, ..._rightFormation.invaders]
      : _invaders;

    for (const inv of allInvaders) {
      if (!inv.alive) continue;
      if (aabb(bulletRect, invRect(inv))) {
        inv.alive = false;
        _playerBullet = null;
        _killedCount++;
        addExplosion(inv.x + INVADER_WIDTH / 2, inv.y + INVADER_HEIGHT / 2);
        addScore(10);
        break;
      }
    }
  }

  // ---- Split trigger ----
  if (!_splitFired && _killedCount >= SPLIT_THRESHOLD) {
    performSplit();
  }

  // ---- Formation movement ----
  if (!_splitFired) {
    stepCombinedFormation(dt);
  } else {
    stepFormation(_leftFormation,  dt);
    stepFormation(_rightFormation, dt);
  }

  // ---- Enemy fire timer ----
  _enemyFireTimer -= dt * 1000;
  if (_enemyFireTimer <= 0) {
    _enemyFireTimer = ENEMY_FIRE_INTERVAL;
    const allInvaders = _splitFired
      ? [..._leftFormation.invaders, ..._rightFormation.invaders]
      : _invaders;
    fireEnemyBullet(allInvaders);
  }

  // ---- Enemy bullet movement + collision ----
  for (let i = _enemyBullets.length - 1; i >= 0; i--) {
    const b = _enemyBullets[i];
    b.y += ENEMY_BULLET_SPEED * dt;

    // Off bottom of screen
    if (b.y > CANVAS_HEIGHT) {
      _enemyBullets.splice(i, 1);
      continue;
    }

    // vs bunkers
    const hitBunker = checkBulletVsBunkers(
      b.x, b.y, ENEMY_BULLET_WIDTH, ENEMY_BULLET_HEIGHT
    );
    if (hitBunker) {
      _enemyBullets.splice(i, 1);
      continue;
    }

    // vs player
    if (!_playerInvulnerable) {
      const bulletRect = {
        x: b.x, y: b.y,
        width: ENEMY_BULLET_WIDTH, height: ENEMY_BULLET_HEIGHT,
      };
      const playerRect = {
        x: _playerX, y: _playerY,
        width: SHIP_WIDTH, height: SHIP_HEIGHT,
      };
      if (aabb(bulletRect, playerRect)) {
        _enemyBullets.splice(i, 1);
        _lives--;
        if (_lives <= 0) {
          // Game over — stop the level and notify
          stop();
          // Show simple game-over text (no game.js dependency)
          _ctx.save();
          _ctx.fillStyle = 'rgba(0,0,0,0.75)';
          _ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          _ctx.fillStyle = '#ff0000';
          _ctx.font = 'bold 64px monospace';
          _ctx.textAlign = 'center';
          _ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
          _ctx.restore();
          return;
        } else {
          // Respawn with invulnerability
          _playerX = (CANVAS_WIDTH - SHIP_WIDTH) / 2;
          _playerInvulnerable = true;
          _invulnTimer = 2000;
          _flashTimer  = 200;
          _playerVisible = false;
        }
        continue;
      }
    }
  }

  // ---- Update explosions ----
  updateExplosions();

  // ---- Level-complete check ----
  if (countAllAlive() === 0) {
    stop();
    if (_onLevelComplete) _onLevelComplete();
  }
}

// ---------------------------------------------------------------------------
// Draw — called each frame after update
// ---------------------------------------------------------------------------
function draw() {
  const ctx = _ctx;

  // Clear
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // HUD
  drawHUD(ctx);

  // Bunkers
  drawBunkers(ctx);

  // Invaders
  if (!_splitFired) {
    drawInvaderList(ctx, _invaders);
  } else {
    drawInvaderList(ctx, _leftFormation.invaders);
    drawInvaderList(ctx, _rightFormation.invaders);
  }

  // Explosions
  drawExplosions(ctx);

  // Enemy bullets
  drawEnemyBullets(ctx);

  // Player
  drawPlayer(ctx);
}

// ---------------------------------------------------------------------------
// RAF loop
// ---------------------------------------------------------------------------
function loop(timestamp) {
  if (!_running) return;

  const dt = Math.min((timestamp - _lastTime) / 1000, 0.05); // cap at 50 ms
  _lastTime = timestamp;

  update(dt);
  if (_running) {
    draw();
    _rafId = requestAnimationFrame(loop);
  }
}

// ---------------------------------------------------------------------------
// stop — cancel the animation loop
// ---------------------------------------------------------------------------
function stop() {
  _running = false;
  if (_rafId !== null) {
    cancelAnimationFrame(_rafId);
    _rafId = null;
  }
}

// ---------------------------------------------------------------------------
// start — entry point called by game.js / index.html coordinator
//
// @param {HTMLCanvasElement}      canvas
// @param {CanvasRenderingContext2D} ctx
// @param {Function}               onLevelComplete
// @param {object}                 [opts]
// @param {number}                 [opts.lives=3]  — carried-over lives
// ---------------------------------------------------------------------------
function start(canvas, ctx, onLevelComplete, opts) {
  // Stop any existing loop first
  stop();

  _canvas          = canvas;
  _ctx             = ctx;
  _onLevelComplete = onLevelComplete;

  // Reset state
  _invaders        = buildInvaders();
  _bunkers         = buildBunkers();
  _splitFired      = false;
  _killedCount     = 0;
  _dirX            = 1;
  _stepTimer       = 0;
  _leftFormation   = null;
  _rightFormation  = null;
  _playerBullet    = null;
  _enemyBullets    = [];
  _enemyFireTimer  = ENEMY_FIRE_INTERVAL;

  // Player position
  _playerX         = (CANVAS_WIDTH - SHIP_WIDTH) / 2;
  _playerY         = 820;
  _lives           = (opts && opts.lives !== undefined) ? opts.lives : 3;
  _playerInvulnerable = false;
  _invulnTimer     = 0;
  _flashTimer      = 0;
  _playerVisible   = true;

  _running  = true;
  _lastTime = performance.now();
  _rafId    = requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export const level3 = { start, stop, update, draw };
export default level3;
