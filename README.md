# Space Invaders — BB.Project1

A pure-HTML/CSS/ES-module Space Invaders built card-by-card on BuildBoard.
No framework, no bundler, no npm dependencies. Open `index.html` from `file://` to play.

---

## Planned File Layout

| File | Owning Card |
|------|-------------|
| `index.html` | Game loop and canvas framework |
| `game.js` | Game loop and canvas framework |
| `gameConfig.js` | Game loop and canvas framework |
| `README.md` | Game loop and canvas framework |
| `input.js` | Keyboard input and the player ship |
| `player.js` | Keyboard input and the player ship |
| `invaders.js` | Level 1: the classic grid |
| `collision.js` | Sprite rendering and collision detection |
| `level1.js` | Level 1: the classic grid |
| `level2.js` | Level 2: they shoot back |
| `level3.js` | Level 3: shields and formations |
| `boss.js` | Boss level: multi-phase finale |

---

## Manual Verification

All steps below are performed by opening `index.html` directly in a browser
(`File → Open File…` or drag-and-drop). **No local server is required.**

### 1 — Page loads without errors

1. Open your browser's DevTools console (F12 / Cmd+Opt+I).
2. Open `index.html` via `file://`.
3. **Pass:** Console shows zero errors and zero warnings on load.

### 2 — Canvas dimensions and dark background

1. On the loaded page, inspect the `<canvas>` element in DevTools.
2. **Pass:** `width` attribute = **768**, `height` attribute = **896**.
3. **Pass:** The page background and canvas background are black (`#000`).

### 3 — `gameConfig.js` exports correct constants

1. In the DevTools console, type:
   ```js
   import('./gameConfig.js').then(m => console.log(m));
   ```
2. **Pass:** The logged module object contains:
   - `CANVAS_WIDTH === 768`
   - `CANVAS_HEIGHT === 896`
   - `PLAYER_SPEED === 200`
   - `BULLET_SPEED === 500`
   - `STARTING_LIVES === 3`

### 4 — `hudState` named export

1. In the DevTools console:
   ```js
   import('./game.js').then(m => console.log(m.hudState));
   ```
2. **Pass:** Logged object has at minimum `{ score: 0, lives: 3, hiScore: 0 }` (numbers).

### 5 — Title scene renders correctly

1. On load the canvas should show the **Title** scene immediately.
2. **Pass:** The text **"SPACE INVADERS"** is visible, centred horizontally and
   vertically on the canvas (green, large font).
3. **Pass:** The text **"Press ENTER to start"** is visible below it (white, smaller font).

### 6 — ENTER transitions Title → Playing (no reload)

1. With the Title scene visible, press **Enter**.
2. **Pass:** The canvas changes to the Playing scene (faint grid lines visible,
   HUD score/lives appear in corners).
3. **Pass:** The browser URL does **not** change; the page does **not** reload
   (verify via the DevTools Network tab — no new page request is issued).

### 7 — HUD is drawn on the canvas during Playing

1. While in the Playing scene inspect the canvas visually.
2. **Pass:** **SCORE: 0** is drawn in the top-left corner of the canvas (white text).
3. **Pass:** **LIVES: 3** is drawn in the top-right corner (green text).
4. **Pass:** **HI: 0** is drawn at the top-centre (yellow text).
5. **Pass:** These are painted pixels on the `<canvas>` — right-click → Inspect
   confirms there are **no** `<div>` or DOM overlay elements added.

### 8 — Game Over scene renders correctly

1. In the DevTools console while in Playing, call:
   ```js
   import('./game.js').then(m => m.triggerGameOver());
   ```
2. **Pass:** The canvas shows the **Game Over** scene:
   - **"GAME OVER"** in large red text, centred.
   - **"SCORE: 0"** (or the current score) below it, white.
   - **"Press ENTER to restart"** below that, white.
3. **Pass:** HUD score and lives are still visible.

### 9 — ENTER transitions Game Over → Title (no reload)

1. While on the Game Over scene, press **Enter**.
2. **Pass:** The canvas returns to the **Title** scene.
3. **Pass:** No page reload occurs.

