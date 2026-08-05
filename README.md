# Space Invaders — BB.Project1

A hand-written, no-framework, no-bundler Space Invaders game that runs
directly from the filesystem (`file://` URL). Every module is a plain
ES module; there is no npm, no build step, and no server required.

---

## Planned File Layout

| File | Status | Owner card |
|------|--------|------------|
| `index.html` | ✅ Created | Game loop and canvas framework |
| `game.js` | ✅ Created | Game loop and canvas framework |
| `gameConfig.js` | ✅ Created | Game loop and canvas framework |
| `input.js` | ✅ Created | Keyboard input and the player ship |
| `player.js` | ✅ Created | Keyboard input and the player ship |
| `invaders.js` | ⏳ Deferred | Invader grid and movement |
| `collision.js` | ⏳ Deferred | Collision detection |
| `level1.js` | ⏳ Deferred | Level 1 wave definition |
| `level2.js` | ⏳ Deferred | Level 2 wave definition |
| `level3.js` | ⏳ Deferred | Level 3 wave definition |
| `boss.js` | ⏳ Deferred | Boss enemy |

> **Note:** Files marked ⏳ Deferred are owned by later cards and must
> **not** be created or stubbed by this card. Placeholder comments inside
> `game.js` mark each future import point.

---

## Architecture Overview

- **`gameConfig.js`** — Single source of truth for shared constants
  (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`,
  `STARTING_LIVES`). All other modules import from here.
- **`game.js`** — Entry point. Owns the `requestAnimationFrame` loop
  (fixed 1/60 s timestep, 250 ms delta cap), the three-scene state machine
  (`title` / `playing` / `gameover`), canvas HUD rendering, and the
  exported `hudState` object.
- **`index.html`** — Minimal host page. Loads `game.js` as
  `type="module"` and centres the 768 × 896 canvas on a dark background.
- **`input.js`** — Keyboard state module. `initInput()` attaches
  `keydown`/`keyup` listeners; `isKeyHeld(code)` queries current hold state.
  Key-repeat events are ignored via `event.repeat`.
- **`player.js`** — `Player` class. Reads input via `isKeyHeld`, moves the
  ship with delta-time scaling, clamps to canvas bounds, and manages a
  single-bullet firing mechanic. Draws procedurally (arcs + rectangles).

---

## Manual Verification Steps

Follow these steps to confirm the implementation is correct without a
build tool or test runner.

### Prerequisites
- A modern browser (Chrome 90+, Firefox 90+, Edge 90+, or Safari 15+).
- The repository files present in the same directory.

### 1 — Open the game
1. In your file manager (or terminal), navigate to the project directory.
2. Double-click **`index.html`** — or drag it into a browser window — to
   open it as a `file://` URL. No local server is needed.
3. **Expected:** A black 768 × 896 canvas is centred on a dark page.
   The text `SPACE INVADERS` (green) and `Press ENTER to start` (white)
   are visible.

### 2 — Title → Playing transition
1. Press **Enter**.
2. **Expected:** The title text disappears. The canvas is black with the
   HUD visible at the bottom (Score 0, BEST 0, LIVES 3). No page reload
   occurs (the browser URL does not change).

### 3 — HUD content
1. While in the Playing scene, inspect the bottom strip of the canvas.
2. **Expected:** Three labels are drawn directly on the canvas:
   - `SCORE 0` (left)
   - `BEST 0` (centre)
   - `LIVES 3` (right)
   A thin horizontal separator line appears above the labels.

### 4 — Game Over transition (console trigger)
1. Open the browser DevTools console (`F12`).
2. Run: `import('./game.js').then(m => { m.hudState.lives = 0; })`
   *(Alternatively call `triggerGameOver` if you import it.)*
3. Wait one frame (or run `m.triggerGameOver()` directly).
4. **Expected:** The scene switches to Game Over — `GAME OVER` (red),
   `Score: 0` (white), and `Press ENTER to restart` (white) are rendered
   on the canvas without a page reload.

### 5 — Game Over → Title transition
1. While on the Game Over screen, press **Enter**.
2. **Expected:** The scene returns to the Title screen (`SPACE INVADERS` /
   `Press ENTER to start`). No page reload occurs.

### 6 — Delta cap / background-tab check
1. Switch to a different browser tab for at least 5 seconds.
2. Switch back to the game tab.
3. **Expected:** The game resumes normally with no visible freeze or burst
   of rapid updates. (The loop caps accumulated delta to 250 ms ≈ 15
   update steps maximum.)

### 7 — Player ship visible in Playing scene
1. Press **Enter** on the title screen to enter Playing.
2. **Expected:** A green Space-Invaders-style player ship is visible near
   the bottom of the canvas, above the HUD strip. The ship has a
   rectangular body, a blue semicircle dome on top, and two wing
   extensions — all drawn procedurally (no external images loaded).

### 8 — Movement: left / right with clamping
1. While in the Playing scene, hold the **Left Arrow** (or **A**) key.
2. **Expected:** The ship moves left at a steady rate. When the ship's
   left edge reaches `x = 0`, it stops moving further left and remains
   flush with the canvas left edge — it does not slide off screen.
3. Release the key; hold the **Right Arrow** (or **D**) key.
4. **Expected:** The ship moves right. When the ship's right edge reaches
   `x = CANVAS_WIDTH` (768 px), it stops — it does not slide off the
   right edge of the canvas.
5. **Clamping check:** Tap and hold both ArrowLeft and ArrowRight
   simultaneously. The ship stays still (forces cancel). Move to the
   far right, then tap only ArrowLeft — the ship moves left normally.

### 9 — Single-bullet firing mechanic
1. In the Playing scene, move the ship to a convenient position.
2. Press **Space** once.
3. **Expected:** A small yellow rectangle (≈4 × 10 px) appears at the
   ship's horizontal centre, at the ship's top edge, and travels upward.
4. While the bullet is in flight, press or hold **Space** again.
5. **Expected:** No second bullet appears. Only one bullet is ever in
   flight at a time.

### 10 — Bullet expiry (single-bullet limit resets)
1. Fire a bullet (Space) and do not fire again.
2. Watch the bullet travel to the top of the canvas.
3. **Expected:** When the bullet's top edge exits the canvas (passes
   `y = 0`), it disappears — `this.bullet` becomes `null` internally.
4. Press **Space** again immediately after.
5. **Expected:** A new bullet spawns without any problem. The single-bullet
   limit is fully reset after the previous bullet left the screen.

### 11 — Key-repeat guard (input.js)
1. Open DevTools → Console.
2. Run the following snippet to count how many times the Set grows while
   holding ArrowLeft for ~1 second:
   ```js
   import('./input.js').then(m => {
     let count = 0;
     const orig = m.isKeyHeld;
     // Observe by watching the Set in the closure — or just trust the
     // movement test: the ship moves at a constant 200 px/s rate,
     // not accelerating each key-repeat tick.
   });
   ```
3. Alternatively, observe the ship: holding **Left Arrow** moves the ship
   at a smooth, constant speed — it does not accelerate, which would
   happen if key-repeat events were processed.
4. **Expected:** Constant movement speed. The `event.repeat` guard in
   `input.js` ensures repeated `keydown` events are discarded.

### 12 — DevTools: no console errors
1. Open DevTools → Console.
2. Hard-reload the page with **Ctrl+Shift+R** (or Cmd+Shift+R on macOS).
3. **Expected:** Zero red error messages. The only output (if any) is
   informational.
