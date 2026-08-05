# Space Invaders — e2e Project

A hand-crafted, zero-dependency Space Invaders clone that runs directly from
the filesystem (`file://` URL) using plain HTML, CSS, and ES modules.

## How to Play

1. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari).
   No server, no build step required.
2. Press **ENTER** on the title screen to start.
3. Move left/right with **Arrow keys** or **A/D**.
4. Fire with **Space**.
5. Destroy all invaders before they reach you.

---

## Level 1 — Manual Verification Checklist

All steps below are performed by opening `index.html` from disk (`file://`) and
pressing **ENTER** to begin play.  No automated test runner is needed.

---

### 1. Formation initial position

**How to verify:**
- Press ENTER to start the game.
- Open browser DevTools → Console and run:
  ```js
  // (paste into console after game starts)
  import('./invaders.js').then(m => {
    const alive = m.invaders.filter(i => i.alive);
    const topY  = Math.min(...alive.map(i => i.y));
    const leftX = Math.min(...alive.map(i => i.x));
    console.log('Top Y:', topY, '(expect 48)');
    console.log('Left X:', leftX, '(expect 192)');
    console.log('Alive:', alive.length, '(expect 55)');
  });
  ```
- **Expected:** `Top Y: 48`, `Left X: 192`, `Alive: 55`.

---

### 2. Speed at 55 invaders alive (≈ 800 ms per step)

**How to verify:**
- Immediately after pressing ENTER (all 55 alive), open the browser console and
  watch invader movement.  Each horizontal nudge should occur roughly every
  **800 ms** — visually about once per second, clearly slow.
- You can time it with a stopwatch: count 5 steps, total should be ≈ 4 seconds.
- **Expected:** step interval ≈ 800 ms (tolerance ±20 ms).

---

### 3. Speed at 1 invader alive (≈ 100 ms per step)

**How to verify:**
- Kill 54 invaders (shoot them one by one).
- With a single invader remaining, movement should be visibly frantic —
  approximately **10 steps per second**.
- **Expected:** step interval ≈ 100 ms (tolerance ±20 ms).

---

### 4. Smooth acceleration as invaders are killed

**How to verify:**
- Start with 55 invaders (slow) and shoot them one at a time.
- Each kill should produce a perceptibly shorter step interval.
- Formula: `interval = 100 + (alive / 55) * 700` ms.
- At 28 alive (≈ half): interval ≈ `100 + (28/55)*700 ≈ 456 ms`.
- **Expected:** smooth, continuous speed increase with no jumps.

---

### 5. Edge-drop and direction reversal

**How to verify (right edge):**
- Wait for the formation to march rightward until the rightmost column is about
  to touch the right canvas edge.
- **Expected:** the entire formation drops by exactly **24 px** (one invader cell
  height = 16 px + 8 px gap) and immediately begins moving left.

**How to verify (left edge):**
- Continue watching; the formation will reach the left edge.
- **Expected:** drop by 24 px and reverse to move right.

You can confirm the drop in DevTools:
```js
import('./invaders.js').then(m => {
  // Record y of first alive invader before edge hit, compare after.
  const top = () => Math.min(...m.invaders.filter(i=>i.alive).map(i=>i.y));
  console.log('Top Y before:', top());
  // Wait for edge hit, then:
  console.log('Top Y after:', top());  // should increase by 24
});
```

---

### 6. Life-loss reset (formation reaches player row)

**How to verify:**
- Do NOT shoot any invaders. Let the formation descend until its bottom row
  overlaps the player's Y position (y ≈ 820).
- **Expected when lives ≥ 1:**
  - One life is deducted (HUD `LIVES` counter decrements by 1).
  - Formation resets to the top starting position (top Y = 48).
  - Player ship resets to its starting horizontal centre position.
  - Invader count resets to 55.

---

### 7. GAME OVER on zero lives

**How to verify:**
- Repeat the life-loss scenario (let formation reach the player) until the LIVES
  counter reaches 0.
- On the final hit:
- **Expected:** A red `GAME OVER` splash screen appears immediately.
- No further movement, shooting, or HUD updates occur.
- Press **ENTER** to return to the title screen.

