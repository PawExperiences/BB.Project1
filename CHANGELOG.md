## 0.1.0 -- e2e space invaders 0.1.0

# Changelog

## [0.1.0] - Initial Release

### Added
- **`index.html`** — Single-page host; 768×896 `<canvas>` centred on a dark background, loads `game.js` as an ES module. Works from a `file://` URL with no server.
- **`gameConfig.js`** — Shared constants: `CANVAS_WIDTH=768`, `CANVAS_HEIGHT=896`, `PLAYER_SPEED=200`, `BULLET_SPEED=500`, `STARTING_LIVES=3`.
- **`game.js`** — Main entry point: fixed-timestep loop (60 Hz, delta capped at 250 ms), `update(dt)` / `render()` phases, three-scene state machine (`title` → `playing` → `gameover`), ENTER-key transitions, canvas-drawn HUD (score / lives / hi-score), exported `hudState` named export.
- **`input.js`** — Keyboard-state module: `initInput()` attaches `keydown`/`keyup` listeners; `isKeyHeld(code)` returns current hold state; ignores `event.repeat` to suppress browser key-repeat.
- **`player.js`** — `Player` class: procedurally drawn ship (arcs + rects, no assets), delta-time movement (ArrowLeft/KeyA, ArrowRight/KeyD) with edge clamping, single-bullet firing (Space), bullet expiry at canvas top.
- **`invaders.js`** — 11×5 invader formation: lime-green `fillRect` sprites, horizontal sweep, edge-triggered drop (24 px) + direction reversal, bounding box shrinks with kills.
- **`collision.js`** — `rectsOverlap(a, b)` pure AABB helper (exported); `runCollisionPass()` orchestrating bullet-vs-invader checks, bullet deactivation, score increment, explosion spawn.
- **`explosion.js`** — `spawnExplosion(x, y)`, `updateExplosions()`, `drawExplosions(ctx)`: 8–12-frame flash effect at kill site.
- **`level1.js`** — Classic 11×5 grid; step-interval scales linearly 800 ms → 100 ms as invaders die; fires `onPlayerReached()` when formation reaches player row; fires `onLevelComplete(2)` on clear; re-initialisable.
- **`level2.js`** — Extends `Level` from `level1.js`; formation 1.5× faster (interval × 0.67); invaders fire downward at 300 px/s (random column, random 800–2000 ms interval); player hit → 1 life deducted, 2 s invulnerability + ship flash; UFO every 20 s alternating sides at 120 px/s, score tier keyed on `totalShotsFiredByPlayer % 4` → [50, 100, 150, 300].
- **`level3.js`** — Exports `start(canvas, ctx, onComplete)`; Level 2 mechanics inherited; four destructible 4×4-cell shield bunkers at y≈80% canvas height; formation split at 28 kills into two independent left/right groups sweeping full canvas width.
- **`boss.js`** — Multi-phase boss: canvas-primitive drawing, horizontal sweep, health bar (10 HP); Phase 1 (HP 10–6) fires at ~1 shot/1.5 s; Phase 2 (HP ≤5) fires at ~1 shot/0.6 s; sudden-death on hit (restart to Level 1, score reset); win screen on defeat showing final score and restart prompt.
- **`README.md`** — Repo root documentation: planned file layout, manual verification steps for all levels.

### Changed
- `.github/workflows/build.yml` removed from repo (86-line deletion in diffstat); CI workflow must be re-scaffolded from the build resource config to match the current toolchain (static file serve / no-build artifact).

### Fixed
- N/A (initial release)
