// The tiny level registry/loader: a map from level number to a factory
// that creates that level's object.
// Added by "Level 1: the classic grid".
//
// Each level module registers itself at load time:
//
//   import { registerLevel } from './levels.js';
//   registerLevel(1, (context) => new Level1(context));
//
// and game.js drives the active level through the small interface the
// factories produce:
//
//   level.formation   the InvaderFormation the collision pass and the
//                     renderer work on
//   level.update(dt)  advance the level one fixed step (marching and its
//                     acceleration, breach and clear detection,
//                     restart-on-breach)
//   level.draw(ctx)   draw the level (shared sprite/formation code only)
//   level.cleared     true once the level's clear condition is met;
//                     game.js then increments the level counter and calls
//                     createLevel(n + 1, context) to hand off
//
// Registering another level (e.g. "Level 2: they shoot back") needs no
// change here or in level1.js: level2.js registers itself with
// registerLevel(2, ...) and game.js gains one import line so the
// registration runs.

const factories = new Map();

// Register the factory that creates the level for the given 1-based level
// number. Called once per level module, at module load time.
export function registerLevel(levelNumber, factory) {
  factories.set(levelNumber, factory);
}

// True when a module has registered a factory for the given level number.
export function isLevelRegistered(levelNumber) {
  return factories.has(levelNumber);
}

// Instantiate the level registered for levelNumber, or null when no module
// has registered it (yet). context is the slice of game state game.js
// shares with every level: { player, hud, hostileBullets }.
export function createLevel(levelNumber, context) {
  const factory = factories.get(levelNumber);
  return factory === undefined ? null : factory(context);
}
