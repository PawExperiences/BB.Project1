// gameConfig.js — Shared game configuration constants.

/** Canvas width in pixels. */
export const CANVAS_WIDTH = 768;

/** Canvas height in pixels. */
export const CANVAS_HEIGHT = 896;

/** Player ship speed in pixels per second. */
export const PLAYER_SPEED = 200;

/** Bullet travel speed in pixels per second (upward). */
export const BULLET_SPEED = 500;

/** Starting number of lives for a new game. */
export const STARTING_LIVES = 3;

// ── Invader grid layout ──────────────────────────────────────────────────────

/** Invader cell width in pixels (bounding box used for AABB). */
export const INV_CELL_W = 36;

/** Invader cell height in pixels (bounding box used for AABB). */
export const INV_CELL_H = 24;

/** Horizontal gap between invader cells. */
export const INV_GAP_X = 16;

/** Vertical gap between invader cells. */
export const INV_GAP_Y = 18;

/**
 * Pixels dropped each time the formation reverses direction.
 * Set to INV_CELL_H so each drop is exactly one invader cell height.
 */
export const INV_DROP_STEP = 24;

/** Horizontal padding from canvas edge that triggers direction reversal. */
export const INV_EDGE_PAD = 16;

/** Base horizontal speed of the invader formation in pixels per second.
 * Used for continuous movement inside a single step; the step interval
 * is now controlled by the timing formula in InvaderGrid.
 */
export const INV_BASE_SPEED = 60;

// ── Scoring and effects ───────────────────────────────────────────────────────

/** Points awarded per invader kill. */
export const SCORE_PER_KILL = 10;

/** Duration of the explosion flash effect in milliseconds. */
export const EXPLOSION_DURATION_MS = 300;

// ── Level 1 step-interval formula constants ──────────────────────────────────

/** Step interval (ms) when all 55 invaders are alive. */
export const STEP_INTERVAL_MAX_MS = 800;

/** Step interval (ms) when only 1 invader remains. */
export const STEP_INTERVAL_MIN_MS = 100;

/** Total invader count for the interval formula denominator. */
export const TOTAL_INVADERS = 55;

/** Pixels the formation moves horizontally each discrete step. */
export const INV_STEP_PX = 8;
