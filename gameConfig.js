// Shared constants for the Space Invaders clone.
// Consumed by game.js and imported by sibling cards as they are added, so
// every card uses the same values.

export const CANVAS_WIDTH = 768;
export const CANVAS_HEIGHT = 896;
export const PLAYER_SPEED = 200;
export const BULLET_SPEED = 500;
export const STARTING_LIVES = 3;

// Invader formation (invaders.js): grid shape, sprite geometry, spacing and
// march pacing. The step interval is a fixed constant here — the classic
// grid's difficulty-ramping march speed is a level concern, not this one.
export const INVADER_COLS = 11;
export const INVADER_ROWS = 5;
export const INVADER_WIDTH = 36;
export const INVADER_HEIGHT = 24;
export const INVADER_H_SPACING = 12;
export const INVADER_V_SPACING = 8;
export const INVADER_STEP_X = 8;
export const INVADER_ROW_DROP = INVADER_HEIGHT + INVADER_V_SPACING;
export const INVADER_STEP_INTERVAL = 0.8;

// Level 1 (level1.js): the march pacing's linear speed-up as invaders die,
// from LEVEL1_STEP_INTERVAL_MAX_MS at 55 alive down to
// LEVEL1_STEP_INTERVAL_MIN_MS at 1 alive.
export const LEVEL1_STEP_INTERVAL_MAX_MS = 800;
export const LEVEL1_STEP_INTERVAL_MIN_MS = 100;

// Collision pass (collision.js): score award, explosion lifetime and the
// invulnerability window granted after the player is hit.
export const SCORE_PER_INVADER = 10;
export const EXPLOSION_DURATION = 0.3;
export const PLAYER_INVULNERABILITY_SECONDS = 2;

// Level 2 (level2.js): the march speed-up factor, the enemy-fire volley
// interval, hostile bullet speed, the UFO's cadence/speed/score tiers and
// the post-respawn invulnerability window.
export const LEVEL2_MARCH_INTERVAL_FACTOR = 0.67;
export const LEVEL2_FIRE_INTERVAL_MIN_MS = 800;
export const LEVEL2_FIRE_INTERVAL_MAX_MS = 2000;
export const LEVEL2_INVADER_BULLET_SPEED = 300;
export const LEVEL2_UFO_INTERVAL_MS = 20000;
export const LEVEL2_UFO_SPEED = 120;
export const LEVEL2_UFO_SCORE_TIERS = [50, 100, 150, 300];
export const LEVEL2_RESPAWN_INVULNERABILITY_S = 2;
