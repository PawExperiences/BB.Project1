## 0.1.0 -- e2e space invaders 0.1.0

# Changelog

## [0.1.0] - Initial Release

### Added
- **Game loop and canvas framework** (`index.html`, `game.js`, `gameConfig.js`, `README.md`): Fixed-timestep game loop at 60 Hz, scene state machine (TITLE → PLAYING → GAME_OVER), canvas HUD (score, lives, hi-score), shared constants module, exported `hudState` named export.
- **Keyboard input and player ship** (`input.js`, `player.js`): Held-key tracking via `initInput()`/`isKeyHeld()`, procedurally-drawn player ship, single-bullet firing with `BULLET_SPEED`, movement clamped to canvas bounds, `lives` property for level cards.
- **Sprite rendering and collision detection** (`invaders.js`, `collision.js`): 11×5 invader grid rendered as filled rectangles, step-and-drop formation movement, AABB bullet–invader collision pass, explosion flash effect (~300–500 ms), per-kill score increment via `POINTS_PER_KILL` constant.
- **Level 1 – The Classic Grid** (`level1.js`): `init/update/render` module interface, step-interval curve scaling linearly from 800 ms (55 invaders) to 100 ms (1 invader), edge-bounce-and-drop, loss condition at Y = 540 px with full formation reset, level-clear transition to Level 2, HUD level label.
- **Level 2 – They Shoot Back** (`level2.js`): 1.5× faster formation (0.67× intervals), randomised enemy shoot timer (800–2000 ms), lowest-column-invader firing at 300 px/s downward, UFO every 20 s alternating sides at 120 px/s with tiered score (50/100/150/300 pts keyed on `playerTotalShotCount % 4`), 2-second respawn invulnerability with visual flash.
- **Level 3 – Shields and Formations** (`level3.js`): Four destructible shield bunkers at ~80 % canvas height (4×4 cell grids, `#00FF41`), per-cell erosion by player and invader projectiles, formation split at 50 % kills into two independently-sweeping halves moving in opposite directions, advance to boss on full clear.
- **Boss Level – Multi-Phase Finale** (`boss.js`): Canvas-primitive boss entity with 10 HP and visible health bar, horizontal edge-bouncing movement, Phase 1 (HP 6–10, fires every 2 s) → Phase 2 (HP ≤ 5, fires every 1 s with visual change), sudden-death rule (one hit resets to Level 1), win screen with final score and restart.
