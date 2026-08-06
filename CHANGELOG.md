## 0.3.0 -- e2e prime tester 0.3.0

# Changelog

## [0.3.0] – Initial Release

### Added

#### C++ Prime Tester Console App (`feat: Prime tester console app #92`)
- `src/prime.h` / `src/prime.cpp` – `is_prime()` function implementing trial-division primality test.
- `src/sieve.h` / `src/sieve.cpp` – Sieve of Eratosthenes for range prime generation, plus a benchmark comparing sieve vs. trial-division (`feat: A sieve for ranges, and a benchmark #93`).
- `src/main.cpp` – CLI entry point: accepts a number or `--range N M` flag; reports primality or lists primes in range.
- `CMakeLists.txt` – CMake build system (C++17, Release build type, produces binary `prime_tester`).
- `README.md` – Full build, usage, and manual verification instructions (`feat: Manual verification steps in the README #94`).
- `CHANGELOG.md` – Project changelog seeded for this release.

#### Release & Run Scripts
- `release/scripts/release.{py,sh,ps1}` – Automate tagging and publishing.
- `release/scripts/run.{py,sh,ps1}` – Build and launch the console app.

#### Space Invaders JS game (pre-existing, same repo)
- `index.html`, `game.js`, `gameConfig.js`, `input.js`, `player.js`, `invaders.js`, `collision.js`, `explosion.js`, `level1.js`, `level2.js`, `level3.js`, `boss.js` – Full browser-based Space Invaders implementation shipped under a prior effort (`e2e space invaders 0.1.0`).
- `docs/releases/0-1-0.md` – Release notes for the Space Invaders 0.1.0 release bundled in the same repository.

## 0.1.0 -- e2e space invaders 0.1.0

# Changelog

## [0.1.0] - Initial Release

### Added
- **Game loop and canvas framework** (`index.html`, `game.js`, `gameConfig.js`): Fixed-timestep loop at 60 updates/s with delta-cap, three-scene state machine (Title → Playing → Game Over), HUD (score, lives, hi-score), and shared `hudState` export.
- **Keyboard input and player ship** (`input.js`, `player.js`): Held-key tracker via `keydown`/`keyup` events; `Player` class with delta-time movement (ArrowLeft/KeyA, ArrowRight/KeyD), single-bullet firing (Space), canvas-boundary clamping, and procedural ship/bullet rendering.
- **Sprite rendering and collision detection** (`invaders.js`, `collision.js`, `explosion.js`): 11×5 lime-green invader formation with 1 px/frame horizontal movement and 20 px edge-drop; AABB bullet-vs-invader and stub enemy-bullet-vs-player collision pass; 20-frame yellow explosion pool; score counter (+10 per kill).
- **Level 1 – The Classic Grid** (`level1.js`): Formation step-interval scaling from ~800 ms (55 invaders) to ~100 ms (1 invader); edge-drop by `INVADER_HEIGHT` (32 px); life-loss/restart on invader reach; `transitionTo('level2')` on clearance; HUD level indicator.
- **Level 2 – They Shoot Back** (`level2.js`): 1.5× faster formation (0.67× Level 1 intervals); random invader shooting (800–2000 ms timer, lowest invader per column, 300 px/s bullets); player respawn at bottom-centre with 2 s invulnerability and flashing; UFO every 20 s alternating sides at 120 px/s with score tiers (0→100, 1→50, 2→150, 3→300 by `shotCount % 4`); static Game Over screen on last life; `transitionTo('level3')` on clearance.
- **Level 3 – Shields and Formation Split** (`level3.js`): Four destructible 4×4-cell bunkers at ~80% canvas height, cell-level erosion from any projectile; formation split into independent halves at 50% kills, halves start in opposite directions and bounce independently; Level 2 shooting behaviour retained; `this.done` flag on clearance or player death.
- **Boss Level – Multi-Phase Finale** (`boss.js`): Boss drawn with canvas primitives, 10 HP with health bar; Phase 1 (10–6 HP) baseline fire rate, Phase 2 (5–0 HP) ≥2× rate with visual transition indicator; sudden-death on boss projectile hit (reset to Level 1); win screen with final score and restart prompt; shared collision module reused for all hit-testing.
- **README.md**: Planned file layout, manual verification checklists for all levels and features.
- **CI**: BuildBoard-scaffolded `.github/workflows/build.yml` (subsequently removed/replaced in diff — see CI currency step in runbook).
