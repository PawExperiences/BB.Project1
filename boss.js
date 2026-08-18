// Boss level: multi-phase finale (Level 4).
// Added by "Boss level: multi-phase finale".
//
// The fight is an ordinary entry in the level registry (levels.js):
// clearing Level 3 makes game.js's level-number dispatch bump the counter
// to 4 and this module's factory creates the fight — the same mechanism
// used for the 1 -> 2 -> 3 transitions, with no special-case entry point.
//
//   body      one 160 x 80 px boss drawn purely from canvas primitives
//             (rects and paths — no image assets), drifting horizontally
//             at 90 px/s and reversing direction at each canvas edge; its
//             vertical position NEVER changes during the fight
//   health    10 HP; each player projectile hit deals exactly 1 damage
//             (stated assumption folded into the spec). A health bar
//             spans the top of the canvas for the whole fight, its filled
//             length always current HP / 10 of the track
//   attack    a three-bullet spread from the boss's centre: one bullet
//             straight down plus one each at -20 deg and +20 deg from
//             straight down, every bullet travelling at 260 px/s
//   phases    phase 1 (HP > 5): a spread every 1500 ms; phase 2 (from
//             the moment HP reaches 5): a spread every 700 ms. The fire
//             interval is the ONLY phase change — pattern, bullet speed
//             and movement are identical in both phases
//   sudden    a single boss projectile hitting the player ends the run
//   death     immediately, regardless of remaining lives: the lives
//             counter is zeroed and game.js's ordinary lives <= 0 check
//             runs the existing game-over -> title -> new game flow,
//             which always restarts at Level 1 (no boss retry)
//   victory   at 0 HP the fight sets `victory`; game.js switches to the
//             WIN scene, where this module draws the win screen (final
//             score + an ENTER-to-restart prompt; the restart starts a
//             fresh run at Level 1)
//
// All hit-testing calls the shared overlaps() helper imported from
// collision.js — this module contains no collision routine of its own.
// collision.js's collide() pass is not involved in the fight: its
// player-bullet-vs-invader loop sees this level's empty formation
// stand-in, and its hostile-bullet-vs-player path applies loseLife(),
// which cannot express sudden death. Boss bullets therefore live in this
// module's own list and are tested here — never pushed into the shared
// hostileBullets list.
//
// Assumptions folded in from the spec: Level 4 spawns no shields, so boss
// projectiles are only hit-tested against the player; there is no
// boss-kill score bonus — the win screen shows the score exactly as it
// stands when the boss dies; health-bar styling is the builder's choice
// as long as it spans the top of the canvas and stays proportional to HP.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { overlaps } from './collision.js';
import { registerLevel } from './levels.js';

// Boss geometry in px. The hitbox is the full 160 x 80 rect: this.x/y is
// the top-left corner — the plain { x, y, width, height } shape the
// shared overlaps() test expects.
const BOSS_WIDTH = 160;
const BOSS_HEIGHT = 80;
// The constant vertical position for the entire fight — the boss never
// descends. 120 px puts the body just below the HUD band (the Score/Lives
// text ends at y = 52) and clear of the health bar at the very top.
const BOSS_Y = 120;
const BOSS_SPEED = 90; // px/s, horizontal only

const BOSS_MAX_HP = 10;
const DAMAGE_PER_HIT = 1; // stated assumption: 1 damage per player projectile

// Attack pattern: 260 px/s bullets in a three-way spread, the side
// bullets angled +/- 20 deg from straight down.
const BULLET_SPEED = 260; // px/s
const SPREAD_ANGLE = (20 * Math.PI) / 180; // radians from straight down
const BULLET_WIDTH = 8;
const BULLET_HEIGHT = 8;
const BULLET_COLOR = '#ff5533';

// Phases: the fire interval is the only difference — 1500 ms while
// HP > 5, 700 ms from the moment HP reaches 5.
const PHASE_TWO_HP = 5;
const FIRE_INTERVAL_PHASE_ONE_MS = 1500;
const FIRE_INTERVAL_PHASE_TWO_MS = 700;

// Brief white flash on the boss body when a player projectile lands —
// pure visual feedback with no gameplay effect.
const HIT_FLASH_SECONDS = 0.12;

// Health bar: a track spanning the top of the canvas; the filled portion
// is always hp / BOSS_MAX_HP of the track width.
const BAR_MARGIN = 8;
const BAR_Y = 4;
const BAR_HEIGHT = 10;
const BAR_TRACK_COLOR = '#331122';
const BAR_FILL_COLOR = '#ff3355';
const BAR_BORDER_COLOR = '#ffffff';

