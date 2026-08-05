// gameConfig.js — Shared configuration constants for Space Invaders

export const CANVAS_WIDTH   = 768;
export const CANVAS_HEIGHT  = 896;
export const PLAYER_SPEED   = 200;  // pixels per second
export const BULLET_SPEED   = 500;  // pixels per second
export const STARTING_LIVES = 3;

// Alias used by player.js (task spec references startingLives)
export const startingLives  = STARTING_LIVES;

// Invader grid configuration
export const INVADER_COLS        = 11;
export const INVADER_ROWS        = 5;
export const INVADER_WIDTH       = 36;   // px — width of each invader cell
export const INVADER_HEIGHT      = 24;   // px — height of each invader cell
export const INVADER_H_GAP       = 12;   // px — horizontal gap between cells
export const INVADER_V_GAP       = 16;   // px — vertical gap between cells
export const INVADER_STEP_X      = 8;    // px — horizontal pixels per tick
export const INVADER_DROP_Y      = 24;   // px — vertical drop on direction reversal
export const INVADER_TOP_MARGIN  = 80;   // px — distance from top of canvas to first row
export const INVADER_POINT_VALUE = 10;   // score points awarded per invader kill
export const EXPLOSION_DURATION  = 150;  // ms — how long the kill flash is shown
