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
| `boss.js` | Level 4: multi-phase boss fight |
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

## Level 4 — Boss Fight

### What's new in Level 4
- **Single boss entity** rendered using canvas primitives only (no sprites), 160×80 px.
- Boss spawns centred near the top of the canvas and drifts horizontally at **90 px/s**, reversing at canvas edges. It never descends.
- A **full-width health bar** at the top of the canvas shows current HP out of 10.
- **Three-bullet spread** fired from the boss centre: straight down, 20° left, 20° right; all bullets travel at 260 px/s.
  - **Phase 1** (HP 10 → 6): fires every **1500 ms**.
  - **Phase 2** (HP ≤ 5): fires every **700 ms**; cockpit turns red.
- **Player hits boss**: each player bullet reduces boss HP by 1 (via `collision.js`).
- **Boss hits player**: immediate **sudden-death** game-over → restart from Level 1.
- **Boss HP reaches 0**: a **win screen** displays the final score and a **RESTART** button that returns to Level 1.

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

### Level 4 (Boss) Acceptance Tests

| # | Test | Expected result |
|---|---|---|
| B4-01 | Clear Level 3 | Game automatically transitions to Level 4; boss appears near top of canvas |
| B4-02 | Observe boss size | Boss body is visibly 160×80 px, drawn with canvas primitives only |
| B4-03 | Observe boss movement | Boss drifts horizontally at ~90 px/s; reverses at left and right canvas edges; never moves vertically |
| B4-04 | Check health bar at start | Full-width bar at top of canvas shows HP 10/10 |
| B4-05 | Hit boss with one player bullet | HP bar updates to 9/10 immediately |
| B4-06 | Observe Phase 1 firing rate | Boss fires a 3-bullet spread roughly every 1500 ms |
| B4-07 | Reduce boss HP to 5 | Boss immediately switches to Phase 2; cockpit turns red; firing rate increases to ~700 ms |
| B4-08 | Allow a boss bullet to hit player | Immediate game-over screen appears; pressing ENTER restarts from Level 1 |
| B4-09 | Defeat boss (HP to 0) | Win screen appears with the player's final score and a RESTART button |
| B4-10 | Click RESTART on win screen | Game resets to Level 1 with score 0 |
| B4-11 | Verify collision logic | No second collision implementation; boss.js imports from collision.js |
| B4-12 | file:// URL | Game runs correctly when index.html is opened directly from the filesystem |

---

## Running the CI Check Locally

The CI simply checks that `index.html` is present:

```bash
test -f index.html && echo "OK"
```

No build step is required.
