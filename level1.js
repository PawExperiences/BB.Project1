// level1.js — Level 1: The Classic Grid
// ES module; owns the 11×5 invader formation, movement, speed scaling,
// edge-drop, win/lose detection, and the Level HUD label.
//
// Imports only from sibling ES modules already present in the project.
// Works under a file:// URL with no bundler or npm dependencies.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { aabb } from './collision.js';

// ---------------------------------------------------------------------------
// Formation constants
// ---------------------------------------------------------------------------
const COLS         = 11;   // columns of invaders
const ROWS         = 5;    // rows of invaders
const TOTAL_INVADERS = COLS * ROWS; // 55

const CELL_SIZE    = 48;   // px — each invader occupies a 48×48 px cell
const SPRITE_SIZE  = 32;   // px — the rendered sprite is 32×32 px
const CELL_PADDING = (CELL_SIZE - SPRITE_SIZE) / 2; // 8 px padding each side

// Horizontal distance moved per step (px).
// One step fires on the interval determined by the speed formula below.
// Value: 12 px per step (chosen to be visible yet precise; falls in 8–16 px range).
const STEP_DISTANCE = 12; // px per horizontal step

// Formation starting position (top-left of the bounding box)
const FORMATION_START_X = 64;
const FORMATION_START_Y = 80;

// ---------------------------------------------------------------------------
// Speed interpolation
// ---------------------------------------------------------------------------
// Step interval scales linearly with the number of living invaders:
//   55 alive  →  800 ms per step
//    1 alive  →  100 ms per step
// Formula: interval = 100 + (aliveCount - 1) * (700 / 54)   [milliseconds]
// (linear interpolation between 100 ms and 800 ms over 1..55 invaders)
const INTERVAL_MIN  = 100;  // ms  (1 invader alive)
const INTERVAL_MAX  = 800;  // ms  (55 invaders alive)
const INTERVAL_SPAN = INTERVAL_MAX - INTERVAL_MIN; // 700
const ALIVE_SPAN    = TOTAL_INVADERS - 1;           // 54

/**
 * stepInterval — returns the ms between horizontal steps for a given live count.
 * @param {number} aliveCount  number of living invaders (1 … 55)
 * @returns {number}  interval in milliseconds
 */
function stepInterval(aliveCount) {
  // Clamp so the formula never goes below INTERVAL_MIN
  const n = Math.max(1, aliveCount);
  return INTERVAL_MIN + (n - 1) * (INTERVAL_SPAN / ALIVE_SPAN);
}

// ---------------------------------------------------------------------------
// Invader record (plain object, not a class — keeps this module self-contained)
// ---------------------------------------------------------------------------
// Each invader: { x, y, width, height, alive }
// x, y are the TOP-LEFT corner of the sprite (NOT the cell).

// ---------------------------------------------------------------------------
// Module-level state (reset by init())
// ---------------------------------------------------------------------------
let _canvas      = null;
let _ctx         = null;
let _playerState = null;  // { x, y, width, height } — supplied by caller

let _invaders    = [];    // flat array, length 55 at start
let _direction   = 1;     // +1 = right, -1 = left
let _stepTimer   = 0;     // accumulated ms since last step
let _aliveCount  = 0;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * init — (re)initialises Level 1 state.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x:number, y:number, width:number, height:number }} playerState
 *   Caller must keep this object up-to-date; level1 reads it each frame.
 *   `x` and `y` must be the TOP-LEFT corner of the player sprite.
 */
export function init(canvas, ctx, playerState) {
  _canvas      = canvas;
  _ctx         = ctx;
  _playerState = playerState;

  _direction   = 1;
  _stepTimer   = 0;
  _invaders    = _createFormation();
  _aliveCount  = TOTAL_INVADERS; // 55
}

/**
 * update — advances Level 1 logic one frame.
 *
 * @param {number} deltaTime  seconds elapsed since the previous frame
 * @param {Array<{x:number,y:number,width:number,height:number}>} playerBullets
 *   Live player bullets (top-left origin); the function removes entries that
 *   hit an invader and sets invader.alive = false.
 * @returns {null | 'LIFE_LOST' | 'NEXT_LEVEL'}
 */
export function update(deltaTime, playerBullets = []) {
  if (!_canvas || !_invaders.length) return null;

  // ------------------------------------------------------------------
  // 1. Collision: player bullets vs invaders
  // ------------------------------------------------------------------
  _checkBulletCollisions(playerBullets);

  // ------------------------------------------------------------------
  // 2. Win check — last invader was just destroyed
  // ------------------------------------------------------------------
  if (_aliveCount <= 0) {
    return 'NEXT_LEVEL';
  }

  // ------------------------------------------------------------------
  // 3. Step timer — advance by deltaTime (convert s → ms)
  // ------------------------------------------------------------------
  _stepTimer += deltaTime * 1000;
  const interval = stepInterval(_aliveCount); // recalculates from current count

  if (_stepTimer >= interval) {
    _stepTimer -= interval;
    _doStep();
  }

  // ------------------------------------------------------------------
  // 4. Lose check — formation bottom reached player top
  // ------------------------------------------------------------------
  if (_playerState) {
    const formationBottom = _formationBottom();
    // player top edge: if playerState uses top-left origin use .y;
    // if it uses centre-y the caller should normalise before passing.
    // We document that playerState.y is the TOP edge of the player sprite.
    if (formationBottom >= _playerState.y) {
      return 'LIFE_LOST';
    }
  }

  return null;
}

