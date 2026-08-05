## 0.1.0 -- e2e space invaders 0.1.0

# Changelog

## [0.1.0] - Initial Release

### Added
- `index.html` — HTML entry point hosting a 768×896 `<canvas id="gameCanvas">` centred on a black background; loads `game.js` as an ES module; works from `file://` with no server or bundler.
- `gameConfig.js` — Shared configuration constants: `CANVAS_WIDTH=768`, `CANVAS_HEIGHT=896`, `PLAYER_SPEED=200`, `BULLET_SPEED=500`, `STARTING_LIVES=3`, `POINTS_PER_KILL`, `UFO_SPEED`, and related level-tuning values.
- `game.js` — Main game module: fixed-timestep loop at 60 steps/s (`requestAnimationFrame`), delta cap at 5 steps, scene state machine (`TITLE` → `PLAYING` → `GAME_OVER`), canvas HUD renderer, exported `hudState` (`score`, `lives`, `hiScore`, `level`) and `SCENES` constant, `startLevel(n)` dispatcher.
- `input.js` — Keyboard input module: `initInput()` attaches `keydown`/`keyup` listeners; `isKeyHeld(key)` returns stable held-key state with no key-repeat flicker.
- `player.js` — `Player` class: delta-time movement at 200 px/s, left/right clamping, single-bullet constraint at 500 px/s, procedural canvas drawing (arcs + rectangles), `lives` property, hit-invulnerability blinking window for Level 2.
- `invaders.js` — Invader grid: 11×5 formation, step-and-drop movement, edge detection, destruction tracking, explosion effect (~150 ms flash), invader return-fire (bottom-row eligible shooters), UFO sprite with shot-count-based scoring (`playerShotCount % 4` → 50/100/150/300 pts).
- `collision.js` — AABB collision detection: bullet-vs-invader, invader-bullet-vs-player; collision pass runs before render; accepts empty invader-bullet arrays safely.
- `level1.js` — Level 1 logic: 55-invader formation, speed scaling (`100 + (aliveCount-1)*(700/54)` ms interval), 24 px drop on edge, lose condition (invaders reach player top edge), win condition calls `startLevel(2)`, HUD level indicator.
- `level2.js` — Level 2 logic: seamless transition from Level 1, lives carry over, 1.4× faster base movement, invader return fire with randomised intervals, UFO mechanic, hit invulnerability window (~2 s blinking), advances to Level 3 on clear.
- `README.md` — Project overview, canonical file-layout table, `file://` run instructions, manual verification steps for Title → Playing → Game Over → Title flow and level mechanics.
- CI build workflow (`.github/workflows/build.yml`) scaffolded by BuildBoard.
