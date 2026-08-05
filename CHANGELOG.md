## 0.1.0 -- e2e space invaders 0.1.0

# Changelog

## [0.1.0] - Initial Release

### Added
- `index.html`: Entry point hosting a 768×896 px `<canvas id="gameCanvas">` on a dark background; loads `game.js` as an ES module. No build step or server required — opens via `file://` URL.
- `gameConfig.js`: Named exports for all shared constants (`CANVAS_WIDTH=768`, `CANVAS_HEIGHT=896`, `PLAYER_SPEED=200`, `BULLET_SPEED=500`, `STARTING_LIVES=3`).
- `game.js`: Main entry module implementing the fixed-timestep game loop (1/60 s update step, 250 ms delta cap, `requestAnimationFrame`), a three-scene state machine (`title` → `playing` → `gameover`), HUD rendering (score top-left, lives top-right), and the exported `hudState` object (`{ score, lives, hiScore }`).
- `input.js`: Keyboard input scaffold module with at least one named export.
- `player.js`: Player module stub with correct export shape.
- `invaders.js`: Invaders module stub with correct export shape.
- `collision.js`: Collision module stub with correct export shape.
- `README.md`: File layout table for all modules, manual verification steps for each scene, and a note that the project runs from `file://` with no build step.
- CI workflow scaffolded by BuildBoard (`.github/workflows/build.yml`).
