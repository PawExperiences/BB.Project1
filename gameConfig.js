// gameConfig.js — Shared constants for Space Invaders

export const CANVAS_WIDTH = 768;
export const CANVAS_HEIGHT = 896;
export const PLAYER_SPEED = 200;    // px/s
export const BULLET_SPEED = 500;    // px/s
export const STARTING_LIVES = 3;
export const TARGET_FPS = 60;

// Fixed timestep in milliseconds (1000 / 60 ≈ 16.667 ms)
export const TIMESTEP = 1000 / TARGET_FPS;

// Cap accumulated delta to 5 timesteps to prevent tab-background burst
export const MAX_ACCUMULATED_DELTA = 5 * TIMESTEP;
