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
| `invaders.js` | Invader-grid stub; full implementation added in the Enemy Grid card. |
| `collision.js` | Collision-detection stub that exports `checkCollision`; full implementation added in the Collision card. |

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
>
> *The game loop and Player integration are in `game.js` — if the ship is not
> yet wired into the loop, use the DevTools console snippets below as an
> alternative confirmation path.*

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
   200 px/s (the ship's 40 px width crosses its own width in ~0.2 s).
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
   It must not move off the left edge of the canvas, regardless of how long
   the key is held.

---

### 16. Edge clamping — right boundary
1. Hold **ArrowRight** or **D** continuously for at least 5 seconds.
2. **Expected:** The ship's right edge reaches `CANVAS_WIDTH` (768 px) and
   **stops there**.  It must not move off the right edge of the canvas.

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
4. **Expected:** A new bullet fires from the ship's cannon. The single-bullet
   constraint is enforced per flight, not permanently.

---

### 20. Lives initialisation
1. In DevTools Console run:
   ```js
   import('./player.js').then(({ Player }) => {
     const p = new Player();
     console.log('lives:', p.lives);
   });
   ```
2. **Expected:** Logs `lives: 3` (the value of `PLAYER_LIVES` from
   `gameConfig.js`).

---

### 21. Procedural drawing — no image assets
1. Open the **Network** tab in DevTools.
2. Reload the page and play normally (move and shoot).
3. **Expected:** No image files (`.png`, `.jpg`, `.svg`, `.gif`, etc.) are
   requested. The ship and bullet are drawn entirely with canvas API calls.

---

### 22. ES module compatibility from file:// URL
1. Open `index.html` directly from the filesystem (double-click or
   `File → Open`) — **not** via `localhost`.
2. **Expected:** The game loads and all features above work without any
   CORS or module-loading errors in the DevTools Console.

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

### Scene State Machine
```
  [Title] --ENTER--> [Playing] --lives==0--> [Game Over] --ENTER--> [Title]
```

### HUD State Contract
`hudState` is a plain object exported from `game.js`.  Sibling modules import
it and mutate its fields directly:
```js
import { hudState } from './game.js';
hudState.score += 10;   // award points
hudState.lives  -= 1;   // lose a life (triggers Game Over check)
```

### Player Ship Contract
`player.x` / `player.y` are the **top-left corner** of the 40 × 32 px ship
bounding box.  Collision-detection cards use this box directly.

```js
import { Player } from './player.js';
const player = new Player();

// Game loop:
player.update(dt);   // dt in seconds
player.draw(ctx);

// Collision check:
if (player.bullet !== null) {
  // player.bullet.x, player.bullet.y — top-left of 4×12 px bullet rect
}

// Lives:
player.lives -= 1;   // decrement when hit (owned by level cards)
```

### Input Module Contract
```js
import { initInput, isKeyHeld } from './input.js';

initInput();   // call once at startup (safe to call multiple times)

// In update():
if (isKeyHeld('ArrowLeft')) { /* move left */ }
if (isKeyHeld('Space'))     { /* fire */ }
```

---

*File-layout scaffolding card — all remaining cards build on top of this.*
