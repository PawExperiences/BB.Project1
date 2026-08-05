// boss.js — Level 4: Boss Fight (Multi-Phase Finale)
// ES module. Registers itself with the game loop via registerLevel().

import { registerLevel, transitionTo, hudState, player, enterGameOver, ctx as gameCtx } from './game.js';
import { checkHit } from './collision.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { triggerExplosion } from './explosion.js';

// ---------------------------------------------------------------------------
// Boss constants
// ---------------------------------------------------------------------------
const BOSS_WIDTH  = 160;
const BOSS_HEIGHT = 100;
const BOSS_X      = Math.round((CANVAS_WIDTH - BOSS_WIDTH) / 2);
const BOSS_Y      = 80;
const BOSS_MAX_HP = 10;

// Health bar
const HBAR_WIDTH  = 200;
const HBAR_HEIGHT = 16;
const HBAR_X      = Math.round((CANVAS_WIDTH - HBAR_WIDTH) / 2);
const HBAR_Y      = BOSS_Y - 28;

// Boss projectile dimensions
const BPROJ_WIDTH  = 8;
const BPROJ_HEIGHT = 18;

// Fire intervals (milliseconds)
const FIRE_INTERVAL_PHASE1 = 2000; // 2 s  (Phase 1: 10 HP → 6 HP)
const FIRE_INTERVAL_PHASE2 =  900; // 0.9 s (Phase 2: 5 HP → 0 HP) — >2× faster

// Boss projectile speed (pixels per second, downward)
const BPROJ_SPEED = 280;

// ---------------------------------------------------------------------------
// Boss state
// ---------------------------------------------------------------------------
let bossHp         = BOSS_MAX_HP;
let phase          = 1;           // 1 or 2
let fireTimer      = 0;           // ms since last shot
let bossProjectiles = [];         // array of {x,y,width,height}
let done           = false;       // true when boss is dead
let flashTimer     = 0;           // ms remaining of phase-transition flash
let phaseJustChanged = false;     // triggers a flash
let winScreenActive = false;      // true when win screen is up

// ---------------------------------------------------------------------------
// Initialise boss state
// ---------------------------------------------------------------------------
function initBoss() {
  bossHp          = BOSS_MAX_HP;
  phase           = 1;
  fireTimer       = 0;
  bossProjectiles = [];
  done            = false;
  flashTimer      = 0;
  phaseJustChanged = false;
  winScreenActive  = false;
}

