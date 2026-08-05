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
| `input.js` | Keyboard-input stub that exports `inputState`; full key handling is added in the Keyboard Input card. |
| `player.js` | Player-ship stub; full implementation added in the Player Ship card. |
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
2. **Expected:** Object contains exactly:
   `CANVAS_WIDTH=768, CANVAS_HEIGHT=896, PLAYER_SPEED=200, BULLET_SPEED=500, STARTING_LIVES=3`.

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

---

*File-layout scaffolding card — all remaining cards build on top of this.*
