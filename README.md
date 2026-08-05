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

### Implemented

| File | Purpose |
|---|---|
| `index.html` | Page shell: 768×896 canvas on a dark background |
| `gameConfig.js` | Shared constants (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`) |
| `game.js` | Fixed-timestep loop, scene FSM (Title / Playing / Game Over), canvas HUD, `hudState` export |
| `input.js` | Keyboard held-key tracker (`initInput`, `isKeyHeld`) |
| `player.js` | Player ship: movement, single-bullet firing, procedural drawing, lives counter |

### Planned (owned by sibling cards)

| File | Owning Card |
|---|---|
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
- **Player position convention:** `player.x` / `player.y` is the **top-left corner** of the ship's 40×32 px bounding box.
- **Single-bullet lock:** only one bullet may be in flight at a time. A new bullet cannot be fired until the previous one either hits something or exits the top of the canvas.

---

## Manual Verification Steps

Open `index.html` in a browser (Chrome, Firefox, or Edge) and verify each point:

### Game loop / canvas (from the previous card)

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

### Input module (`input.js`)

11. **`initInput` / `isKeyHeld` exports** — in DevTools console:
    ```js
    import('./input.js').then(m => console.log(typeof m.initInput, typeof m.isKeyHeld));
    ```
    Must print `function function`.
12. **Held-key detection** — in DevTools console:
    ```js
    import('./input.js').then(({ initInput, isKeyHeld }) => {
      initInput();
      window._isKeyHeld = isKeyHeld;
    });
    ```
    Then hold **ArrowLeft** and run `_isKeyHeld('ArrowLeft')` — must return `true`. Release the key and run again — must return `false`.

### Player ship (`player.js`)

13. **Ship appears** — wire the player into the game loop temporarily via the console:
    ```js
    import('./input.js').then(({ initInput }) => initInput());
    import('./player.js').then(({ Player }) => { window._p = new Player(); });
    ```
    Open the Playing scene (press Enter on Title). In the console, call `_p.draw(document.getElementById('gameCanvas').getContext('2d'))` — a green spaceship shape must appear on the canvas.
14. **Movement** — after step 13, hold **ArrowLeft** or **A**: the ship must drift left. Hold **ArrowRight** or **D**: the ship must drift right. Release the key: the ship stops.
15. **Clamping** — hold a direction key until the ship reaches the edge; it must stop exactly at the canvas boundary and never go beyond.
16. **Firing** — press **Space**: a yellow bullet must appear above the ship and travel upward.
17. **Single-bullet lock** — hold **Space** while a bullet is in flight; no second bullet must appear.
18. **Bullet recycling** — let the bullet travel off the top of the canvas; pressing **Space** again must fire a new bullet.
19. **`lives` initialisation** — in the console: `_p.lives` must equal `3`.
20. **Procedural drawing only** — inspect `player.js` source; it must contain `arc` and `fillRect` calls and no `drawImage` / `new Image` / `src` references.
