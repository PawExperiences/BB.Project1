// formation.js — shared Space Invaders formation constants
// Imported by level1.js, level2.js, level3.js, and any module that needs
// the canonical 11×5 grid geometry.
//
// This file owns the single source of truth for cell dimensions, invader
// types, column/row counts, and the initial vertical offset of the formation.

// ---------------------------------------------------------------------------
// Cell dimensions (invader sprite size + inter-invader gap)
// ---------------------------------------------------------------------------
export const INVADER_WIDTH  = 32;  // px — sprite bounding box width
export const INVADER_HEIGHT = 24;  // px — sprite bounding box height
export const INVADER_GAP_X  = 8;   // px — horizontal gap between invaders
export const INVADER_GAP_Y  = 8;   // px — vertical gap between invaders

// Cell size including the gap (the repeating unit of the grid)
export const CELL_W = INVADER_WIDTH  + INVADER_GAP_X;  // 40 px
export const CELL_H = INVADER_HEIGHT + INVADER_GAP_Y;  // 32 px

// ---------------------------------------------------------------------------
// Grid dimensions
// ---------------------------------------------------------------------------
export const COLS = 11;
export const ROWS = 5;
export const TOTAL_INVADERS = COLS * ROWS; // 55

// ---------------------------------------------------------------------------
// Invader type per row (0 = top rows, 1 = middle rows, 2 = bottom row)
// Row 0 (top)    → type 0  (worth most / drawn differently in later cards)
// Rows 1–2       → type 1
// Rows 3–4       → type 2  (bottom rows)
// ---------------------------------------------------------------------------
export const ROW_TYPES = [0, 1, 1, 2, 2];

// ---------------------------------------------------------------------------
// Initial formation origin
// ---------------------------------------------------------------------------
export const FORMATION_TOP = 80;   // px from canvas top to the top of row 0
// Horizontal centering is computed at runtime using canvasWidth:
//   originX = Math.round((canvasWidth - (COLS * CELL_W - INVADER_GAP_X)) / 2)

// Convenience: total pixel span of the formation (excluding trailing gap)
export const FORMATION_WIDTH  = COLS * CELL_W - INVADER_GAP_X;  // 432 px
export const FORMATION_HEIGHT = ROWS * CELL_H - INVADER_GAP_Y;  // 152 px
