// Shared constants for the Space Invaders game loop and canvas. Sibling
// cards (input, player, invaders, collision, levels 1-3, boss) import from
// here instead of restating these numbers as literals.

export const CANVAS_WIDTH = 768;
export const CANVAS_HEIGHT = 896;

export const PLAYER_SPEED = 200; // px/s
export const BULLET_SPEED = 500; // px/s

export const STARTING_LIVES = 3;

// Caps the per-frame delta the fixed-timestep loop will consume. Without
// this, returning to a backgrounded tab after several seconds would hand
// the loop a huge elapsed time and it would burn through a burst of
// catch-up update() steps, fast-forwarding the game instead of resuming it.
export const MAX_FRAME_DELTA = 0.25; // seconds

// Invader fleet grid (11 x 5 = 55 invaders).
export const INVADER_COLUMNS = 11;
export const INVADER_ROWS = 5;
export const INVADER_WIDTH = 32;
export const INVADER_HEIGHT = 24;
export const INVADER_GUTTER_X = 16;
export const INVADER_GUTTER_Y = 16;
export const INVADER_TOP_MARGIN = 48;

export const INVADER_KILL_SCORE = 10;

// How long a kill/hit explosion rectangle stays on screen before collision.js
// removes it.
export const EXPLOSION_DURATION = 0.2; // seconds
