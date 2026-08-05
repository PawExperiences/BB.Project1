# Space Invaders — E2E Build

A hand-written, no-framework, no-bundler Space Invaders clone that runs directly from the filesystem.

## Running the Game

Open `index.html` in any modern browser — no server, no build step required:

```
file:///path/to/project/index.html
```

Or simply double-click `index.html` in your file manager.

## Controls

| Key | Action |
|-----|--------|
| ← / A | Move left |
| → / D | Move right |
| Space | Fire |

## Level Progression

| Level | Description |
|-------|-------------|
| 1 | Classic 11×5 invader grid — timer-driven movement |
| 2 | Second wave — faster movement |
| 3 | Third wave — fastest movement |
| **BOSS** | Multi-phase boss finale |
| Win Screen | Displayed after defeating the boss |

---

## Manual Verification Steps

The steps below cover every acceptance criterion for the game, including the boss fight and win screen.

### 1 — Basic startup

1. Open `index.html` via `file://` URL (no HTTP server).
2. Verify the canvas appears with a black background, the HUD at the top, the player ship near the bottom, and the invader grid.
3. Confirm the HUD shows `Score: 0`, `Lives: 3`, `Level: 1`.

### 2 — Player controls

4. Hold ← (or A) — ship moves left and stops at the left canvas edge.
5. Hold → (or D) — ship moves right and stops at the right canvas edge.
6. Press Space — a yellow bullet fires upward. While the bullet is in flight, pressing Space again does nothing (single-bullet mechanic).
7. Let the bullet travel off the top of the canvas — a new bullet can then be fired.

### 3 — Hitting invaders

8. Shoot an invader. Verify: the invader disappears, a brief white flash appears at its position, and the score increments by 10.

### 4 — Level 1 → 2 → 3 progression

9. Destroy all 55 invaders on Level 1 (cheat: aim quickly). Verify the game automatically advances to Level 2 (HUD shows `Level: 2`, fresh invader grid appears, score is preserved).
10. Destroy all invaders on Level 2. Verify automatic advance to Level 3 (`Level: 3`).
11. Destroy all invaders on Level 3. Verify automatic advance to the boss fight (`Level: BOSS`) with **no player input or score threshold required**.

### 5 — Boss fight appearance (Phase 1)

12. After Level 3 clears, verify:
    - The invader grid is gone.
    - A large boss entity (≈ 120 × 80 px) is visible, centred horizontally near the top of the canvas.
    - The boss is rendered entirely with canvas primitives — **no image files** are loaded.
    - The boss **does not move horizontally** at any point.
    - A health bar is displayed below the boss showing **`BOSS  HP: 10 / 10`**.
    - The boss body has a **cyan / teal** colour scheme (Phase 1).

### 6 — Boss Phase 1 firing

13. Wait approximately 2 seconds. A single projectile fires straight down from the boss's cannon.
14. Move the ship out of the projectile path. Verify the projectile disappears when it exits the bottom of the canvas.
15. Wait for a second projectile. Confirm the interval is approximately 2 seconds.

### 7 — Damaging the boss / health bar update

16. Fire player bullets at the boss. Verify:
    - Each hit reduces the health bar immediately and visibly.
    - The HP label below the bar decrements with each hit (`HP: 9 / 10`, `HP: 8 / 10`, …).

### 8 — Phase 2 activation at 5 HP

17. Continue hitting the boss until HP reaches **exactly 5**. Verify ALL of the following occur simultaneously:
    - The boss body colour changes from cyan/teal to **orange/red**.
    - A **`⚡ PHASE 2 ⚡`** text indicator appears below the health bar.
    - The health bar fill changes to orange/red.
    - Projectiles now fire at approximately **1-second intervals** (noticeably faster than before).
    - The shot pattern is still a **single projectile straight down** — no spread.

### 9 — Instant death on boss projectile hit

18. Deliberately let a boss projectile reach the player ship. Verify:
    - The game **immediately** resets — no death animation, no life lost.
    - The HUD shows `Score: 0` and `Level: 1`.
    - The boss fight does not continue.
    - The Level 1 invader grid is visible and normal gameplay resumes.

### 10 — Winning the game

19. Defeat the boss (reduce HP to 0 using player bullets). Verify:
    - The canvas shows a **Win Screen** overlay.
    - The overlay contains the text **`YOU WIN!`** (gold colour).
    - The overlay contains the text **`The boss has been defeated!`**.
    - The overlay shows **`Final Score: N`** where N matches the score shown in the HUD just before the last hit.
    - The overlay shows **`Press any key to play again`**.

### 11 — Win screen any-key restart

20. While the Win Screen is displayed, press **any keyboard key**. Verify:
    - The Win Screen disappears.
    - The game restarts at **Level 1** with **Score: 0** and **Lives: 3**.
    - Normal gameplay resumes.

### 12 — Edge cases

21. During Phase 2, confirm the boss HP continues to decrement correctly down to 0 with each hit.
22. Confirm `index.html` loads and the full game (including boss fight) is playable with **no HTTP server** (pure `file://` URL).

---

## File Structure

```
index.html      — Entry point (loads game.js as an ES module)
game.js         — Game loop, scene manager, level progression
boss.js         — Boss entity, two-phase behaviour, win screen rendering
collision.js    — AABB collision helpers (shared by all levels)
explosion.js    — Explosion effect pool
gameConfig.js   — Shared constants (canvas size, speeds, lives)
input.js        — Keyboard input (held-key tracking)
invaders.js     — Invader grid state, movement, drawing
level1.js       — Level 1 logic (timer-driven formation movement)
level2.js       — Level 2 logic
level3.js       — Level 3 logic
player.js       — Player ship (movement, bullet, procedural drawing)
score.js        — Score state (getScore / addScore / resetScore)
```