// Boss body palette.
const HULL_COLOR = '#aa2244';
const DARK_COLOR = '#661126';
const CORE_COLOR = '#ffcc33';

export class BossLevel {
  // context is game.js's shared slice of game state
  // ({ player, hud, hostileBullets }). The boss needs the player — its
  // in-flight bullet, its bounding box and the lives counter sudden death
  // zeroes — and the hud, whose score the win screen displays.
  // hostileBullets is deliberately NOT used; see the header comment.
  constructor(context) {
    this.player = context.player;
    this.hud = context.hud;

    this.width = BOSS_WIDTH;
    this.height = BOSS_HEIGHT;
    this.x = (CANVAS_WIDTH - this.width) / 2; // start horizontally centered
    this.y = BOSS_Y; // never reassigned: no vertical movement, ever
    this.direction = 1; // +1 = drifting right, -1 = drifting left

    this.hp = BOSS_MAX_HP;

    // Boss projectiles in flight: { x, y, width, height, vx, vy }, x/y
    // the top-left corner for the shared AABB test, vx/vy in px/s.
    this.bullets = [];

    // Milliseconds accumulated toward the next spread. Like Level 1's
    // march timer, the remainder is kept across shots so the average
    // fire rate stays exact at the 60 steps/s fixed timestep.
    this.fireTimerMs = 0;

    this.flashTimer = 0;

    // game.js's level interface. `cleared` is never set by this level —
    // the fight ends through `victory`, which game.js maps to the WIN
    // scene rather than advancing to a Level 5 that does not exist.
    this.cleared = false;
    this.victory = false;

    // Formation stand-in: game.js's per-frame collide() pass destructures
    // currentLevel.formation.invaders. The boss arena holds no invaders,
    // so an empty list keeps that loop a no-op; the boss's own overlap
    // checks run in update() below via the shared overlaps() helper.
    this.formation = { invaders: [] };
  }

  // One spread = three bullets from the boss's centre: straight down
  // (angle 0) plus one each rotated +/- SPREAD_ANGLE from straight down.
  // The direction vector for an angle a measured from straight down is
  // (sin a, cos a), so angle 0 flies at (0, BULLET_SPEED) and every
  // bullet's speed is exactly BULLET_SPEED px/s.
  fireSpread() {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    for (const angle of [-SPREAD_ANGLE, 0, SPREAD_ANGLE]) {
      this.bullets.push({
        x: centerX - BULLET_WIDTH / 2,
        y: centerY - BULLET_HEIGHT / 2,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        vx: Math.sin(angle) * BULLET_SPEED,
        vy: Math.cos(angle) * BULLET_SPEED,
      });
    }
  }

