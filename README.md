# e2e Space Invaders

A plain-HTML5 / ES-module Space Invaders game.  
**No build step. No package manager. No server required.**  
Open `index.html` directly in a modern browser.

---

## File Layout and Module Responsibilities

| File | Responsibility |
|---|---|
| `index.html` | Single-page entry point. Hosts the `<canvas>` (800 × 600 px) on a black background and loads `game.js` as an ES module. |
| `gameConfig.js` | Named exports for all shared constants: `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`. Import this wherever a game-wide value is needed. |
| `game.js` | Main module. Owns the fixed-timestep game loop (60 steps/s, 250 ms delta cap), the three-scene state machine (Title → Playing → Game Over → Title), canvas HUD rendering, and the exported `hudState` object. |
| `input.js` | Keyboard input. Tracks held keys (`isKeyHeld` / `isKeyDown`) and single-frame presses (`isKeyJustPressed`). Wired by `game.js` at boot. |
| `player.js` | Player ship entity — movement, clamping, single-bullet firing, procedural drawing, lives counter. |
| `invaders.js` | Invader grid module — **stub only**. Full implementation added in the invaders card. |
| `collision.js` | Collision detection module — **stub only**. Full implementation added in the sprite-rendering and collision card. |

---

## Shared Constants (`gameConfig.js`)

| Constant | Value | Unit |
|---|---|---|
| `CANVAS_WIDTH` | 800 | px |
| `CANVAS_HEIGHT` | 600 | px |
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
2. **Expected:** The page background is black. An 800 × 600 black canvas is centred.
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
3. **Expected:** No page reload occurs.

### Step 4 — ENTER during Playing is a no-op
1. While in the Playing scene press **ENTER** one or more times.
2. **Expected:** Nothing changes (no crash, no scene change).

### Step 5 — Trigger Game Over via the console
1. Open the browser DevTools console.
2. In the console:
   ```js
   const mod = await import('./game.js');
   mod.triggerGameOver();
   ```
   **Alternative (always works):**
   ```js
   const mod = await import('./game.js');
   mod.hudState.lives = 0;  // triggers automatic game-over on next update
   ```
3. **Expected:** The canvas renders **"GAME OVER"**, `Score: 0`, and **"Press ENTER to restart"**.

### Step 6 — Transition from Game Over back to Title
1. While the Game Over screen is showing, press **ENTER**.
2. **Expected:** The Title screen reappears. Score is reset to `0`. No page reload.

### Step 7 — Hi-score persistence within session
1. Via the console:
   ```js
   const mod = await import('./game.js');
   mod.hudState.score = 1500;
   mod.triggerGameOver();
   ```
2. **Expected:** Game Over screen shows `Score: 1500`.
3. Press **ENTER** → Title. **Expected:** `HI  1500` shown in the HUD.
4. Trigger game over again with score `0`. Press **ENTER** → Title.
5. **Expected:** `HI  1500` is still shown (hi-score is not downgraded).

### Step 8 — Delta cap (backgrounded-tab test)
1. On the Playing screen, switch to a different tab and wait **≥ 5 seconds**.
2. Switch back.
3. **Expected:** The game resumes smoothly — no visible burst of frames or stutter.

### Step 9 — Stub files exist and are error-free
1. In the DevTools Sources panel confirm that `player.js`, `invaders.js`, and `collision.js` are loaded.
2. **Expected:** All three files load without syntax errors.

---

## Player Ship — Manual Verification

These steps verify the keyboard input and player ship module (`input.js` + `player.js`).

### Step P1 — Ship appears and lives counter is correct
1. Press **ENTER** to enter the Playing scene.
2. Import the Player class in the DevTools console and create an instance:
   ```js
   const { Player } = await import('./player.js');
   const p = new Player();
   console.log(p.lives);  // must print 3
   ```
3. **Expected:** `p.lives === 3` (equals `STARTING_LIVES`).

### Step P2 — Ship movement and clamping
1. While in the Playing scene, open `game.js` in the DevTools Sources panel and
   add a temporary `Player` instance to the render/update cycle, **or** use the
   console approach below to observe clamping:
   ```js
   const { Player } = await import('./player.js');
   const p = new Player();

   // Simulate holding ArrowRight for a long time (many seconds worth of dt)
   for (let i = 0; i < 1000; i++) p.update(1/60);
   console.log(p.x);   // must be <= 800 - 20  (CANVAS_WIDTH - half ship width)

   // Reset and simulate holding ArrowLeft
   const p2 = new Player();
   // Manually trigger left movement by noting isKeyHeld reads the live set;
   // instead verify the formula: x never goes below 20 (half ship width)
   // by calling update with a large dt and inspecting x.
   ```
