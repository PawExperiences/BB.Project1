// AABB collision pass: player-bullet-vs-invader and invader-bullet-vs-player.
// Called from game.js's update() step, strictly before rendering ("collide,
// then draw"). Reuses the player's bullet size (BULLET_WIDTH/BULLET_HEIGHT
// from player.js) and the score/game-over hooks already exported by
// game.js, instead of redefining any of them here.

import { hud, triggerGameOver } from './game.js';
import { BULLET_WIDTH, BULLET_HEIGHT } from './player.js';

const SCORE_PER_INVADER = 10;
const EXPLOSION_DURATION = 0.3; // seconds
const EXPLOSION_COLOR = '#ffca28';

const explosions = []; // { x, y, age } -- transient, drawn as a fading ring

function overlaps(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function spawnExplosion(invader) {
  explosions.push({
    x: invader.x + invader.width / 2,
    y: invader.y + invader.height / 2,
    age: 0,
  });
}

function updateExplosions(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].age += dt;
    if (explosions[i].age >= EXPLOSION_DURATION) {
      explosions.splice(i, 1);
    }
  }
}

// Player bullet vs invaders: on a hit, both are removed, an explosion plays
// at the invader's last position, and the score increments.
function checkPlayerBulletVsInvaders(player, invaderFormation) {
  const bullet = player.bullet;
  if (!bullet) return;

  const bulletBox = { x: bullet.x, y: bullet.y, width: BULLET_WIDTH, height: BULLET_HEIGHT };
  const invaders = invaderFormation.invaders;

  for (let i = 0; i < invaders.length; i++) {
    const invader = invaders[i];
    if (overlaps(bulletBox, invader)) {
      spawnExplosion(invader);
      invaders.splice(i, 1);
      player.bullet = null;
      hud.score += SCORE_PER_INVADER;
      break; // a single bullet only ever hits one invader
    }
  }
}

// Invader-bullet vs player. Written generically over any array of bullet
// objects ({ x, y }, falling back to the shared bullet size when a bullet
// doesn't carry its own width/height) so it is already correct once
// invader-firing logic lands in a later card -- this card never populates
// `invaderFormation.bullets` itself.
function checkInvaderBulletsVsPlayer(invaderBullets, player) {
  const playerBox = { x: player.x, y: player.y, width: player.width, height: player.height };

  for (let i = invaderBullets.length - 1; i >= 0; i--) {
    const bullet = invaderBullets[i];
    const bulletBox = {
      x: bullet.x,
      y: bullet.y,
      width: bullet.width ?? BULLET_WIDTH,
      height: bullet.height ?? BULLET_HEIGHT,
    };

    if (overlaps(bulletBox, playerBox)) {
      invaderBullets.splice(i, 1);
      player.loseLife();
      hud.lives = player.lives;
      if (player.lives <= 0) {
        triggerGameOver();
      }
    }
  }
}

export function update(dt, player, invaderFormation) {
  checkPlayerBulletVsInvaders(player, invaderFormation);
  checkInvaderBulletsVsPlayer(invaderFormation.bullets, player);
  updateExplosions(dt);
}

export function draw(ctx) {
  for (const explosion of explosions) {
    const t = explosion.age / EXPLOSION_DURATION;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = EXPLOSION_COLOR;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, 6 + t * 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
