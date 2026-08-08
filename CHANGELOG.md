## 0.1.0 -- e2e space invaders 0.1.0

# Changelog

## [0.1.0] - Initial Release

### Added
- **Game loop and canvas framework** (`index.html`, `game.js`, `gameConfig.js`, `README.md`): Fixed-timestep game loop at 60 updates/s with delta cap, three-scene state machine (Title → Playing → Game Over), canvas HUD (score, lives), shared config constants (CANVAS_WIDTH=768, CANVAS_HEIGHT=896, PLAYER_SPEED=200, BULLET_SPEED=500, STARTING_LIVES=3), and named `hudState` export.
- **Keyboard input and player ship** (`input.js`, `player.js`): Key-held tracking without browser repeat artifacts, player movement (ArrowLeft/A, ArrowRight/D) clamped to canvas bounds, single-bullet firing (Space), procedural ship and bullet rendering, lives counter initialised from config.
- **Sprite rendering and collision detection** (`invaders.js`, `collision.js`): 11×5 invader formation (55 invaders, 32×24 px cells, 8 px gaps), step-and-drop sweep, per-kill explosion flash, exported `score` counter, AABB `runCollisions()` covering player-bullet-vs-invader and invader-bullet-vs-player pairs.
- **Level 1 – The Classic Grid** (`level1.js`): Lifecycle object `{ init, update, render }`, step-interval scaling from ~800 ms (55 alive) to ~100 ms (1 alive), edge-detect-drop, lose condition (formation reaches player row), win condition (all 55 cleared → Level 2), HUD level label.
- **Level 2 – They Shoot Back** (`level2.js`): Formation at 1.5× Level 1 speed (intervals × 0.67), random invader fire (800–2000 ms, lowest-in-column), invader bullets at 300 px/s, bonus UFO every 20 s (alternating sides, 120 px/s, 50/100/150/300 pt tiers keyed by session shot count), 2-second post-respawn invulnerability with ship flash, lives carry over from Level 1.
- **Level 3 – Shields and Split Formations** (`level3.js`): Four destructible 4×4-cell bunkers at ~80% canvas height, per-cell erosion by player bullets, invader bullets, and descending invaders; formation split at ≥28 kills into independent left (cols 1–6) and right (cols 7–11) halves with opposite initial directions; win → Boss transition.
- **Boss Level – Multi-Phase Finale** (`boss.js`): 160×80 px canvas-primitive boss, 90 px/s horizontal drift, 10 HP health bar, Phase 1 three-bullet spread every 1500 ms (HP 6–10), Phase 2 every 700 ms (HP ≤5), collision via `collision.js`, sudden-death rule (one hit → Level 1 restart), win screen with final score and Play Again.
- **CI workflow** (`.github/workflows/build.yml`): BuildBoard-scaffolded build workflow for the project.

### Changed
- `README.md` expanded from stub to full documentation (planned file layout, manual verification steps, Level 2–4 verification sections).

### Fixed
- N/A (initial release).
