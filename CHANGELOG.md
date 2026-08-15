## 0.5.0 -- e2e space invaders cc 0.5.0

# Changelog

## [0.5.0] - 2026-08-15

First public release of **e2e space invaders (claude code cli)** -- a dependency-free, file://-only Space Invaders clone (plain HTML + ES modules, no bundler, no npm packages, no build step). Built from 7 feature cards merged as PRs #349-#355.

### Added
- **Game loop and canvas framework** (`index.html`, `game.js`, `gameConfig.js` -- PR #349): 768x896 dark-background canvas; fixed-timestep 60Hz update/render loop with a clamped accumulator (bounded catch-up after a backgrounded tab, no spiral-of-death); Title / Playing / GameOver scene machine driven entirely by ENTER with no page reload; on-canvas HUD backed by an exported `{ score, lives, hiScore }` state object.
- **Keyboard input and the player ship** (`input.js`, `player.js` -- PR #350): held-key tracking via keydown/keyup that ignores OS key-repeat; ship movement at 200 px/s (Arrows or A/D, case-insensitive) clamped to the canvas edges; single-bullet-in-flight upward fire at 500 px/s; lives counter seeded from `STARTING_LIVES` (3).
- **Sprite rendering and collision detection** (`invaders.js`, `collision.js` -- PR #351): 11x5 (55-invader) rigid formation with edge-bounce-and-drop movement, all rectangles drawn with `fillRect`; AABB collision pass (player-bullet-vs-invader, invader-bullet-vs-player) resolved before each frame's render; kill explosion FX and a +10 score increment per kill.
- **Level 1: the classic grid** (`level1.js` -- PR #352): linear step-interval speed ramp (~800ms at 55 alive down to ~100ms at 1 alive), recalculated on every kill; life loss + full formation restart if invaders reach the player's row; HUD level indicator; wired as `game.js`'s level 1, falling through to Game Over for level 2 until the next card replaced that branch.
- **Level 2: they shoot back** (`level2.js` -- PR #353): auto-advance from Level 1 with no level-select screen and lives carried over unchanged; formation 1.5x faster (every Level 1 step interval x0.67); a single global randomized (800-2000ms) invader-fire timer that only lets the lowest surviving invader in a column shoot, bullets falling at 300 px/s; a bonus UFO every 20s of level time, alternating entry side, scoring a deterministic tier `[50,100,150,300][cumulativeShotsFired % 4]`; player respawn at the fixed bottom-center position with 2s of flashing invulnerability on hit.
- **Level 3: shields and formations** (`level3.js` -- PR #354): four destructible 4x4 shield bunkers (~8px cells, 64 cells total) at ~80% canvas height, eroding per-cell from either side's projectiles or invader contact; once >=28 of the 55 starting invaders are destroyed, the formation splits into independently sweeping left (orig. columns 1-6) and right (orig. columns 7-11) groups moving outward.
- **Boss level: multi-phase finale** (`boss.js` -- PR #355): 160x80 boss with 10 HP and a top-of-canvas health bar; horizontal drift at 90 px/s reversing at the canvas edges, fixed vertical position; three-bullet spread attack (straight down, +/-20deg) at 260 px/s, firing every 1500ms above 5 HP (Phase 1) and every 700ms at or below 5 HP (Phase 2); any boss bullet touching the player is sudden death; 0 HP triggers a win screen; both outcomes restart at Level 1 with score reset to 0.

### Changed
- `game.js`'s level dispatcher was audited and extended (PR #355) into one ordered chain -- `level1Active -> level2Active -> level3Active -> bossActive` -- each level signaling completion via its own `update()` return value (`'cleared'` / `'playerHit'` / `'victory'`), so Level 4 could be registered alongside Levels 1-3 using the same pattern.

### Known Issues
- **Level 2 -> Level 3 progression is broken.** `level2.js`'s `update()` never returns `'cleared'`, so `game.js` can never flip from `level2Active` to `level3Active`. **In this build, Level 3 and the Level 4 boss fight cannot be reached by playing through from Level 1** -- the game currently plateaus at Level 2 regardless of score or invaders destroyed. This is self-documented in the shipped `README.md` ("Known pre-existing gap...") and was explicitly left unfixed by PR #355 as "outside this card's scope." See the release runbook's go/no-go step before shipping.

### Notes for reviewers
- The git diffstat supplied for generating this release (12 files changed, 2 insertions(+), 2317 deletions(-), every game file shown as pure deletion) is inconsistent with the actual repository contents at HEAD, which contain the full ~1,800-line implementation described above. This changelog was instead verified directly against the project's stored build artifact for this release (outbound git/network access to the live repo was unavailable in this environment). Recommend a human re-run `git diff <initial-commit>..db2b172 --stat` to confirm the diffstat-generation step in the release pipeline is healthy; if it's inverted for this release it may be inverted for others.