---

### 8. Level-clear transition (all 55 invaders destroyed)

**How to verify:**
- Shoot all 55 invaders.
- **Expected:** The game transitions directly to Level 2 (no level-select screen).
- The HUD shows `LEVEL 2` at the top centre.
- The invader formation resets and begins moving faster.

---

### 9. HUD level number

**How to verify:**
- During gameplay, look at the top-centre of the canvas.
- **Expected:** The text `LEVEL 1` is displayed between the score (top-left)
  and lives (top-right).

---

## Level 2 — Manual Verification Checklist

All steps below begin from Level 2, which is reached by clearing Level 1
(destroying all 55 invaders). No level-select screen appears — the transition
is automatic.

---

### L2-1. Auto-advance from Level 1 with no life reset

**How to verify:**
- Start a game and note your current lives count.
- Shoot all 55 invaders in Level 1.
- **Expected:**
  - The scene transitions immediately to Level 2 with no level-select screen.
  - The HUD shows `LEVEL 2`.
  - The `LIVES` counter is **identical** to what it was the moment the last
    Level 1 invader was destroyed — no reset.
  - The score carries over.

---

### L2-2. Formation speed (≈ 1.5× faster than Level 1)

**How to verify:**
- At the start of Level 2 (all 55 alive), the step interval should be
  approximately **536 ms** (800 ms × 0.67).
- Time 5 formation steps with a stopwatch: total ≈ 2.7 seconds.
- Compare: Level 1 at 55 alive is ≈ 4 seconds for 5 steps.
- **Expected:** Level 2 is visibly and measurably faster than Level 1 at the
  same invader count.

---

### L2-3. Enemy fire — invaders shoot back

**How to verify:**
- Enter Level 2 and do not shoot any invaders.
- Wait 1–3 seconds.
- **Expected:**
  - A red bullet appears from one of the bottom-row invaders and travels
    downward at a noticeable speed.
  - Multiple bullets may be in flight simultaneously.
  - The shooter is always from the bottom-most alive invader in its column
    (not from the top rows while lower invaders are still alive).

---

### L2-4. Player hit — life loss and respawn

**How to verify:**
- Allow an enemy bullet to hit the player ship.
- **Expected:**
  - The LIVES counter decrements by exactly 1.
  - The player ship immediately reappears at its default starting position
    (horizontally centred, near the bottom of the canvas).
  - The ship begins flashing (alternating visible/invisible every 200 ms).
  - Flashing lasts for exactly 2 seconds, then the ship renders solid.

---

### L2-5. Invulnerability window

**How to verify:**
- Allow the player to be hit by an enemy bullet (ship starts flashing).
- During the 2-second flash window, position the ship so another enemy bullet
  would hit it.
- **Expected:**
  - The second bullet passes through (or simply disappears on contact) without
    decrementing lives.
  - Lives remain unchanged; no additional respawn occurs.
  - After 2 seconds, the ship is solid again and `onHit` resumes normally.

---

### L2-6. Game over when lives reach 0

**How to verify:**
- Allow enemy bullets to deplete all remaining lives (let hits occur until
  LIVES shows 0).
- **Expected:**
  - The red `GAME OVER` screen appears immediately.
  - No further gameplay occurs.
  - Pressing ENTER returns to the title screen.

---

### L2-7. UFO — appearance and timing

**How to verify:**
- Start Level 2 and wait (do not shoot invaders to keep the level alive).
- After approximately **20 seconds**, a red saucer-shaped UFO should appear
  at the top of the play field (above the invader formation).
- **Expected:**
  - The UFO enters from the **left edge** on its first appearance, travelling
    rightward.
  - It moves horizontally at a steady pace (120 px/s — takes about 6.4 s to
    cross the 768 px canvas).
  - If not shot, it exits the right edge silently and disappears.
  - After another 20 seconds, a second UFO appears from the **right edge**,
    travelling left.
  - Subsequent UFOs alternate sides.

---

### L2-8. UFO scoring — deterministic by shot count

