# Space Invaders — Hand-Written ES Modules

A classic Space Invaders clone built with plain HTML, CSS and ES modules.
No framework, no bundler, no npm. Open `index.html` directly in your browser
(file:// URL works).

## How to Play

1. Open `index.html` in a modern browser (Chrome, Firefox, Edge).
2. Press **Enter** on the title screen to start.
3. **Arrow Left / A** — move left  
   **Arrow Right / D** — move right  
   **Space** — fire
4. Destroy all invaders to advance to the next level.
5. Survive as long as possible. Your hi-score persists until the page is refreshed.

---

## Manual Verification Steps

Run through every item below in a plain browser tab (file:// URL).
No test runner is required; these are human play-through checks.

### Level 1 — Baseline

| # | Action | Expected result |
|---|--------|------------------|
| L1-1 | Open `index.html`, press Enter | Title screen appears; pressing Enter starts Level 1 with 3 lives, score 0. |
| L1-2 | Let the invader formation march | Formation moves side-to-side, drops one row on each edge bounce. |
| L1-3 | Fire with Space | Yellow bullet travels upward; hit invader disappears with yellow flash; score increments by 10. |
| L1-4 | Let the formation reach the player row without firing | One life is lost; formation resets; score is preserved. |
| L1-5 | Lose all 3 lives | GAME OVER screen appears showing final score; pressing Enter returns to title. |
| L1-6 | Destroy every invader | **GAME OVER screen appears and score/hi-score are preserved — auto-advance to Level 2 begins (see L2 tests).** |

---

### Level 2 — Auto-Advance from Level 1

| # | Action | Expected result |
|---|--------|------------------|
| L2-ADV-1 | Clear all 55 invaders in Level 1 | Scene switches directly to Level 2 with **no level-select or transition screen**. |
| L2-ADV-2 | Observe HUD immediately after advance | **Score and lives are unchanged** from the end of Level 1 (neither is reset to 0 or 3). Level counter shows "LEVEL 2". |

---

### Level 2 — Enemy Fire

| # | Action | Expected result |
|---|--------|------------------|
| L2-FIRE-1 | Enter Level 2 and observe the invaders | After 0.8–2.0 s, a light-red bullet drops from one of the bottom-row invaders. |
| L2-FIRE-2 | Watch multiple shots over 30 s | Each shot comes from the **lowest living invader in its column**; interval between shots is visibly random (0.8–2.0 s). |
| L2-FIRE-3 | Let an enemy bullet reach the bottom edge | Bullet disappears silently — no sound, no explosion, no life loss. |
| L2-FIRE-4 | Kill all but one column of invaders | Only that column fires; only its lowest invader fires. |
| L2-FIRE-5 | Destroy the last invader | Enemy fire stops immediately; level transitions automatically to Level 3. |

---

### Level 2 — UFO Bonus

> **UFO side note:** The first UFO always enters from the **left**. Subsequent UFOs alternate (right, left, right, …).

| # | Action | Expected result |
|---|--------|------------------|
| L2-UFO-1 | Wait ~20 s after Level 2 starts | A magenta UFO appears from the **left** side, near the top of the canvas. |
| L2-UFO-2 | Let the UFO cross without shooting it | UFO exits the right edge and disappears — **score does not change**. |
| L2-UFO-3 | Wait another ~20 s | Second UFO enters from the **right**; subsequent UFOs alternate sides. |
| L2-UFO-4 | Shoot the UFO — **scoring tier test** (repeat for each tier): | |
| | Fire exactly **0 shots** before hitting UFO (totalShotsFired % 4 = 0) | Score += **50** |
| | Fire such that **totalShotsFired % 4 = 1** before hit | Score += **100** |
| | Fire such that **totalShotsFired % 4 = 2** before hit | Score += **150** |
| | Fire such that **totalShotsFired % 4 = 3** before hit | Score += **300** |
| L2-UFO-5 | Confirm `totalShotsFired` is cumulative | Shots fired during Level 1 **count** toward the modulo — fire 3 shots in Level 1, then immediately hit the UFO → tier index = 3 → 300 pts. |

---

### Level 2 — Player Hit and Invulnerability

| # | Action | Expected result |
|---|--------|------------------|
| L2-HIT-1 | Stand still and let an enemy bullet hit you | Lives decrements by exactly 1; ship reappears at bottom-centre (same start position as Level 1 start). |
| L2-HIT-2 | Observe the ship immediately after respawn | Ship **flashes** (alternates visible/invisible rapidly) for ~2 seconds. |
| L2-HIT-3 | During the flashing window, let a second bullet pass through the ship | **No life is lost**; invulnerability is not re-triggered; flashing continues from where it was. |
| L2-HIT-4 | After the 2-second flash window ends | Ship renders solidly; the next bullet hit **does** cost a life normally. |
| L2-HIT-5 | Lose all lives from enemy fire | Standard GAME OVER screen appears; pressing Enter returns to title. |

---

### Level 2 — Formation Speed

| # | Action | Expected result |
|---|--------|------------------|
| L2-SPD-1 | Compare march speed at 55 invaders alive | Level 2 formation visibly steps **faster** than Level 1 at the same density (≈1.5× faster). |
| L2-SPD-2 | Kill invaders and watch speed increase | Formation still accelerates as invaders die, same curve shape as Level 1 but shifted faster overall. |

---

### Level 3 — Auto-Advance from Level 2

| # | Action | Expected result |
|---|--------|------------------|
| L3-ADV-1 | Clear all invaders in Level 2 | Scene switches **directly to Level 3** with no transition screen or manual input. |
| L3-ADV-2 | Observe HUD after advancing | Score and lives are **unchanged** from end of Level 2. Level counter shows **"LEVEL 3"**. |

---

### Level 3 — Shield Bunkers

| # | Action | Expected result |
|---|--------|------------------|
| L3-BNK-1 | Enter Level 3 and observe the canvas | **Four green bunkers** appear horizontally centred at approximately **80 % of the canvas height** (evenly spaced). |
| L3-BNK-2 | Inspect a bunker closely | Each bunker is a **4 × 4 grid of 8 × 8 px cells** filled in solid `#00FF00`. |
| L3-BNK-3 | Fire a player bullet directly into a bunker | The **exact cell** the bullet overlaps is removed (hole visible on the very next frame). The bullet is destroyed — it does **not** pass through. |
| L3-BNK-4 | Fire through an existing gap in a bunker | Bullet passes through the gap and continues upward — **no cell is consumed**. |
| L3-BNK-5 | Let an invader bullet (light-red) strike a bunker | The overlapping cell disappears; the invader bullet is destroyed. |
| L3-BNK-6 | Repeatedly shoot the same bunker from different angles | Bunker erodes cell-by-cell until fully destroyed; player bullets then fly through freely. |

---

### Level 3 — Invader Formation Split

| # | Action | Expected result |
|---|--------|------------------|
| L3-SPL-1 | Begin Level 3 and observe the formation | Standard **11-column × 5-row** grid moves side-to-side exactly as in Levels 1 and 2. |
| L3-SPL-2 | Kill the 27th invader (⌊55 / 2⌋ = 27 destroyed) | The formation **splits into two independent halves** with no manual input. |
| L3-SPL-3 | Identify the split boundary | Left half = **columns 0–4** (5 columns); right half = **columns 5–10** (6 columns, middle column goes to right when 11 is odd). |
| L3-SPL-4 | Watch direction immediately after split | Left half moves **left**; right half moves **right** — the two halves diverge. |
| L3-SPL-5 | Let the left half reach the left canvas edge | Left half **steps down one row and reverses** — identical to classic arcade step-down. |
| L3-SPL-6 | Let the right half reach the right canvas edge | Right half **steps down one row and reverses** independently of the left half. |
| L3-SPL-7 | Destroy all invaders in the left half first | Right half continues moving and shooting on its own; game does **not** end prematurely. |
| L3-SPL-8 | Destroy all invaders in both halves | All invaders dead → auto-advance to the **Boss Level** (no more placeholder screen). |

---

### Level 3 — Invader Shooting

| # | Action | Expected result |
|---|--------|------------------|
| L3-SHT-1 | Enter Level 3 and wait | Within **0.8–2.0 s**, a light-red bullet drops from the bottom-most invader of a randomly chosen column. |
| L3-SHT-2 | Watch shooting over 60 s | Shots come from the **lowest live invader** in their column; timing is visibly random. At most **3 invader bullets** on screen simultaneously. |
| L3-SHT-3 | After the split, observe fire from both halves | Each sub-formation fires **independently** — shots can come from the left-half columns and right-half columns at different times. |
| L3-SHT-4 | Let an invader bullet reach the bottom edge | Bullet disappears silently — no life lost, no sound. |

---

### Level 3 — Player Hit and Invulnerability

| # | Action | Expected result |
|---|--------|------------------|
| L3-HIT-1 | Stand still and let an enemy bullet hit you | Lives decrements by 1; ship respawns at **bottom-centre** and begins **flashing** for ~2 s. |
| L3-HIT-2 | During the flash window, let a second bullet pass through | **No life is lost**; invulnerability continues until the 2-second window expires. |
| L3-HIT-3 | After flashing stops, take another hit | Life is lost normally. |
| L3-HIT-4 | Lose all lives to invader fire | **GAME OVER** screen appears; pressing Enter returns to title. |

---

### Level 3 — Level Completion

| # | Action | Expected result |
|---|--------|------------------|
| L3-WIN-1 | Destroy every invader across both sub-formations | Scene transitions **directly to the Boss Level** — no placeholder screen. |

---

### Boss Level — Appearance and Movement

| # | Action | Expected result |
|---|--------|------------------|
| BL-APP-1 | Clear all Level 3 invaders | Scene transitions immediately to the Boss Level. Level counter shows **"LEVEL 4"**. |
| BL-APP-2 | Observe the boss on entry | The boss appears **immediately** at the horizontal centre of the top of the canvas — no intro animation or fade. |
| BL-APP-3 | Watch the boss over several seconds | Boss moves **horizontally back and forth**, bouncing off the left and right canvas edges continuously. |
| BL-APP-4 | Inspect the boss visually | Boss is drawn entirely with **canvas 2D primitives** (rectangles, arcs, lines). No external image files are loaded. |

---

### Boss Level — Health Bar

| # | Action | Expected result |
|---|--------|------------------|
| BL-HP-1 | Enter the Boss Level | A health bar is **visible at the top of the canvas** showing full HP (10/10). |
| BL-HP-2 | Hit the boss with one player bullet | Health bar shrinks by exactly **1/10** of its total width; score increases by **100**. |
| BL-HP-3 | Hit the boss 4 more times (total 5 hits, HP now 5) | Health bar is at **50 %** width; colour is still the Phase 1 colour (green). |
| BL-HP-4 | Hit the boss once more (total 6 hits, HP now 4 — drops to ≤ 5) | Health bar colour **shifts visibly** (e.g. green → orange/red) indicating Phase 2. The label reads **"[PHASE 2]"**. |
| BL-HP-5 | Continue hitting until HP reaches 0 | Health bar empties to zero; win screen appears immediately. |

---

### Boss Level — Phase 1 Firing (HP 10 – 6)

| # | Action | Expected result |
|---|--------|------------------|
| BL-P1-1 | Enter Boss Level and do not move the player | Boss fires a **single straight-down projectile** aimed at the player's X position approximately every **2 seconds** (tolerance ±200 ms). |
| BL-P1-2 | Move the player left or right before the next shot | The next projectile is fired toward the **player's position at the moment the shot is taken** (not a homing projectile). |
| BL-P1-3 | Let a boss projectile reach the bottom of the canvas | Projectile disappears silently — no event triggered. |
| BL-P1-4 | Observe simultaneous projectiles | At most **one boss projectile** is in flight at any time during Phase 1. |

---

### Boss Level — Phase 2 Firing (HP 5 – 1)

| # | Action | Expected result |
|---|--------|------------------|
| BL-P2-1 | Reduce boss HP to 5 | Boss transitions to Phase 2: health bar changes colour; fire rate **noticeably increases**. |
| BL-P2-2 | Time the shots in Phase 2 | Shots arrive approximately every **1 second** (tolerance ±200 ms) — clearly faster than the ~2 s Phase 1 rate. |
| BL-P2-3 | Observe projectile behaviour | Pattern is identical to Phase 1 (single aimed straight-down projectile); at most **one projectile** in flight at a time. |

---

### Boss Level — Sudden-Death Collision

| # | Action | Expected result |
|---|--------|------------------|
| BL-COL-1 | Let a boss projectile hit the player | The run **ends immediately** — no life decrement, no respawn. |
| BL-COL-2 | Observe the scene after collision | Player is returned **directly to Level 1** (title screen is skipped). Score is **reset to 0**; lives reset to **3**. |
| BL-COL-3 | Verify no intermediate screen appears | There is **no game-over overlay** shown — the transition to Level 1 is instant. |

---

### Boss Level — Scoring

| # | Action | Expected result |
|---|--------|------------------|
| BL-SCR-1 | Hit the boss with a player bullet | Score increments by exactly **100 points** per hit. |
| BL-SCR-2 | Confirm 10 hits total before boss death | Running score increases by 100 per hit (1 000 pts from hits alone if all 10 hit). |
| BL-SCR-3 | Deliver the killing blow (HP → 0) | Score receives an additional **500 point bonus** on top of the final 100-point hit award. |

---

### Boss Level — Win Screen

| # | Action | Expected result |
|---|--------|------------------|
| BL-WIN-1 | Defeat the boss (HP → 0) | A **win screen overlay** appears on the canvas immediately. |
| BL-WIN-2 | Inspect the win screen | Screen shows: a **"YOU WIN!" / "CONGRATULATIONS!"** message, the player's **final score**, and a **"Press ENTER to play again"** prompt. |
| BL-WIN-3 | Press Enter on the win screen | Player is returned to **Level 1** with score reset to 0 and lives reset to 3. |
| BL-WIN-4 | Verify hi-score is preserved | The hi-score displayed in the HUD during Level 1 reflects the score achieved in the winning run (if it was a new record). |

---

## File Structure

```
index.html        — entry point
game.js           — game loop, scene state machine, HUD
gameConfig.js     — shared constants (canvas size, speeds, lives)
input.js          — keyboard input manager
player.js         — player ship: movement, shooting, drawing
invaders.js       — InvaderGrid: march logic, geometry, draw
collisions.js     — collision detection pass (bullet vs invader)
explosions.js     — explosion flash pool
level1.js         — Level 1 logic (classic grid, step interval curve)
level2.js         — Level 2 logic (enemy fire, UFO, invulnerability)
level3.js         — Level 3 logic (shields, formation split)
boss.js           — Boss level: multi-phase finale
README.md         — this file
```

## Architecture Notes

- **No bundler, no server required.** All imports use relative sibling paths.
- **Fixed timestep** (60 Hz update, uncapped render) prevents speed variation across machines.
- **`computeStepInterval(liveCount)`** in `level1.js` is the single source of truth for the formation speed curve. Level 2 and Level 3 import it and multiply by 0.67.
- **`getTotalShotsFired()`** in `level1.js` is read by Level 2 on init to carry the shot counter forward.
- UFO scoring uses `totalShotsFired % 4` mapped to `[50, 100, 150, 300]`.
- Invulnerability is tracked per level; the player sprite is simply skipped in the render pass during flash-off half-cycles.
- **Level 3 split logic:** when ⌊55/2⌋ = 27 invaders are destroyed, the single `InvaderGrid`-style formation is replaced by two independent `SubFormation` instances. Left half (columns 0–4) diverges left; right half (columns 5–10) diverges right. Each sub-formation has its own step timer, direction, and shot timer.
- **Shield bunkers** are 4 × 4 grids of 8 × 8 px boolean cells. Any projectile that overlaps a live cell destroys exactly that cell and is consumed.
- **Boss level** (`boss.js`): single large boss with 10 HP drawn with canvas primitives. Phase 1 (HP 10–6) fires every ~2 s; Phase 2 (HP ≤ 5) fires every ~1 s. A single aimed straight-down projectile is in flight at a time. Any hit instantly ends the run; the player restarts Level 1. Defeating the boss awards 500 bonus points and shows a win screen. Score and hi-score carry over through all levels.
