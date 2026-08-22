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

// Collision pass (collision.js): score award, explosion lifetime and the
// invulnerability window granted after the player is hit.
export const SCORE_PER_INVADER = 10;
export const EXPLOSION_DURATION = 0.3;
export const PLAYER_INVULNERABILITY_SECONDS = 2;
