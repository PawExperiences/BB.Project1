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
- **Expected:** The game transitions away from the playing scene.
- A `LEVEL CLEAR!` screen appears with the message `Level 2 coming soon…`.
- No further invader movement or player input is processed.

---

### 9. HUD level number

**How to verify:**
- During gameplay, look at the top-centre of the canvas.
- **Expected:** The text `LEVEL 1` is displayed between the score (top-left)
  and lives (top-right).

---

## File Structure

```
index.html      — entry point (open this in a browser)
game.js         — main loop, scene state machine, HUD
gameConfig.js   — shared constants
player.js       — player ship
invaders.js     — 11×5 invader grid, draw
level1.js       — Level 1 logic (movement, edge-detect, life-loss, level-clear)
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
- `game.js` exports `transitionTo`, `resetGame`, `checkGameOver`, `renderGameOver`,
  and `drawHUD` so future level modules can call them without circular imports.