/**
 * draw — renders the formation and the Level HUD each frame.
 * Must be called from the game loop's render phase.
 */
export function draw() {
  if (!_ctx) return;

  // Draw alive invaders
  _ctx.fillStyle = '#00ff00';
  for (const inv of _invaders) {
    if (inv.alive) {
      _ctx.fillRect(Math.round(inv.x), Math.round(inv.y), inv.width, inv.height);
    }
  }

  // HUD — "LEVEL 1" drawn at bottom-centre, above the player area.
  // Canvas height is 896 px; player sits at ~y=836 (896-60).
  // We place the label at y = CANVAS_HEIGHT - 24 so it sits below
  // the formation and player activity zone but stays on screen.
  // Alternatively, it could go top-centre between the score and formation;
  // we choose bottom-centre so it does not obscure anything above.
  const hudX = (_canvas ? _canvas.width : CANVAS_WIDTH) / 2;
  const hudY = (_canvas ? _canvas.height : CANVAS_HEIGHT) - 8;

  _ctx.save();
  _ctx.textAlign    = 'center';
  _ctx.textBaseline = 'bottom';
  _ctx.fillStyle    = '#aaffaa';
  _ctx.font         = '16px monospace';
  _ctx.fillText('LEVEL 1', hudX, hudY);
  _ctx.restore();
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function _createFormation() {
  const invaders = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = FORMATION_START_X + col * CELL_SIZE + CELL_PADDING;
      const y = FORMATION_START_Y + row * CELL_SIZE + CELL_PADDING;
      invaders.push({
        x,
        y,
        width:  SPRITE_SIZE,
        height: SPRITE_SIZE,
        alive:  true,
      });
    }
  }
  return invaders; // exactly 55 entries
}

/**
 * _doStep — moves the entire formation one step horizontally.
 * If a live invader would breach the canvas edge, the formation drops
 * CELL_SIZE px (48 px) and reverses direction instead.
 */
function _doStep() {
  const canvasW = _canvas ? _canvas.width : CANVAS_WIDTH;
  const dx      = STEP_DISTANCE * _direction;

  // Tentatively apply the horizontal move
  for (const inv of _invaders) {
    inv.x += dx;
  }

  // Check whether any live invader now exceeds a boundary
  let hitWall = false;
  for (const inv of _invaders) {
    if (!inv.alive) continue;
    if (inv.x < 0 || inv.x + inv.width > canvasW) {
      hitWall = true;
      break;
    }
  }

  if (hitWall) {
    // Undo the step, drop down by one cell height, reverse
    for (const inv of _invaders) {
      inv.x -= dx;       // undo overshot horizontal move
      inv.y += CELL_SIZE; // drop exactly 48 px
    }
    _direction *= -1;
  }
}

/**
 * _checkBulletCollisions — tests each active player bullet against each live
 * invader using AABB.  Mutates both arrays in-place.
 *
 * @param {Array<{x:number,y:number,width:number,height:number}>} bullets
 */
function _checkBulletCollisions(bullets) {
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const bullet = bullets[bi];
    let hit = false;

    for (const inv of _invaders) {
      if (!inv.alive) continue;

      if (_aabb(bullet, inv)) {
        inv.alive = false;
        _aliveCount--;
        hit = true;
        break; // one bullet hits at most one invader
      }
    }

    if (hit) {
      bullets.splice(bi, 1);
    }
  }
}

/**
 * Local AABB helper — avoids depending on collision.js's internal `aabb`
 * (which is not exported).  Rects are { x, y, width, height }, top-left origin.
 *
 * @param {{x:number,y:number,width:number,height:number}} a
 * @param {{x:number,y:number,width:number,height:number}} b
 * @returns {boolean}
 */
function _aabb(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * _formationBottom — returns the maximum y + height among all live invaders.
 * @returns {number}
 */
function _formationBottom() {
  let bottom = -Infinity;
  for (const inv of _invaders) {
    if (!inv.alive) continue;
    const edge = inv.y + inv.height;
    if (edge > bottom) bottom = edge;
  }
  return bottom;
}

// ---------------------------------------------------------------------------
// Read-only introspection helpers (useful for testing / DevTools)
// ---------------------------------------------------------------------------

/** Returns the count of currently living invaders. */
export function aliveCount() { return _aliveCount; }

/** Returns a shallow copy of the invader array (for inspection only). */
export function getInvaders() { return _invaders.slice(); }
