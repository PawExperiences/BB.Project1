## 0.1.0 -- e2e space invaders 0.1.0

# Changelog

## [0.1.0] - Initial Release

### Added
- **Game loop and canvas framework** (`index.html`, `game.js`, `gameConfig.js`): 768×896 canvas on a black background, fixed-timestep game loop at 60 fps (delta capped at 0.25 s), scene state machine (Title → Playing → Game Over), canvas-drawn HUD (score, lives, hi-score), exported `hudState` object for downstream modules, stub comments for future imports.
- **Keyboard input and player ship** (`input.js`, `player.js`): `initInput()` / `isKeyHeld()` input manager using `keydown`/`keyup` listeners; `Player` class with delta-time movement at 200 px/s, edge clamping, single-bullet-in-flight shooting at 500 px/s, procedural ship and bullet drawing, `lives` counter seeded from `STARTING_LIVES`.
- **Sprite rendering and collision detection** (`invaders.js`, `collisions.js`, `explosions.js`): 11×5 invader grid (24×16 px cells, 8 px gaps), formation march (8 px/step, every 30 ticks), edge-drop (16 px) with direction reversal, AABB bullet-vs-invader collision pass (runs before draw), 8-frame explosion flash, on-canvas score display (+10 per kill), commented stub for future invader-bullet-vs-player collision.
- **Level 1: the classic grid** (`level1.js`): formation top at y=48 px, linear step-interval scaling (800 ms at 55 alive → 100 ms at 1 alive), one-cell-height drop on edge contact, win → transition to Level 2, lose life + formation reset when formation reaches player row, HUD level label.
- **Level 2: they shoot back** (`level2.js`): 1.5× faster formation (0.67× interval), global enemy shoot timer (800–2000 ms random), lowest-per-column invader fires at 300 px/s, UFO every 20 s alternating sides at 120 px/s, UFO score tiers based on `totalShotsFired % 4` (50/100/150/300), player hit → 2 s invulnerability with ship flash, standard game-over on last life.
- **Level 3: shields and splitting formation** (`level3.js`): four destructible shield bunkers at ~80% canvas height (4×4 grid of 8×8 px green cells), per-cell projectile erosion, formation split at ⌊startingCount/2⌋ kills into two independent sub-formations moving in opposite directions, independent edge-drop and invader fire per half, transition to boss on all-clear.
- **Boss level: multi-phase finale** (`boss.js`): boss drawn with canvas primitives, 10 HP, horizontal wall-bounce movement, Phase 1 (HP 10–6, fires every ~2 s), Phase 2 (HP ≤5, fires every ~1 s, health bar colour shift), 100 pts per hit + 500 pt completion bonus, sudden-death on boss bullet hit (Level 1 restart + score reset), win screen with final score and restart prompt.
- **Project README** (`README.md`): planned file layout, manual verification checklist for all levels and mechanics.
