# BB.Project1 — Space Invaders

A pure-ES-module, no-bundler Space Invaders game that runs directly from the
filesystem (`file://` URL). No npm, no server required.

---

## Planned File Layout

| File | Owning Card |
|------|-------------|
| `index.html` | Game loop and canvas framework |
| `game.js` | Game loop and canvas framework |
| `gameConfig.js` | Game loop and canvas framework |
| `input.js` | Keyboard input and the player ship |
| `player.js` | Keyboard input and the player ship |
| `invaders.js` | Level 1: the classic grid |
| `collision.js` | Sprite rendering and collision detection |
| `level1.js` | Level 1: the classic grid |
| `level2.js` | Level 2: they shoot back |
| `level3.js` | Level 3: shields and formations |
| `boss.js` | Boss level: multi-phase finale |

---

## Manual Verification Checklist

Work through each step after opening the project. All steps must pass before
marking this card Done.

### 1. Open from `file://`
- [ ] Open `index.html` directly in your browser (File → Open, or drag-and-drop).
- [ ] Confirm the URL bar shows `file:///…/index.html` (not `http://localhost`).
- [ ] Open the browser DevTools console (`F12`). Confirm **zero errors** and
      **zero warnings** appear on load.

### 2. Title screen appearance
- [ ] A 768 × 896 black canvas is centred on a black page.
- [ ] The canvas displays the text **SPACE INVADERS** in white, large, monospace
      font, centred horizontally and vertically.
- [ ] Below it, **Press ENTER to start** appears in a smaller grey font.
- [ ] No other content is visible on the canvas.

### 3. ENTER key — Title → Playing transition
- [ ] Press the **Enter** key once.
- [ ] The title text disappears immediately (no page reload — the URL stays the
      same, the browser tab does not flash/reload).
- [ ] The canvas goes black with a dark HUD bar at the top.
- [ ] The HUD bar shows **SCORE: 0**, **HI: 0**, and **LIVES: 3**.

### 4. HUD display in the Playing scene
- [ ] `SCORE:` value is displayed on the left of the HUD bar.
- [ ] `HI:` (hi-score) value is displayed in the centre of the HUD bar.
- [ ] `LIVES:` value is displayed on the right of the HUD bar.
- [ ] The game area below the HUD is empty and black (no entities yet — those
      are added by downstream cards).

### 5. Game Over scene
- [ ] Open the browser console and run:
      ```js
      // Force the game into the gameover scene to test it
      // (Paste each line separately)
      ```
      Because direct scene forcing requires editing the source, instead do:
      - Temporarily edit `game.js` line `let currentScene = 'title';` to
        `let currentScene = 'gameover';`, save, and reload.
- [ ] The canvas shows **GAME OVER** in red, centred.
- [ ] Below it, **SCORE: 0** is shown in white.
- [ ] Below that, **Press ENTER to restart** is shown in grey.
- [ ] Press **Enter** — the scene transitions to Title without a page reload.
- [ ] Revert the `currentScene` edit before committing.

### 6. Game Over → Title reset (score & lives)
- [ ] While on the Game Over scene, confirm that pressing Enter:
  - Resets `hud.score` to `0`.
  - Resets `hud.lives` to `3` (STARTING_LIVES).
  - Transitions to the Title scene (text **SPACE INVADERS** reappears).
  - Does **not** reload the page.

### 7. Tab-background burst prevention
- [ ] On the Title screen, switch to a different browser tab or window.
- [ ] Wait at least **10 seconds**.
- [ ] Switch back to the Space Invaders tab.
- [ ] Open DevTools → Performance or simply observe: the game should resume
      normally without a visible burst of rapid updates or a frozen frame.
- [ ] Confirm in the console that no errors were thrown during the background
      period.

---

## Architecture Notes

- **`gameConfig.js`** — single source of truth for all numeric constants.
  Every other module imports from here; never hardcode magic numbers.
- **`game.js`** — owns the canvas, the `requestAnimationFrame` loop, the scene
  state machine, the `hud` export, and (temporarily) the ENTER key listener.
  Once `input.js` is added by the *Keyboard input and the player ship* card,
  that listener moves there.
- **Fixed timestep** — `update()` is called in discrete 1/60 s steps regardless
  of how fast or slow the display renders. `render()` is called once per
  animation frame. This decouples physics/logic from display refresh rate.
- **`MAX_ACCUMULATED_DELTA`** — capped at 5 × TIMESTEP so that returning from
  a backgrounded tab never causes more than five update steps to fire at once.
