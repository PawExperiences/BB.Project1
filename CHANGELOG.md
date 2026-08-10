## 0.5.0 -- e2e space invaders cc 0.5.0

# Changelog

All notable changes to this project are documented in this file.

## [0.5.0] - 2026-08-10

First tagged release of the project (PREVIOUS: None).

### Added
- Static, zero-build game shell: `index.html` hosts a 768x896 `<canvas>` on a dark page; opens directly via a `file://` URL with no server or build step. (`index.html`, `gameConfig.js`)
- Shared numeric constants module `gameConfig.js` exporting `CANVAS_WIDTH` (768), `CANVAS_HEIGHT` (896), `PLAYER_SPEED` (200), `BULLET_SPEED` (500), and `STARTING_LIVES` (3).
- Fixed-timestep game loop in `game.js`: 60 updates/sec with distinct update and render phases, and a clamped accumulator so resuming a backgrounded/restored tab never fires a burst of catch-up updates.
- Three-scene state machine driven entirely by ENTER, never reloading the page: **Title** ("SPACE INVADERS" / "Press ENTER to start") -> **Playing** -> **Game Over** ("GAME OVER", final score, "Press ENTER to restart") -> back to Title.
- On-canvas HUD (score, lives) rendered every frame during Playing, backed by an exported `hudState` object (`score`, `lives`, `hiScore`) so later gameplay cards can read/mutate it without owning scene/HUD logic.
- Game Over triggers automatically when `hudState.lives` reaches 0.
- Keyboard-controlled player ship and shooting, added in `input.js` / `player.js` (commit `1dc86a0`, "Keyboard input and the player ship", PR #198). This task's groomed description/acceptance criteria were not part of this release's task bundle, so this entry is derived only from the commit title and the diffstat file list — see **Open Questions**.

### Not in this release
- Invader sprite rendering and AABB collision detection (`invaders.js`, `collision.js`) were bundled as a Done task ("Sprite rendering and collision detection") for v0.5.0, but no corresponding files or commits appear anywhere in the supplied git range. See **Open Questions**.

### Open Questions / Blockers (must be resolved before tagging - see `steps`)
1. **Scope mismatch.** The Done task "Sprite rendering and collision detection" is bundled for v0.5.0, but the supplied git range (`9197bb1`, `1dc86a0`) contains no `invaders.js`/`collision.js` anywhere. The actual second commit instead belongs to a different, unbundled task, "Keyboard input and the player ship" (#198, `input.js`/`player.js` - which task 2's own groomed description names as a *sibling* card, not itself). Release scope (what BuildBoard says is Done) and git history (what actually merged) disagree. A human/upstream agent must confirm the correct commit range or task bundle before this release is tagged.
2. **Diffstat sign.** The supplied diffstat for this range shows all 6 touched files (`README.md`, `game.js`, `gameConfig.js`, `index.html`, `input.js`, `player.js`) as pure deletions (356 deletions, 0 insertions), even though both commits are `feat:` commits and the deleted line counts exactly match each file's expected size. This looks like a direction/sign artifact in how the diffstat was generated, not a real removal of the game - but this run had no live repo access to confirm it against the actual commits.
