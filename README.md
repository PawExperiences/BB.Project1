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
| `level1.js` | ✅ Created | Level 1 wave definition |
| `level2.js` | ⏳ Deferred | Level 2 wave definition |
| `level3.js` | ⏳ Deferred | Level 3 wave definition |
| `boss.js` | ⏳ Deferred | Boss enemy |

---

## Architecture Overview

- **`gameConfig.js`** — Single source of truth for shared constants
  (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`,
  `STARTING_LIVES`). All other modules import from here.
- **`game.js`** — Entry point. Owns the `requestAnimationFrame` loop
  (fixed 1/60 s timestep, 250 ms delta cap), the four-scene state machine
  (`title` / `playing` / `levelcomplete` / `gameover`), canvas HUD rendering,
  and the exported `hudState` object. Wires Level-1 callbacks.
- **`index.html`** — Minimal host page. Loads `game.js` as
  `type="module"` and centres the 768 × 896 canvas on a dark background.
- **`input.js`** — Keyboard state module. `initInput()` attaches
  `keydown`/`keyup` listeners; `isKeyHeld(code)` queries current hold state.
  Key-repeat events are ignored via `event.repeat`.
- **`player.js`** — `Player` class. Reads input via `isKeyHeld`, moves the
  ship with delta-time scaling, clamps to canvas bounds, and manages a
  single-bullet firing mechanic. Draws procedurally (arcs + rectangles).
- **`invaders.js`** — Formation state and rendering. Exports `initInvaders()`,
  `stepInvaders(stepPx)` (discrete-step model for level1), `getAliveCount()`,
  `getFormationBottom()`, `updateInvaders(dt)` (legacy continuous model),
  `drawInvaders(ctx)`, and constants including `INVADER_DROP`/`INVADER_CELL_HEIGHT`.
- **`collision.js`** — `rectsOverlap(a, b)` pure AABB helper (exported);
  `runCollisionPass(player)` checks player bullet vs invaders, marks kills,
  deactivates bullets, spawns explosions, increments score. Exports
  `SCORE_PER_KILL = 10`.
- **`explosion.js`** — Explosion particle list. `spawnExplosion()`,
  `updateExplosions()`, `drawExplosions(ctx)`. Flashes yellow for 10 frames.
- **`level1.js`** — Level 1 wave definition. Classic 11×5 invader formation
  with step-based marching (interval scales linearly from ~800 ms at 55 alive
  down to ~113 ms at 1 alive), edge-drop by exactly one cell height (24 px),
  life-breach callback, and level-complete callback. Exports `LEVEL_NUMBER = 1`
  for the HUD, plus `initLevel1()` and `updateLevel1()`.

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
   HUD visible at the bottom (SCORE 0, LEVEL 1, BEST 0, LIVES 3). An 11×5
   grid of lime-green (#00FF00) rectangles appears in the upper portion of
   the canvas, centred horizontally.

### 3 — Invader formation visible
1. While in the Playing scene, observe the upper portion of the canvas.
2. **Expected:** 55 lime-green filled rectangles arranged in 11 columns
   and 5 rows. Each invader is 24×16 px with 12 px horizontal gaps and
   8 px vertical gaps between cells. The entire formation is centred.

### 4 — Formation marches in discrete steps
1. Watch the formation over several seconds.
2. **Expected:** All invaders move together as a unit in discrete lateral
   steps (8 px per step). With all 55 alive the step interval is ~800 ms;
   the movement is slow and rhythmic.

### 5 — Speed increases as invaders die
1. Destroy several invaders and observe the formation speed.
2. **Expected:** Each kill increases the step frequency. With roughly half
   the invaders (~28) remaining the interval is ~450 ms (noticeably faster).
   With one invader left the interval is ~113 ms (rapid darting).

### 6 — Edge detection and row drop
1. Watch the formation reach either canvas edge.
2. **Expected:** When the rightmost surviving invader's right edge reaches
   the canvas right edge (768 px), or the leftmost surviving invader's left
   edge reaches 0, the entire formation drops exactly 24 px downward and
   reverses horizontal direction.

### 7 — Shrinking bounding box
1. Fire at and destroy invaders on one side of the formation.
2. **Expected:** The formation turns around sooner (because edge detection
   uses the surviving invaders' bounding box, not the original full-grid width).

### 8 — HUD shows Level 1
1. While in the Playing scene, inspect the bottom strip of the canvas.
2. **Expected:** Four labels are drawn on the canvas:
   - `SCORE 0` (left, updates on kills)
   - `LEVEL 1` (left-of-centre, constant while Level 1 is active)
   - `BEST 0` (centre)
   - `LIVES 3` (right)
   A thin horizontal separator line appears above the labels.

### 9 — Shooting an invader
1. Line up the player ship under an invader and press **Space**.
2. **Expected:**
   - The bullet travels upward and hits the invader.
   - The invader disappears (is no longer drawn).
   - A brief yellow flash appears at the invader's former position for
     approximately 8–12 frames, then vanishes.
   - The SCORE in the HUD increases by 10.

### 10 — Bullet deactivation on hit
1. Fire a bullet and observe a kill.
2. **Expected:** After the kill, the bullet disappears immediately. The
   player can fire a new bullet right away.

### 11 — No re-processing on same frame
1. Fire multiple bullets rapidly (note: single-bullet mechanic).
2. **Expected:** Each bullet destroys at most one invader.

### 12 — Score increments correctly
1. Destroy several invaders.
2. **Expected:** Each kill increases SCORE by exactly 10.

### 13 — Destroyed invaders excluded from future collisions
1. Shoot through a gap where an invader used to be.
2. **Expected:** The bullet passes through the gap and may hit the invader
   behind it — the destroyed invader does not intercept bullets.

### 14 — Formation reaches player — life lost
1. Let the formation descend until its bottom edge reaches the player ship.
2. **Expected:** One life is lost (LIVES decrements by 1). The formation
   resets to a fresh 11×5 grid at full speed (800 ms interval). The game
   continues with the remaining lives.

### 15 — Game Over when lives exhausted
1. Allow the formation to reach the player three times (starting with 3 lives).
2. **Expected:** After the third breach the scene switches to Game Over —
   `GAME OVER` (red), `Score: <current>` (white), and
   `Press ENTER to restart` (white).

### 16 — All invaders cleared — Level Complete
1. Destroy all 55 invaders.
2. **Expected:** The scene transitions to `LEVEL COMPLETE!` (green) with
   the current score and `Press ENTER to continue`. Pressing ENTER returns
   to the Title screen. (Level 2 is a future card.)

### 17 — Game Over transition
1. Open the browser DevTools console (`F12`).
2. Run: `import('./game.js').then(m => { m.triggerGameOver(); })`
3. **Expected:** The scene switches to Game Over.

### 18 — Game Over → Title transition
1. While on the Game Over screen, press **Enter**.
2. **Expected:** Returns to the Title screen.

### 19 — No console errors
1. Open DevTools → Console.
2. Hard-reload the page with **Ctrl+Shift+R**.
3. **Expected:** Zero red error messages.

### 20 — Scope note: HUD / Score display gap
The score integer is incremented by `collision.js` (SCORE_PER_KILL = 10)
and displayed by the HUD renderer in `game.js`. No separate HUD card is needed.

### 21 — Scope note: Invader shooting
Invader bullets are out of scope for this card (Level 2 card). The
`rectsOverlap(a, b)` helper in `collision.js` is reusable for future cards.
