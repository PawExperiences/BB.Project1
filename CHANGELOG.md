## 0.1.0 -- e2e provider openai 0.1.0

# Changelog

## Added
- Roman numeral conversion package with functions `to_roman` and `from_roman`.
- The numeral table module `table.py` for value-to-numeral pairs.

## Changed
- Implemented round-trip testing for conversion functions.
- Updated documentation to include acceptance criteria for tests.

## Fixed
- Ensured error handling for invalid inputs in conversion functions.

## 0.5.0 -- e2e space invaders cc 0.5.0

# Changelog

All notable changes to this project are recorded in this file. This is the first tagged release, so `0.5.0` describes the whole game.

## [0.5.0] - e2e space invaders cc

First tagged release (no previous tag). Bundles PRs #386-#392 (`4defccf`..`661e2ad`).

### Added
- **Entry point** - `index.html` at the repository root: dark page background, exactly one `<canvas>` at `width="768"` / `height="896"`, and `game.js` loaded via `<script type="module" src="game.js">`. No CDN, no bundler output, no npm package. (#386)
- **Frame loop and scenes** - `game.js` runs a fixed-timestep loop at 60 update steps/s with `update` and `render` as distinct phases, and the Title / Playing / Game Over / Win scenes. ENTER drives every transition entirely in-page: no `location.reload()`, no assignment to `location`, no navigation. (#386)
- **Shared HUD state** - `game.js` exports a single mutable HUD state object (`score`, `lives`, `hiScore`). Starting a game resets `score` to 0 and `lives` to 3; `hiScore` is the best score of the page session and survives restarts. (#386)
- **Tunables** - `gameConfig.js` named exports: `CANVAS_WIDTH` 768, `CANVAS_HEIGHT` 896, `PLAYER_SPEED` 200, `BULLET_SPEED` 500, starting lives 3, plus grid dimensions, step distance/interval, row drop, explosion duration, points per invader and invulnerability seconds used by every level. (#386, #388)
- **Keyboard input** - `input.js` exporting `initInput()` and `isKeyHeld(key)`. Held-key state is polled per frame rather than driven by OS key repeat; `ArrowLeft`/`ArrowRight`, `a`/`A`/`d`/`D` and `Space`/`" "` normalise to stable identifiers; arrows and space no longer scroll the page. (#387)
- **Player ship** - `player.js` exporting `Player` with `update(dt)` / `draw(ctx)`: delta-time movement at 200 px/s clamped to the playfield, drawn procedurally from canvas arcs and rectangles (no sprites), a strictly one-bullet-at-a-time cannon at 500 px/s, and a lives counter with `loseLife()`, `grantInvulnerability(seconds)`, `resetPosition()` and a full reset path. (#387)
- **Invader formation** - `invaders.js` exporting `InvaderFormation` (`reset`, `step`, `aliveCount`, `lowestBottom`, `draw`): 55 invaders in the classic 11x5 grid, advancing in discrete steps driven by a `dt` accumulator, dropping a row and reversing when the *living* bounding box would leave the playfield. Kills leave holes; the grid never re-flows. (#388)
- **Collision and explosions** - `collision.js` exporting `overlaps(a, b)` and `collide(state)`: one axis-aligned bounding-box pass per frame for player-bullet-vs-invader (kill, explosion, score) and hostile-bullet-vs-player (life loss then brief invulnerability), plus `spawnExplosion` / `updateExplosions` / `drawExplosions` / `clearExplosions` built from canvas primitives only. (#388)
- **Level registry** - `levels.js` exporting `registerLevel`, `isLevelRegistered` and `createLevel`; a request for an unregistered level falls through to the Game Over scene instead of crashing or blanking the canvas. (#389)
- **Level 1: the classic grid** - `level1.js`, registered as level 1. Step interval `100 + (aliveCount - 1) * (700 / 54)` ms - about 800 ms at 55 alive, about 100 ms at 1 - so survivors visibly speed up. The formation reaching the player's row costs a life and restarts the level from a fresh grid; the last life routes to `endGame()`. Clearing all 55 calls `advanceLevel()`. The HUD gains the current level number. (#389)
- **Level 2: they shoot back** - `level2.js`, extending `Level1`: every step interval multiplied by 0.67, a single global enemy-fire timer at a uniform 800-2000 ms that spawns one bullet from the lowest living invader of an occupied column, hostile bullets at 300 px/s, a bonus UFO every 20 s that alternates entry side and crosses at 120 px/s scoring `[50,100,150,300][shotCount % 4]` (session-cumulative shot count, never random), and death -> bottom-centre respawn with 2 s of flashing invulnerability. Lives carry over from Level 1; clearing the grid advances to level 3. (#390)
- **Level 3: shields and formations** - `level3.js`, extending `Level2`: four destructible bunkers evenly spaced across the canvas with their tops at ~80% of canvas height, each a 4x4 grid of ~8 px cells (64 cells at level start), eroded permanently by player bullets, hostile bullets and descending invaders - never rebuilt, not even on respawn. At 28 kills the survivors split into independent left (original columns 1-6) and right (columns 7-11) groups that start moving apart and sweep-and-drop on their own schedules; clearing both advances to level 4. (#391)
- **Boss level: multi-phase finale** - `boss.js`, self-registering as level 4: a 160x80 boss drawn purely with canvas 2D primitives, 10 HP with a health bar across the top of the canvas, 90 px/s horizontal drift with edge reversal and no vertical movement, and a three-bullet spread from its centre at 0 deg / +20 deg / -20 deg at 260 px/s - every 1500 ms while HP >= 6, every 700 ms from HP <= 5. Sudden death: any boss projectile touching the player ends the run regardless of remaining lives. 0 HP routes to `winGame()`. (#392)
- **README** - the file layout plus a numbered manual verification path per level, runnable end to end from a browser. (#386-#392)
- **Release tooling** - `release/scripts/release.{py,sh,ps1}` and `release/scripts/run.{py,sh,ps1}`.

### Changed
- **Repository toolchain** - the tree at this tag is a browser-only ES-module game with no build step, no package manager and no runtime dependency. The Maven project (`pom.xml`, `src/main/java/com/buildboard/calculator/**`) and the CMake project (`CMakeLists.txt`, `src/*.cpp`, `tests/sieve_test.cpp`) from earlier e2e runs are not present at this ref.
- **Frame order** - one frame in `game.js` executes as entity updates -> `collide(state)` -> `updateExplosions(dt)` -> render. Nothing reachable from the render path kills an invader, removes a bullet, or changes score or lives.

### Fixed
- **Backgrounded-tab catch-up burst** - each frame's raw delta is clamped to 250 ms before it enters the accumulator, capping a single frame at 15 update steps, so returning to a backgrounded tab no longer teleports the ship and the invaders.
- **Two end screens** - `boss.js` no longer renders its own win screen; it delegates to `winGame()` / `renderWin()` in `game.js`, so only one end screen can ever appear.
- **Enemy-fire branch with no shooters** - `collide(state)` is a no-op and does not throw when the hostile-bullet list is absent or empty, so Level 1 (which has no enemy fire) runs clean.

## 0.2.0 -- e2e calculator 0.2.0

# Changelog — e2e calculator 0.2.0

First release of the Calculator (Java Swing) project. There is no previous release to diff against; everything below is new.

## Added
- Maven build foundation: `pom.xml` (groupId `com.buildboard`, artifactId `calculator`, packaging `jar`) targeting Java 21 via maven-compiler-plugin `<release>21</release>`, JUnit 5 (`org.junit.jupiter:junit-jupiter:5.10.2`, test scope) and maven-surefire-plugin 3.2.5, so `mvn -B test` runs green from a clean checkout. (#377)
- `SkeletonTest` smoke test plus a `README.md` documenting the planned project layout. (#377)
- Expression evaluation core `com.buildboard.calculator.Evaluator` — a UI-free class with a single static `evaluate(String)` API supporting `+ - * /` with correct precedence and left-associativity, nested parentheses, decimal literals, unary minus in leading and post-operator positions, and insignificant whitespace. (#378)
- Checked `com.buildboard.calculator.CalculationException` for every failure mode: division by zero and malformed input (unbalanced parentheses, empty/blank input) throw with descriptive, problem-naming messages; the evaluator never returns NaN, Infinity or a sentinel value. (#378)
- `EvaluatorTest` JUnit 5 suite written test-first (red/green), covering precedence, nested parentheses, decimals, both unary-minus positions, division by zero, unbalanced parentheses and empty input. (#378)
- Swing UI `CalculatorWindow`: title "Calculator", 320x420 initial and minimum size, a right-aligned non-editable display, and a GridBagLayout grid of 18 buttons (digits 0-9, `.`, `+ - * /`, `( )`, `C`, `=`). (#379)
- Result formatting with up to 10 significant digits and trailing zeros stripped (`1+2` -> `3`, `10/4` -> `2.5`, `2/3` -> `0.6666666667`); all arithmetic stays in `Evaluator`. (#379)
- Inline error handling: a `CalculationException` message is shown in the display and the next input clears it and starts a fresh expression; after a successful result a digit/`.`/`(` starts fresh while an operator continues from the result. (#379)
- Full keyboard support independent of focused component: printable keys append, ENTER evaluates, ESCAPE clears, BACKSPACE edits an in-progress expression. (#379)
- Headless-safe `CalculatorWindowTest` suite that skips frame-instantiating tests when no display is present. (#379)
- `Main` launcher that opens the window on the Swing EDT via `SwingUtilities.invokeLater`, plus maven-jar-plugin config stamping `Main-Class: com.buildboard.calculator.Main` into the manifest — `java -jar target/calculator-0.1.0.jar` runs the app with zero runtime dependencies. (#380)
- `MainTest` entry-point test and a `README.md` documenting the exact build (`mvn -B package`) and run (`java -jar target/calculator-0.1.0.jar`) commands. (#380)

## Changed
- Repository housekeeping: leftover files from earlier, unrelated e2e projects (JS game sources, C++ prime-tester sources, old release scripts and docs) were removed from the tree during this release window. They were never part of the calculator product.

## Fixed
- Nothing — first release, no prior defects to fix.

## 0.3.0 -- e2e prime tester 0.3.0

# Changelog

## [0.3.0] - e2e prime tester (first release)

First release of the Prime Number Tester: a standalone, dependency-free C++17 command-line program built with CMake (minimum 3.16). No previous release of this project exists (PREVIOUS: None).

### Added
- `prime_tester` CLI: prints `<n> is prime` / `<n> is not prime` for each integer token, one per line to stdout, in input order. Core predicate `bool is_prime(long long n)` (src/prime.h, src/prime.cpp) uses trial division up to sqrt(n) with the 6k+/-1 optimisation.
- Correct edge cases: every n < 2 (0, 1, all negatives) is not prime; 2 and 3 are prime; even n > 2 is not prime.
- Two input modes: tokens as command-line arguments (stdin ignored), or one token per line from stdin until EOF when no arguments are given.
- Error contract: a non-integer or out-of-`long long`-range token is echoed verbatim to stderr as `not a number: <token>`; processing continues with the remaining tokens and the process exits 1 if any bad token occurred. Clean runs exit 0; empty input prints nothing and exits 0.
- Sieve module (src/sieve.h, src/sieve.cpp): `std::vector<long long> primes_up_to(long long n)` implemented as a Sieve of Eratosthenes; empty vector for n < 2 (e.g. `primes_up_to(30)` = {2,3,5,7,11,13,17,19,23,29}).
- `--upto N` CLI mode: prints every prime 2 <= p <= N (N inclusive), one per line, exit 0; N < 2 prints nothing and exits 0. Serves as the manual benchmark: `--upto 10000000` completes in well under 30 seconds (timed externally).
- CTest coverage (tests/sieve_test.cpp) for `primes_up_to` boundary cases (n < 2, n = 2, n = 30); `ctest` passes against the build tree.
- README.md: copy-pasteable build section (`cmake -B build`, `cmake --build build`, executable at `build/prime_tester`) plus a worked-examples table covering eight scenarios (prime, composite, 0, 1, negative, non-numeric token, empty stdin, `--upto 30`) with verbatim expected stdout and exit statuses.

### Changed
- Repository housekeeping before this release line: the working tree was reset (commits 3d812d4, 32e31f9, 8e02c96), removing the prior in-repo e2e experiments visible in the diff -- the space invaders game sources (boss.js, collision.js, game.js, gameConfig.js, index.html, input.js, invaders.js, level1.js, level2.js, levels.js, player.js), the old release scripts (release/scripts/*), old per-release notes (docs/releases/0-1-0.md, 0-6-0.md) and the old CHANGELOG content. None of that is part of this release's scope.

### Fixed
- Nothing; initial release of the current codebase.

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
