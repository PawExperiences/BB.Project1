## 0.1.0 -- e2e space invaders 0.1.0

# Changelog

## [0.1.0] - Initial Release

### Added
- **CI Scaffold**: Minimal `index.html`, `README.md`, and companion files committed to unblock the GitHub Actions build pipeline (`feat: CI build failed #158`).
- **Game Loop & Canvas Framework** (`game.js`, `gameConfig.js`, `index.html`): Fixed-timestep game loop at 60 steps/s with delta cap (≤250 ms), three-scene state machine (Title → Playing → Game Over) driven by ENTER key, on-canvas HUD (Score / Lives / Hi-Score), and exported `hudState` object (`feat: Game loop and canvas framework #159`).
- **Keyboard Input & Player Ship** (`input.js`, `player.js`): Hold-state keyboard tracker (`initInput` / `isKeyHeld`), procedurally-drawn player ship, single-bullet firing mechanic clamped to canvas bounds, lives initialised from `gameConfig.js` (`feat: Keyboard input and the player ship #160`).
- **Sprite Rendering & Collision Detection** (`invaders.js`, `collision.js`): 11×5 invader formation with horizontal sweep and drop logic, AABB collision (player bullet vs invader, invader bullet vs player), score increment (+10 per kill), 300 ms explosion effect, score overlay via `ctx.fillText` (`feat: Sprite rendering and collision detection #161`).
- **Level 1 – The Classic Grid** (`level1.js`): Playable first level; step-interval scales linearly from ~800 ms (55 invaders) to ~100 ms (1 invader); formation drops 48 px on edge contact; signals `'LIFE_LOST'` / `'NEXT_LEVEL'` / `null`; "LEVEL 1" drawn on canvas each frame (`feat: Level 1: the classic grid #162`).
- **Level 2 – They Shoot Back** (`level2.js`): Formation 1.5× faster than Level 1; single on-screen invader bullet fired from lowest invader in a random column every 800–2 000 ms; player respawn at bottom-centre with 2 s invulnerability and 200 ms flash; bonus UFO every 20 s at 120 px/s with score tiers [50,100,150,300] keyed by session shot count (`feat: Level 2: they shoot back #163`).
- **Level 3 – Shields & Formations** (`level3.js`): Four destructible 4×4-cell shield bunkers at ~80 % canvas height; standard 11×5 invader grid; formation splits into independent left/right halves when ≥28 invaders are destroyed; returns `'BOSS'` when all invaders cleared (`feat: Level 3: shields and formations #164`).
- **Boss Level – Multi-Phase Finale** (`boss.js`): 160×80 px Canvas-primitive boss drifting at 90 px/s; 10 HP health bar; Phase 1 (HP 10–6): 3-bullet spread every 1 500 ms; Phase 2 (HP 5–1): same spread every 700 ms at 260 px/s; sudden-death player rule; Win Screen on HP = 0 with final score and restart (`feat: Boss level: multi-phase finale #165`).
- **Supporting files**: `main.js` (entry-point wiring), `style.css` (dark-background canvas styling), `README.md` (planned file layout, manual verification steps).
- **CI Workflow** (`.github/workflows/build.yml`): BuildBoard-managed build workflow; re-scaffolded to match zero-build-step Node toolchain and artifact upload.
