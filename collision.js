// collision.js
// Reusable AABB collision check, plus the two collision pairs this card
// owns: the player's bullet vs. the invader grid, and an invader bullet vs.
// the player ship. A kill spawns a brief explosion effect and bumps
// hud.score; a player hit only invokes the existing player.loseLife()
// response from the player-ship card -- no new life/game-over behaviour is
// invented here. game.js calls collide() during its per-frame update, ahead
// of that frame's render pass, then drawExplosions() during render.

import { hud } from './game.js';

// Mirrors the bullet rectangle player.js draws (BULLET_WIDTH/BULLET_HEIGHT
// there); player.bullet only carries { x, y }, so the collision box is
// reconstructed here rather than redefining the bullet entity.
const PLAYER_BULLET_WIDTH = 4;
const PLAYER_BULLET_HEIGHT = 16;

const EXPLOSION_DURATION = 0.25; // seconds a kill's explosion effect is shown
const EXPLOSION_COLOR = '#ffaa00';
const SCORE_PER_KILL = 10;

const explosions = []; // { x, y, width, height, timeLeft }

export function aabbIntersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function spawnExplosion(rect) {
  explosions.push({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    timeLeft: EXPLOSION_DURATION,
  });
}

function updateExplosions(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].timeLeft -= dt;
    if (explosions[i].timeLeft <= 0) {
      explosions.splice(i, 1);
    }
  }
}

function checkBulletVsInvaders(player, invaderFormation) {
  const bullet = player.bullet;
  if (!bullet) return;

  const bulletRect = {
    x: bullet.x,
    y: bullet.y,
    width: PLAYER_BULLET_WIDTH,
    height: PLAYER_BULLET_HEIGHT,
  };

  const invaders = invaderFormation.invaders;
  for (let i = 0; i < invaders.length; i++) {
    if (aabbIntersects(bulletRect, invaders[i])) {
      spawnExplosion(invaders[i]);
      invaders.splice(i, 1);
      player.bullet = null;
      hud.score += SCORE_PER_KILL;
      break;
    }
  }
}

function checkInvaderBulletsVsPlayer(player, invaderFormation) {
  const bullets = invaderFormation.bullets;
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (aabbIntersects(bullets[i], player)) {
      bullets.splice(i, 1);
      player.loseLife();
    }
  }
}

// Runs and fully resolves this frame's collisions. game.js must call this
// before its render pass so hits are reflected in the same frame's draw.
export function collide(dt, player, invaderFormation) {
  updateExplosions(dt);
  checkBulletVsInvaders(player, invaderFormation);
  checkInvaderBulletsVsPlayer(player, invaderFormation);
}

export function drawExplosions(ctx) {
  ctx.fillStyle = EXPLOSION_COLOR;
  for (const explosion of explosions) {
    ctx.fillRect(explosion.x, explosion.y, explosion.width, explosion.height);
  }
}
