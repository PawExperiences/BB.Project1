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

### Planned (owned by sibling cards)

| File | Owning Card |
|---|---|
| `level1.js` | "Level 1" |
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
- **Invader formation:** 11 columns × 5 rows, each cell 30×20 px, 10 px gaps. The formation steps sideways 8 px per tick; when the leading edge hits a canvas boundary it drops 20 px and reverses.
- **AABB collision:** `collision.js` performs axis-aligned bounding-box tests between the player's bullet and every living invader after each update and before each render.
- **Explosion flashes:** orange 30×20 px rectangles appear at the kill site for 400 ms, managed in `invaders.js`.

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

### Step-and-Drop Movement

7. **Horizontal drift** — the entire formation moves smoothly to the right (or left) as a unit each game tick.
8. **Direction reversal** — when the right-most invader's right edge reaches the right canvas edge (768 px), the formation drops 20 px downward and begins moving left. When the left-most invader's left edge reaches the canvas left edge (0 px), it drops again and reverses back to the right.
9. **Drop amount** — each reversal drops the formation exactly 20 px (one invader-height).

---

### Bullet–Invader Collision

10. **Fire a bullet** — press **Space** while in the Playing scene; a yellow bullet travels upward from the player ship.
11. **Hit detection** — fly the bullet into the invader formation; when the bullet's bounding box overlaps an invader's bounding box:
    - The bullet disappears.
    - The invader disappears.
    - An orange flash rectangle appears at the invader's position.
12. **Single hit per bullet** — one bullet destroys exactly one invader; it cannot pass through to hit a second.

---

### Explosion Flash

13. **Orange flash appears** — at the moment of a kill, an orange (`#ff6600`) 30×20 px rectangle is visible at the invader's last position.
14. **Flash duration** — the orange rectangle disappears after approximately 400 ms (between 300–500 ms is acceptable).
15. **No residual artifact** — after the flash expires the cell is empty (no ghost rectangle remains).

---

### Score Increment

16. **Score display** — the HUD at the top of the Playing canvas shows `SCORE  0` at game start.
17. **Score increments on kill** — each invader destroyed adds exactly 10 points to the displayed score (`POINTS_PER_KILL = 10`).
18. **Cumulative score** — destroy 3 invaders in one play; the score must read `SCORE  30`.
19. **Score persists to Game Over** — the Game Over screen shows the correct final score matching the HUD.
20. **Hi-score updates** — after a Game Over with a higher score than before, returning to Title and starting a new game shows the updated `HI` value.

---

### Dynamic Edge Detection After Kills

21. **Shrinking formation** — destroy all invaders in the right-most column. The formation should now reverse direction earlier (when the new right-most column's right edge reaches the canvas boundary).
22. **Left-edge shrink** — destroy all invaders in the left-most column; the formation reverses later when moving left (i.e. travels further left before dropping).

---

### Absence of Invader Bullets

23. **No invader projectiles** — play for at least 30 seconds; invaders must never fire any bullet or projectile toward the player. (Invader firing is out of scope for this card.)
24. **Inspect source** — open `invaders.js` and `collision.js` in DevTools; neither file should contain any logic for creating, moving, or detecting invader-fired bullets.

---

### Game loop / canvas (from the previous card)

25. **Canvas size** — the black canvas is exactly 768 px wide × 896 px tall and centred on a dark page background.
26. **HUD layout** — Playing scene shows `SCORE 0` left, `HI 0` centre, `LIVES 3` right.
27. **Background-tab cap** — switch to another tab for 10+ seconds, return; the game resumes smoothly with no freeze or large jump in formation position.
28. **Game Over scene** — manually trigger via console: `import('./game.js').then(m => { m.hudState.lives = 0; })` → canvas must show "GAME OVER", the score, and "Press ENTER to restart".
29. **Return to Title** — pressing **Enter** on Game Over returns to Title scene (no reload).

---

### Input / Player (from the previous card)

30. **Ship visible** — after pressing Enter, a green spaceship shape appears near the bottom of the canvas.
31. **Movement** — hold **ArrowLeft** / **A**: ship drifts left. Hold **ArrowRight** / **D**: ship drifts right. Release: stops.
32. **Clamping** — ship cannot move beyond canvas edges.
33. **Firing** — press **Space**: yellow bullet appears above ship and travels upward.
34. **Single-bullet lock** — holding Space while a bullet is in flight produces no second bullet.
35. **Bullet recycling** — bullet that exits the top of the canvas allows firing again.
