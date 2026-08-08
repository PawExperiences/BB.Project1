# Space Invaders — BB.Project1

A browser-native Space Invaders game built with hand-written HTML, CSS, and ES modules.  
No framework, no bundler, no npm. Open `index.html` directly from the filesystem.

---

## File Layout

### Files owned by the Game loop card

| File | Description |
|------|-------------|
| `index.html` | Page shell, `<canvas>` element (800 × 600), loads `game.js` as a module |
| `game.js` | Fixed-timestep game loop, scene state machine, HUD, `hudState` export |
| `gameConfig.js` | Shared named constants (canvas size, speeds, lives) |
| `README.md` | Project documentation (this file) |

### Files owned by the Keyboard input and player ship card

| File | Description |
|------|-------------|
| `input.js` | `initInput()`, `isKeyHeld(key)` — keyboard state tracker |
| `player.js` | `Player` class — movement, shooting, drawing |

### Files owned by the Sprite rendering and collision detection card

| File | Description |
|------|-------------|
| `invaders.js` | Invader grid, movement, explosion effects |
| `collision.js` | `rectsOverlap`, bullet-vs-invader, invader-bullet-vs-player |

### Files owned by Level cards

| File | Owning card |
|------|-------------|
| `level1.js` | Level 1: the classic grid |
| `level2.js` | Level 2 |
| `level3.js` | Level 3 |
| `boss.js` | Boss encounter |

---

## Running the Game

1. Clone or download the repository so all files are in the same folder.
2. Open `index.html` in a modern browser using a `file://` URL  
   (e.g. drag the file into the browser, or `File → Open File…`).
3. No web server, no `npm install`, no build step is required.

---

## Manual Verification

Follow these steps to confirm every acceptance criterion after checkout.

### Prerequisites
- A modern desktop browser (Chrome 90+, Firefox 88+, or Edge 90+).
- All files in the same directory.

---

### 1. Open from `file://`

1. Double-click `index.html`, drag it into a browser tab, or use `File → Open File…`.
2. Confirm the address bar shows a `file://…/index.html` URL.
3. **Expected:** A black page with a centred black canvas (800 × 600).

---

### 2. Title scene

1. **Expected:**
   - Green text `SPACE INVADERS` centred horizontally and vertically.
   - White text `Press ENTER to start` below it.
   - Grey text `HI-SCORE: 0` below that.

---

### 3. Title → Playing transition

1. Press **Enter**.
2. **Expected:** Canvas clears to black, HUD shows `SCORE: 0` (top-left), `LIVES: 3` (top-right),
   and `LEVEL: 1` (top-centre).

---

### 4. Invader formation visible (AC: 11 × 5 grid)

1. After pressing Enter to start, confirm a grid of green rectangles is visible on the canvas.
2. Count: 11 columns × 5 rows = 55 invaders total.
3. **Expected:** All 55 green rectangles (`ctx.fillRect` only; no images) are displayed.

---

### 5. Formation movement and edge-detect-and-drop (AC: movement + reversal)

1. Watch the formation move sideways as a unit.
2. When it reaches the right edge: **Expected** — the entire formation drops one step down and
   reverses direction (moves left).
3. When it reaches the left edge: **Expected** — drops again and moves right.
4. Verify no individual invader moves independently.

---

### 6. Level 1 — march speed scales with alive count

1. Press Enter to start.
2. **Expected at start (55 invaders):** The formation takes approximately 800 ms per horizontal step.
3. Kill invaders by shooting them until only a handful remain.
4. **Expected near the end (≈1 invader):** The step interval approaches 100 ms — the formation
   moves noticeably faster.
5. To verify the formula: open DevTools Console while playing and observe the log output
   `[level1] aliveCount=N interval=Xms` printed at each step.

---

### 7. Kill → immediate interval recalculation

1. With a slow-moving formation (many invaders), shoot one invader.
2. **Expected:** The next march step fires after the new (slightly shorter) interval,
   not after the old interval that was already pending.
3. DevTools Console will show the updated `interval=` immediately after the kill.

---

### 8. Breach condition — life lost + formation resets

1. Let the formation descend until the bottom row reaches the player's row
   (or speed up by killing most invaders so the breach happens faster).
2. **Expected:**
   - `LIVES:` counter in the HUD decrements by 1.
   - The invader formation resets to its starting position and the march restarts
     at full speed (800 ms interval, 55 invaders).
   - The HUD still shows `LEVEL: 1`.
3. When lives reach 0, the game transitions to the GAME OVER screen — the game loop
   handles this, not `level1.js`.

---

### 9. Level clear — CustomEvent dispatched

