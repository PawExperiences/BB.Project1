## 0.1.0 -- e2e space invaders 0.1.0

# Changelog

## [0.1.0] - Initial Release

### Added
- **Game loop and canvas framework** (`index.html`, `game.js`, `gameConfig.js`): Fixed-timestep game loop (1/60 s tick, 250 ms delta cap), three-scene state machine (Title → Playing → Game Over), canvas HUD (score, lives, hi-score), and shared constants (`CANVAS_WIDTH=768`, `CANVAS_HEIGHT=896`, `PLAYER_SPEED=200`, `BULLET_SPEED=500`, `STARTING_LIVES=3`). Works from a `file://` URL with no server dependency.
- **Keyboard input and player ship** (`input.js`, `player.js`): Held-key tracking via `KeyboardEvent.code`; `Player` class with delta-time movement (200 px/s), edge clamping, single-bullet mechanic (500 px/s), and procedural canvas drawing.
- **Sprite rendering and collision detection** (`invaders.js`, `collision.js`, `explosion.js`, `score.js`): 11×5 green invader formation, AABB collision (player bullet↔invader, invader bullet↔player), white flicker explosion pool (3–5 frames), 10-point-per-kill score exported from `score.js`.
- **Level 1 – The Classic Grid** (`level1.js`): Formation steps 8 px per tick; speed scales linearly from ~800 ms (55 alive) to ~100 ms (1 alive); edge-drop of one cell height on boundary touch; life-loss/reset on formation reaching player row; level-clear transition to Level 2; HUD displays `LEVEL 1`.
- **Level 2 – They Shoot Back** (`level2.js`): Formation runs at 0.67× Level 1 intervals; global enemy-fire timer (800–2000 ms random, bottom-column invader selected at random); invader bullets travel down at 300 px/s; 2-second invulnerability with visual flash on player hit; UFO bonus target every 20 s alternating sides at 120 px/s with score tier (50/100/150/300 pts) based on `totalShotsFired % 4`.
- **Level 3 – Shields and Formations** (`level3.js`): Four destructible shield bunkers (4×4 grid of 8 px green cells at 80% canvas height); cell-level erosion from both player and invader bullets; formation split at ≥ 28 kills into independent left/right sub-formations; each sub-formation sweeps and fires independently; level complete when all invaders in both halves are eliminated.
- **Boss Level – Multi-Phase Finale** (`boss.js`): Stationary boss rendered with canvas primitives, 10 HP visible health bar; Phase 1 (HP 6–10): fires single projectile every 2 s; Phase 2 (HP 1–5): fires every 1 s with visual phase-change cue; boss projectile hits player → instant death, score reset, restart at Level 1; boss defeated → Win Screen with final score and any-key restart.
- **CI workflow** (`.github/workflows/build.yml`): BuildBoard-scaffolded build workflow initialised for the project.
- **README.md**: Module file listing, single-sentence purpose per file, manual verification checklists for every level and mechanic.
