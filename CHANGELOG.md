## 0.1.0 -- e2e space invaders 0.1.0

# Changelog

## [0.1.0] - Initial Release

### Added
- `index.html`: Entry point hosting a 768×896 px `<canvas>` element on a dark (`#000`) background, loading `game.js` as an ES module.
- `gameConfig.js`: Named exports for all shared constants (`CANVAS_WIDTH=768`, `CANVAS_HEIGHT=896`, `PLAYER_SPEED=200`, `BULLET_SPEED=500`, `STARTING_LIVES=3`).
- `game.js`: Fixed-timestep game loop (60 steps/s, 250 ms delta cap), three-scene state machine (Title → Playing → Game Over), canvas HUD renderer, and exported `hudState` object.
- `input.js`: `initInput()` and `isKeyHeld(key)` using a held-key map (no key-repeat dependency).
- `player.js`: `Player` class with delta-time movement, boundary clamping, single-in-flight bullet, procedural canvas rendering, and `lives` property seeded from `gameConfig.js`.
- `invaders.js`: 11×5 invader grid (55 invaders, 24×16 px cells, 32×24 px stride), horizontal march with edge-drop (16 px) and direction reversal, AABB collision detection for player bullet vs. invaders and invader bullets vs. player, explosion flash effect (~300 ms), score increment of 10 pts per kill.
- `collision.js`: Dedicated AABB collision pass integrated into the `update` cycle before `render`.
- Level 1: Formation speed scaling linearly from ~800 ms/step (55 invaders) to ~100 ms/step (1 invader); lose condition (invader reaches player ship top → lose 1 life, level restart); win condition (all 55 killed → advance to Level 2); HUD displays current level number.
- Level 2: Faster invader movement (measurable multiplier increase over Level 1); invader downward projectiles from bottom-most alive invader per column at random intervals; bonus UFO crossing the top of the screen with points awarded by `playerShotCount % 4` → `[50, 100, 150, 300]`; player respawn with ≥1.5 s invulnerability window (flashing indicator) after a hit; game-over flow triggered on last life lost.
- Level 3: Four destructible shield bunkers (4×4 grid of ~8×8 px cells, green, placed at ~80% canvas height); cell-by-cell erosion by player or invader bullets; formation split at 50% kills — remaining invaders divide into left and right halves sweeping independently in opposite directions; transition to Boss level on full clear.
- `README.md`: File-layout map and manual verification steps for all features through Level 3.
