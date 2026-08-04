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

/** Pixels dropped each time the formation reverses direction. */
export const INV_DROP_STEP = 20;

/** Horizontal padding from canvas edge that triggers direction reversal. */
export const INV_EDGE_PAD = 16;

/** Base horizontal speed of the invader formation in pixels per second. */
export const INV_BASE_SPEED = 60;

// ── Scoring and effects ───────────────────────────────────────────────────────

/** Points awarded per invader kill. */
export const SCORE_PER_KILL = 10;

/** Duration of the explosion flash effect in milliseconds. */
export const EXPLOSION_DURATION_MS = 300;
