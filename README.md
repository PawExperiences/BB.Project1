# e2e Space Invaders

A hand-written, zero-dependency Space Invaders game that runs directly from
the filesystem — no server, no bundler, no npm.

---

## File Layout

| File | Owner / Card |
|---|---|
| `index.html` | **Game loop and canvas framework** |
| `game.js` | **Game loop and canvas framework** |
| `gameConfig.js` | **Game loop and canvas framework** |
| `input.js` | **Keyboard input and the player ship** |
| `player.js` | **Keyboard input and the player ship** |
| `invaders.js` | Later card — *Level 1: the classic grid* |
| `collision.js` | Later card — *Sprite rendering and collision detection* |
| `level1.js` | Later card — *Level 1* |
| `level2.js` | Later card — *Level 2* |
| `level3.js` | Later card — *Level 3* |
| `boss.js` | Later card — *Boss level: multi-phase finale* |

---

## Architecture Overview

### `gameConfig.js`
Exports shared constants:
- `CANVAS_WIDTH = 768`
- `CANVAS_HEIGHT = 896`
- `PLAYER_SPEED = 200` px/sec
- `BULLET_SPEED = 500` px/sec
- `STARTING_LIVES = 3`
- `startingLives = 3` (alias for backward-compatibility)

### `input.js`
- `initInput()` — attaches `keydown`/`keyup` listeners to `window` once at startup.
- `isKeyHeld(key)` — returns `true` while the given `KeyboardEvent.key` is held; `false` otherwise.
- No reliance on key-repeat events; the Map-backed held state is authoritative.

### `player.js`
Exports the `Player` class:
- Constructor sets starting position and reads `STARTING_LIVES` from `gameConfig.js`.
- `update(dt)` — moves the ship left/right (`ArrowLeft`/`a`, `ArrowRight`/`d`) at 200 px/s;
  clamps to canvas bounds; manages the single-bullet-in-flight constraint.
- `draw(ctx)` — procedural Canvas 2D rendering: wide base + mid body + barrel + dome arc;
  also draws the active bullet as a 4 × 12 px yellow rectangle.
- `this.lives` — initialised from `STARTING_LIVES`; readable/decrementable by level cards.
- `this.bullet` getter — exposes bullet state for future collision detection.

### `game.js`
- **Fixed-timestep loop**: 60 update steps/sec (`UPDATE_STEP = 1/60 s`),
  accumulated delta capped at 200 ms to prevent catch-up bursts.
- **Scene state machine**: Title → Playing → Game Over → Title, driven by
  the ENTER key with no page reload.
- **HUD**: drawn directly on the canvas; exports `hudState { score, lives,
  hiScore }` for sibling modules to read and mutate.
- Instantiates a `Player` on transition to Playing; calls `player.update(dt)`
  and `player.draw(ctx)` each tick/frame.

---

## Manual Verification Checklist

Open `index.html` by double-clicking it (or dragging it into a browser tab)
so the URL starts with `file://`. No local server is required.

### 1. No errors on load
- [ ] The browser console (F12 → Console) shows **no errors** and **no
  network requests** (Network tab should be empty or show only the local
  file loads for `game.js`, `gameConfig.js`, `input.js`, and `player.js`).

### 2. Canvas size and background
- [ ] A black rectangle 768 × 896 px is visible in the page.
- [ ] The surrounding page body is also black.

### 3. Title scene
- [ ] The canvas displays **"SPACE INVADERS"** in large green text centred
  horizontally and vertically.
- [ ] Below it, **"Press ENTER to start"** is displayed in white.
- [ ] **"HI-SCORE: 0"** (or the current session hi-score) is shown near
  the top of the canvas.

### 4. Title → Playing transition (ENTER)
- [ ] Pressing **ENTER** while on the Title scene switches to the Playing
  scene **without** a page reload.
- [ ] The Playing scene shows the HUD: **"SCORE: 0"** on the top-left and
  **"LIVES: 3"** on the top-right of the canvas.
- [ ] A green player ship is visible near the bottom of the canvas.

### 5. Player movement
- [ ] Hold **ArrowLeft** or **a** — the ship moves left at a steady speed
  and stops at the left edge (x = 0), never going further.
- [ ] Hold **ArrowRight** or **d** — the ship moves right at a steady speed
  and stops at the right edge, never going past the canvas boundary.
- [ ] Release the key — the ship stops immediately (no coasting).

### 6. Shooting
- [ ] Press **Space** — a small yellow bullet appears above the barrel and
  travels upward.
- [ ] While the bullet is in flight, pressing or holding **Space** does **not**
  spawn a second bullet.
- [ ] Once the bullet exits the top of the canvas it disappears, and
  **Space** can fire again.

### 7. Ship rendering
- [ ] The ship is drawn procedurally (no image files loaded).
- [ ] It has a recognisable cannon silhouette: wide base, narrower mid
  section, narrow barrel, and a small dome/arc at the top.

### 8. Playing scene stubs
- [ ] No JavaScript errors appear in the console during the Playing scene.

### 9. Playing → Game Over transition
- [ ] Open the browser console and run:
  ```js
  import('./game.js').then(m => { m.hudState.lives = 0; });
  ```
- [ ] Within one update tick the scene switches to **Game Over**.

### 10. Game Over scene
- [ ] The canvas displays **"GAME OVER"** in large red text.
- [ ] Below it, the final **"SCORE: N"** is shown.
- [ ] Below that, **"Press ENTER to restart"** is displayed.
- [ ] The hi-score is shown near the top.

### 11. Game Over → Title transition (ENTER)
- [ ] Pressing **ENTER** on the Game Over scene returns to the **Title** scene.
- [ ] The hi-score reflects the highest score seen so far.

### 12. Delta-cap behaviour (backgrounded tab)
- [ ] Switch to another tab for ≥ 5 seconds, then switch back.
- [ ] The game resumes smoothly with no visible burst of catch-up updates.

### 13. `hudState` export
- [ ] In the console run:
  ```js
  import('./game.js').then(m => console.log(m.hudState));
  ```
- [ ] The logged object has `score`, `lives`, and `hiScore`.
