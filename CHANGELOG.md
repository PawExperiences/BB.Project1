## 0.1.0 -- e2e space invaders 0.1.0

# Changelog

## [0.1.0] - Initial Release

### Added
- **Game Loop & Canvas Framework** (`index.html`, `game.js`, `gameConfig.js`): 768×896 canvas on a dark background, fixed-timestep game loop (1/60 s steps, delta capped to `MAX_ACCUMULATED_DELTA`), scene state machine (Title → Playing → Game Over), HUD rendering (score, lives, hi-score), ENTER-key scene transitions, no page reloads.
- **Shared Config** (`gameConfig.js`): Named exports `CANVAS_WIDTH=768`, `CANVAS_HEIGHT=896`, `PLAYER_SPEED=200`, `BULLET_SPEED=500`, `STARTING_LIVES=3`, `TARGET_FPS=60`, `MAX_ACCUMULATED_DELTA`.
- **Shared Constants** (`constants.js`): Grid geometry and sprite ID constants consumed by level modules.
- **Keyboard Input** (`input.js`): `initInput()` / `isKeyHeld(code)` API; physical press/release tracking via `KeyboardEvent.code`; no key-repeat pollution.
- **Player Ship** (`player.js`): Delta-time movement (ArrowLeft/KeyA, ArrowRight/KeyD), edge clamping, single-bullet firing (Space), upward bullet travel, procedural canvas-primitive rendering.
- **Invader Formation & Collision** (`invaders.js`, `collision.js`): 11×5 invader grid, sideways sweep with drop-and-reverse on edge contact, AABB bullet-vs-invader and invader-bullet-vs-player collision passes, running `score` export, timed explosion effect renderer.
- **Level 1** (`level1.js`): Classic 11×5 grid, linearly scaling step interval (800 ms → 100 ms as invaders are killed), win/lose Promise resolution, "Level 1" HUD label.
- **Level 2** (`level2.js`): 1.5× faster formation (0.67× interval multiplier), enemy shooting from lowest invader per column (800–2000 ms random timer, 300 px/s bullets), UFO bonus every 20 s (alternating sides, 120 px/s, score tier by `shotCount % 4`), player hit/respawn with 2 s flashing invulnerability, SceneManager transitions to Level 3 or Game Over.
- **Level 3** (`level3.js`): Same 11×5 grid with standard speed-up; four destructible shield bunkers (4×4 cell grids at 80% canvas height); formation split at ≥50% casualties into two independently sweeping/accelerating halves; level-completion signal to boss.
- **Boss Level** (`boss.js`): 160×80 px procedural boss, horizontal drift at 90 px/s, 10 HP health bar, two-phase spread shot (1500 ms / 700 ms at ≤5 HP, 260 px/s, ±20° spread), sudden-death on player hit, win screen with score and restart.
- **CI Workflow Fix** (`.github/workflows/build.yml`): Corrected `index.html` existence check; all original checkout + validate steps preserved and passing.
- **README** (`README.md`): Full planned file layout, manual verification checklist, tab-background burst prevention notes.
