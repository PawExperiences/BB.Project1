# BB.Project1 — Space Invaders

A vanilla-JS Space Invaders clone. No build step, no bundler, no npm — open
`index.html` directly in a browser.

---

## File Layout

| File | Purpose |
|---|---|
| `index.html` | Entry point. Hosts the `<canvas>` (768 × 896 px), dark background, loads `game.js` as `type="module"`. |
| `gameConfig.js` | Named exports for all shared constants (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`). Every other module imports constants from here. |
| `game.js` | Main loop (fixed-timestep, 60 Hz), scene state machine (Title / Playing / Game Over), HUD renderer, exported `hudState` object, exported `switchScene()` function. Instantiates `Player` and calls `update`/`draw` each frame. |
| `input.js` | Keyboard handler. Exports `initInput()` (registers keydown/keyup on window) and `isKeyHeld(key)` (returns true while key is held). |
| `player.js` | Player ship. Exports `Player` class, `PLAYER_SPEED`, `BULLET_SPEED`, `CANVAS_WIDTH`. |
| `invaders.js` | Invader grid stub. Exports `initInvaders()`, `updateInvaders(dt)`, `renderInvaders(ctx)`. Full implementation owned by the *Invaders* card. |
| `collision.js` | Collision detection stub. Exports `rectsOverlap(a, b)` and `checkCollisions()`. Full implementation owned by the *Collision* card. |
| `README.md` | This file — layout map and manual verification steps. |

### Import graph

```
game.js          ← imports from gameConfig.js, input.js, player.js
input.js         ← standalone
player.js        ← imports from gameConfig.js, input.js
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
3. **Expected:** The page loads with **no red errors** in the console.  
   You should see a log line:
   ```
   [game] switchScene: (none) → title
   ```

---

### Step 2 — Title scene

1. Observe the canvas.
2. **Expected:** The canvas shows the text **SPACE INVADERS** in green and
   a blinking white **"Press ENTER to start"** prompt.

---

### Step 3 — Transition to Playing scene

1. Press the **ENTER** key.
2. **Expected:** The canvas changes immediately — no page reload.  
   The console shows:
   ```
   [game] switchScene: title → playing
   ```
3. **Expected:** A HUD is visible at the top of the canvas showing
   `Score: 0` on the left, `Hi: 0` in the centre, and `Lives: 3` on the right.  
   The player ship (green procedural shape with a nose arc and wings) is visible
   near the bottom of the canvas.

---

### Step 4 — Keyboard input and `isKeyHeld` (AC: input.js)

1. While on the Playing scene, open the DevTools console and run:
   ```js
   import('./input.js').then(m => {
     console.log('before hold:', m.isKeyHeld('ArrowLeft'));
   });
   ```
2. **Expected:** Prints `false`.
3. To confirm the held-key map works, physically hold **ArrowLeft** and run the
   same import again — it should print `true` while the key is held and `false`
   after release.

---

### Step 5 — Ship movement

1. Press and hold **ArrowLeft** (or **A**).  
   **Expected:** The ship slides left at a steady rate.  
   When the ship reaches the left edge it stops (left edge does not go below 0).
2. Press and hold **ArrowRight** (or **D**).  
   **Expected:** The ship slides right and stops at the right edge
   (right edge does not exceed 768).

---

### Step 6 — Firing a bullet

1. Press **Space**.  
   **Expected:** A small yellow rectangle appears above the ship and travels
   upward rapidly.
2. While that bullet is still on screen, press **Space** again.  
   **Expected:** A second bullet does **not** appear (one-bullet rule).
3. Wait for the bullet to exit the top of the canvas.  
   **Expected:** No bullet is drawn; pressing **Space** again fires a new one.

---

### Step 7 — HUD shows correct lives

1. While on the Playing scene, run in the console:
   ```js
   import('./game.js').then(m => console.log('lives:', m.hudState.lives));
   ```
2. **Expected:** Prints `lives: 3`.

---

### Step 8 — player.js named exports

1. In the console run:
   ```js
   import('./player.js').then(m => {
     console.log('PLAYER_SPEED', m.PLAYER_SPEED);   // 200
     console.log('BULLET_SPEED', m.BULLET_SPEED);   // 500
     console.log('CANVAS_WIDTH', m.CANVAS_WIDTH);   // 768
   });
   ```
2. **Expected:** All three values are printed correctly.

---

### Step 9 — Fixed-timestep loop cadence

1. While on the Playing scene, watch the console for one second.
2. **Expected:** A log line appears roughly every second:
   ```
   [game] update steps in last ~1 s: 60
   ```
   The count should be between 55 and 65 under normal desktop load.

---

### Step 10 — Tab-blur / spiral-of-death guard

1. While on the Playing scene, click away to a different tab and wait **5+ seconds**.
2. Return to the game tab.
3. **Expected:** The console shows a cap message such as:
   ```
   [game] Delta capped: 5243.0 ms → 250 ms
   ```
   The game continues smoothly.

---

### Step 11 — Game Over scene

1. Open the console and run:
   ```js
   import('./game.js').then(m => m.switchScene('game-over'));
   ```
2. **Expected:** The canvas shows **GAME OVER** in red, `Score: 0` beneath
   it, and a blinking **"Press ENTER to restart"** prompt.
   The HUD at the top remains visible.

---

### Step 12 — Return to Title from Game Over

1. While on the Game Over scene, press **ENTER**.
2. **Expected:** The canvas returns to the Title scene.  
   The console shows:
   ```
   [game] switchScene: game-over → title
   ```

---

### Step 13 — No network requests

1. Open DevTools → Network tab, then reload.
2. **Expected:** Only `index.html`, `game.js`, `gameConfig.js`, `input.js`, and
   `player.js` appear as module requests. No CDN, API, or npm requests.

---

### All acceptance criteria at a glance

| AC | What is checked | Pass condition |
|---|---|---|
| AC1 | `initInput()` + `isKeyHeld(key)` | Held key returns `true`; released returns `false`; no key-repeat dependence |
| AC2 | `player.js` named exports | `PLAYER_SPEED === 200`, `BULLET_SPEED === 500`, `CANVAS_WIDTH === 768` |
| AC3 | `Player` constructor | `player.lives === 3` (from `gameConfig.js`) |
| AC4 | Left/right movement | Ship moves at exactly `PLAYER_SPEED` px/s (delta-time scaled) |
| AC5 | Clamping | Left edge ≥ 0 and right edge ≤ `CANVAS_WIDTH` |
| AC6 | Fire bullet | Space with no bullet in flight spawns a bullet travelling upward |
| AC7 | One-bullet rule | Second Space press while bullet is live has no effect |
| AC8 | Bullet cleared at top | After `bullet.y < 0`, next Space fires again |
| AC9 | Procedural ship drawing | Ship drawn with arcs + rectangles; no image file loaded |
| AC10 | Bullet rendering | In-flight bullet rendered as a small filled rectangle |
| AC11 | Loop integration | `player.update(dt)` and `player.draw(ctx)` called each frame; no console errors |
| AC12 | HUD lives | `renderHUD` displays `player.lives` value |
| AC13 | `file://` URL | Game works without a server |
| AC14 | Build pipeline | GitHub Actions completes with no errors |
