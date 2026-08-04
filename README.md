# e2e Space Invaders

A plain-HTML5 / ES-module Space Invaders game.
**No build step. No package manager. No server required.**
Open `index.html` directly in a modern browser.

---

## File Layout and Module Responsibilities

| File | Responsibility |
|---|---|
| `index.html` | Single-page entry point. Hosts the `<canvas>` (768 × 896 px) on a black background and loads `game.js` as an ES module. |
| `gameConfig.js` | Named exports for all shared constants: `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`. Import this wherever a game-wide value is needed. |
| `game.js` | Main module. Owns the fixed-timestep game loop (60 steps/s, 250 ms delta cap), the three-scene state machine (Title → Playing → Game Over → Title), canvas HUD rendering, and the exported `hudState` object. |
| `input.js` | Keyboard input. Tracks held keys (`isKeyDown`) and single-frame presses (`isKeyJustPressed`). Wired by `game.js` at boot; full player-movement binding added in the player-ship card. |
| `player.js` | Player ship module — **stub only** for this card. Full implementation added in the player-ship card. |
| `invaders.js` | Invader grid module — **stub only**. Full implementation added in the invaders card. |
| `collision.js` | Collision detection module — **stub only**. Full implementation added in the sprite-rendering and collision card. |

---

## Shared Constants (`gameConfig.js`)

| Constant | Value | Unit |
|---|---|---|
| `CANVAS_WIDTH` | 768 | px |
| `CANVAS_HEIGHT` | 896 | px |
| `PLAYER_SPEED` | 200 | px/s |
| `BULLET_SPEED` | 500 | px/s |
| `STARTING_LIVES` | 3 | — |

---

## Manual Verification Checklist

Follow these steps from a `file://` URL — no local server needed.

### Prerequisites
- A modern browser (Chrome 90+, Firefox 90+, Edge 90+, Safari 15+) with ES-module support.
- Clone or download the repository so all files sit in the same folder.

### Step 1 — Open the game
1. In your file manager (or browser's address bar) open `index.html`.
2. **Expected:** The page background is black. A 768 × 896 black canvas is centred.
3. **Expected:** The canvas shows **"SPACE INVADERS"** and **"Press ENTER to start"** in white, centred text.
4. **Expected:** The browser console (F12) shows **no errors**.

### Step 2 — Verify the HUD
1. While on the Title screen, look at the top edge of the canvas.
2. **Expected:** `SCORE  0` appears top-left (green text).
3. **Expected:** `HI  0` appears top-centre.
4. **Expected:** `LIVES  3` appears top-right.

### Step 3 — Transition to Playing
1. Press **ENTER**.
2. **Expected:** Title text disappears. The canvas now shows the Playing stub message and the HUD is still visible.
3. **Expected:** No page reload occurs (the URL does not change and the browser does not flash).

### Step 4 — ENTER during Playing is a no-op
1. While in the Playing scene press **ENTER** one or more times.
2. **Expected:** Nothing changes (no crash, no scene change).

### Step 5 — Trigger Game Over via the console
1. Open the browser DevTools console.
2. Because `game.js` is a module you need to locate it in the Sources tab first, or use the snippet below.
3. In the console, import the module and call `triggerGameOver`:
   ```js
   // Chrome / Edge — ES dynamic import over file:// may be blocked in some
   // browsers; if so, temporarily set lives to 0 via the hudState export
   // (see alternative below).
   const mod = await import('./game.js');
   mod.triggerGameOver();
   ```
   **Alternative (always works):**
   ```js
   const mod = await import('./game.js');
   mod.hudState.lives = 0;  // triggers automatic game-over on next update
   ```
4. **Expected:** The canvas renders **"GAME OVER"**, `Score: 0`, and **"Press ENTER to restart"**.

### Step 6 — Transition from Game Over back to Title
1. While the Game Over screen is showing, press **ENTER**.
2. **Expected:** The Title screen reappears. Score is reset to `0` (visible in the HUD). No page reload.

### Step 7 — Hi-score persistence within session
1. Via the console set a non-zero score before triggering game over:
   ```js
   const mod = await import('./game.js');
   mod.hudState.score = 1500;
   mod.triggerGameOver();
   ```
2. **Expected:** Game Over screen shows `Score: 1500`.
3. Press **ENTER** → Title. **Expected:** `HI  1500` is shown in the HUD top-centre.
4. Trigger game over again with score `0`. Press **ENTER** → Title.
5. **Expected:** `HI  1500` is still shown (hi-score is not downgraded).

### Step 8 — Delta cap (backgrounded-tab test)
1. On the Playing screen, switch to a different tab or window and wait **≥ 5 seconds**.
2. Switch back.
3. **Expected:** The game resumes smoothly — no visible burst of frames or stutter.

### Step 9 — Stub files exist and are error-free
1. In the DevTools Sources panel confirm that `player.js`, `invaders.js`, and `collision.js` are loaded.
2. **Expected:** All three files load without syntax errors (no red entries in the console).

---

## Architecture Notes

- **No build step** — edit any `.js` file and refresh the browser.
- **No package manager** — there is no `package.json`, `node_modules`, or `npm`.
- **No server required** — all imports are relative paths; `game.js` imports `gameConfig.js` and `input.js` with `./` prefixes so they resolve on `file://`.
- The `hudState` object is a **live, mutable export**. Later cards import it and mutate `hudState.score`, `hudState.lives`, etc. directly; `game.js` reads the same object each render frame.
- The game loop uses a **fixed-timestep accumulator** pattern: wall-clock elapsed time is accumulated and drained in `1/60 s` increments, keeping physics updates deterministic regardless of display refresh rate.
