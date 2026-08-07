// Shared game constants used across all modules.

export const CANVAS_WIDTH   = 768;
export const CANVAS_HEIGHT  = 896;
export const PLAYER_SPEED   = 200; // px/sec
export const BULLET_SPEED   = 500; // px/sec
export const STARTING_LIVES = 3;

// Alias kept for backward-compatibility with any code that imports startingLives.
export const startingLives  = STARTING_LIVES;
