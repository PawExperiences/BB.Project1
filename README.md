# e2e Space Invaders

A hand-written, zero-dependency Space Invaders game that runs directly from
the filesystem — no server, no bundler, no npm.

---

## Planned File Layout

| File | Owner / Card |
|---|---|
| `index.html` | **This card** — Game loop and canvas framework |
| `game.js` | **This card** — Game loop and canvas framework |
| `gameConfig.js` | **This card** — Game loop and canvas framework |
| `input.js` | Later card — *Keyboard input and the player ship* |
| `player.js` | Later card — *Keyboard input and the player ship* |
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

### `game.js`
- **Fixed-timestep loop**: 60 update steps/sec (`UPDATE_STEP = 1/60 s`),
  accumulated delta capped at 200 ms to prevent catch-up bursts.
- **Scene state machine**: Title → Playing → Game Over → Title, driven by
  the ENTER key with no page reload.
- **HUD**: drawn directly on the canvas; exports `hudState { score, lives,
  hiScore }` for sibling modules to read and mutate.

---

## Manual Verification Checklist

Open `index.html` by double-clicking it (or dragging it into a browser tab)
so the URL starts with `file://`. No local server is required.

### 1. No errors on load
- [ ] The browser console (F12 → Console) shows **no errors** and **no
  network requests** (Network tab should be empty or show only the two
  local file loads for `game.js` and `gameConfig.js`).

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
  scene **without** a page reload (URL does not change, no white flash).
- [ ] The Playing scene shows the HUD: **"SCORE: 0"** on the top-left and
  **"LIVES: 3"** on the top-right of the canvas.
- [ ] The canvas is cleared and re-drawn every frame (no flickering
  artefacts from previous frames).

### 5. Playing scene stubs
- [ ] No JavaScript errors appear in the console during the Playing scene.
- [ ] The game loop is running (you can verify by temporarily mutating
  `hudState.score` in the console and confirming the HUD updates on the
  next render).

### 6. Playing → Game Over transition
- [ ] Open the browser console and type:
  ```js
  import('./game.js').then(m => { m.hudState.lives = 0; });
  ```
  (or simply set `hudState.lives = 0` if you have a reference).
- [ ] Within one update tick the scene should switch to **Game Over**.
- [ ] Alternatively, wait for a later card that wires up actual lives loss.

### 7. Game Over scene
- [ ] The canvas displays **"GAME OVER"** in large red text.
- [ ] Below it, the final **"SCORE: N"** is shown.
- [ ] Below that, **"Press ENTER to restart"** is displayed.
- [ ] The hi-score is shown near the top.

### 8. Game Over → Title transition (ENTER)
- [ ] Pressing **ENTER** on the Game Over scene returns to the **Title**
  scene (not directly to Playing).
- [ ] The hi-score on the Title scene reflects the score from the just-
  finished game if it was higher than the previous hi-score.

### 9. Delta-cap behaviour (backgrounded tab)
- [ ] Switch to a different browser tab and wait at least 5 seconds.
- [ ] Switch back. The game should resume smoothly with **no visible
  stutter or burst** of catch-up updates.
- [ ] To verify programmatically: add a `console.count('update')` inside
  `update()` temporarily; after returning from a 5-second background
  pause the counter should jump by at most ~12 (200 ms / (1/60 s) ≈ 12)
  regardless of how long the tab was hidden.

### 10. `hudState` export
- [ ] In the browser console run:
  ```js
  import('./game.js').then(m => console.log(m.hudState));
  ```
- [ ] The logged object has properties `score`, `lives`, and `hiScore`.

### 11. Exactly three source files
- [ ] Only `index.html`, `game.js`, and `gameConfig.js` exist in the
  project root (besides `README.md` and the CI config). No other `.js`
  or `.html` files have been created.
