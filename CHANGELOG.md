## 0.1.0 -- e2e space invaders 0.1.0

## [0.1.0] - Initial Release

### Added
- **Game Loop & Canvas Framework** (`index.html`, `game.js`, `gameConfig.js`): Fixed-timestep game loop at 60 UPS with accumulator/delta-cap pattern; three-scene state machine (Title → Playing → Game Over) driven by the Enter key; HUD rendering (score, lives, hi-score) drawn directly on canvas; exported `hudState` object for cross-module mutation; import stubs for all future modules.
- **Shared Constants** (`gameConfig.js`): `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`/`INITIAL_LIVES` exported as ES module named constants.
- **Keyboard Input** (`input.js`): `initInput()` attaches `keydown`/`keyup` listeners; `isKeyHeld(key)` reflects physical press/release state; OS key-repeat events suppressed via `event.repeat` guard.
- **Player Ship** (`player.js`): `Player` class with delta-time movement (ArrowLeft/a, ArrowRight/d), canvas-edge clamping, single in-flight bullet (Space), bullet auto-removal on exit, procedural canvas drawing, externally writable `lives` property.
- **Invader Grid & Collision** (`invaders.js`, `collision.js`): 11×5 formation (55 invaders) drawn with `ctx.fillRect`; sideways march with edge-detect-and-drop; pure `rectsOverlap(a,b)` AABB helper; `checkBulletVsInvaders` and `checkInvaderBulletsVsPlayer` passes; short-lived explosion effect (named-constant frame count); per-kill score increment (named constant); collision-before-draw ordering enforced in `game.js`.
- **Level 1** (`level1.js`): Classic invader wave; linear step-interval scaling 800 ms → 100 ms as kills accumulate; breach detection (formation reaches player row → lose life + reset formation); level-clear `CustomEvent('levelComplete', { detail: { nextLevel: 2 } })`; HUD level display via `hud.set('level', 1)`.
- **Level 2** (`level2.js`): Auto-advances from Level 1 via `advanceLevel()`; lives carried over; formation 1.5× faster than Level 1 at every threshold; random enemy fire (800–2000 ms interval, random column, bottom invader fires); enemy bullets at 300 px/s; UFO every 20 s alternating entry side at 120 px/s; UFO score tiers by `session_shot_count mod 4` (50/100/150/300); player hit → respawn at bottom-centre with 2 s invulnerability (flashing); lives-zero → Game Over scene; Enter on Game Over → Title.
- **Level 3** (`level3.js`): Four destructible shield bunkers (4×4 cell grids, ~8 px cells, ~80% canvas height); cell-level collision with player and enemy projectiles; descending invaders erode cells; 11×5 starting grid; formation split at 28th kill — columns 1–6 left half, columns 7–11 right half — each half sweeps independently in opposite initial directions; level-clear advances to boss.
- **Boss Level** (`boss.js`): 160×80 px boss drawn with canvas primitives at Y=60 px; proportional health bar at top of canvas; 90 px/s horizontal drift with edge reversal; Phase 1 (HP > 5): three-bullet spread every 1500 ms; Phase 2 (HP ≤ 5): spread every 700 ms, transition immediate; bullets at 260 px/s at 0°/±20° from vertical; collision via imported `checkCollision` from `collision.js`; boss projectile hit → sudden death, restart from Level 1; HP reaches 0 → win screen with final score and restart prompt.
- **CI Fix**: Updated `.github/workflows/build.yml` container image from invalid `node:330` to a valid Node LTS tag so the BuildBoard-managed pipeline passes.
- **README**: File-layout table listing all eight module files with owning card names; Manual Verification section for `file://` testing.

### Changed
- `README.md` updated to reflect full project file layout.
- `.github/workflows/build.yml` image tag corrected (net lines removed reflect replacement of the broken workflow with a fixed one).

### Fixed
- CI pipeline no longer fails at container pull step due to non-existent `node:330` image tag.
