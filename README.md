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
   let count = 0;
   const orig = window.__testUpdateCount;
   // Patch via module re-import is not directly possible;
   // instead, count animation frames for 1 second:
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

   *Alternative*: Add a temporary `console.count('update')` inside `update()` in
   `game.js`, reload, wait exactly 1 second, then read the counter — it should
   read **~60**.

### 11 — Delta cap prevents burst after backgrounding

1. Open the page in Playing scene.
2. Switch to a different tab (or minimize) for **3–5 seconds**.
3. Switch back.
4. **Pass:** The game resumes smoothly with **no visible stutter or jump**.
5. **Pass:** To verify programmatically, add `console.log('steps per tick', steps)`
   inside the `while` drain loop in `game.js` and check the console after
   returning from background — the maximum value logged should be **≤ 15**
   (250 ms cap ÷ 16.67 ms/step ≈ 15 steps), not hundreds.

### 12 — No stub/placeholder source files

1. Inspect the repository root (or the directory containing `index.html`).
2. **Pass:** Only **four** files are present:
   `index.html`, `game.js`, `gameConfig.js`, `README.md`.
3. **Pass:** None of `input.js`, `player.js`, `invaders.js`, `collision.js`,
   `level1.js`, `level2.js`, `level3.js`, `boss.js` exist yet.

### 13 — Placeholder comments in `game.js`

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
