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

### Planned (owned by sibling cards)

| File | Owning Card |
|---|---|
| `level2.js` | "Level 2" |
| `level3.js` | "Level 3" |
| `boss.js` | "Boss battle" |

---

## Architecture Notes

- **`gameConfig.js`** is the single source of truth for all numeric constants. Every other module imports from it.
- **`hudState`** is a named export from `game.js`. Sibling modules increment `hudState.score` on a kill, decrement `hudState.lives` on a hit, etc. Changes are reflected on the canvas on the very next frame.
- **Fixed timestep:** the loop runs `update()` at exactly 60 steps/second regardless of monitor refresh rate. If the tab is backgrounded and returned to, the accumulated delta is capped at 5 × (1/60) s so no burst of catch-up updates occurs.
- **Scene FSM:** `TITLE → PLAYING → GAME_OVER → TITLE`. ENTER drives every transition.
- **Player position convention:** `player.x` / `player.y` is the **top-left corner** of the ship's 40×32 px bounding box.
- **Single-bullet lock:** only one bullet may be in flight at a time. A new bullet cannot be fired until the previous one either hits something or exits the top of the canvas.
- **`POINTS_PER_KILL = 10`** is exported from `invaders.js` and is the single named constant for score-per-kill.
- **Invader formation:** 11 columns × 5 rows, each cell 30×20 px, 10 px gaps. The formation marches sideways using a time-based step interval that scales from ~800 ms (55 invaders) down to ~100 ms (1 invader). When the leading edge hits a canvas boundary the formation drops `(INVADER_HEIGHT + INVADER_GAP) = 30 px` and reverses.
- **AABB collision:** `collision.js` performs axis-aligned bounding-box tests between the player's bullet and every living invader after each update and before each render.
- **Explosion flashes:** orange 30×20 px rectangles appear at the kill site for 400 ms, managed in `invaders.js`.
- **Level system:** `level1.js` owns the formation marching logic (time-based, not tick-based). `game.js` calls `level1Init/Update/Render` each frame. When `hudState.level` changes to 2, the game currently returns to the Title screen (Level 2 is a sibling card).

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

16. **Destroy all 55 invaders** — when the last invader is killed, `hudState.level` becomes 2 and the game returns to the Title screen (Level 2 is not yet implemented; the win transition reuses the Title scene for now).

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

23. **Level displayed** — while playing, the top-right area of the canvas shows `Level: 1` in a light blue/purple colour, below the main HUD line and above the invader formation.
24. **No overlap** — the level label does not overlap the LIVES counter (which is at the very top-right) and does not overlap the invader formation (which starts at Y ≈ 80 px).

---

### Score Increment

25. **Score display** — the HUD at the top of the Playing canvas shows `SCORE  0` at game start.
26. **Score increments on kill** — each invader destroyed adds exactly 10 points to the displayed score (`POINTS_PER_KILL = 10`).
27. **Cumulative score** — destroy 3 invaders in one play; the score must read `SCORE  30`.
28. **Score persists to Game Over** — the Game Over screen shows the correct final score matching the HUD.
29. **Hi-score updates** — after a Game Over with a higher score than before, returning to Title and starting a new game shows the updated `HI` value.

---

### Game loop / canvas

30. **Canvas size** — the black canvas is exactly 768 px wide × 896 px tall and centred on a dark page background.
31. **HUD layout** — Playing scene shows `SCORE 0` left, `HI 0` centre, `LIVES 3` right.
32. **Background-tab cap** — switch to another tab for 10+ seconds, return; the game resumes smoothly with no freeze or large jump in formation position.
33. **Game Over scene** — manually trigger via console: `import('./game.js').then(m => { m.hudState.lives = 0; })` → canvas must show "GAME OVER", the score, and "Press ENTER to restart".
34. **Return to Title** — pressing **Enter** on Game Over returns to Title scene (no reload).

---

### Input / Player

35. **Ship visible** — after pressing Enter, a green spaceship shape appears near the bottom of the canvas.
36. **Movement** — hold **ArrowLeft** / **A**: ship drifts left. Hold **ArrowRight** / **D**: ship drifts right. Release: stops.
37. **Clamping** — ship cannot move beyond canvas edges.
38. **Firing** — press **Space**: yellow bullet appears above ship and travels upward.
39. **Single-bullet lock** — holding Space while a bullet is in flight produces no second bullet.
40. **Bullet recycling** — bullet that exits the top of the canvas allows firing again.

---

### Absence of Invader Bullets

41. **No invader projectiles** — play for at least 30 seconds; invaders must never fire any bullet or projectile toward the player. (Invader firing is out of scope for this card.)