2. **Expected:** After many `update(dt)` calls, `p.x` converges to the clamped
   maximum and does not grow beyond it.
3. **Manual key test:** Open the playing scene (ENTER), then hold **ArrowRight**.
   The ship (if rendered) moves right and stops at the right canvas edge.
   Hold **ArrowLeft** — ship moves left and stops at the left canvas edge.

### Step P3 — Single-bullet constraint
1. In the DevTools console:
   ```js
   const { Player } = await import('./player.js');
   // initInput() is already called by game.js at boot, so input is live.
   const p = new Player();

   // Simulate a Space-press by checking bullet state:
   // (Keyboard events are driven by real input; hold Space and call update.)
   p.update(1/60);                      // with Space held: bullet spawns
   const b1 = p.bullet;
   p.update(1/60);                      // still holding Space
   const b2 = p.bullet;
   console.log(b1 === b2);             // must be true — same bullet object
   ```
2. **Expected:** While a bullet is in flight, holding or repeatedly pressing
   Space does not create a second bullet. `p.bullet` is the same object
   reference across frames.

### Step P4 — Bullet exits top and resets
1. In the DevTools console:
   ```js
   const { Player } = await import('./player.js');
   const p = new Player();

   // Force a bullet into existence by setting it directly:
   // (Or hold Space in-game and observe.)
   // Simulate bullet travel until it exits the top (y < 0):
   // BULLET_SPEED = 500 px/s, canvas height = 600px.
   // At 500px/s it takes 600/500 = 1.2 s to cross the full canvas.
   // Spawned near y = 600 - 60 - 16 - 12 ≈ 512, so needs ~1.02 s to exit.

   // Hold Space: bullet spawns
   p.update(1/60);           // bullet created (requires Space held live)

   // Fast-forward: advance 200 frames × (1/60)s ≈ 3.3 s
   for (let i = 0; i < 200; i++) p.update(1/60);
   console.log(p.bullet);   // must be null — bullet has exited top
   ```
2. **Expected:** After enough frames `p.bullet === null`.
3. **Expected:** After the bullet is gone, holding Space again fires a new bullet.

### Step P5 — Bullet speed
1. In the DevTools console:
   ```js
   const { Player } = await import('./player.js');
   const p = new Player();

   // Force-create a bullet at a known position for inspection:
   // (Requires Space to be held when update is called — do so in-game or
   //  temporarily patch isKeyHeld in the console.)

   // After bullet spawns, record y, advance one frame, check delta:
   const dt = 1 / 60;
   p.update(dt);                       // Space held → bullet spawns
   if (p.bullet) {
     const y0 = p.bullet.y;
     p.update(dt);                     // advance one frame (Space still held but bullet exists — no new bullet)
     const dy = y0 - p.bullet.y;      // bullet moves UP so y decreases
     console.log(dy.toFixed(2));      // must be ≈ 8.33  (500 / 60)
   }
   ```
2. **Expected:** Per-frame bullet displacement ≈ `500 / 60 ≈ 8.33 px` upward.

### Step P6 — Ship is drawn procedurally (no image assets)
1. Open the DevTools Network tab and reload the page.
2. Filter by **Img** type.
3. **Expected:** No image requests are made. The ship is drawn entirely with
   canvas API calls (`fillRect`, `arc`, `ellipse`, `beginPath` / `fill` etc.).

---

## Architecture Notes

- **No build step** — edit any `.js` file and refresh the browser.
- **No package manager** — there is no `package.json`, `node_modules`, or `npm`.
- **No server required** — all imports are relative paths; modules resolve on `file://`.
- The `hudState` object is a **live, mutable export**. Later cards import it and
  mutate `hudState.score`, `hudState.lives`, etc. directly; `game.js` reads the
  same object each render frame.
- The game loop uses a **fixed-timestep accumulator** pattern: wall-clock elapsed
  time is accumulated and drained in `1/60 s` increments, keeping physics updates
  deterministic regardless of display refresh rate.
- `isKeyHeld(key)` (exported from `input.js`) is the canonical held-key query
  used by `player.js`. `isKeyDown` is retained as a backward-compatible alias.