### 10 — Game loop runs at ~60 update steps per second

1. In the DevTools console while in Playing, run:
   ```js
   let frames = 0;
   const start = performance.now();
   const id = requestAnimationFrame(function f() {
     frames++;
     if (performance.now() - start < 1000) requestAnimationFrame(f);
     else console.log('rAF frames in 1 s:', frames);
   });
   ```
2. **Pass:** The logged frame count is approximately **60** (typically 58–62 on a
   60 Hz display), confirming the loop is driven by `requestAnimationFrame` at
   the display refresh rate with one update step per frame under normal load.

### 11 — Delta cap prevents burst after backgrounding

1. Open the page in Playing scene.
2. Switch to a different tab (or minimize) for **3–5 seconds**.
3. Switch back.
4. **Pass:** The game resumes smoothly with **no visible stutter or jump**.

### 12 — `initInput()` and `isKeyHeld()` work correctly

1. In the DevTools console:
   ```js
   import('./input.js').then(({ initInput, isKeyHeld }) => {
     initInput();
     window._isKeyHeld = isKeyHeld;
     console.log('input module loaded');
   });
   ```
2. **Pass:** No errors are thrown; console prints `'input module loaded'`.
3. Hold down the **A** key and in the console run `window._isKeyHeld('a')`.
4. **Pass:** Returns `true` while A is held.
5. Release A and run `window._isKeyHeld('a')` again.
6. **Pass:** Returns `false` immediately after release.

### 13 — isKeyHeld is not fooled by browser key-repeat

1. Hold down the **A** key for 2+ seconds (browser will fire repeated keydown events).
2. In the console run `window._isKeyHeld('a')`.
3. **Pass:** Still returns `true` (a single value, not a counter).
4. Release A; `window._isKeyHeld('a')` returns `false`.
5. **Pass:** The function returns a boolean, not a number that inflates with repeats.

### 14 — Player ship appears and moves

1. Press **Enter** on the Title screen to enter the Playing scene.
2. **Pass:** A green procedurally-drawn ship is visible near the bottom of the canvas.
3. Hold **ArrowLeft** or **A**.
4. **Pass:** The ship moves left at a steady speed (~200 px/s).
5. Hold **ArrowRight** or **D**.
6. **Pass:** The ship moves right at a steady speed (~200 px/s).
7. **Pass:** The ship never moves off the left or right edge of the canvas.

### 15 — Ship clamping at canvas edges

1. Hold **ArrowLeft** until the ship reaches the left wall.
2. **Pass:** The ship stops flush with the left edge (left edge = 0); it does not
   disappear or clip outside the canvas.
3. Hold **ArrowRight** until the ship reaches the right wall.
4. **Pass:** The ship stops flush with the right edge (right edge = CANVAS_WIDTH = 768).

### 16 — Firing a single bullet

1. In the Playing scene, press **Space**.
2. **Pass:** A small bright-yellow filled rectangle appears above the ship and
   travels upward.
3. **Pass:** While the bullet is in flight, pressing **Space** again has no effect
   (no second bullet appears).
4. **Pass:** When the bullet exits the top of the canvas it disappears and a new
   **Space** press fires again.

### 17 — No stub/placeholder source files (pre-input card)

This check applied before this card was implemented. Post-implementation the
repository contains exactly the expected files:
`index.html`, `game.js`, `gameConfig.js`, `README.md`, `input.js`, `player.js`.

### 18 — Placeholder comments in `game.js`

1. Open `game.js` in a text editor or the DevTools Sources panel.
2. **Pass:** The file contains exactly these eight comment lines (in any order):
   ```
   // input.js added by card: "Keyboard input and the player ship"
   // player.js added by card: "Keyboard input and the player ship"
   // invaders.js added by card: "Level 1: the classic grid"
   // collision.js added by card: "Sprite rendering and collision detection"
   // level1.js added by card: "Level 1: the classic grid"
   // level2.js added by card: "Level 2: they shoot back"
   // level3.js added by card: "Level 3: shields and formations"
   // boss.js added by card: "Boss level: multi-phase finale"
   ```
