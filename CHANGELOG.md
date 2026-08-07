## 0.1.0 -- e2e space invaders 0.1.0

# Changelog

## [0.1.0] - Initial Release

### Added
- **CI / Workflow**: Fixed `.github/workflows/build.yml` to use a plain shell `test -f index.html` validation step; removed all npm/node/bundler invocations that are inappropriate for a no-build-tool stack.
- **Game Loop & Canvas Framework** (`index.html`, `game.js`, `gameConfig.js`): Established the foundational scaffolding — 768×896 canvas, fixed-timestep game loop at 60 Hz with delta-cap, three-scene state machine (Title → Playing → Game Over), canvas HUD (score, lives, hi-score), and exported `hudState` object.
- **Keyboard Input & Player Ship** (`input.js`, `player.js`): Thin key-state tracker (`initInput`, `isKeyHeld`); `Player` class with delta-time movement (200 px/s), canvas-edge clamping, single-bullet constraint (500 px/s upward), procedural ship rendering, and `lives` counter sourced from `gameConfig.js`.
- **Sprite Rendering & Collision Detection** (`invaders.js`, `collision.js`): 11×5 invader grid (55 invaders, 32×24 px each, 16 px horizontal / 12 px vertical gaps), unit formation movement with edge-detect drop, AABB collision (player bullet vs. invader → score increment + explosion effect; invader bullet vs. player → console stub), score tracking.
- **Level 1 — The Classic Grid** (`level1.js`): Formation march with linearly-scaling step interval (800 ms → 100 ms as invaders are destroyed), win/lose wiring (`advanceLevel` / `loseLife`), HUD level field update.
- **Level 2 — They Shoot Back** (`level2.js`, `shared/invaders.js`): Shared step-interval utility; Level 2 runs at 1.5× Level 1 speed (×0.67 multiplier); random invader shooting (800–2000 ms, lowest surviving invader per column, 300 px/s bullet); player hit/respawn with 2-second 10 Hz blink invulnerability; UFO bonus every 20 s alternating sides at 120 px/s with `cumulativeShotCount % 4` score tiers (50/100/150/300).
- **Level 3 — Shields & Formations** (`level3.js`): Four destructible 4×4 shield bunkers at ~80% canvas height; standard 11×5 grid; formation split at ≥28 kills (columns 1–6 left, 7–11 right) into two independent sweep halves; win transitions to Boss Level.
- **Boss Level — Multi-Phase Finale** (`boss.js`): 160×80 px procedurally-drawn boss, 10 HP with full-width health bar; three-bullet spread (straight, ±20°) at 260 px/s; Phase 1 fires every 1500 ms (HP 10–6), Phase 2 every 700 ms (HP ≤5); sudden-death on boss hit; win screen on HP=0; uses imported `collision.js`.
- **README.md**: Full file layout, manual verification checklists for every component and level.
