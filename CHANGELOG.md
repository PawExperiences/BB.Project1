## 0.1.0 -- e2e space invaders 0.1.0

# Changelog

## [0.1.0] - Initial Release

### Added
- `index.html`: Minimal HTML5 document with a 768×896 px canvas, dark background, opens from `file://` with no server required.
- `gameConfig.js`: ES module exporting `CANVAS_WIDTH=768`, `CANVAS_HEIGHT=896`, `PLAYER_SPEED=200`, `BULLET_SPEED=500`, `STARTING_LIVES=3`.
- `game.js`: Fixed-timestep game loop (60 Hz, ≤250 ms delta cap), scene state machine (Title → Playing → Game Over), HUD drawn on canvas, exports `hudState { score, lives, hiScore }`.
- `input.js`: ES module exporting `initInput()` and `isKeyHeld(code)` using `KeyboardEvent.code`; key-repeat-safe.
- `player.js`: `Player` class with `update(dt)` / `draw(ctx)` / `getBounds()`; clamped movement, single-in-flight bullet, procedural ship sprite.
- `formation.js`: Shared 11×5 grid layout constants (cell dimensions, invader types, initial positions).
- `invaders.js`: `InvaderGrid` class — 11×5 formation, step-and-drop movement, per-invader `alive` flag and `getBounds()`.
- `collision.js`: `CollisionSystem` class — AABB bullet-vs-invader and invader-bullet-vs-player checks, explosion effect rendering, `getScore()`.
- `state.js`: Shared session state (`sessionShotCount`, `lives`) imported by Levels 1 and 2.
- `level1.js`: Level 1 — classic 55-invader grid, linearly-scaled step interval (800 ms → 100 ms), breach detection, life loss, calls `game.nextLevel()` on clear.
- `level2.js`: Level 2 — 1.5× faster formation, invader shooting (random 800–2000 ms interval, lowest-alive-in-column fires, 300 px/s), player respawn with 2 s invulnerability and flash, UFO every 20 s (alternating sides, 120 px/s, tier scoring from `sessionShotCount`).
- `level3.js`: Level 3 — four destructible 4×4 bunkers at ~80% canvas height, formation split at 28th kill (columns 1–6 left, 7–11 right, independent sweep), transition to Boss on full clear.
- `boss.js`: Level 4 — 160×80 px canvas-primitive boss, horizontal drift at 90 px/s, 10 HP, Phase 1 (≥5 HP) fires 3-bullet spread every 1500 ms, Phase 2 (<5 HP) every 700 ms at 260 px/s, sudden-death on player hit resets to Level 1, Win Screen on 0 HP.
- `.github/workflows/build.yml`: Replaced broken npm-install workflow with a static-project-aware workflow: verifies `index.html` exists, packages static files as a release artifact, no `package.json` required.
- `README.md`: Added `## Planned File Layout` section listing all eight future module files with owning card names; added manual verification steps for all levels.

### Fixed
- CI workflow no longer attempts `npm install` / `yarn install` on a zero-dependency static project; build now passes green on every push.
