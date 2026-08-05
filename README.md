# Space Invaders — BB.Project1

## Overview
A hand-written, no-framework, no-bundler Space Invaders clone that runs
directly from the filesystem (`file://` URL).  No server, no npm, no build
step.

---

## File Layout

| File | Purpose |
|---|---|
| `index.html` | Entry point — mounts the `<canvas>` element and loads `game.js` as an ES module. |
| `gameConfig.js` | Shared constants (canvas size, speeds, starting lives) exported as named ES-module exports. |
| `game.js` | Main entry module: fixed-timestep loop, three-scene state machine (Title → Playing → Game Over), canvas HUD, and the exported `hudState` object. |
| `input.js` | Keyboard-input module: `initInput()` attaches held-key listeners; `isKeyHeld(code)` queries live key state. |
| `player.js` | Player ship: `Player` class with `update(dt)`, `draw(ctx)`, position, bullet state, and lives. |
| `invaders.js` | 11×5 invader grid: state array, `updateInvaders()`, `drawInvaders(ctx)`, movement constants. |
| `collision.js` | AABB helper `checkCollision(a,b)`, `runCollisionPass(player)` (player-bullet vs invaders), and `checkInvaderBulletVsPlayer()` for future use. |
| `explosion.js` | Explosion pool: `addExplosion(cx,cy)`, `updateExplosions()`, `drawExplosions(ctx)`. |
| `score.js` | Score state: `getScore()`, `addScore(n)`, `resetScore()`. |

---

## Runtime Requirements

- **Any modern browser** (Chrome, Firefox, Edge, Safari) with ES-module support.
- **No server required.** Open `index.html` directly with `File → Open` or by
  double-clicking.  `file://` is the only supported runtime.
- No npm, no bundler, no build step.

---

## Manual Verification Checklist

A QA tester can confirm every acceptance criterion by following these steps:

### 1. Open the game
1. Open `index.html` in a browser from a `file://` URL (no local server).
2. Open the browser **DevTools Console** (`F12`).
3. **Expected:** No red errors, no network requests in the Network tab.

