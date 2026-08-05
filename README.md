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
| 4 | `boss.js` | Boss fight — multi-phase finale, sudden-death projectiles |

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
      game transitions away from Level 3 to Level 4 (boss fight).
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

### Level 4 — Boss Fight: Manual Verification Checklist

Level 4 starts automatically after clearing Level 3 (all invaders destroyed).
For quick testing, temporarily change the `transitionTo('level4')` call in
`level3.js` to trigger from an earlier point, or change `level1.js`'s win
condition to call `transitionTo('level4')` directly.

#### 1. Automatic Entry

- [ ] After destroying the last invader in Level 3, the screen transitions
      directly to Level 4 with **no manual input required**.
- [ ] The HUD shows **LEVEL: 4** immediately upon entry.
- [ ] The player ship is re-centred (fresh spawn position) when Level 4 starts.

#### 2. Boss Appearance

- [ ] A **single large entity** is displayed near the top-centre of the canvas.
- [ ] The boss is drawn entirely with canvas primitives — no image files are
      loaded. (Confirm in the Network tab: no `.png`, `.jpg`, `.svg` requests.)
- [ ] The boss is **visually significantly larger** than a standard alien
      (standard alien = 30 × 20 px; boss hull should be at least 160 × 100 px).
- [ ] The boss has distinct visual elements: a domed top, a main hull body, two
      wing extensions, and a central eye/cannon aperture.

#### 3. Health Bar

- [ ] A health bar is visible **above the boss** from the moment Level 4 starts.
- [ ] The health bar reads **HP: 10 / 10** at the start.
- [ ] Each successful player bullet hit reduces the displayed HP by exactly 1.
- [ ] The health bar fill decreases proportionally as HP drops.
- [ ] The health bar remains visible at all HP values down to 0.

#### 4. Boss Does Not Move

- [ ] Observe the boss for at least 30 seconds without shooting.
- [ ] Confirm the boss position does **not** change at any point — it is
      stationary throughout the entire fight.

#### 5. Phase 1 Fire Rate (HP 10 → 6)

- [ ] At the start of the fight (HP = 10), the boss fires a **single projectile**
      downward from its centre at a baseline interval (~2 seconds).
- [ ] Only one projectile per firing event (no spread or multi-shot).
- [ ] The projectile travels straight downward.
- [ ] While HP is between 10 and 6 inclusive, the fire rate does **not** increase.

#### 6. Phase 2 Activation and Fire Rate (HP 5 → 0)

- [ ] When the boss's HP drops to **exactly 5**, Phase 2 activates.
- [ ] The fire rate immediately increases to at least **2× the Phase 1 rate**
      (Phase 1 ≈ 2 s interval; Phase 2 ≈ 0.9 s interval — more than 2× faster).
- [ ] The higher fire rate is sustained for the remainder of the fight.

#### 7. Phase Transition Visual Indicator

- [ ] At the moment HP drops to 5 (Phase 2 activation), a **visible change**
      occurs on-screen:
  - [ ] The **health bar colour** changes from green to red.
  - [ ] The **boss body colour** shifts from purple (`#cc44ff`) to red (`#ff2200`).
  - [ ] A brief **white/orange flash** pulses on the boss body for ~800 ms.
- [ ] After the flash ends, the boss retains the Phase 2 colour scheme.

#### 8. Player Bullet vs Boss Collision

- [ ] Fire a bullet that hits the boss body. Confirm:
  - [ ] The boss HP decreases by **exactly 1**.
  - [ ] The bullet **disappears** immediately on contact (consumed on hit).
  - [ ] An explosion effect appears at the hit location.
- [ ] Fire multiple bullets; confirm each hit reduces HP by 1 (not more).
- [ ] Bullets that miss the boss (pass beside or above it) do **not** reduce HP.

#### 9. Boss Projectile vs Player — Sudden Death

- [ ] Allow a boss projectile to reach the player ship. Confirm:
  - [ ] The game **immediately resets** to Level 1 (no "Game Over" screen,
        no lives counter — direct reset).
  - [ ] The **score resets to 0** on sudden death.
  - [ ] The **lives counter resets** to the starting value (3).
  - [ ] There is **no continue or extra-life prompt** — the reset is instant.
- [ ] After the reset, the game behaves identically to a fresh Level 1 start.

#### 10. Win Condition — Boss Defeated

- [ ] Reduce the boss HP to 0 by shooting it 10 times.
- [ ] When HP reaches 0, confirm:
  - [ ] The boss body and projectiles are **no longer rendered**.
  - [ ] A **win screen overlay** appears.
  - [ ] The win screen shows a clear **victory message** (e.g. "YOU WIN!").
  - [ ] The win screen shows the **final score** accumulated during the run.
  - [ ] A **restart prompt** is visible ("Press ENTER or SPACE to play again").

#### 11. Win Screen Restart

- [ ] While the win screen is displayed, press **Enter** or **Space**.
- [ ] The game returns to **Level 1** immediately.
- [ ] The **score resets to 0** and **lives reset** to starting value.
- [ ] Level 1 gameplay is fully functional after the restart.

#### 12. API Contract — Same Update/Draw Interface

- [ ] Open the browser console. Confirm there are **no errors** related to
      `boss.js` module loading or missing exports.
- [ ] The game loop drives `boss.js` via the same `{ update, render }` hooks
      used by `level1.js`, `level2.js`, and `level3.js` — verified by inspecting
      that `boss.js` calls `registerLevel({ update, render })`.
- [ ] No bespoke `requestAnimationFrame` call or custom timer loop exists in
      `boss.js` — all timing is driven by the shared game loop's `dt` parameter.

#### 13. Collision Uses Shared Module

- [ ] Open `boss.js` and verify it contains `import { checkHit } from './collision.js'`.
- [ ] Confirm there is **no custom AABB rectangle-overlap function** defined
      inside `boss.js` (no duplicate hit-test logic).
- [ ] All boss hit detections (boss projectile → player, player bullet → boss)
      call `checkHit(a, b)` from `collision.js`.

#### 14. file:// URL Compatibility

- [ ] Open `index.html` directly from the filesystem (drag into browser or use
      File → Open).
- [ ] Play through to Level 4. Confirm the boss loads and operates with
      **no console errors** — specifically no CORS errors, no module-not-found
      errors, and no network requests for external resources.

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
| `boss.js` | Level 4 — boss fight, multi-phase finale |