**How to verify:**
- The UFO score depends on `totalShotsFired % 4` at the moment of the hit:
  - `% 4 === 0` → **50 pts**
  - `% 4 === 1` → **100 pts**
  - `% 4 === 2` → **150 pts**
  - `% 4 === 3` → **300 pts**
- To test a specific tier: count your shots carefully (each Space press when
  no bullet is in flight increments the counter).
- Shoot the UFO and verify the score increase in the HUD matches the expected
  tier value.
- **Expected:** The score jumps by exactly the tier amount the instant the UFO
  is hit.

---

### L2-9. UFO — no penalty for missing

**How to verify:**
- Allow the UFO to cross the screen without shooting it.
- **Expected:**
  - UFO exits the opposite edge with no score change.
  - No explosion or visual effect on exit.
  - The 20-second timer resets; the next UFO appears 20 seconds later from the
    opposite side.

---

### L2-10. Enemy bullet speed

**How to verify (visual):**
- Watch enemy bullets travel downward.
- They should take approximately **3 seconds** to travel the full 896 px canvas
  height (900 px ÷ 300 px/s ≈ 3 s).
- **Expected:** Bullets travel at a moderate, fair speed — faster than the
  player bullet (500 px/s) but clearly slower.

---

## Level 3 — Manual Verification Checklist

Level 3 is reached by clearing Level 2 (destroying all invaders in Level 2).
Alternatively, you can test `level3.js` directly by calling
`level3.start(canvas, ctx, () => console.log('Level complete!'))` from the
browser console after importing the module.

---

### L3-1. Reaching Level 3

**How to verify:**
- Clear Level 1 and Level 2 (shoot all invaders in each).
- **Expected:**
  - The HUD at the top of the canvas displays `LEVEL 3`.
  - A fresh 5×11 invader grid appears at the top of the canvas.
  - Four green shield bunkers are visible across the lower portion of the
    canvas (approximately 80% of the canvas height).
  - No console errors are visible in DevTools.

---

### L3-2. Bunker rendering

**How to verify:**
- At the start of Level 3, inspect the four bunkers visually.
- **Expected:**
  - Four bunkers are evenly distributed horizontally across the canvas
    (centres at approximately 15%, 38%, 62%, and 85% of canvas width).
  - Each bunker is a 4-column × 4-row grid of solid green (`#00FF00`)
    squares, each approximately 8 px wide with a 1 px gap between cells.
  - Bunkers appear at approximately 80% of the canvas height (y ≈ 717 px).

---

### L3-3. Bunker erosion — player bullet

**How to verify:**
- Move the player ship so it is directly beneath one of the bunkers.
- Fire a bullet upward into the bunker.
- **Expected:**
  - The bullet stops when it intersects the first bunker cell it encounters.
  - Exactly one cell is removed from the bunker (the cell now appears absent
    on the next frame).
  - The surrounding cells are unaffected.
  - Fire repeatedly into the same bunker and observe individual cells
    disappearing one at a time.

---

### L3-4. Bunker erosion — enemy bullet

**How to verify:**
- Allow enemy invaders to fire bullets downward.
- Position or wait for enemy bullets to pass through a bunker.
- **Expected:**
  - Each enemy bullet that hits a bunker cell removes exactly that one cell
    and is consumed (the bullet disappears).
  - The bunker visibly erodes from the top as enemy bullets rain down.

---

### L3-5. Fully eroded bunker

**How to verify:**
- Destroy all 16 cells of one bunker (fire repeatedly into it from below;
  let enemy fire hit it from above).
- **Expected:**
  - When all 16 cells are removed, no green cells are visible for that bunker.
  - Player bullets and enemy bullets pass through the bunker's former
    location without being consumed.
  - No console errors occur related to the destroyed bunker.

---

### L3-6. Formation sweep before split

**How to verify:**
- At the start of Level 3, watch the invader formation.
- **Expected:**
  - The 5×11 grid sweeps left and right in the classic Space Invaders
    style (same as Level 1).
  - When the formation reaches the right or left canvas edge, it drops
    down by 24 px and reverses direction.
  - No split occurs while fewer than 28 invaders have been killed.

