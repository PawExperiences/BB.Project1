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

### 19 — Invader formation renders

1. Press **Enter** on the Title screen.
2. **Pass:** An 11×5 grid of 55 coloured rectangles (32×24 px each) is visible
   near the top of the canvas, centred horizontally, with 8 px horizontal and
   8 px vertical gaps between cells.
3. **Pass:** The rows display distinct colours (e.g. red, orange, yellow, green, cyan
   from top to bottom).

### 20 — Formation step-and-drop movement

1. Enter the Playing scene and observe the invader formation.
2. **Pass:** The formation moves horizontally in discrete timed steps.
3. **Pass:** When the right edge of the rightmost invader reaches the right canvas
   boundary (x = 768), the entire formation drops by 32 px (one sprite-height stride)
   and begins moving left.
4. **Pass:** When the left edge of the leftmost invader reaches x = 0, the
   formation drops again and reverses to move right.
5. **Pass:** With all 55 invaders alive the step interval is approximately 800 ms;
   as invaders are destroyed the interval decreases toward 100 ms with 1 remaining.

### 21 — Shooting an invader

1. Enter the Playing scene. Position the ship under an invader.
2. Press **Space** to fire.
3. **Pass:** When the yellow bullet's AABB overlaps a living invader:
   - The invader rectangle disappears.
   - A brief yellow/white explosion flash appears at that cell for ~8 frames.
   - The bullet disappears simultaneously.
   - The SCORE counter in the HUD increments by 1.
4. **Pass:** Subsequent shots can kill additional invaders, each incrementing the
   score.

### 22 — `score` export from `invaders.js`

1. In the DevTools console (while in Playing):
   ```js
   import('./invaders.js').then(m => console.log('score:', m.score));
   ```
2. **Pass:** Returns a number equal to the count of invaders killed so far.
3. Kill another invader, then repeat the import check.
4. **Pass:** The value increments correctly.

### 23 — `runCollisions` signature

1. In the DevTools console:
   ```js
   import('./collision.js').then(m => console.log(typeof m.runCollisions));
   ```
2. **Pass:** Logs `'function'`.
3. Call it with empty arrays and a mock player:
   ```js
   import('./collision.js').then(({ runCollisions }) => {
     runCollisions([], [], [], { x: 384, y: 800, hit: false });
     console.log('no crash');
   });
   ```
4. **Pass:** No error is thrown; logs `'no crash'`.

### 24 — Collision pass order (collide-then-draw)

1. Open `game.js` in DevTools Sources.
2. **Pass:** In `updatePlaying`, the call to `runCollisions(...)` appears **before**
   any draw call (draw calls are in `renderPlaying`, which is only invoked from
   `render()`, which is called after `update()` completes).

### 25 — Level number on HUD

1. Enter the Playing scene.
2. **Pass:** The text **"LEVEL 1"** is visible on the canvas below the main HUD row.
3. **Pass:** The score (top-left), hi-score (top-centre), and lives (top-right)
   remain fully visible and are not overwritten by the level label.

### 26 — Win condition: all invaders cleared

1. Using the DevTools console, kill all invaders programmatically:
   ```js
   import('./invaders.js').then(({ invaders }) => {
     invaders.forEach(i => { i.alive = false; });
   });
   ```
2. Wait one game tick.
3. **Pass:** The game transitions away from the Playing scene
   (returns to Title or advances, signalling `gameState.level = 2`).

### 27 — Lose condition: formation reaches player row

1. Enter the Playing scene.
2. In the DevTools console, force the formation down to the player row:
   ```js
   import('./invaders.js').then(({ invaders }) => {
     invaders.forEach(i => { i.y += 700; });
   });
   ```
3. Wait one game tick.
4. **Pass:** `hudState.lives` decrements by 1 and the formation resets to its
   starting position.

---

## Level 2 Manual Verification

These steps verify Level 2 behaviour. To reach Level 2, clear Level 1 (kill all
55 invaders) or jump directly using the console shortcut below.

### L2-0 — Jump to Level 2 via console (shortcut for testing)

1. Start a game (press **Enter** on Title).
2. In the DevTools console:
   ```js
   import('./invaders.js').then(({ invaders }) => {
     invaders.forEach(i => { i.alive = false; });
   });
   ```
3. Wait one tick.
4. **Pass:** `hudState.level` becomes `2` and the Playing scene continues
   (no transition to Title or Game Over).

### L2-1 — Lives carry over from Level 1

