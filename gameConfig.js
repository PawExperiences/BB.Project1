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

// ---------------------------------------------------------------------------
// Level 2 — new mechanics
// ---------------------------------------------------------------------------

/** Formation marches this many times faster than Level 1 (verifiable via console). */
export const LEVEL2_SPEED_MULTIPLIER   = 1.4;

/** Downward travel speed of invader-fired bullets (px/s). */
export const INVADER_BULLET_SPEED      = 260;
/** Width of an invader bullet (px). */
export const INVADER_BULLET_WIDTH      = 3;
/** Height of an invader bullet (px). */
export const INVADER_BULLET_HEIGHT     = 14;

/** Minimum time between invader shots (ms). */
export const INVADER_FIRE_INTERVAL_MIN = 600;
/** Maximum time between invader shots (ms). */
export const INVADER_FIRE_INTERVAL_MAX = 1500;

/** UFO horizontal crossing speed (px/s). */
export const UFO_SPEED           = 120;
/** UFO sprite width (px). */
export const UFO_WIDTH           = 52;
/** UFO sprite height (px). */
export const UFO_HEIGHT          = 22;
/** Y position of the UFO row from the canvas top (px). */
export const UFO_Y               = 70;
/** Milliseconds between successive UFO appearances. */
export const UFO_SPAWN_INTERVAL  = 14000;
/**
 * Score awarded for shooting the UFO, indexed by (playerShotCount % 4).
 * [50, 100, 150, 300]
 */
export const UFO_SCORE_TABLE     = [50, 100, 150, 300];

/** Duration of the post-respawn invulnerability window (ms). */
export const INVULNERABILITY_DURATION = 2000;
/** Ship sprite on/off toggle period during the invulnerability blink (ms). */
export const BLINK_INTERVAL          = 150;
