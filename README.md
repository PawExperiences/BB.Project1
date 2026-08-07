# Space Invaders

A hand-crafted, dependency-free Space Invaders clone built with plain HTML, CSS and ES Modules.
No bundler, no package manager — open `index.html` directly in a modern browser.

---

## How to Play

1. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari).
2. Use **Arrow Left / Arrow Right** to move your ship.
3. Press **Space** to fire.
4. Survive all invader waves and defeat the Boss.

---

## File Overview

| File | Purpose |
|---|---|
| `index.html` | Entry point — canvas element + loads `game.js` |
| `game.js` | Main game loop, scene management |
| `gameConfig.js` | Shared constants (canvas size, speeds, lives) |
| `input.js` | Keyboard state tracker |
| `player.js` | Player ship logic |
| `invaders.js` | Shared invader utilities |
| `collision.js` | AABB collision helpers |
| `level3.js` | Level 3: shields, formations, split mechanic |
| `README.md` | This file |

---

## Level 3 — Shields and Formations

### What's new in Level 3
- **Four destructible shield bunkers** rendered at ~80% of canvas height.
  Each is a 4×4 grid of 8×8 px green cells.
- **11×5 invader grid** (55 invaders) sweeping left/right as in Level 1.
- **Formation split** when 28 invaders are destroyed:
  - Columns 1–6 become the left half and sweep outward to the left.
  - Columns 7–11 become the right half and sweep outward to the right.
  - Each half operates independently with classic edge-detect drop-and-reverse.
- **Win condition**: all invaders in both halves dead → transitions to the Boss Level.

---

## Manual Verification Checklist

Open `index.html` directly from the filesystem (`file://` URL — no local server needed).

### Level 3 Acceptance Tests

| # | Test | Expected result |
|---|---|---|
| L3-01 | Open the game and reach Level 3 | Four green 32×32 bunkers appear at ~80% of canvas height, evenly spaced |
| L3-02 | Count bunker cells at start | Each bunker has exactly 16 solid-colour cells (4 columns × 4 rows) |
| L3-03 | Fire a player bullet into a bunker | The bullet stops; exactly one cell is removed from that bunker |
| L3-04 | Let an invader projectile hit a bunker | The projectile stops; exactly one cell is removed |
| L3-05 | Allow invaders to descend into a bunker | Cells under the invader footprint are eroded; the invader continues alive |
| L3-06 | Count invaders at Level 3 start | 11 columns × 5 rows = 55 invaders, sweeping left/right |
| L3-07 | Destroy 27 invaders | Formation remains unified; no split yet |
| L3-08 | Destroy the 28th invader | Formation immediately splits into two independent groups |
| L3-09 | Observe post-split behaviour | Left group (cols 1–6) moves left; right group (cols 7–11) moves right |
| L3-10 | Let a split half reach a canvas edge | That half drops one step and reverses direction |
| L3-11 | Destroy all invaders | Level 3 win is declared; game transitions to Boss Level |
| L3-12 | Destroyed bunker cells | Do not re-appear after split or at any later point |

---

## Running the CI Check Locally

The CI simply checks that `index.html` is present:

```bash
test -f index.html && echo "OK"
```

No build step is required.