// ---------------------------------------------------------------------------
// update(dt) — called every fixed-timestep tick (dt in seconds)
// ---------------------------------------------------------------------------
function update(dt) {
  if (done) return;

  const dtMs = dt * 1000;

  // Flash countdown
  if (flashTimer > 0) {
    flashTimer -= dtMs;
    if (flashTimer < 0) flashTimer = 0;
  }

  // -------------------------------------------------------------------------
  // Fire timer — boss fires centred projectile downward
  // -------------------------------------------------------------------------
  const currentInterval = (phase === 1) ? FIRE_INTERVAL_PHASE1 : FIRE_INTERVAL_PHASE2;
  fireTimer += dtMs;
  if (fireTimer >= currentInterval) {
    fireTimer -= currentInterval;
    // Spawn a projectile centred on the boss, just below it
    bossProjectiles.push({
      x:      BOSS_X + Math.round((BOSS_WIDTH - BPROJ_WIDTH) / 2),
      y:      BOSS_Y + BOSS_HEIGHT,
      width:  BPROJ_WIDTH,
      height: BPROJ_HEIGHT,
    });
  }

  // -------------------------------------------------------------------------
  // Move boss projectiles downward
  // -------------------------------------------------------------------------
  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    bossProjectiles[i].y += BPROJ_SPEED * dt;
    // Remove if off-screen
    if (bossProjectiles[i].y > CANVAS_HEIGHT) {
      bossProjectiles.splice(i, 1);
    }
  }

  // -------------------------------------------------------------------------
  // Collision: boss projectile vs player — sudden death
  // -------------------------------------------------------------------------
  const currentPlayer = player;
  if (currentPlayer) {
    const playerRect = {
      x:      currentPlayer.x,
      y:      currentPlayer.y,
      width:  40,   // SHIP_WIDTH from player.js
      height: 32,   // SHIP_HEIGHT from player.js
    };
    for (let i = bossProjectiles.length - 1; i >= 0; i--) {
      if (checkHit(bossProjectiles[i], playerRect)) {
        // Sudden death — reset to Level 1
        done = true;
        winScreenActive = false;
        // Reset HUD
        hudState.score = 0;
        hudState.lives = 3; // STARTING_LIVES
        hudState.level = 1;
        transitionTo('level1');
        return;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Collision: player bullet vs boss — 1 HP per hit, bullet consumed
  // -------------------------------------------------------------------------
  if (currentPlayer) {
    const bullet = currentPlayer.getBullet();
    if (bullet) {
      const bossRect = {
        x:      BOSS_X,
        y:      BOSS_Y,
        width:  BOSS_WIDTH,
        height: BOSS_HEIGHT,
      };
      if (checkHit(bullet, bossRect)) {
        currentPlayer.clearBullet();
        bossHp -= 1;
        triggerExplosion(BOSS_X + BOSS_WIDTH / 2 - 15, BOSS_Y + BOSS_HEIGHT / 2 - 10);

        // Phase transition check: HP drops to 5
        if (phase === 1 && bossHp <= 5) {
          phase = 2;
          fireTimer = 0; // reset timer so rate change is immediate
          flashTimer = 800; // 800 ms flash
          phaseJustChanged = true;
        } else {
          phaseJustChanged = false;
        }

        // Win condition
        if (bossHp <= 0) {
          bossHp = 0;
          done = true;
          winScreenActive = true;
          if (hudState.score > hudState.hiScore) {
            hudState.hiScore = hudState.score;
          }
          // Listen for restart
          _attachWinListeners();
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Win screen restart listener
// ---------------------------------------------------------------------------
let _winKeyListener   = null;

function _attachWinListeners() {
  if (_winKeyListener) return; // already attached
  _winKeyListener = (e) => {
    if (e.code === 'Enter' || e.code === 'Space') {
      _detachWinListeners();
      // Reset score + lives and go to Level 1
      hudState.score = 0;
      hudState.lives = 3;
      hudState.level = 1;
      transitionTo('level1');
    }
  };
  window.addEventListener('keydown', _winKeyListener);
}

function _detachWinListeners() {
  if (_winKeyListener) {
    window.removeEventListener('keydown', _winKeyListener);
    _winKeyListener = null;
  }
}

// ---------------------------------------------------------------------------
// render(ctx) — called every animation frame
// ---------------------------------------------------------------------------
function render(ctx) {
  // -------------------------------------------------------------------------
  // Win screen — drawn instead of normal boss
  // -------------------------------------------------------------------------
  if (winScreenActive) {
    renderWinScreen(ctx);
    return;
  }

  // -------------------------------------------------------------------------
  // Boss body
  // -------------------------------------------------------------------------
  const isFlashing = flashTimer > 0;

  // Body fill colour: white flash during phase transition, then phase-tinted
  if (isFlashing) {
    // Alternate between white and phase-2 colour rapidly
    const flashCycle = Math.floor(flashTimer / 100) % 2;
    ctx.fillStyle = flashCycle === 0 ? '#ffffff' : '#ff4400';
  } else {
    ctx.fillStyle = phase === 1 ? '#cc44ff' : '#ff2200';
  }

  // Main rectangular hull
  ctx.fillRect(BOSS_X, BOSS_Y + 30, BOSS_WIDTH, BOSS_HEIGHT - 30);

  // Domed top (arc)
  ctx.beginPath();
  ctx.arc(
    BOSS_X + BOSS_WIDTH / 2,
    BOSS_Y + 30,
    BOSS_WIDTH / 2,
    Math.PI, 0, false
  );
  ctx.fill();

  // Eye / cannon aperture — dark circle in centre
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(
    BOSS_X + BOSS_WIDTH / 2,
    BOSS_Y + 55,
    12, 0, Math.PI * 2
  );
  ctx.fill();

  // Eye glow — phase colour
  ctx.fillStyle = phase === 1 ? '#cc44ff' : '#ff2200';
  ctx.beginPath();
  ctx.arc(
    BOSS_X + BOSS_WIDTH / 2,
    BOSS_Y + 55,
    6, 0, Math.PI * 2
  );
  ctx.fill();

  // Left wing
  ctx.fillStyle = isFlashing
    ? (Math.floor(flashTimer / 100) % 2 === 0 ? '#ffffff' : '#ff4400')
    : (phase === 1 ? '#aa22dd' : '#cc1100');
  ctx.fillRect(BOSS_X - 40, BOSS_Y + 50, 40, 24);

  // Right wing
  ctx.fillRect(BOSS_X + BOSS_WIDTH, BOSS_Y + 50, 40, 24);

  // Wing tips (lines)
  ctx.strokeStyle = phase === 1 ? '#ff88ff' : '#ff6600';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(BOSS_X - 40, BOSS_Y + 50);
  ctx.lineTo(BOSS_X - 55, BOSS_Y + 45);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(BOSS_X + BOSS_WIDTH + 40, BOSS_Y + 50);
  ctx.lineTo(BOSS_X + BOSS_WIDTH + 55, BOSS_Y + 45);
  ctx.stroke();

  // -------------------------------------------------------------------------
  // Health bar
  // -------------------------------------------------------------------------
  renderHealthBar(ctx);

  // -------------------------------------------------------------------------
  // Boss projectiles
  // -------------------------------------------------------------------------
  ctx.fillStyle = phase === 1 ? '#ff88ff' : '#ff4400';
  for (const proj of bossProjectiles) {
    ctx.fillRect(Math.round(proj.x), Math.round(proj.y), proj.width, proj.height);
  }
}

// ---------------------------------------------------------------------------
// Health bar renderer
// ---------------------------------------------------------------------------
function renderHealthBar(ctx) {
  // Background track
  ctx.fillStyle = '#333';
  ctx.fillRect(HBAR_X, HBAR_Y, HBAR_WIDTH, HBAR_HEIGHT);

  // Fill — colour changes with phase
  const fillW = Math.round((bossHp / BOSS_MAX_HP) * HBAR_WIDTH);
  if (phase === 1) {
    ctx.fillStyle = '#44ff44'; // green in phase 1
  } else {
    ctx.fillStyle = '#ff3300'; // red in phase 2
  }
  ctx.fillRect(HBAR_X, HBAR_Y, fillW, HBAR_HEIGHT);

  // Border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(HBAR_X, HBAR_Y, HBAR_WIDTH, HBAR_HEIGHT);

  // HP text
  ctx.fillStyle = '#fff';
  ctx.font = '13px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`HP: ${bossHp} / ${BOSS_MAX_HP}`, HBAR_X + HBAR_WIDTH / 2, HBAR_Y + HBAR_HEIGHT / 2);
}

// ---------------------------------------------------------------------------
// Win screen renderer
// ---------------------------------------------------------------------------
function renderWinScreen(ctx) {
  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  // Victory title
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 64px monospace';
  ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);

  // Congratulatory message
  ctx.fillStyle = '#ffffff';
  ctx.font = '28px monospace';
  ctx.fillText('The boss has been defeated!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

  // Final score
  ctx.fillStyle = '#00ff88';
  ctx.font = '32px monospace';
  ctx.fillText(`Final Score: ${hudState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);

  // Restart prompt
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px monospace';
  ctx.fillText('Press ENTER or SPACE to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
}

// ---------------------------------------------------------------------------
// Initialise and register with the game loop
// ---------------------------------------------------------------------------
initBoss();
registerLevel({ update, render });