---

### L3-7. Formation split trigger

**How to verify:**
- Count your kills as you shoot invaders.
- **Expected:**
  - When your kill count reaches exactly **28** (the 28th invader you destroy),
    the formation splits into two independent halves.
  - The left half (columns 0–5, i.e. 6 columns including column 5) begins
    moving **left**.
  - The right half (columns 6–10, i.e. 5 columns) begins moving **right**.
  - The split happens exactly once, even if you continue shooting.

**Console verification:**
```js
// After the split fires, open DevTools and check that there are two
// independent sub-formations rather than one combined formation.
// You can observe this visually: the two halves move in opposite directions
// simultaneously after the 28th kill.
```

---

### L3-8. Independent sub-formation sweeps after split

**How to verify:**
- After the split, observe both halves independently.
- **Expected:**
  - The left sub-formation reverses direction when its **own** rightmost
    surviving invader reaches the left canvas edge (independent of the right
    half's position).
  - The right sub-formation reverses direction when its **own** leftmost
    surviving invader reaches the right canvas edge.
  - If one sub-formation is fully destroyed, the other continues sweeping
    independently.

---

### L3-9. Both halves fire after split

**How to verify:**
- After the formation splits, do not shoot any more invaders.
- **Expected:**
  - Red enemy bullets appear from both the left sub-formation and the right
    sub-formation.
  - Both halves independently fire at the player.

---

### L3-10. Level-complete condition

**How to verify:**
- Shoot all remaining invaders in both sub-formations.
- **Expected:**
  - The level-complete callback fires **only** when the last invader across
    both halves is destroyed (zero remaining in both left and right).
  - The game advances to the next scene (or logs "Level complete" if wired
    to console).
  - Destroying all invaders in one half alone does **not** trigger the
    level-complete callback.

---

### L3-11. Bunkers remain active after split

**How to verify:**
- After the formation split (28+ kills), continue firing bullets into bunkers.
- Allow enemy bullets from both sub-formations to hit bunkers.
- **Expected:**
  - Bunker cell erosion continues to work correctly from both player bullets
    and enemy bullets from both sub-formations.
  - No regression in bunker collision detection after the split event.

---

### L3-12. No console errors

**How to verify:**
- Open `index.html` via `file://` in Chrome or Firefox.
- Open DevTools → Console.
- Play through Level 3 (trigger the split, erode bunkers, destroy all invaders).
- **Expected:** Zero console errors attributable to `level3.js` at any point
  during play.

---

## File Structure

```
index.html      — entry point (open this in a browser)
game.js         — main loop, scene state machine, HUD
gameConfig.js   — shared constants
player.js       — player ship
invaders.js     — 11×5 invader grid, draw
level1.js       — Level 1 logic (movement, edge-detect, life-loss, level-clear)
level2.js       — Level 2 logic (enemy fire, UFO, invulnerability)
level3.js       — Level 3 logic (bunkers, formation split)
collision.js    — AABB collision detection
explosion.js    — explosion effects
input.js        — keyboard input
score.js        — score state
```

---

## Architecture Notes

- **No bundler, no server, no npm.** Every module uses bare `import` with
  relative paths so `file://` access works in all modern browsers.
- `level1.js` owns the timer-based step logic for Level 1. It does **not**
  call `updateInvaders()` from `invaders.js` (which was a per-tick px model).
  Level 1 drives movement through `updateLevel1(dt)` called by the game loop.
- `level2.js` follows the plain-object level protocol `{ init, update, draw }`
  and is driven by `game.js` when `currentScene === 'level2'`.
- `level3.js` exports `level3 = { start, stop, update, draw }`. Call
  `level3.start(canvas, ctx, onLevelComplete)` to launch Level 3. It owns its
  own `requestAnimationFrame` loop and is entirely self-contained.
- `game.js` exports `transitionTo`, `resetGame`, `checkGameOver`, `renderGameOver`,
  and `drawHUD` so future level modules can call them without circular imports.
