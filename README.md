# Space Invaders — BB.Project1

A hand-crafted, framework-free Space Invaders clone that runs directly from the filesystem (`file://` URL) with no build step or local server.

## How to Play

1. Clone or download the repository.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
3. Use the keyboard:
   - **Arrow Left / A** — move ship left
   - **Arrow Right / D** — move ship right
   - **Space** — fire

## File Map

| File | Purpose |
|---|---|
| `index.html` | Entry point — loads `game.js` as an ES module |
| `game.js` | Game loop, level dispatch, HUD, collision wiring |
| `player.js` | Player ship: movement, shooting, lives, invulnerability |
| `level1.js` | Level 1 — classic 11×5 invader grid |
| `level2.js` | Level 2 — invaders fire back |
| `level3.js` | Level 3 — faster, more challenging |
| `boss.js` | Level 4 — multi-phase boss fight |
| `invaders.js` | `InvaderGrid` class (continuous-movement variant) |
| `formation.js` | Shared formation geometry constants |
| `collision.js` | `CollisionSystem` — AABB detection, explosions, score |
| `input.js` | Keyboard input (held-key tracking) |
| `state.js` | Shared mutable state (lives, shot count) |
| `gameConfig.js` | Canvas size and global game constants |

---

## Manual Verification Steps

Open `index.html` directly in a browser (`file://` URL — no server needed) and work through each section.

### Level 1 — Classic Grid

1. Launch the game. A 11-column × 5-row green invader formation appears.
2. Invaders step horizontally; on reaching a canvas edge they drop one row and reverse.
3. As invaders are killed the step interval shortens (formation speeds up).
4. **Fire**: press Space — a yellow bullet travels upward and destroys the first invader it contacts.
5. **Breach**: allow an invader to reach the bottom — the formation resets and a life is lost (HUD top-right decrements).
6. Kill all 55 invaders — the game automatically advances to **Level 2** with no manual intervention.

### Level 2 — Invaders Fire Back

1. The invader formation reappears (same layout) in Level 2.
2. Invaders periodically fire downward bullets.
3. An invader bullet hitting the player ship triggers a hit; lives decrement and the ship respawns with a 2-second invulnerability flash.
4. Kill all invaders to advance to **Level 3**.

### Level 3 — Advanced Challenge

1. Level 3 presents an increased difficulty (faster movement, more aggressive firing, or altered formation — per Level 3 implementation).
2. Complete Level 3 by destroying all invaders. The game automatically advances to **Level 4** with no manual intervention.

### Level 4 — Boss Fight

#### Boss appearance
1. A large 160×80 px enemy appears near the top of the canvas, rendered entirely with Canvas 2D primitives (no images).
2. A **health bar** is visible at the very top of the canvas, initialised to full width (representing 10 HP).

#### Boss movement
3. The boss drifts horizontally at 90 px/s. Confirm it bounces off the left and right canvas edges.
4. The boss **never descends** — its vertical position remains fixed throughout the fight.

#### Phase 1 firing (HP 10 → 6)
5. Every **1 500 ms** the boss fires a three-bullet spread: one bullet straight down, one angled 20° to the left, one angled 20° to the right.
6. All three bullets travel at 260 px/s (visibly slower than the player's 500 px/s bullet).
7. The health bar shrinks with each player bullet that hits the boss.

#### Phase 2 firing (HP 5 → 0)
8. When the boss reaches 5 HP the cadence doubles — bullets now fire every **700 ms** (same spread pattern, noticeably faster).
9. The health bar turns **yellow** to signal Phase 2.

#### Sudden-death rule
10. Let a boss bullet hit the player ship. The run ends **immediately** — the game resets to Level 1, the score resets to 0, and lives reset to 3. There is no incremental life loss.

#### Win condition
11. Reduce the boss to 0 HP. A **Win Screen** appears overlaid on the canvas showing:
    - The text **"YOU WIN!"** prominently displayed.
    - The player's **final score** (e.g. "Final Score: 120").
    - A clearly labelled **"[ RESTART ]"** button.
12. Click **[ RESTART ]**. The game resets to Level 1, score resets to 0, and lives reset to 3.

#### Edge cases
13. Verify the boss health bar reaches exactly 0 width (not negative) when the last hit lands.
14. Verify the win screen does not appear before the boss reaches 0 HP.
15. Verify the restart button only responds to clicks inside its visible boundary.

---

## Architecture Notes

- **No framework, no bundler, no npm.** Every file is a plain ES module loaded via `<script type="module">`.
- **Runs from `file://`** — no `fetch()` of local files, no dynamic imports that require a server.
- **Collision detection** is centralised in `collision.js` (`CollisionSystem`). The boss level imports and uses this module for bullet-vs-player detection; no second collision implementation exists elsewhere.
- **Score** accumulates across levels via the `CollisionSystem` instance in `game.js`. The boss fight's player-bullet-vs-boss hit detection is handled inside `boss.js` (which decrements boss HP directly), separate from the invader-kill score path.
- **Shared state** (`state.js`) carries lives and session shot count across level transitions.
