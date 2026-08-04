# BB.Project1 — Space Invaders

A vanilla-JS Space Invaders clone. No build step, no bundler, no npm — open
`index.html` directly in a browser.

---

## File Layout

| File | Purpose |
|---|---|
| `index.html` | Entry point. Hosts the `<canvas>` (768 × 896 px), dark background, loads `game.js` as `type="module"`. |
| `gameConfig.js` | Named exports for all shared constants (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`). Every other module imports constants from here. |
| `game.js` | Main loop (fixed-timestep, 60 Hz), scene state machine (Title / Playing / Game Over), HUD renderer, exported `hudState` object, exported `switchScene()` function. |
| `input.js` | Keyboard handler scaffold. Exports `initInput()` and `isKeyDown(key)`. Stub only — full implementation owned by the *Keyboard input* card. |
| `player.js` | Player ship stub. Exports `initPlayer()`, `updatePlayer(dt)`, `renderPlayer(ctx)`. Full implementation owned by the *Player* card. |
| `invaders.js` | Invader grid stub. Exports `initInvaders()`, `updateInvaders(dt)`, `renderInvaders(ctx)`. Full implementation owned by the *Invaders* card. |
| `collision.js` | Collision detection stub. Exports `rectsOverlap(a, b)` and `checkCollisions()`. Full implementation owned by the *Collision* card. |
| `README.md` | This file — layout map and manual verification steps. |

### Import graph (locked by this card)

All cards import from exactly these filenames at the repo root:

```
game.js          ← imports from gameConfig.js
input.js         ← standalone stub
player.js        ← standalone stub
invaders.js      ← standalone stub
collision.js     ← standalone stub
```

Do **not** rename or move these files without updating every import site.

---

## Constants exported by `gameConfig.js`

| Export | Value | Unit |
|---|---|---|
| `CANVAS_WIDTH` | `768` | px |
| `CANVAS_HEIGHT` | `896` | px |
| `PLAYER_SPEED` | `200` | px / s |
| `BULLET_SPEED` | `500` | px / s |
| `STARTING_LIVES` | `3` | — |

---

## Manual Verification Steps

All verification is done by opening a file directly in a browser —
**no local server required**.

### Prerequisites

- A modern browser: Chrome 80+, Firefox 75+, or Edge 80+.
- All files (`index.html`, `game.js`, `gameConfig.js`, `input.js`, `player.js`,
  `invaders.js`, `collision.js`) in the **same directory**.

---

### Step 1 — Open the game

1. Double-click `index.html`, or drag it into a browser window, or paste the
   absolute path into the address bar:
   ```
   file:///C:/projects/BB.Project1/index.html
   ```
2. Open DevTools (F12 → Console tab).
3. **Expected (AC1):** The page loads with **no red errors** in the console.  
   You should see a log line:
   ```
   [game] switchScene: (none) → title
   ```

---

### Step 2 — Canvas dimensions and dark background

1. In the DevTools Console, run:
   ```js
   const c = document.getElementById('gameCanvas');
   console.log(c.width, c.height);
   ```
2. **Expected (AC2):** Prints `768 896`.
3. **Expected (AC3):** The page body is visibly dark (CSS `background: #000`).  
   The canvas is centred in the viewport.

---

### Step 3 — Title scene

1. Observe the canvas.
2. **Expected (AC4):** The canvas shows the text **SPACE INVADERS** in green and
   a blinking white **"Press ENTER to start"** prompt.

---

### Step 4 — Transition to Playing scene

1. Press the **ENTER** key.
2. **Expected (AC5):** The canvas changes immediately — no page reload.  
   The console shows:
   ```
   [game] switchScene: title → playing
   ```
3. **Expected (AC6):** A HUD is visible at the top of the canvas showing
   `Score: 0` on the left, `Hi: 0` in the centre, and `Lives: 3` on the right.  
   A green rectangle (stub player) is visible near the bottom of the canvas.

---

### Step 5 — Fixed-timestep loop cadence

1. While on the Playing scene, watch the console for one second.
2. **Expected (AC7):** A log line appears roughly every second:
   ```
   [game] update steps in last ~1 s: 60
   ```
   The count should be between 55 and 65 under normal desktop load.

---

### Step 6 — Tab-blur / spiral-of-death guard

1. While on the Playing scene, click away to a different tab and wait **5+ seconds**.
2. Return to the game tab.
3. **Expected (AC8):** The console shows a cap message such as:
   ```
   [game] Delta capped: 5243.0 ms → 250 ms
   ```
   The game continues smoothly; the update-steps counter for that second stays
   near 60, not hundreds.

---

### Step 7 — Game Over scene

1. Open the console and run:
   ```js
   import('./game.js').then(m => m.switchScene('game-over'));
   ```
2. **Expected (AC9):** The canvas shows **GAME OVER** in red, `Score: 0` beneath
   it, and a blinking **"Press ENTER to restart"** prompt.
   The HUD at the top remains visible.

---

### Step 8 — Return to Title from Game Over

1. While on the Game Over scene, press **ENTER**.
2. **Expected (AC10):** The canvas returns to the Title scene.  
   The console shows:
   ```
   [game] switchScene: game-over → title
   ```
   Score and lives are reset to their starting values (`0` and `3`).

---

### Step 9 — Exported `hudState`

1. In the console, run:
   ```js
   import('./game.js').then(m => console.log(m.hudState));
   ```
2. **Expected (AC11):** Prints an object, e.g.:
   ```
   { score: 0, lives: 3, hiScore: 0 }
   ```
3. Mutate it and confirm the HUD updates on the next frame:
   ```js
   import('./game.js').then(m => { m.hudState.score = 9999; });
   ```
   Switch to Playing scene (press ENTER on Title) — the HUD should show
   `Score: 9999` until a scene reset overwrites it.

---

### Step 10 — Stub modules are valid ES modules

1. In the console, run each import in turn:
   ```js
   import('./input.js').then(m => console.log('input ok', m));
   import('./player.js').then(m => console.log('player ok', m));
   import('./invaders.js').then(m => console.log('invaders ok', m));
   import('./collision.js').then(m => console.log('collision ok', m));
   ```
2. **Expected (AC12):** Each logs `ok` with the module's named exports —
   no errors thrown.

---

### Step 11 — No network requests

1. Open DevTools → Network tab, then reload.
2. **Expected (AC13):** Only `index.html`, `game.js`, and `gameConfig.js`
   appear. No CDN, API, or npm requests.
3. Search the source of all `.js` files for `fetch` — none found.  
   No `import` starts with `https://` or `npm:`.

---

### All acceptance criteria at a glance

| AC | What is checked | Pass condition |
|---|---|---|
| AC1 | `index.html` loads via `file://` | No console errors |
| AC2 | Canvas dimensions | `canvas.width === 768`, `canvas.height === 896` |
| AC3 | Page background | Visibly dark (CSS on `body`) |
| AC4 | `gameConfig.js` exports | All five constants importable with correct values |
| AC5 | Fixed timestep | `update()` called at 1/60 s steps |
| AC6 | Title scene text | "SPACE INVADERS" + "Press ENTER to start" on canvas |
| AC7 | Tab-blur guard | Delta capped; no update burst on return |
| AC8 | ENTER on Title | Transitions to Playing; no page reload |
| AC9 | Playing scene | Loop runs; blank/placeholder content acceptable |
| AC10 | ENTER on Game Over | Returns to Title; score and lives reset |
| AC11 | Game Over scene | "GAME OVER" + score + "Press ENTER to restart" |
| AC12 | HUD on Playing | Score and lives drawn on canvas |
| AC13 | `hudState` export | Object with `score`, `lives`, `hiScore`; mutable |
| AC14 | All six `.js` files exist | Valid ES modules, no syntax errors on import |
| AC15 | README | File layout + manual verification steps documented |
| AC16 | No build step needed | Works from `file://` with no server or npm |
