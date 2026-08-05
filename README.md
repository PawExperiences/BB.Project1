# Space Invaders

A hand-crafted browser Space Invaders game built with plain HTML, CSS, and ES modules — no framework, no bundler, no npm.

---

## How to Run

1. Clone or download this repository.
2. Open `index.html` directly in your browser:
   - **macOS / Linux:** `open index.html`
   - **Windows:** double-click `index.html` in File Explorer, or run `start index.html` in a terminal.
   - Works from a `file://` URL — no local server required.

---

## File Layout

### Implemented (this card)

| File | Purpose |
|---|---|
| `index.html` | Page shell: 768×896 canvas on a dark background |
| `gameConfig.js` | Shared constants (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`) |
| `game.js` | Fixed-timestep loop, scene FSM (Title / Playing / Game Over), canvas HUD, `hudState` export |

### Planned (owned by sibling cards)

| File | Owning Card |
|---|---|
| `input.js` | "Keyboard input and the player ship" |
| `player.js` | "Keyboard input and the player ship" |
| `invaders.js` | "Invader grid and movement" |
| `collision.js` | "Collision detection" |
| `level1.js` | "Level 1" |
| `level2.js` | "Level 2" |
| `level3.js` | "Level 3" |
| `boss.js` | "Boss battle" |

---

## Architecture Notes

- **`gameConfig.js`** is the single source of truth for all numeric constants. Every other module imports from it.
- **`hudState`** is a named export from `game.js`. Sibling modules increment `hudState.score` on a kill, decrement `hudState.lives` on a hit, etc. Changes are reflected on the canvas on the very next frame.
- **Fixed timestep:** the loop runs `update()` at exactly 60 steps/second regardless of monitor refresh rate. If the tab is backgrounded and returned to, the accumulated delta is capped at 5 × (1/60) s so no burst of catch-up updates occurs.
- **Scene FSM:** `TITLE → PLAYING → GAME_OVER → TITLE`. ENTER drives every transition.

---

## Manual Verification Steps

Open `index.html` in a browser (Chrome, Firefox, or Edge) and verify each point:

1. **No console errors** — open DevTools (F12) → Console; it must be clean on load.
2. **Canvas size** — the black canvas is exactly 768 px wide × 896 px tall and centred on a dark page background.
3. **Title scene** — the canvas shows "SPACE INVADERS" and "Press ENTER to start".
4. **Scene transition** — pressing **Enter** moves to the Playing scene without reloading the page (URL bar unchanged).
5. **Playing scene & HUD** — the canvas shows a black field with a HUD at the top: `SCORE 0` on the left, `HI 0` in the centre, `LIVES 3` on the right.
6. **`hudState` console test** — in DevTools console, run:
   ```js
   import('./game.js').then(m => { m.hudState.score = 9999; });
   ```
   The HUD score must update to `9999` on the next frame (no reload).
7. **Game Over scene** — manually trigger it from the console:
   ```js
   import('./game.js').then(m => { m.hudState.lives = 0; });
   ```
   The canvas must show "GAME OVER", the score, and "Press ENTER to restart".
8. **Return to Title** — pressing **Enter** on the Game Over screen returns to the Title scene (no reload).
9. **Background-tab cap** — switch to another tab for 10+ seconds, return; the game must resume smoothly with at most 5 catch-up `update()` calls (no freeze or jump).
10. **`gameConfig.js` exports** — in DevTools console:
    ```js
    import('./gameConfig.js').then(m => console.log(m));
    ```
    Must print: `{ CANVAS_WIDTH: 768, CANVAS_HEIGHT: 896, PLAYER_SPEED: 200, BULLET_SPEED: 500, STARTING_LIVES: 3 }`.
