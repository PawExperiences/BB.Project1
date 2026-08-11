// gameConfig.js
// Shared constants for the Space Invaders clone.
// Sibling cards (input/player, sprites/collision, levels 1-3, boss) import
// these values so gameplay tuning lives in one place.

export const CANVAS_WIDTH = 768;
export const CANVAS_HEIGHT = 896;
export const PLAYER_SPEED = 200; // px/sec, used by the future player card
export const BULLET_SPEED = 500; // px/sec, used by the future collision/player cards
export const STARTING_LIVES = 3;
