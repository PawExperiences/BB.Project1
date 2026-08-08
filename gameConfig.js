// gameConfig.js — shared constants for the entire Space Invaders project

export const CANVAS_WIDTH   = 800;  // pixels
export const CANVAS_HEIGHT  = 600;  // pixels
export const PLAYER_SPEED   = 200;  // pixels per second
export const BULLET_SPEED   = 500;  // pixels per second
export const INITIAL_LIVES  = 3;

// Backward-compatible alias used by game.js (Game loop card)
export const STARTING_LIVES = INITIAL_LIVES;
