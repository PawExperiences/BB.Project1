// gameConfig.js — Shared configuration constants for Space Invaders

export const CANVAS_WIDTH   = 768;
export const CANVAS_HEIGHT  = 896;
export const PLAYER_SPEED   = 200;  // pixels per second
export const BULLET_SPEED   = 500;  // pixels per second
export const STARTING_LIVES = 3;

// Alias used by player.js (task spec references startingLives)
export const startingLives  = STARTING_LIVES;
