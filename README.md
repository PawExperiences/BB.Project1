# e2e Space Invaders

A browser-based Space Invaders clone built with hand-written HTML and ES modules.
**No build step, no bundler, no npm.** Open `index.html` directly from the
filesystem (`file://` URL) and the game starts.

---

## File Layout

| File | Responsibility |
|---|---|
| `index.html` | Entry point. Hosts the `<canvas id="gameCanvas">` (768 × 896 px) and loads `game.js` as an ES module. |
| `gameConfig.js` | Shared constants: canvas size, speeds, starting lives. Import from any module that needs them. |
| `game.js` | Main entry module. Owns the fixed-timestep game loop, the scene state machine (title → playing → gameover), and the exported `hudState`. |
| `input.js` | Keyboard input scaffold. Tracks held keys (`isKeyDown`) and single-frame edge triggers (`isKeyJustPressed`). Full implementation added by the sibling card. |
| `player.js` | Player state and update/render stubs. Full implementation added by the sibling card. |
| `invaders.js` | Invader grid state and update/render stubs. Full implementation added by the sibling card. |
| `collision.js` | AABB collision detection stubs. Full implementation added by the sibling card. |
| `README.md` | This file. |

---

## Running the Game

1. Clone or download the repository so all files sit in the same folder.
2. Open `index.html` in Chrome, Firefox, or Edge — either double-click it or
   use **File → Open File** in the browser.
3. The address bar will show a `file:///…/index.html` URL. No server is needed.

> **Note:** Because the project uses ES modules (`type="module"`), Chrome may
> block same-origin module imports from `file://` depending on your OS security
> settings. If you see a CORS error, start a trivial local server just for
> development (e.g. `python3 -m http.server 8080`) and open
> `http://localhost:8080`. The production intent is still `file://`.

---

## Manual Verification Steps

Work through these checks in order after opening `index.html`.

### 1. Canvas and styling
- [ ] A black page appears with a centred 768 × 896 canvas.
- [ ] No scrollbars are visible on a typical 1080 p desktop viewport.
- [ ] The browser console shows **no errors**.

### 2. Title scene
- [ ] The canvas shows **"SPACE INVADERS"** in large, centred text.
- [ ] Below it, **"Press ENTER to start"** is visible in smaller text.

### 3. Title → Playing transition
- [ ] Press **ENTER**. The display switches to the Playing scene immediately
  (no page reload — the URL does not change, and `performance.now()` keeps
  counting from its previous value).
- [ ] The HUD shows **"SCORE: 0"** at the top-left and **"LIVES: 3"** at the
  top-right.
- [ ] A placeholder `[ game area ]` label is visible in the centre of the canvas.

### 4. Game-over transition (programmatic trigger)
Open the browser **DevTools console** and run:
```js
import('./game.js').then(m => m.setGameOver());
```
- [ ] The canvas switches to the Game Over scene within one frame.
- [ ] **"GAME OVER"** appears in large red text, centred.
- [ ] The current score value is displayed below it.
- [ ] **"Press ENTER to restart"** appears below the score.

### 5. Game Over → Title transition
- [ ] Press **ENTER** while on the Game Over scene.
- [ ] The Title scene reappears (no page reload).

### 6. Delta cap / no catch-up burst
- [ ] Switch to a different tab for 5 seconds, then return.
- [ ] The game resumes smoothly with **no visible stutter or burst** of
  accelerated updates. (The 250 ms delta cap prevents accumulated frames from
  being replayed all at once.)

### 7. `gameConfig.js` named exports
In the DevTools console:
```js
import('./gameConfig.js').then(m => console.log(m));
```
Expected output:
```
{ CANVAS_WIDTH: 768, CANVAS_HEIGHT: 896, PLAYER_SPEED: 200, BULLET_SPEED: 500, STARTING_LIVES: 3 }
```

### 8. `hudState` named export
```js
import('./game.js').then(m => console.log(m.hudState));
```
Expected output includes `{ score: 0, lives: 3, hiScore: 0 }` (values may differ
if you have already played a round).

### 9. Stub modules
Confirm each stub file has at least one named export:
```js
import('./input.js').then(console.log);
import('./player.js').then(console.log);
import('./invaders.js').then(console.log);
import('./collision.js').then(console.log);
```
Each should print an object with at least one key.

---

## Architecture Notes

- **Fixed timestep**: `update(dt)` is called with `dt = 1/60` s. The game loop
  accumulates real elapsed time and drains it in fixed steps. Raw frame deltas
  are clamped to 250 ms before accumulation.
- **Render isolation**: `render(ctx)` reads state only; it never writes to
  `hudState` or any other game-state variable.
- **Scene machine**: three scenes (`title`, `playing`, `gameover`). ENTER drives
  transitions; `location.reload()` is never called.
- **HUD**: drawn directly on the canvas — no DOM overlays.
- **hiScore**: persists for the lifetime of the page session only (no
  `localStorage` — out of scope for this card).