  update(dt) {
    // The fight is over the moment victory is set; game.js switches to
    // the WIN scene in this same fixed step, so nothing may move or fire
    // any more.
    if (this.victory) return;

    // Horizontal drift at BOSS_SPEED px/s (dt-scaled, so it is framerate
    // independent), reversing direction at each canvas edge and snapping
    // flush to it. this.y is never touched.
    this.x += this.direction * BOSS_SPEED * dt;
    if (this.x <= 0) {
      this.x = 0;
      this.direction = 1;
    } else if (this.x + this.width >= CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.width;
      this.direction = -1;
    }

    // Phased firing: the interval is re-read every update from the
    // CURRENT hp, so the moment a hit brings the boss to 5 HP the very
    // next wait is 700 ms. Because the timer keeps its remainder, a
    // leftover that already exceeds the shorter interval fires at once —
    // the phase-2 rate takes effect immediately, as specified.
    this.fireTimerMs += dt * 1000;
    const intervalMs =
      this.hp > PHASE_TWO_HP
        ? FIRE_INTERVAL_PHASE_ONE_MS
        : FIRE_INTERVAL_PHASE_TWO_MS;
    if (this.fireTimerMs >= intervalMs) {
      this.fireTimerMs -= intervalMs;
      this.fireSpread();
    }

    // Bullet flight along each bullet's fixed velocity; a bullet that
    // has fully left the canvas is removed.
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (
        bullet.y > CANVAS_HEIGHT ||
        bullet.x + bullet.width < 0 ||
        bullet.x > CANVAS_WIDTH
      ) {
        this.bullets.splice(i, 1);
      }
    }

    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
    }

    // Player projectile vs boss — the shared AABB test from collision.js.
    // Each hit deals exactly DAMAGE_PER_HIT and consumes the bullet; the
    // health bar picks the new hp up on this same frame's draw.
    const playerBullet = this.player.bullet;
    if (playerBullet !== null && overlaps(playerBullet, this)) {
      this.player.bullet = null;
      this.hp = Math.max(0, this.hp - DAMAGE_PER_HIT);
      this.flashTimer = HIT_FLASH_SECONDS;
      if (this.hp === 0) {
        // Win: the fight ends here. Victory takes precedence over a boss
        // bullet connecting in this same fixed step, so the sudden-death
        // check below is skipped once the boss is dead.
        this.victory = true;
        this.bullets.length = 0;
        return;
      }
    }

    // Boss projectile vs player — sudden death. One hit ends the run
    // immediately, no matter how many lives remain: the lives counter is
    // zeroed outright (player.js documents that it may also be assigned
    // directly), overriding even the post-respawn invulnerability window,
    // and game.js's ordinary lives <= 0 check ends the game in this same
    // fixed step. The existing game-over flow then restarts at Level 1.
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      if (overlaps(this.bullets[i], this.player)) {
        this.bullets.splice(i, 1);
        this.player.lives = 0;
        break;
      }
    }
  }

  draw(ctx) {
    this.drawHealthBar(ctx);
    this.drawBoss(ctx);

    ctx.fillStyle = BULLET_COLOR;
    for (const bullet of this.bullets) {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
  }

  // The health bar spans the top of the canvas for the whole fight. It is
  // re-drawn from the live hp every frame, so the filled length — exactly
  // hp / BOSS_MAX_HP of the track — updates on the very frame a hit
  // lands.
  drawHealthBar(ctx) {
    const trackWidth = CANVAS_WIDTH - BAR_MARGIN * 2;

    ctx.fillStyle = BAR_TRACK_COLOR;
    ctx.fillRect(BAR_MARGIN, BAR_Y, trackWidth, BAR_HEIGHT);

    const fillWidth = trackWidth * (this.hp / BOSS_MAX_HP);
    if (fillWidth > 0) {
      ctx.fillStyle = BAR_FILL_COLOR;
      ctx.fillRect(BAR_MARGIN, BAR_Y, fillWidth, BAR_HEIGHT);
    }

    ctx.strokeStyle = BAR_BORDER_COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      BAR_MARGIN - 0.5,
      BAR_Y - 0.5,
      trackWidth + 1,
      BAR_HEIGHT + 1,
    );
  }

  // The boss body: 160 x 80 px of canvas primitives — filled rects and
  // arcs, no image assets.
  drawBoss(ctx) {
    const x = this.x;
    const y = this.y;
    const centerX = x + this.width / 2;

    // Main hull band, upper deck and command tower.
    ctx.fillStyle = HULL_COLOR;
    ctx.fillRect(x, y + 24, this.width, 32);
    ctx.fillRect(x + 24, y + 8, 112, 16);
    ctx.fillRect(x + 48, y, 64, 8);

    // Cockpit dome on the hull's centre line.
    ctx.beginPath();
    ctx.arc(centerX, y + 24, 14, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // Three cannon housings slung under the hull.
    ctx.fillStyle = DARK_COLOR;
    ctx.fillRect(x + 16, y + 56, 12, 24);
    ctx.fillRect(centerX - 6, y + 56, 12, 24);
    ctx.fillRect(x + this.width - 28, y + 56, 12, 24);

    // Glowing core at the centre of the hull.
    ctx.fillStyle = CORE_COLOR;
    ctx.beginPath();
    ctx.arc(centerX, y + 40, 8, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    // Hit flash: a white overlay that fades over HIT_FLASH_SECONDS.
    if (this.flashTimer > 0) {
      ctx.globalAlpha = (this.flashTimer / HIT_FLASH_SECONDS) * 0.75;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, this.width, this.height);
      ctx.globalAlpha = 1;
    }
  }

  // The win screen, drawn by game.js while the WIN scene is active: the
  // final score exactly as it stood when the boss died (there is no
  // boss-kill bonus) plus the restart prompt. ENTER starts a fresh run
  // at Level 1.
  drawWinScreen(ctx) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px monospace';
    ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    ctx.font = '24px monospace';
    ctx.fillText(
      `Final Score: ${this.hud.score}`,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 - 10,
    );

    ctx.font = '20px monospace';
    ctx.fillText(
      'Press ENTER to restart',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 40,
    );
    ctx.textAlign = 'left';
  }
}

// Self-registration: game.js imports this module once so this line runs,
// and clearing Level 3 makes the existing level-number dispatch create
// the fight for Level 4 with no further wiring — the same handoff used
// for the 1 -> 2 -> 3 transitions.
registerLevel(4, (context) => new BossLevel(context));
