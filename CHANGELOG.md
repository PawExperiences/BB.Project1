## 0.1.0 -- e2e space invaders 0.1.0

# Changelog — Space Invaders 0.1.0

First release of the project: a complete, four-level Space Invaders built as hand-written ES modules with zero dependencies and no build step. Open `index.html` from the filesystem (`file://`) and press ENTER.

## Added

### Game framework (#366, commit 6c8adf1)
- `index.html`: dark page with a single 768x896 canvas, all styling inline, loads `game.js` as an ES module; runs from `file://` with no server, bundler, fetch or CDN.
- `gameConfig.js`: shared named constants `CANVAS_WIDTH` (768), `CANVAS_HEIGHT` (896), `PLAYER_SPEED` (200), `BULLET_SPEED` (500), `STARTING_LIVES` (3).
- `game.js`: fixed-timestep loop (`update(dt)` at a constant 1/60 s, 60 steps/s, render as a separate per-frame phase, frame delta clamped at 250 ms against background-tab catch-up bursts).
- Scene state machine with exactly three scenes (Title / Playing / Game Over), every transition triggered by ENTER, no page reloads; `hiScore` updated to `max(hiScore, score)` on entering Game Over.
- On-canvas HUD plus the named export `hudState` (`{ score, lives, hiScore }`) as the integration point for later cards.

### Input and player ship (#367, commit 1fbc5f2)
- `input.js`: `initInput()` / `isKeyHeld(key)` held-key tracking derived purely from keydown/keyup transitions; keyboard auto-repeat neutralized via an `event.repeat` guard.
- `player.js`: procedurally drawn ship (canvas arcs/rects, no image assets); ArrowLeft/ArrowRight or A/D movement at 200 px/s dt-scaled; hard clamping to `x = 0`..`CANVAS_WIDTH`.
- Firing: Space spawns one upward bullet at 500 px/s under the classic one-bullet-in-flight rule; the in-flight bullet (or `null`) is exposed as `player.bullet`.
- Lives counter initialised from `STARTING_LIVES` with a documented decrement interface, rendered on the canvas.

### Invaders and collision (#368, commit 78a8f91)
- `invaders.js`: the classic 11-column x 5-row formation (55 identical `fillRect` invaders) marching sideways as a unit; at either canvas edge the formation reverses and drops one step.
- `collision.js`: shared AABB overlap test; per-frame collision pass runs after world updates and before any drawing; player-bullet-vs-invader kills remove both, spawn a ~0.2-0.4 s explosion (several may run concurrently) and add +10 score; the invader-bullet-vs-player check consumes the game state's hostile-bullet list (empty until Level 2).

### Levels and finale (#369, #370, Level 3, #371; commits 7766c63, b7a04f3, 7afebba)
- `level1.js` + level registry/loader: classic 55-invader grid; step interval scales linearly from ~800 ms (55 alive) to ~100 ms (1 alive); edge contact drops the formation by exactly one invader cell height and reverses direction; an invader reaching the player row costs one life and restarts the level (score/lives otherwise carry over); clearing all 55 advances the level counter; HUD shows `LEVEL n`.
- `level2.js`: same grid at 1.5x speed (every march interval x 0.67); enemy fire on a single global timer every 800-2000 ms from the lowest living invader of a random occupied column, bullets travel down at 300 px/s; bonus UFO every 20 s, alternating entry sides, crossing at 120 px/s, awarding 50/100/150/300 points by session shot count mod 4 (cumulative across levels); player death respawns the ship bottom-centre with 2 s of visibly flashing invulnerability; last life lost enters the existing Game Over scene.
- `level3.js`: four destructible shield bunkers (4x4 grids of ~8 px cells) evenly spaced at ~80% canvas height; each projectile (either side) destroys exactly the cell it hits and is consumed; destroyed cells stay destroyed and let projectiles pass; descending invaders carve through bunkers unharmed; at the 28th kill the formation splits by original column into independent left (columns 1-6, moves left first) and right (columns 7-11, moves right first) groups that sweep, descend and fire independently at equal speed.
- `boss.js` (Level 4): 160x80 px boss drawn with canvas primitives, 10 HP with a proportional health bar across the top of the canvas; horizontal drift at 90 px/s with edge reversal, never descends; three-bullet centre spread (straight down, +/-20 degrees) at 260 px/s, fired every 1500 ms above 5 HP and every 700 ms from 5 HP; all hit-testing imports the shared helpers from `collision.js`; one boss-bullet hit is sudden death (restart is a fresh run at Level 1); reducing the boss to 0 HP shows a win screen with the final score and a restart option.

### Build / CI
- BuildBoard-managed CI build workflow `.github/workflows/build.yml` scaffolded (commit 917c6a5); the project builds green with all game files present.

## Changed
- Nothing — initial release.

## Fixed
- Nothing — initial release.

## 0.6.0 -- e2e prime tester cc 0.6.0

## [0.6.0] - 2026-08-16

### Added
- BuildBoard-managed CI build workflow (`.github/workflows/build.yml`), scaffolded for the project's C++ (CMake) toolchain (`gcc:14-bookworm`, artifact path `build`) — commit `5e3fc19`.
- GitHub Release delivery channel wired to `PawExperiences/BB.Project1` for this and future versions.

### Changed
- None. No application source is present in this release's commit range.

### Fixed
- None.

### Notes
- First tagged release (previous: none). The commit range `3d812d4..8e02c96` contains only repository-reset housekeeping (`3d812d4`, `32e31f9`, `8e02c96`) and the CI scaffold (`5e3fc19`) — no bundled Done tasks, empty diffstat. See the pre-flight step in `steps` before publishing.