1. Kill all 55 invaders.
2. **Expected:** `window` fires a `CustomEvent('levelComplete', { detail: { nextLevel: 2 } })`.
3. In DevTools Console, confirm the log: `levelComplete received, nextLevel: 2`.
4. The game returns to the title screen (Level 2 is not yet implemented; the game loop
   handles the fallback).

---

### 10. HUD shows LEVEL: 1 throughout play

1. Press Enter to start.
2. **Expected:** `LEVEL: 1` appears at the top-centre of the canvas immediately.
3. After a breach and formation reset, **Expected:** `LEVEL: 1` is still displayed.

---

### 11. Bullet kills invader on overlap (AC: collision)

1. Move the player under an invader in the bottom row.
2. Press **Space** to fire.
3. **Expected:** The invader disappears (alive = false) on the same frame the bullet bounding
   box overlaps the invader bounding box. The bullet is also consumed (does not continue upward).

---

### 12. Explosion effect (AC: explosion visible for EXPLOSION_FRAMES)

1. Kill an invader (step 11 above).
2. **Expected:** A coloured cross/spark shape appears at the killed invader's position for
   approximately 20 frames (~0.33 seconds at 60 fps), then disappears.

---

### 13. Score increments (AC: score display)

1. Kill an invader.
2. **Expected:** The `SCORE:` counter in the top-left HUD (drawn via `ctx.fillText`) increments
   by 10 (the `SCORE_PER_KILL` constant).
3. Kill additional invaders; score should increase by 10 per kill.

---

### 14. Collision pass order (AC: collide → update → draw)

1. Open `game.js` in a text editor.
2. Confirm that within the `gameLoop` function, `runCollisions()` is called before `update()`
   and both are called before `render()`.
3. Confirm that `drawInvaders` contains no state mutations (no `alive = false` assignments).

---

### 15. `rectsOverlap` is a pure function (AC: pure function)

1. Open DevTools → Console.
2. Run:
   ```js
   import('./collision.js').then(({ rectsOverlap }) => {
     console.log(rectsOverlap({x:0,y:0,w:10,h:10}, {x:5,y:5,w:10,h:10}));  // true
     console.log(rectsOverlap({x:0,y:0,w:10,h:10}, {x:20,y:20,w:10,h:10})); // false
   });
   ```
3. **Expected output:** `true` then `false`.

---

### 16. `checkInvaderBulletsVsPlayer` with empty array (AC: no throw)

1. In DevTools → Console:
   ```js
   import('./collision.js').then(({ checkInvaderBulletsVsPlayer }) => {
     checkInvaderBulletsVsPlayer([], { x: 375, y: 540, width: 50, height: 40 }, () => {});
     console.log('no throw — ok');
   });
   ```
2. **Expected output:** `no throw — ok` with no errors.

---

### 17. Named constants (AC: no magic numbers)

1. Open `invaders.js` — confirm `INVADER_SPEED`, `EXPLOSION_FRAMES`, `INVADER_DROP` are declared
   as `const` at the top.
2. Open `game.js` — confirm `SCORE_PER_KILL` is declared as `const`.
3. Open `collision.js` — confirm bullet/invader dimensions are referenced via local `const` variables.
4. Open `level1.js` — confirm `TOTAL_INVADERS`, `INTERVAL_MAX_MS`, `INTERVAL_MIN_MS` are declared
   as `const` at the top.

---

### 18. ES modules + file:// compatibility (AC: no bundler)

1. Reload `index.html` from `file://` with network disconnected.
2. **Expected:** Page loads, title screen displays, no console errors about module loading.
3. Confirm `level1.js` uses `export` / `import` — no `require()` or `module.exports`.

---

### Legacy checks (Game loop card + Keyboard input card ACs — still valid)

#### Verify `gameConfig.js` exports

1. Open DevTools → Console and run:
   ```js
   import('./gameConfig.js').then(m => console.log(
     m.CANVAS_WIDTH, m.CANVAS_HEIGHT, m.PLAYER_SPEED, m.BULLET_SPEED, m.INITIAL_LIVES
   ));
   ```
2. **Expected output:** `800 600 200 500 3`

#### Verify `input.js` — key hold and release

1. Run:
   ```js
   import('./input.js').then(({ initInput, isKeyHeld }) => {
     initInput();
     window._isKeyHeld = isKeyHeld;
   });
   ```
2. Hold **ArrowLeft** → `_isKeyHeld('ArrowLeft')` → `true`.
3. Release → `_isKeyHeld('ArrowLeft')` → `false`.

#### Player spawn and movement

1. Pressing Enter to start should show the green player ship near the bottom-centre of the canvas.
2. **ArrowLeft** / **ArrowRight** (or **a** / **d**) move the ship; it clamps at canvas edges.
3. **Space** fires a bullet (yellow rectangle) that travels upward; only one bullet in flight at a time.

---

*All checks above should pass on the `develop` branch before this card is moved to Done.*
