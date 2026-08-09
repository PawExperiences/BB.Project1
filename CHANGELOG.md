## 0.1.0 -- e2e space invaders 0.1.0

## [0.1.0] - Initial Release

### Added
- **CI scaffold** (`index.html`, `main.js`, `style.css`, `README.md`): minimum source files to satisfy the CI pipeline and establish the file-naming contract for all sibling tasks.
- **Game loop & canvas framework** (`game.js`, `gameConfig.js`, `index.html`): fixed-timestep loop at 60 Hz, delta-cap at 250 ms, Title/Playing/Game-Over scene state machine, canvas HUD, exported `hudState` object.
- **Shared constants** (`gameConfig.js`): `CANVAS_WIDTH=768`, `CANVAS_HEIGHT=896`, `PLAYER_SPEED=200`, `BULLET_SPEED=500`, `STARTING_LIVES=3`.
- **Keyboard input** (`input.js`): `initInput()` / `isKeyHeld(key)` with held-state tracking; no key-repeat leakage.
- **Player ship** (`player.js`): procedurally-drawn ship (40×32 px), frame-rate-independent movement & clamping, single-bullet constraint, `lives` property, `loseLife()` method.
- **Invader grid & score** (`invaders.js`): 11×5 = 55-invader formation, lateral sweep with edge-reversal and downward drop, mutable `score` export, 20-frame explosion flash effect.
- **Collision detection** (`collision.js`): AABB `runCollisions(invaders, bullets, player)`, bullet-vs-invader pass, invader-bullet-vs-player stub with `TODO` comment.
- **Level 1** (`level1.js`): classic grid, speed scaling 800 ms → 100 ms linear with alive-count, 48 px drop on wall contact, LEVEL COMPLETE screen, lose-life-on-reach-player-boundary with full reset, LEVEL 1 HUD label.
- **Level 2** (`level2.js`): 1.5× faster grid (×0.67 intervals), invader shooting (single bullet, random 800–2000 ms interval, lowest-per-column selection, 300 px/s downward), UFO every 20 s alternating sides at 120 px/s, score tiers by `sessionShotCount % 4`, 2-second respawn invulnerability with flash, lives carry-over from Level 1, Game Over handoff.
- **Level 3** (`level3.js`): same grid, four destructible shield bunkers (4×4 cells, 8×8 px, #00FF00) at 80 % canvas height, mid-wave formation split at ≥28 kills into independent Left (cols 1–6) and Right (cols 7–11) halves sweeping in opposite directions, cell-level bunker erosion via `rectIntersects`, `isDone()` lifecycle method.
- **Boss level** (`boss.js`): Level 4 auto-dispatched from `game.js`, 160×80 px canvas-primitive boss at Y=40 drifting at 90 px/s, 10 HP, green proportional health bar at canvas top, three-bullet spread (±20°, 260 px/s), Phase 1 ≥6 HP every 1500 ms / Phase 2 ≤5 HP every 700 ms, sudden-death player hit → Level 1 reset, win screen with score and restart prompt.
