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
| `invaders.js` | ✅ Created | Sprite rendering and collision detection |
| `collision.js` | ✅ Created | Sprite rendering and collision detection |
| `explosion.js` | ✅ Created | Sprite rendering and collision detection |
| `level1.js` | ⏳ Deferred | Level 1 wave definition |
| `level2.js` | ⏳ Deferred | Level 2 wave definition |
| `level3.js` | ⏳ Deferred | Level 3 wave definition |
| `boss.js` | ⏳ Deferred | Boss enemy |

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
- **`invaders.js`** — Formation state, movement logic (`updateInvaders(dt)`),
  and rendering (`drawInvaders(ctx)`). Exports `INVADER_SPEED` as the named
  speed constant. Edge detection uses surviving-invader bounding box only.
- **`collision.js`** — `rectsOverlap(a, b)` pure AABB helper (exported);
  `runCollisionPass(player)` checks player bullet vs invaders, marks kills,
  deactivates bullets, spawns explosions, increments score. Exports
  `SCORE_PER_KILL = 10`.
- **`explosion.js`** — Explosion particle list. `spawnExplosion()`,
  `updateExplosions()`, `drawExplosions(ctx)`. Flashes yellow for 10 frames.

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
   HUD visible at the bottom (Score 0, BEST 0, LIVES 3). An 11×5 grid of
   lime-green (#00FF00) rectangles appears in the upper portion of the
   canvas, centred horizontally.

### 3 — Invader formation visible
1. While in the Playing scene, observe the upper portion of the canvas.
2. **Expected:** 55 lime-green filled rectangles arranged in 11 columns
   and 5 rows. Each invader is 24×16 px with 12 px horizontal gaps and
   8 px vertical gaps between cells. The entire formation is centred.

### 4 — Formation moves horizontally
1. Watch the formation over several seconds.
2. **Expected:** All invaders move together as a unit, sliding left or right
   at a steady speed. No invader moves independently.

### 5 — Edge detection and row drop
1. Watch the formation reach either canvas edge.
2. **Expected:** When the rightmost surviving invader's right edge reaches
   the canvas right edge (768 px), or the leftmost surviving invader's left
   edge reaches 0, the entire formation drops exactly 24 px downward and
   reverses horizontal direction.

### 6 — Shrinking bounding box
1. Fire at and destroy invaders on one side of the formation.
2. **Expected:** The formation turns around sooner (because edge detection
   uses the surviving invaders' bounding box, not the original full-grid width).

### 7 — Shooting an invader
1. Line up the player ship under an invader and press **Space**.
2. **Expected:**
   - The bullet travels upward and hits the invader.
   - The invader disappears (is no longer drawn).
   - A brief yellow flash appears at the invader's former position for
     approximately 8–12 frames, then vanishes.
   - The SCORE in the HUD increases by 10.

### 8 — Bullet deactivation on hit
1. Fire a bullet and observe a kill.
2. **Expected:** After the kill, the bullet disappears immediately (it is
   deactivated). The player can fire a new bullet right away.

### 9 — No re-processing on same frame
1. Fire multiple bullets rapidly (note: single-bullet mechanic means only
   one is active at a time).
2. **Expected:** Each bullet destroys at most one invader. No invader is
   destroyed more than once.

### 10 — Score increments correctly
1. Destroy several invaders.
2. **Expected:** Each kill increases SCORE by exactly 10. After 3 kills,
   score reads 30, etc.

### 11 — Destroyed invaders excluded from future collisions
1. Shoot through a gap where an invader used to be.
2. **Expected:** The bullet passes through the gap and may hit the invader
   behind it — the destroyed invader does not block or intercept bullets.

### 12 — HUD content
1. While in the Playing scene, inspect the bottom strip of the canvas.
2. **Expected:** Three labels are drawn directly on the canvas:
   - `SCORE 0` (left, updates on kills)
   - `BEST 0` (centre)
   - `LIVES 3` (right)
   A thin horizontal separator line appears above the labels.

### 13 — Game Over transition
1. Open the browser DevTools console (`F12`).
2. Run: `import('./game.js').then(m => { m.triggerGameOver(); })`
3. **Expected:** The scene switches to Game Over — `GAME OVER` (red),
   `Score: <current>` (white), and `Press ENTER to restart` (white).

### 14 — Game Over → Title transition
1. While on the Game Over screen, press **Enter**.
2. **Expected:** Returns to the Title screen.

### 15 — No console errors
1. Open DevTools → Console.
2. Hard-reload the page with **Ctrl+Shift+R**.
3. **Expected:** Zero red error messages.

### 16 — Scope note: HUD / Score display gap
The score integer is incremented by `collision.js` (SCORE_PER_KILL = 10)
and displayed by the existing HUD renderer in `game.js`. No separate HUD
card is needed; this card closes the gap.

### 17 — Scope note: Invader shooting
Invader bullets are out of scope for this card (Level 2 card). The
`rectsOverlap(a, b)` helper in `collision.js` is designed to be reusable:
it accepts any two `{x, y, width, height}` objects and is exported for
use by the Level 2 card without modification.
