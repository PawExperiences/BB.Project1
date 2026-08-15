// Level 4: the boss fight, the game's finale.
//
// A single large multi-phase boss with an HP bar, horizontal drift, and a
// two-phase three-bullet spread attack. Reuses collision.js's existing
// update()/draw() pass for all hit-testing -- both player-bullet-vs-boss and
// boss-bullet-vs-player -- by exposing the same `{ invaders, bullets }`
// formation shape Levels 1-3 already pass it, instead of writing a second
// collision implementation. HP loss and the sudden-death rule are detected
// from that pass's side effects (the boss hitbox being spliced out, the
// player's lives dropping) one frame later -- the same "react on the next
// update()" pattern Level 1-3 already use to notice collision.js removing
// things from their arrays.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './gameConfig.js';
import { BULLET_WIDTH, BULLET_HEIGHT } from './player.js';
import { triggerGameOver, triggerWin } from './game.js';

const BOSS_WIDTH = 160;
const BOSS_HEIGHT = 80;
const BOSS_Y = 90; // fixed for the whole fight -- the boss never descends
const BOSS_SPEED = 90; // px/sec, horizontal drift
const BOSS_COLOR = '#ab47bc';

const MAX_HP = 10;
const PHASE2_HP_THRESHOLD = 5; // HP strictly below this fires the faster interval
const FIRE_INTERVAL_PHASE1_MS = 1500;
const FIRE_INTERVAL_PHASE2_MS = 700;

const SPREAD_ANGLE_DEG = 20; // either side of straight down
const BULLET_SPEED = 260; // px/sec
const BULLET_COLOR = '#ff1744';

const HEALTH_BAR_X = 84; // clear of the HUD's Score/Level/Lives text row
const HEALTH_BAR_Y = 60;
const HEALTH_BAR_WIDTH = CANVAS_WIDTH - HEALTH_BAR_X * 2;
const HEALTH_BAR_HEIGHT = 14;
const HEALTH_BAR_BG = '#333';
const HEALTH_BAR_FILL = '#e53935';
const HEALTH_BAR_BORDER = '#fff';

function fireIntervalFor(hp) {
  return hp < PHASE2_HP_THRESHOLD ? FIRE_INTERVAL_PHASE2_MS : FIRE_INTERVAL_PHASE1_MS;
}

export class Level4 {
  constructor() {
    this.x = CANVAS_WIDTH / 2 - BOSS_WIDTH / 2;
    this.y = BOSS_Y;
    this.direction = 1; // 1 = moving right, -1 = moving left
    this.hp = MAX_HP;
    this.cleared = false;

    // The AABB collision.js checks player bullets against, wrapped in an
    // array because collision.js's player-bullet pass iterates an
    // "invaders" list and splices whichever entry a bullet overlaps.
    this.hitbox = { x: this.x, y: this.y, width: BOSS_WIDTH, height: BOSS_HEIGHT };
    this.bullets = []; // boss projectiles: { x, y, vx, vy }

    // Same `{ invaders, bullets }` shape Levels 1-3 pass as `formation` to
    // collision.update()/draw() -- see game.js's level dispatcher.
    this.formation = { invaders: [this.hitbox], bullets: this.bullets };

    this.fireTimerMs = fireIntervalFor(this.hp);
    this.lastPlayerLives = null; // seeded from the player on the first update()
  }

  fireSpread() {
    // Bullet x/y are the top-left corner of the AABB collision.js checks
    // (falling back to BULLET_WIDTH/BULLET_HEIGHT, same as any other
    // generic invader bullet) -- centered here so the hitbox starts truly
    // on the boss's centre point, same offset math Level 2/3 use for their
    // own bullets.
    const centerX = this.x + BOSS_WIDTH / 2 - BULLET_WIDTH / 2;
    const centerY = this.y + BOSS_HEIGHT / 2 - BULLET_HEIGHT / 2;
    const angleRad = (SPREAD_ANGLE_DEG * Math.PI) / 180;

    for (const angle of [0, -angleRad, angleRad]) {
      this.bullets.push({
        x: centerX,
        y: centerY,
        vx: Math.sin(angle) * BULLET_SPEED,
        vy: Math.cos(angle) * BULLET_SPEED,
      });
    }
  }

  updateMovement(dt) {
    this.x += BOSS_SPEED * this.direction * dt;
    if (this.x <= 0) {
      this.x = 0;
      this.direction = 1;
    } else if (this.x + BOSS_WIDTH >= CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - BOSS_WIDTH;
      this.direction = -1;
    }

    // Keep the hitbox collision.js reads in sync with the boss's position
    // for this frame's pass, whether or not it currently sits in `invaders`.
    this.hitbox.x = this.x;
    this.hitbox.y = this.y;
  }

  updateFiring(dt) {
    this.fireTimerMs -= dt * 1000;
    if (this.fireTimerMs > 0) return;
    this.fireTimerMs = fireIntervalFor(this.hp);
    this.fireSpread();
  }

  updateBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (bullet.y > CANVAS_HEIGHT || bullet.x < 0 || bullet.x > CANVAS_WIDTH) {
        this.bullets.splice(i, 1);
      }
    }
  }

  update(dt, player) {
    if (this.cleared) return;

    if (this.lastPlayerLives === null) {
      this.lastPlayerLives = player.lives;
    }

    // React to last frame's collision.js pass: the hitbox vanishing from
    // `invaders` means a player bullet landed on the boss.
    if (this.formation.invaders.length === 0) {
      this.hp = Math.max(0, this.hp - 1);
      if (this.hp > 0) {
        this.formation.invaders.push(this.hitbox);
      } else {
        this.cleared = true;
        triggerWin();
        return;
      }
    }

    // Sudden death: any lives drop while the boss fight is running came
    // from a boss bullet (collision.js's checkInvaderBulletsVsPlayer, via
    // `this.formation.bullets`) -- end the run immediately regardless of
    // remaining HP, unlike the normal lives-reach-0 path Levels 1-3 use.
    if (player.lives < this.lastPlayerLives) {
      this.lastPlayerLives = player.lives;
      triggerGameOver();
      return;
    }
    this.lastPlayerLives = player.lives;

    this.updateMovement(dt);
    this.updateFiring(dt);
    this.updateBullets(dt);
  }

  draw(ctx) {
    ctx.fillStyle = BOSS_COLOR;
    ctx.fillRect(this.x, this.y, BOSS_WIDTH, BOSS_HEIGHT);

    ctx.fillStyle = BULLET_COLOR;
    for (const bullet of this.bullets) {
      ctx.fillRect(bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT);
    }

    this.drawHealthBar(ctx);
  }

  drawHealthBar(ctx) {
    ctx.fillStyle = HEALTH_BAR_BG;
    ctx.fillRect(HEALTH_BAR_X, HEALTH_BAR_Y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);

    const hp = Math.max(this.hp, 0);
    const fillWidth = (hp / MAX_HP) * HEALTH_BAR_WIDTH;
    ctx.fillStyle = HEALTH_BAR_FILL;
    ctx.fillRect(HEALTH_BAR_X, HEALTH_BAR_Y, fillWidth, HEALTH_BAR_HEIGHT);

    ctx.strokeStyle = HEALTH_BAR_BORDER;
    ctx.strokeRect(HEALTH_BAR_X, HEALTH_BAR_Y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`BOSS ${hp}/${MAX_HP}`, CANVAS_WIDTH / 2, HEALTH_BAR_Y + HEALTH_BAR_HEIGHT - 3);
  }
}
