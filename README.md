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
| `input.js` | ⏳ Deferred | Keyboard input and the player ship |
| `player.js` | ⏳ Deferred | Keyboard input and the player ship |
| `invaders.js` | ⏳ Deferred | Invader grid and movement |
| `collision.js` | ⏳ Deferred | Collision detection |
| `level1.js` | ⏳ Deferred | Level 1 wave definition |
| `level2.js` | ⏳ Deferred | Level 2 wave definition |
| `level3.js` | ⏳ Deferred | Level 3 wave definition |
| `boss.js` | ⏳ Deferred | Boss enemy |

> **Note:** Every file marked ⏳ Deferred is owned by a later card and must
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

### 7 — No deferred files exist
1. Inspect the project directory.
2. **Expected:** Only `index.html`, `game.js`, `gameConfig.js`, and
   `README.md` are present (plus `test/sample-pr.txt`). None of
   `input.js`, `player.js`, `invaders.js`, `collision.js`, `level1.js`,
   `level2.js`, `level3.js`, or `boss.js` exist.

### 8 — DevTools: no console errors
1. Open DevTools → Console.
2. Hard-reload the page with **Ctrl+Shift+R** (or Cmd+Shift+R on macOS).
3. **Expected:** Zero red error messages. The only output (if any) is
   informational.
