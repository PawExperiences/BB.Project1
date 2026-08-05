# Space Invaders

A hand-crafted browser Space Invaders game built with plain HTML, CSS, and ES modules — no framework, no bundler, no npm.

---

## How to Run

1. Clone or download this repository.
2. Open `index.html` directly in your browser:
   - **macOS / Linux:** `open index.html`
   - **Windows:** double-click `index.html` in File Explorer, or run `start index.html` in a terminal.
   - Works from a `file://` URL — no local server required.

---

## File Layout

### Implemented

| File | Purpose |
|---|---|
| `index.html` | Page shell: 768×896 canvas on a dark background |
| `gameConfig.js` | Shared constants (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`) |
| `game.js` | Fixed-timestep loop, scene FSM (Title / Playing / Game Over), canvas HUD, `hudState` export |
| `input.js` | Keyboard held-key tracker (`initInput`, `isKeyHeld`) |
| `player.js` | Player ship: movement, single-bullet firing, procedural drawing, lives counter |
| `invaders.js` | 11×5 invader formation: creation, step-and-drop movement, explosion flashes, rendering |
| `collision.js` | AABB collision pass: player bullets vs living invaders, score increment |
| `level1.js` | Level 1: time-based marching loop, edge-bounce-and-drop, loss/win conditions, level HUD |
| `level2.js` | Level 2: 1.5× faster formation, enemy fire, bonus UFO, hit/respawn/invulnerability |

### Planned (owned by sibling cards)

| File | Owning Card |
|---|---|
| `level3.js` | "Level 3" |
| `boss.js` | "Boss battle" |

---

## Architecture Notes

- **`gameConfig.js`** is the single source of truth for all numeric constants. Every other module imports from it.
- **`hudState`** is a named export from `game.js`. Sibling modules increment `hudState.score` on a kill, decrement `hudState.lives` on a hit, etc. Changes are reflected on the canvas on the very next frame.
- **`hudState.playerTotalShotCount`** is incremented by `game.js` each time the player fires a new bullet, and is used by Level 2 to determine UFO score tier.
- **Fixed timestep:** the loop runs `update()` at exactly 60 steps/second regardless of monitor refresh rate. If the tab is backgrounded and returned to, the accumulated delta is capped at 5 × (1/60) s so no burst of catch-up updates occurs.
- **Scene FSM:** `TITLE → PLAYING → GAME_OVER → TITLE`. ENTER drives every transition.
- **Player position convention:** `player.x` / `player.y` is the **top-left corner** of the ship's 40×32 px bounding box.
- **Single-bullet lock:** only one bullet may be in flight at a time. A new bullet cannot be fired until the previous one either hits something or exits the top of the canvas.
- **`POINTS_PER_KILL = 10`** is exported from `invaders.js` and is the single named constant for score-per-kill.
- **Invader formation:** 11 columns × 5 rows, each cell 30×20 px, 10 px gaps. The formation marches sideways using a time-based step interval that scales from ~800 ms (55 invaders) down to ~100 ms (1 invader). When the leading edge hits a canvas boundary the formation drops `(INVADER_HEIGHT + INVADER_GAP) = 30 px` and reverses.
- **Level 2 formation speed:** The same step-interval curve as Level 1, but every interval is multiplied by **0.67** (1.5× faster). At 55 invaders alive the interval is ~536 ms; at 1 alive it is ~67 ms.
- **AABB collision:** `collision.js` performs axis-aligned bounding-box tests between the player's bullet and every living invader after each update and before each render.
- **Explosion flashes:** orange 30×20 px rectangles appear at the kill site for 400 ms, managed in `invaders.js`.
- **Level system:** `level1.js` owns Level 1 formation logic. `level2.js` owns Level 2 logic. `game.js` calls the appropriate `init/update/render` functions for the active level. When Level 1 is cleared (`hudState.level` becomes 2), `game.js` calls `advanceLevel(hudState)` which calls `level2Init(ctx, state, player)` — the player's life count is **not** reset.
- **Enemy fire (Level 2):** A global shoot timer fires at a random interval in [800, 2000] ms. On each trigger, the lowest invader in a randomly chosen non-empty column fires a bullet downward at 300 px/s.
- **UFO (Level 2):** Spawns every 20 seconds. Alternates start side (left on first, right on second, etc.). Travels at 120 px/s. Score tier is `[50, 100, 150, 300][playerTotalShotCount % 4]`.
- **Hit/respawn (Level 2):** Enemy bullet hits deduct one life. The player respawns at the same X position. A 2-second invulnerability window causes the ship to flash (visible/invisible every 200 ms); enemy bullets pass through without effect during this period.

---

## Manual Verification Checklist

Open `index.html` in a browser (Chrome, Firefox, or Edge — must support ES modules). Verify each item:

### General / Setup

1. **No console errors** — open DevTools (F12) → Console; it must be clean on load.
2. **Title scene** — the canvas shows "SPACE INVADERS" and "Press ENTER to start".
3. **Scene transition** — pressing **Enter** moves to the Playing scene; URL bar is unchanged.

---

### Formation Rendering

4. **55 invaders visible at game start** — after pressing Enter, count the grid: 11 columns × 5 rows of cyan (`#00ccff`) filled rectangles, each exactly 30 px wide × 20 px tall.
5. **Correct gaps** — visually confirm approximately 10 px horizontal and vertical spacing between each invader cell.
6. **Formation position** — the formation starts near the top-left of the playing area, well below the HUD separator line.

---

### Time-Based Step Marching (Level 1)

7. **Slow march at game start** — immediately after pressing Enter, the entire formation steps right approximately once every 800 ms (visually, about 1.25 steps/second).
8. **Speed increases as invaders are killed** — destroy several invaders; the march noticeably speeds up. With only a handful left, the formation moves much faster.
9. **Step formula** — the interval formula is `100 + (aliveCount / 55) * 700` ms. At 55 alive → 800 ms; at 1 alive → ~112 ms (approximately 100 ms).

---

### Edge Bounce and Drop

10. **Direction reversal** — when the right-most living invader's right edge would cross the right canvas edge (768 px), the formation drops and begins moving left. Likewise on the left edge.
11. **Drop amount** — each reversal drops the formation exactly `INVADER_HEIGHT + INVADER_GAP = 30 px` downward.
12. **Dynamic edge detection** — destroy all invaders in the right-most column; the formation now reverses earlier (the new right-most column's edge hits 768 px sooner).

---

### Loss Condition — Formation Reaches Player Row

13. **Formation drops to Y = 540** — let the formation march down until the bottom edge of the lowest living invader row is at or below Y = 540 px. Exactly **one life is lost** (LIVES counter decrements by 1).
14. **Immediate full reset** — immediately after losing the life, all 55 invaders respawn at the original starting position, direction resets to right, and the march timer resets.
15. **Game Over on zero lives** — after losing all 3 lives this way, the canvas transitions to the Game Over screen.

---

### Level Clear Condition

16. **Destroy all 55 invaders** — when the last invader is killed, the game automatically transitions to Level 2 (no level-select screen, no lives reset).

---

### Bullet–Invader Collision

17. **Fire a bullet** — press **Space** while in the Playing scene; a yellow bullet travels upward from the player ship.
18. **Hit detection** — fly the bullet into the invader formation; when the bullet's bounding box overlaps an invader's bounding box:
    - The bullet disappears.
    - The invader disappears.
    - An orange flash rectangle appears at the invader's position.
19. **Single hit per bullet** — one bullet destroys exactly one invader; it cannot pass through to hit a second.

---

### Explosion Flash

20. **Orange flash appears** — at the moment of a kill, an orange (`#ff6600`) 30×20 px rectangle is visible at the invader's last position.
21. **Flash duration** — the orange rectangle disappears after approximately 400 ms (between 300–500 ms is acceptable).
22. **No residual artifact** — after the flash expires the cell is empty (no ghost rectangle remains).

---

### HUD — Level Number

23. **Level displayed** — while playing, the top-right area of the canvas shows `Level: 1` (or `Level: 2` in Level 2) in a light blue/purple colour.
24. **No overlap** — the level label does not overlap the LIVES counter or the invader formation.

---

### Score Increment

25. **Score display** — the HUD at the top of the Playing canvas shows `SCORE  0` at game start.
26. **Score increments on kill** — each invader destroyed adds exactly 10 points to the displayed score (`POINTS_PER_KILL = 10`).
27. **Cumulative score** — destroy 3 invaders in one play; the score must read `SCORE  30`.
28. **Score persists to Game Over** — the Game Over screen shows the correct final score matching the HUD.
29. **Hi-score updates** — after a Game Over with a higher score than before, returning to Title and starting a new game shows the updated `HI` value.

---

### Level 2 — Formation Speed

30. **Faster march** — immediately upon entering Level 2, the formation noticeably marches faster than the slowest Level 1 speed (interval is ~536 ms at 55 invaders vs ~800 ms in Level 1).
31. **Speed curve still accelerates** — as invaders are killed in Level 2, the march continues to accelerate (same curve shape as Level 1, just 1.5× faster throughout).

---

### Level 2 — Enemy Fire

32. **Invaders fire bullets** — within 2 seconds of entering Level 2, at least one red bullet should appear travelling downward from the formation.
33. **Lowest-in-column** — enemy bullets always originate from the bottom of a column, never from a row above a living invader in the same column.
34. **Bullet travels downward at 300 px/s** — time how long a bullet takes to travel the visible canvas height (896 px); it should take approximately 3 seconds.
35. **Bullet removed on hit** — when an enemy bullet hits the player, the bullet disappears.
36. **Bullet removed at bottom** — enemy bullets that reach the bottom of the canvas (y > 896) are removed.
37. **Timer continues during invulnerability** — after being hit, enemy bullets continue to spawn and travel normally.

---

### Level 2 — Hit / Respawn / Invulnerability

38. **Life deducted on hit** — when an enemy bullet hits the player, the LIVES counter decrements by 1.
39. **Same-X respawn** — the player ship remains at the same horizontal position after being hit (no teleport).
40. **Flashing ship** — for approximately 2 seconds after being hit, the ship flashes (alternately visible and invisible, roughly every 200 ms).
41. **Invulnerability** — during the 2-second flash window, additional enemy bullets overlapping the player produce no life loss.
42. **Normal hit detection resumes** — after the flash stops, the next enemy bullet to hit causes another life loss.
43. **Game Over at 0 lives** — losing the last life in Level 2 transitions to the Game Over screen.

---

### Level 2 — UFO

44. **UFO appears at 20 s** — approximately 20 seconds after entering Level 2, a magenta rectangle (UFO) appears at the top of the play area and travels horizontally.
45. **Alternating sides** — the first UFO enters from the left; the second from the right; the third from the left again, and so on.
46. **UFO speed** — the UFO takes roughly 768/120 ≈ 6.4 seconds to cross the full canvas width.
47. **UFO exits and is removed** — a UFO that is not shot disappears when it exits the opposite edge; no ghost remains.
48. **UFO scoring** — shoot the UFO and verify the score increment matches the expected tier:
    - 0 total shots fired → 50 pts
    - 1 total shot fired → 100 pts
    - 2 total shots fired → 150 pts
    - 3 total shots fired → 300 pts
    - 4 total shots fired → 50 pts (wraps)
49. **Subsequent UFO spawns** — after the 20-second mark, another UFO spawns every 20 seconds.

---

### Level 2 — Automatic Level Transition from Level 1

50. **No level-select screen** — destroying the last invader in Level 1 immediately starts Level 2; there is no intermediate screen.
51. **Lives unchanged** — the LIVES counter after entering Level 2 equals whatever it was at the end of Level 1.

---

### Game loop / canvas

52. **Canvas size** — the black canvas is exactly 768 px wide × 896 px tall and centred on a dark page background.
53. **HUD layout** — Playing scene shows `SCORE 0` left, `HI 0` centre, `LIVES 3` right.
54. **Background-tab cap** — switch to another tab for 10+ seconds, return; the game resumes smoothly with no freeze or large jump in formation position.
55. **Game Over scene** — canvas shows "GAME OVER", the score, and "Press ENTER to restart".
56. **Return to Title** — pressing **Enter** on Game Over returns to Title scene (no reload).

---

### Input / Player

57. **Ship visible** — after pressing Enter, a green spaceship shape appears near the bottom of the canvas.
58. **Movement** — hold **ArrowLeft** / **A**: ship drifts left. Hold **ArrowRight** / **D**: ship drifts right. Release: stops.
59. **Clamping** — ship cannot move beyond canvas edges.
60. **Firing** — press **Space**: yellow bullet appears above ship and travels upward.
61. **Single-bullet lock** — holding Space while a bullet is in flight produces no second bullet.
62. **Bullet recycling** — bullet that exits the top of the canvas allows firing again.
