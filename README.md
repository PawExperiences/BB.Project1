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
4. Destroy all invaders to advance to Level 2.
5. Survive as long as possible. Your hi-score persists until the page is refreshed.

---

## Manual Verification Steps

Run through every item below in a plain browser tab (file:// URL).
No test runner is required; these are human play-through checks.

### Level 1 — Baseline

| # | Action | Expected result |
|---|--------|-----------------|
| L1-1 | Open `index.html`, press Enter | Title screen appears; pressing Enter starts Level 1 with 3 lives, score 0. |
| L1-2 | Let the invader formation march | Formation moves side-to-side, drops one row on each edge bounce. |
| L1-3 | Fire with Space | Yellow bullet travels upward; hit invader disappears with yellow flash; score increments by 10. |
| L1-4 | Let the formation reach the player row without firing | One life is lost; formation resets; score is preserved. |
| L1-5 | Lose all 3 lives | GAME OVER screen appears showing final score; pressing Enter returns to title. |
| L1-6 | Destroy every invader | **GAME OVER screen appears and score/hi-score are preserved — auto-advance to Level 2 begins (see L2 tests).** |

---

### Level 2 — Auto-Advance from Level 1

| # | Action | Expected result |
|---|--------|-----------------|
| L2-ADV-1 | Clear all 55 invaders in Level 1 | Scene switches directly to Level 2 with **no level-select or transition screen**. |
| L2-ADV-2 | Observe HUD immediately after advance | **Score and lives are unchanged** from the end of Level 1 (neither is reset to 0 or 3). Level counter shows "LEVEL 2". |

---

### Level 2 — Enemy Fire

| # | Action | Expected result |
|---|--------|-----------------|
| L2-FIRE-1 | Enter Level 2 and observe the invaders | After 0.8–2.0 s, a light-red bullet drops from one of the bottom-row invaders. |
| L2-FIRE-2 | Watch multiple shots over 30 s | Each shot comes from the **lowest living invader in its column**; interval between shots is visibly random (0.8–2.0 s). |
| L2-FIRE-3 | Let an enemy bullet reach the bottom edge | Bullet disappears silently — no sound, no explosion, no life loss. |
| L2-FIRE-4 | Kill all but one column of invaders | Only that column fires; only its lowest invader fires. |
| L2-FIRE-5 | Destroy the last invader | Enemy fire stops immediately; level transitions (game over screen for now). |

---

### Level 2 — UFO Bonus

> **UFO side note:** The first UFO always enters from the **left**. Subsequent UFOs alternate (right, left, right, …).

| # | Action | Expected result |
|---|--------|-----------------|
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
|---|--------|-----------------|
| L2-HIT-1 | Stand still and let an enemy bullet hit you | Lives decrements by exactly 1; ship reappears at bottom-centre (same start position as Level 1 start). |
| L2-HIT-2 | Observe the ship immediately after respawn | Ship **flashes** (alternates visible/invisible rapidly) for ~2 seconds. |
| L2-HIT-3 | During the flashing window, let a second bullet pass through the ship | **No life is lost**; invulnerability is not re-triggered; flashing continues from where it was. |
| L2-HIT-4 | After the 2-second flash window ends | Ship renders solidly; the next bullet hit **does** cost a life normally. |
| L2-HIT-5 | Lose all lives from enemy fire | Standard GAME OVER screen appears; pressing Enter returns to title. |

---

### Level 2 — Formation Speed

| # | Action | Expected result |
|---|--------|-----------------|
| L2-SPD-1 | Compare march speed at 55 invaders alive | Level 2 formation visibly steps **faster** than Level 1 at the same density (≈1.5× faster). |
| L2-SPD-2 | Kill invaders and watch speed increase | Formation still accelerates as invaders die, same curve shape as Level 1 but shifted faster overall. |

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
README.md         — this file
```

## Architecture Notes

- **No bundler, no server required.** All imports use relative sibling paths.
- **Fixed timestep** (60 Hz update, uncapped render) prevents speed variation across machines.
- **`computeStepInterval(liveCount)`** in `level1.js` is the single source of truth for the formation speed curve. Level 2 imports it and multiplies by 0.67.
- **`getTotalShotsFired()`** in `level1.js` is read by Level 2 on init to carry the shot counter forward.
- UFO scoring uses `totalShotsFired % 4` mapped to `[50, 100, 150, 300]`.
- Invulnerability is tracked in `level2.js`; the player sprite is simply skipped in the render pass during flash-off half-cycles.