### 2. Canvas and background
1. Confirm the canvas occupies the centre of the page on a black background.
2. Right-click the canvas → Inspect → confirm `width="768"` and `height="896"` attributes.
3. **Expected:** Both the page body and the canvas are visibly black (#000).

### 3. Title scene
1. On load the canvas should display:
   - **`SPACE INVADERS`** (large, centred, green text).
   - **`Press ENTER to start`** (smaller, centred, white text).
2. **Expected:** Text is visible and horizontally centred.

### 4. Scene transition — Title → Playing
1. Press **ENTER**.
2. **Expected:** The Title text disappears; the HUD appears at the top of the
   canvas showing `SCORE 0` on the left, `HI 0` in the centre, and `LIVES 3`
   on the right.  No page reload occurs.

### 5. HUD values
1. In DevTools Console run:
   ```js
   import('./game.js').then(m => console.log(m.hudState));
   ```
2. **Expected:** Logs `{ score: 0, lives: 3, hiScore: 0 }`.

### 6. gameConfig constants
1. In DevTools Console run:
   ```js
   import('./gameConfig.js').then(m => console.log(m));
   ```
2. **Expected:** Object contains at minimum:
   `CANVAS_WIDTH=768, CANVAS_HEIGHT=896, PLAYER_SPEED=200, BULLET_SPEED=500, STARTING_LIVES=3, PLAYER_LIVES=3`.

### 7. Stub modules load without errors
1. In DevTools Console run each of the following and confirm no error is thrown:
   ```js
   import('./input.js').then(m => console.log('input OK', m));
   import('./player.js').then(m => console.log('player OK', m));
   import('./invaders.js').then(m => console.log('invaders OK', m));
   import('./collision.js').then(m => console.log('collision OK', m));
   import('./explosion.js').then(m => console.log('explosion OK', m));
   import('./score.js').then(m => console.log('score OK', m));
   ```
2. **Expected:** Each logs its "OK" message and a module object with at least
   one named export.

### 8. Game Over scene (manual trigger)
1. While on the Playing scene, open DevTools Console and run:
   ```js
   import('./game.js').then(m => { m.hudState.lives = 0; });
   ```
2. Wait up to ~2 seconds (next update tick).
3. **Expected:** Canvas shows **`GAME OVER`**, `Score: 0`, `Hi-Score: 0`, and
   `Press ENTER to restart`.

### 9. Scene transition — Game Over → Title
1. Press **ENTER** on the Game Over screen.
2. **Expected:** Returns to the Title scene (no page reload).
3. Re-import `hudState` in the console and confirm `score === 0` and
   `lives === 3`.

### 10. Delta cap (tab-backgrounding test)
1. On the Playing scene, switch to a different tab or application for at
   least **5 seconds**.
2. Switch back.
3. **Expected:** The game resumes normally with no visible stutter or burst of
   rapid updates.  The loop continues smoothly at ~60 fps.

---

## Manual Verification — Keyboard Input & Player Ship

The following steps verify every acceptance criterion for the
`input.js` and `player.js` implementation.

> **Setup:** Open `index.html` from a `file://` URL, press **ENTER** to enter
> the Playing scene so the ship is visible, then follow each step.

---

### 11. initInput / isKeyHeld — module loads and listener attaches
1. In DevTools Console run:
   ```js
   import('./input.js').then(({ initInput, isKeyHeld }) => {
     initInput();
     console.log('isKeyHeld ArrowLeft before press:', isKeyHeld('ArrowLeft'));
   });
   ```
2. **Expected:** Logs `false` (no key held yet). No errors thrown.
3. Call `initInput()` a second time in the console — confirm it does **not**
   attach duplicate listeners (the console log count should not double).

---

### 12. Held-key tracking (not key-repeat)
1. In DevTools Console, after running `initInput()`, hold **ArrowLeft**.
2. While holding, run:
   ```js
   import('./input.js').then(({ isKeyHeld }) => console.log(isKeyHeld('ArrowLeft')));
   ```
3. **Expected:** Logs `true`.
4. Release the key and run the same line again.
5. **Expected:** Logs `false`.
6. Confirm that holding the key for several seconds does **not** log additional
   `true` values beyond the first keydown (i.e., key-repeat events are
   ignored).

---

### 13. Ship movement — left
1. Enter the Playing scene so the ship is drawn.
2. Hold **ArrowLeft** (or **A**) for approximately 1 second.
3. **Expected:** The ship moves left smoothly. Speed should be approximately
   200 px/s.
4. Release the key — the ship stops immediately.

---

### 14. Ship movement — right
1. Hold **ArrowRight** (or **D**) for approximately 1 second.
2. **Expected:** The ship moves right smoothly at ~200 px/s.
3. Release the key — the ship stops immediately.

---

### 15. Edge clamping — left boundary
1. Hold **ArrowLeft** or **A** continuously for at least 5 seconds.
2. **Expected:** The ship's left edge reaches x = 0 and **stops there**.
   It must not move off the left edge of the canvas.

---

### 16. Edge clamping — right boundary
1. Hold **ArrowRight** or **D** continuously for at least 5 seconds.
2. **Expected:** The ship's right edge reaches `CANVAS_WIDTH` (768 px) and
   **stops there**.

---

### 17. Single-bullet constraint — firing
1. Press **Space** once.
2. **Expected:** A small yellow rectangle (bullet) appears at the top-centre
   of the ship and travels upward.
3. While the bullet is in flight, press **Space** repeatedly.
4. **Expected:** **No second bullet appears.** Only one bullet is ever visible
   at a time.

---

### 18. Bullet travel speed
1. Fire a bullet (press **Space**).
2. The bullet should cross the full 896 px canvas height in approximately
   **1.79 seconds** (896 ÷ 500 px/s).
3. **Expected:** Bullet travels upward smoothly and exits the top of the
   canvas in roughly that time.

---

### 19. Bullet exit and reset
1. Fire a bullet and wait for it to exit the top of the canvas (y < 0).
2. **Expected:** The bullet disappears.
3. Immediately press **Space** again.
4. **Expected:** A new bullet fires from the ship's cannon.

---

### 20. Lives initialisation
1. In DevTools Console run:
   ```js
   import('./player.js').then(({ Player }) => {
     const p = new Player();
     console.log('lives:', p.lives);
   });
   ```
2. **Expected:** Logs `lives: 3`.

---

### 21. Procedural drawing — no image assets
1. Open the **Network** tab in DevTools.
2. Reload the page and play normally (move and shoot).
3. **Expected:** No image files (`.png`, `.jpg`, `.svg`, `.gif`, etc.) are
   requested.

---

### 22. ES module compatibility from file:// URL
1. Open `index.html` directly from the filesystem (double-click or
   `File → Open`) — **not** via `localhost`.
2. **Expected:** The game loads and all features above work without any
   CORS or module-loading errors in the DevTools Console.

---

## Manual Verification — Invader Grid, Movement, Collision, Explosion & Score

The following steps verify every acceptance criterion for the
`invaders.js`, `collision.js`, `explosion.js`, and `score.js` implementation.

> **Setup:** Open `index.html` from a `file://` URL, press **ENTER** to enter
> the Playing scene.

---

### 23. Invader grid is rendered on game start
1. Press **ENTER** to enter the Playing scene.
2. **Expected:** An 11 × 5 grid of 55 solid **green (#00FF00)** rectangles
   appears near the top of the canvas.
3. Each rectangle is **24 px wide × 16 px tall**.
4. There is a **12 px horizontal gap** between adjacent columns and an
   **8 px vertical gap** between adjacent rows.
5. The formation is centred horizontally (left edge at approximately x = 208)
   and starts near y = 60.

---

### 24. Formation moves horizontally
1. Observe the invader grid immediately after entering the Playing scene.
2. **Expected:** The entire formation slides smoothly to the right each frame.
3. The movement speed is controlled by the single constant `INVADER_SPEED_X`
   in `invaders.js` — changing its value (e.g. to `3`) and reloading should
   make all invaders move noticeably faster.

---

### 25. Formation drops and reverses at canvas boundaries
1. Watch the formation reach the **right** edge of the canvas (768 px).
2. **Expected:** The moment the rightmost invader's right edge reaches or
   passes x = 768, the **entire formation drops by 24 px** and begins moving
   to the left.
3. Watch the formation reach the **left** edge (x = 0).
4. **Expected:** The moment the leftmost invader's left edge reaches or passes
   x = 0, the formation drops another 24 px and reverses to the right.
5. This cycle repeats indefinitely.

---

### 26. Player bullet kills an invader (AABB collision)
1. Aim the player ship under any live invader.
2. Fire with **Space**.
3. **Expected (in order):**
   a. The bullet travels upward and overlaps the invader rectangle.
   b. The invader **disappears** from the grid (marked dead).
   c. The bullet **disappears** (consumed).
   d. A **white rectangle** briefly flickers at the invader's position
      (explosion effect, 3–5 frames).
   e. The **SCORE** counter in the HUD increments by **10**.
4. Confirm only the hit invader is removed; all others remain.

---

### 27. Score increments correctly
1. Kill several invaders one at a time.
2. **Expected:** The HUD `SCORE` value increases by exactly **10** per kill.
3. In DevTools Console run:
   ```js
   import('./score.js').then(({ getScore }) => console.log('score:', getScore()));
   ```
4. **Expected:** Logs the same total shown in the HUD.

---

### 28. Explosion appears and disappears
1. Kill an invader.
2. **Expected:** A **white (#FFFFFF) rectangle** (same 24 × 16 px size as the
   invader) appears at the killed invader's position.
3. Count frames (~60 fps): the white rectangle must disappear within
   **3–5 frames** (≈ 50–83 ms).
4. After it disappears, the grid position is empty (no green, no white).

---

### 29. Multiple simultaneous explosions
1. If two bullets can be arranged to hit two invaders in the same frame (or
   rapid succession), confirm that **both** white flicker rectangles appear
   and disappear independently.
2. Alternative: In DevTools Console, after importing the module, manually
   call:
   ```js
   import('./explosion.js').then(({ addExplosion }) => {
     addExplosion(250, 80);
     addExplosion(400, 80);
   });
   ```
3. **Expected:** Two white rectangles flicker simultaneously at the two
   positions and each disappears after ~4 frames.

---

### 30. Invader-bullet vs. player hit handler (wiring check)
1. In DevTools Console run:
   ```js
   import('./collision.js').then(m => {
     console.log('checkInvaderBulletVsPlayer exported:', typeof m.checkInvaderBulletVsPlayer);
   });
   ```
2. **Expected:** Logs `checkInvaderBulletVsPlayer exported: function`.
3. This confirms the handler hook is wired and ready for the 'they shoot back'
   card without duplicating any player.js exports.

---

### 31. Collision pass runs before render (code inspection)
1. Open `game.js` in a text editor.
2. Inside the `update()` function, confirm the following call order:
   - `updateInvaders()` — formation movement
   - `updateExplosions()` — explosion timers
   - `runCollisionPass(player)` — **collision detection**
3. Inside the `renderPlaying()` function, confirm:
   - `drawInvaders(ctx)`
   - `drawExplosions(ctx)`
   - `player.draw(ctx)`
4. **Expected:** All collision logic (`runCollisionPass`) is called inside
   `update()`, which always executes before `render()` / `renderPlaying()`
   in the fixed-timestep loop.

---

### 32. No bundler, no npm, no server
1. Confirm the repository contains no `package.json`, no `node_modules`, no
   `webpack.config.js`, no `vite.config.js`, or similar.
2. Open `index.html` directly from disk (`file://`).
3. **Expected:** Game loads, invaders appear and move, bullets fire, collisions
   register — all without a local server or build step.

---

## Architecture Notes

### Fixed-Timestep Loop
`game.js` uses `requestAnimationFrame` for the outer loop.  Each frame:
1. The raw wall-clock delta is **clamped to 250 ms maximum** before being added
   to an accumulator.  This prevents a burst of missed ticks after the browser
   tab has been backgrounded.
2. The accumulator is drained in fixed steps of `1/60` s (~16.67 ms).
3. `update(dt)` is called for each fixed tick; `render()` is called once per
   animation frame.
4. Within `update()`, the call order is:
   - `player.update(dt)`
   - `updateInvaders()`
   - `updateExplosions()`
   - `runCollisionPass(player)` ← **collision before render**

### Scene State Machine
```
  [Title] --ENTER--> [Playing] --lives==0--> [Game Over] --ENTER--> [Title]
```

### HUD State Contract
`hudState` is a plain object exported from `game.js`.  The score field is
kept in sync with `score.js` each tick:
```js
hudState.score = getScore();   // called every update tick
```

### Player Ship Contract
`player.x` / `player.y` are the **top-left corner** of the 40 × 32 px ship
bounding box.  Collision-detection uses this box directly.

```js
import { Player } from './player.js';
const player = new Player();

player.update(dt);   // dt in seconds
player.draw(ctx);

// Collision check:
if (player.bullet !== null) {
  // player.bullet.x, player.bullet.y — top-left of 4×12 px bullet rect
}

player.lives -= 1;   // decrement when hit
```

### Invader Module Contract
```js
import { invaders, updateInvaders, drawInvaders, INVADER_SPEED_X } from './invaders.js';
// invaders — array of { x, y, alive } objects (55 total)
// updateInvaders() — call once per tick to move the formation
// drawInvaders(ctx) — renders all live invaders as green fillRect
// INVADER_SPEED_X — named constant; change to tune speed
```

### Score Module Contract
```js
import { getScore, addScore, resetScore } from './score.js';
getScore();     // → current score integer
addScore(10);   // → adds 10 to score
resetScore();   // → resets to 0 (called on game reset)
```

### Input Module Contract
```js
import { initInput, isKeyHeld } from './input.js';

initInput();   // call once at startup (safe to call multiple times)

if (isKeyHeld('ArrowLeft')) { /* move left */ }
if (isKeyHeld('Space'))     { /* fire */ }
```

---

*File-layout scaffolding card — all remaining cards build on top of this.*
