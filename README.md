# Space Invaders — E2E Project

A hand-crafted Space Invaders game built with vanilla HTML, CSS, and ES modules.
No build step, no bundler, no package manager — open `index.html` directly in a
browser (including from a `file://` URL) and play.

---

## How to Run

1. Clone or download the repository.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge).
3. No server required — all imports are relative ES-module paths.

---

## Controls

| Key | Action |
|-----|--------|
| **← / A** | Move left |
| **→ / D** | Move right |
| **Space** | Fire |
| **Enter** | Start / Restart |

---

## Levels

| Level | File | Description |
|-------|------|-------------|
| 1 | `level1.js` | Classic 11×5 grid, step-speed increases as invaders are killed |
| 2 | `level2.js` | Invaders shoot back at the player |
| 3 | `level3.js` | Destructible shield bunkers + formation split at 50% kills |

---

## Manual Verification Steps

All acceptance criteria are verified by hand. Follow the steps below after
opening `index.html` in a browser.

---

### General

- [ ] Title screen shows "SPACE INVADERS" and "Press ENTER to start".
- [ ] Pressing **Enter** on the title screen starts Level 1.
- [ ] HUD shows SCORE (top-left), HI (top-centre), LIVES (top-right), LEVEL (below score).
- [ ] Pressing **Enter** on the Game Over screen returns to the title.

---

### Level 3 — Manual Verification Checklist

Level 3 is reached automatically after completing Level 2 (all invaders destroyed).
For quick testing you can temporarily change the `transitionTo` call in `level1.js`
or `level2.js` to jump straight to `'level3'`.

#### 1. Shield Bunkers — Initial State

- [ ] Exactly **four** bunkers appear on screen when Level 3 starts.
- [ ] Each bunker is a solid **green 32 × 32 px block** (4 columns × 4 rows of 8 px cells).
- [ ] All 16 cells of every bunker are visible and fully solid at level start.
- [ ] The four bunkers are **evenly spaced horizontally** across the canvas width.
- [ ] The bunker row is positioned at approximately **80% of the canvas height**
      (roughly two-thirds of the way down, well above the player ship).

#### 2. Shield Erosion — Player Bullet

- [ ] Fire a bullet into a bunker. Observe that **exactly one cell** is removed
      at the collision point.
- [ ] Subsequent shots at the same bunker remove additional individual cells;
      the bunker visually erodes cell by cell.
- [ ] Once all 16 cells of a bunker are destroyed, that bunker is invisible
      (no remaining rectangle is drawn).
- [ ] Shooting through a gap in the bunker (an already-eroded cell) does **not**
      remove a second cell in that hit — the bullet only interacts with the first
      solid cell it overlaps.

#### 3. Shield Erosion — Invader Bullet

- [ ] Allow an invader bullet to pass through the bunker area. Observe that the
      bullet removes cells it overlaps (one per bullet, same as the player bullet).
- [ ] A bunker can be eroded by invader bullets independently from player bullets;
      the two sources of erosion work identically.

#### 4. Invader Bodies Do Not Damage Bunkers

- [ ] Let the formation advance toward the bunker row without firing.
- [ ] Confirm that invader sprites passing over or through a bunker position do
      **not** remove any cells. Only projectiles cause erosion.

#### 5. Starting Formation

- [ ] Level 3 starts with an **11-column × 5-row** grid of invaders (55 total).
- [ ] The formation performs the standard **left-right sweep**, reversing when
      the leading edge reaches the canvas boundary and dropping one row.
- [ ] Invaders fire red bullets downward at random intervals (Level 2 behaviour
      carried forward).

#### 6. Formation Split — Trigger

- [ ] Destroy invaders one by one while monitoring the count.
- [ ] When **28 invaders** have been destroyed (≥ 50% of 55, i.e.
      ⌈55 / 2⌉ = 28), the formation splits.
- [ ] The split happens at the boundary between **column 5 and column 6**
      (columns 0–4 form the left half; columns 5–10 form the right half).
- [ ] Before the 28th kill the formation moves as a single unit; after the kill
      the two halves move independently.

#### 7. Formation Split — Independent Sweep

- [ ] Immediately after the split, the **left half begins moving left** and the
      **right half begins moving right** (opposite directions).
- [ ] Each half reverses direction and drops a row when **its own** bounding edge
      hits the canvas wall — independently of the other half.
- [ ] Both halves move at the **same speed** as the pre-split formation.
- [ ] Surviving invaders in **both** halves continue to fire bullets after the split.

#### 8. Level Completion

- [ ] Destroy all invaders in **both** halves. The `done` flag is set and the
      game transitions away from Level 3 (Game Over screen, or the next level if
      wired up).
- [ ] If the **player ship is hit** enough times to exhaust all lives, the Game
      Over screen appears immediately, consistent with Level 1 / Level 2 behaviour.

#### 9. Edge Cases

- [ ] Clearing one half entirely while the other still has survivors: the
      remaining half continues to sweep and shoot normally.
- [ ] Partial bunker destruction carries over correctly — re-verify that eroded
      cells stay eroded each frame (no cell "heals" between frames).
- [ ] The level runs without errors when opened directly via a `file://` URL
      (check the browser console for any module-import or CORS errors — there
      should be none).

---

## File Overview

| File | Purpose |
|------|----------|
| `index.html` | Canvas host and ES-module entry point |
| `game.js` | Game loop, scene state machine, HUD |
| `gameConfig.js` | Shared constants (canvas size, speeds, lives) |
| `input.js` | Keyboard state tracker |
| `player.js` | Player ship entity |
| `invaders.js` | Legacy invader formation module (used by pre-level code) |
| `collision.js` | AABB collision helpers |
| `explosion.js` | Explosion pool, update, and render |
| `level1.js` | Level 1 — classic grid, accelerating sweep |
| `level2.js` | Level 2 — invaders shoot back |
| `level3.js` | Level 3 — shield bunkers + formation split |
