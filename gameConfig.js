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