1. While in Level 1, note the current `hudState.lives` value.
2. Clear Level 1 (kill all invaders as above).
3. **Pass:** `hudState.lives` is the same value after the transition — it is NOT
   reset to 3.

### L2-2 — Level 2 invader grid is 11×5

1. After transitioning to Level 2, confirm via console:
   ```js
   import('./invaders.js').then(({ invaders }) => {
     const alive = invaders.filter(i => i.alive);
     console.log('alive:', alive.length);
   });
   ```
2. **Pass:** `alive.length === 55`.

### L2-3 — Formation moves faster in Level 2

1. In Level 1, observe the step interval with 55 invaders alive (~800 ms).
2. After advancing to Level 2, observe the same full grid.
3. **Pass:** Steps visually occur approximately 1.5× as often (roughly every 536 ms
   at 55 alive, vs 800 ms in Level 1).

### L2-4 — Invaders fire downward bullets

1. Enter Level 2 and wait a few seconds.
2. **Pass:** Small red rectangles appear below the invader formation and travel
   downward toward the player.
3. **Pass:** No more than a handful of bullets are on screen at once (each fire
   event spawns exactly one bullet).

### L2-5 — Invader bullet hits player → life lost, respawn

1. Enter Level 2 and allow an invader bullet to reach the player ship.
2. **Pass:** `hudState.lives` decrements by 1.
3. **Pass:** The player ship immediately reappears at the bottom-centre of the
   canvas (x = 384, y = CANVAS_HEIGHT − 80).

### L2-6 — Invulnerability window and flash

1. After the player is hit and respawns, observe the ship for 2 seconds.
2. **Pass:** The ship visually flickers (appears and disappears at a regular
   sub-second interval) for approximately 2 seconds.
3. **Pass:** During the flicker window, a second invader bullet passing through
   the player's position does NOT decrement `hudState.lives` again.
4. After ~2 seconds, the ship stops flickering.
5. **Pass:** The ship is now solid and the next hit DOES decrement a life.

### L2-7 — UFO appears every 20 seconds

1. Enter Level 2 and start a stopwatch.
2. **Pass:** A UFO (red rectangle with dome, labelled "UFO") appears along the
   top edge of the play area approximately 20 seconds after level start.
3. **Pass:** A second UFO appears approximately 40 seconds after level start.

### L2-8 — UFO alternates entry side

1. Watch the first UFO: **Pass:** it enters from the **left** and travels right.
2. Watch the second UFO: **Pass:** it enters from the **right** and travels left.
3. Watch the third UFO: **Pass:** it enters from the **left** again.

### L2-9 — UFO exits silently if not shot

1. Allow a UFO to cross the entire screen without shooting it.
2. **Pass:** The UFO disappears after exiting the canvas edge.
3. **Pass:** `hudState.score` does NOT change when the UFO exits.

### L2-10 — Shooting the UFO awards score

1. Shoot a UFO (position under it and press Space).
2. **Pass:** `hudState.score` increases by one of: 50, 100, 150, or 300.
3. In the console check:
   ```js
   import('./game.js').then(m => console.log('shots:', m.hudState.sessionShotCount));
   ```
4. **Pass:** The score increment equals `[50,100,150,300][hudState.sessionShotCount % 4]`
   at the moment of the hit.

### L2-11 — sessionShotCount is cumulative across levels

1. Fire several shots in Level 1, note the count via console.
2. Advance to Level 2.
3. **Pass:** `hudState.sessionShotCount` continues from where it was — it is not
   reset to 0 on level transition.

### L2-12 — Game Over when lives reach 0

1. In Level 2, allow invader bullets to hit the player until lives reach 0
   (or force it: `import('./game.js').then(m => { m.hudState.lives = 0; })`
   — note: the next tick will trigger game over automatically).
   Alternatively call `triggerGameOver()` directly:
   ```js
   import('./game.js').then(m => m.triggerGameOver());
   ```
2. **Pass:** The Game Over scene is displayed.
3. Press **Enter**.
4. **Pass:** The Title scene is shown. No page reload.

### L2-13 — level2.js has no npm imports or fetch calls

1. Open `level2.js` in DevTools Sources or a text editor.
2. **Pass:** The only `import` statements reference `./gameConfig.js` and
   `./invaders.js` (relative paths, no `node_modules` specifiers).
3. **Pass:** There are no `fetch(...)` calls anywhere in the file.
4. **Pass:** Opening `index.html` via `file://` works with no network errors in
   the DevTools Network tab.
