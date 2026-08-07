// state.js — shared game state across levels
// Imported by level1.js, level2.js, player.js, and game.js.
// sessionShotCount: cumulative player shots for the entire session (never reset between levels).
// lives: current player lives, carried across levels.

export const state = {
  sessionShotCount: 0,
  lives: 3,
};
