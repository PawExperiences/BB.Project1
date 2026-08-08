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
| `invaders.js` | Sprite rendering and collision detection |
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
- [ ] The game area below the HUD shows the invader formation (green rectangles
      arranged in an 11-column × 5-row grid).

### 5. Invader formation movement
- [ ] After entering the Playing scene, the invader formation moves slowly
      to the right.
- [ ] When the rightmost column of living invaders reaches the right edge of
      the canvas, the formation drops downward and reverses direction (moves left).
- [ ] When the leftmost column of living invaders reaches the left edge, the
      formation drops downward and reverses direction again (moves right).
- [ ] Invaders that have been destroyed are **not** drawn — their grid slot
      appears empty.

### 6. Player ship and shooting
- [ ] A cyan ship is visible near the bottom of the canvas.
- [ ] Pressing **Arrow Left / A** moves the ship left; **Arrow Right / D** moves it right.
- [ ] Pressing **Space** fires a yellow bullet upward from the ship's nose.
- [ ] Only one bullet is in flight at a time (firing again while a bullet is
      active does nothing).
- [ ] The bullet disappears when it exits the top of the canvas.

### 7. Collision — bullet hits invader
- [ ] Fire a bullet at an invader.
- [ ] On overlap: the invader disappears (alive = false, not drawn), the bullet
      disappears, and a brief orange-white flash rectangle appears at the kill
      position.
- [ ] The flash disappears within ~300 ms.
- [ ] The **SCORE** counter in the HUD increases by 10 for each kill.

### 8. Explosion timing
- [ ] Fire several shots rapidly at different invaders.
- [ ] Each kill produces its own independent flash that lasts ~300 ms regardless
      of when other kills happen.

### 9. Game Over scene
- [ ] Open the browser console and temporarily edit `game.js` to set
      `let currentScene = 'gameover';`, save, and reload.
- [ ] The canvas shows **GAME OVER** in red, centred.
- [ ] Below it, **SCORE: 0** is shown in white.
- [ ] Below that, **Press ENTER to restart** is shown in grey.
- [ ] Press **Enter** — the scene transitions to Title without a page reload.
- [ ] Revert the `currentScene` edit before committing.

### 10. Game Over → Title reset (score & lives)
- [ ] While on the Game Over scene, confirm that pressing Enter:
  - Resets `hud.score` to `0`.
  - Resets `hud.lives` to `3` (STARTING_LIVES).
  - Transitions to the Title scene (text **SPACE INVADERS** reappears).
  - Does **not** reload the page.

### 11. Tab-background burst prevention
- [ ] On the Title screen, switch to a different browser tab or window.
- [ ] Wait at least **10 seconds**.
- [ ] Switch back to the Space Invaders tab.
- [ ] Observe: the game resumes normally without a visible burst of rapid
      updates or a frozen frame.
- [ ] Confirm in the console that no errors were thrown during the background
      period.

---

## Architecture Notes

- **`gameConfig.js`** — single source of truth for all numeric constants.
  Every other module imports from here; never hardcode magic numbers.
- **`game.js`** — owns the canvas, the `requestAnimationFrame` loop, the scene
  state machine, the `hud` export, and the ENTER key listener.
- **`input.js`** — keyboard abstraction; call `initInput()` once at startup,
  then query `isKeyHeld(code)` anywhere.
- **`player.js`** — `Player` class; handles movement, clamping, and single
  in-flight bullet.
- **`invaders.js`** — `Invader` class, 11 × 5 `formation` array,
  `updateFormation(dt)`, `drawFormation(ctx)`.
- **`collision.js`** — AABB pass, `score` export, explosion effect state,
  `runCollisionPass(player, invaderBullets)`, `updateExplosions(dt)`,
  `drawExplosions(ctx)`.
- **Fixed timestep** — `update()` is called in discrete 1/60 s steps regardless
  of how fast or slow the display renders. `render()` is called once per
  animation frame. This decouples physics/logic from display refresh rate.
- **`MAX_ACCUMULATED_DELTA`** — capped at 5 × TIMESTEP so that returning from
  a backgrounded tab never causes more than five update steps to fire at once.
- **Collision ordering** — `runCollisionPass` is always called before
  `updateFormation` and draw calls, ensuring no entity is moved into a
  pre-existing overlap without detection.
