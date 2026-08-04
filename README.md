# BB.Project1 — Space Invaders

Initialized by BuildBoard.

---

## Manual Verification Steps

All verification is done by opening a file directly in a browser — **no local server required**.

### Prerequisites

- A modern browser: Chrome 80+, Firefox 75+, or Edge 80+.
- The files `index.html` and `game.js` in the same directory.

---

### Step 1 — Open the game

1. In your file manager, double-click `index.html`, or drag it into a browser window.
   Alternatively, paste the absolute path into the address bar, e.g.:
   ```
   file:///C:/projects/BB.Project1/index.html
   ```
2. Open the browser's developer console (F12 → Console tab).
3. **Expected — AC1:** The page loads with no red errors in the console.  
   You should see a log line like `[game] switchScene: (none) → title`.

---

### Step 2 — Title scene

1. Observe the canvas (black rectangle centred on the dark page).
2. **Expected — AC2:** The canvas is centred on a dark (`#0a0a0a`) background.
3. **Expected — AC3:** The canvas shows the text **SPACE INVADERS** in green and a
   blinking white **"Press ENTER to start"** prompt.

---

### Step 3 — Transition to Playing scene

1. Press the **ENTER** key.
2. **Expected — AC4:** The canvas changes immediately (no page reload).  
   The console shows `[game] switchScene: title → playing`.
3. **Expected — AC5:** A HUD is visible at the top of the canvas showing
   `Score: 0` on the left and `Lives: 3` on the right (and `Hi: 0` in the centre).  
   A green rectangle (stub player) is visible near the bottom of the canvas.

---

### Step 4 — Confirm fixed-timestep loop cadence (AC6)

1. While on the Playing scene, watch the console for one second.
2. **Expected:** A log line appears roughly every second, e.g.:
   ```
   [game] update steps in last ~1 s: 60
   ```
   The number should be between 55 and 65 under normal desktop load.

---

### Step 5 — Tab-blur / spiral-of-death guard (AC7)

1. While on the Playing scene, click away to a different tab and wait 5+ seconds.
2. Return to the game tab.
3. **Expected:** The console shows a cap message such as:
   ```
   [game] Delta capped: 5243.0 ms → 200 ms
   ```
   The game continues smoothly; the update-steps counter for that second is **not**
   hundreds of steps — it stays near 60.

---

### Step 6 — Game Over scene (AC8)

1. Open the browser console and type the following, then press Enter:
   ```js
   import('./game.js').then(m => m.switchScene('game-over'));
   ```
   *(Alternatively, set a breakpoint and call `switchScene('game-over')` from any
   module that imports `game.js`.)*
2. **Expected — AC8:** The canvas shows **GAME OVER** in red, `Score: 0` beneath it,
   and a blinking **"Press ENTER to restart"** prompt.
   The HUD at the top remains visible.

---

### Step 7 — Return to Title from Game Over (AC9)

1. While on the Game Over scene, press **ENTER**.
2. **Expected — AC9:** The canvas returns to the Title scene.  
   The console shows `[game] switchScene: game-over → title`.

---

### Step 8 — Exported HUD state (AC10)

1. In the browser console, type:
   ```js
   import('./game.js').then(m => console.log(m.hudState));
   ```
2. **Expected — AC10:** An object is printed, e.g.:
   ```
   { score: 0, lives: 3, hiScore: 0 }
   ```
   You can mutate it: `import('./game.js').then(m => { m.hudState.score = 9999; })`
   and the HUD updates on the next render frame.

---

### Step 9 — No fetch / no npm (AC11)

1. In the Network tab of DevTools, reload the page.
2. **Expected — AC11:** Only `index.html` and `game.js` appear — no network requests
   to CDNs, APIs, or npm registries.  
   Search the source of `game.js` for `fetch` — none found.  
   Search for `import` — no URL starts with `https://` or `npm:`.

---

### All criteria at a glance

| AC  | How to verify | Pass condition |
|-----|--------------|----------------|
| AC1 | Open `index.html` via `file://` | No console errors |
| AC2 | Observe page | Canvas centred on dark background |
| AC3 | Title scene | "SPACE INVADERS" + "Press ENTER to start" drawn on canvas |
| AC4 | Press ENTER on Title | Transitions to Playing; no reload |
| AC5 | Playing scene | HUD shows Score: 0, Lives: 3 on canvas |
| AC6 | Watch console 1 s | `update steps … 60` logged |
| AC7 | Blur tab 5 s, return | Delta capped message; no update burst |
| AC8 | Call `switchScene('game-over')` | GAME OVER + score + restart prompt |
| AC9 | Press ENTER on Game Over | Returns to Title |
| AC10 | Console: `import('./game.js').then(…)` | `hudState` object accessible |
| AC11 | DevTools Network + source search | No fetch, no npm |
| AC12 | Follow steps above | All pass without a local server |
