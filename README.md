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
| `level2.js` | Level 2: they shoot back |
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
3. **Expected:** All 55 green rectangles are displayed.

---

### 5. Formation movement and edge-detect-and-drop

1. Watch the formation move sideways as a unit.
2. When it reaches the right edge: **Expected** — the entire formation drops one step down and
   reverses direction (moves left).
3. When it reaches the left edge: **Expected** — drops again and moves right.

---

### 6. Level 1 — march speed scales with alive count

1. Press Enter to start.
2. **Expected at start (55 invaders):** The formation takes approximately 800 ms per horizontal step.
3. Kill invaders until only a handful remain.
4. **Expected near the end (≈1 invader):** The step interval approaches 100 ms.
5. DevTools Console logs: `[level1] aliveCount=N interval=Xms` at each step.

---

### 7. Kill → immediate interval recalculation

1. With a slow-moving formation (many invaders), shoot one invader.
2. **Expected:** The next march step fires after the new (slightly shorter) interval.
3. DevTools Console will show the updated `interval=` immediately after the kill.

---

### 8. Level 1 breach condition — life lost + formation resets

1. Let the formation descend until the bottom row reaches the player's row.
2. **Expected:**
   - `LIVES:` counter decrements by 1.
   - The invader formation resets to its starting position.
   - The HUD still shows `LEVEL: 1`.
3. When lives reach 0, the game transitions to the GAME OVER screen.

---

### 9. Level 1 clear — advances to Level 2

1. Kill all 55 invaders in Level 1.
2. **Expected:** `levelComplete` event fires with `nextLevel: 2`, Level 2 loads automatically
   with HUD showing `LEVEL: 2`. No level-select screen appears.
3. Player's lives from Level 1 are **preserved** (no reset).

---

### 10. Level 2 — grid visible

1. After Level 1 clears, confirm a fresh 11 × 5 grid of green rectangles appears.
2. **Expected:** 55 invaders, same layout as Level 1.

---

### 11. Level 2 — faster formation

1. In Level 2 observe the formation speed.
2. **Expected:** Formation moves noticeably faster than Level 1 at the same invader count.
3. DevTools Console logs: `[level2] aliveCount=N interval=Xms`.
4. Verify each logged interval is approximately 0.67× the corresponding Level 1 value.

---

### 12. Level 2 — enemy fire

1. Stand still in Level 2.
2. **Expected:** Red enemy bullets appear from the bottom of invader columns every 800–2000 ms.
3. Each bullet travels downward at approximately 300 px/s.
4. Multiple bullets may be in flight simultaneously.

---

### 13. Level 2 — enemy bullet hits player

1. Let an enemy bullet reach the player ship.
2. **Expected:**
   - `LIVES:` decrements by 1.
   - Player ship immediately reappears at bottom-centre.
   - Ship flashes (alternates visible/invisible) for 2 seconds.
   - A second bullet hitting the ship during those 2 seconds does **not** cost another life.
3. After 2 seconds the ship stops flashing and is vulnerable again.

---

### 14. Level 2 — UFO

1. Wait 20 seconds after Level 2 loads.
2. **Expected:** A red UFO sprite enters from the left side and crosses the screen horizontally
   near the top.
3. Wait another 20 seconds — **Expected:** UFO enters from the right side.
4. UFO crossing speed is approximately 120 px/s.

---

### 15. Level 2 — UFO score tiers

1. Fire shots to reach a known `session_shot_count` value (fire N−1 shots into empty space
   first, then shoot the UFO as the Nth shot).
2. **Expected scores:**
   - If `session_shot_count mod 4 == 0` when UFO is hit → **50 pts**
   - `== 1` → **100 pts**
   - `== 2` → **150 pts**
   - `== 3` → **300 pts**
3. DevTools: `sessionShotCount` increments on each Space keypress.

---

### 16. Level 2 — session_shot_count persists from Level 1

1. Fire several shots during Level 1 (note the count).
2. Clear Level 1 to advance to Level 2.
3. **Expected:** `session_shot_count` continues from where Level 1 left off (not reset to 0).

---

### 17. Level 2 clear — advances toward Level 3

1. Kill all 55 invaders in Level 2.
2. **Expected:** `levelComplete` event fires with `nextLevel: 3`.
3. (Level 3 not yet implemented — game returns to title screen as fallback.)

---

### 18. Game Over when lives reach 0

1. Let lives drain to 0 (by enemy bullets or breach).
2. **Expected:** Game transitions to GAME OVER scene.
3. Press **ENTER** on GAME OVER screen.
4. **Expected:** Returns to Title scene.

---

### 19. HUD shows LEVEL: 2 throughout Level 2

1. In Level 2, **Expected:** `LEVEL: 2` appears at top-centre.
2. After a breach and formation reset (in Level 2), **Expected:** `LEVEL: 2` is still displayed.

---

### 20. Level 1 legacy checks (still valid)

#### Level clear — CustomEvent dispatched

1. Kill all 55 invaders.
2. **Expected:** `window` fires `CustomEvent('levelComplete', { detail: { nextLevel: 2 } })`.
3. In DevTools Console, confirm the log: `levelComplete received, nextLevel: 2`.

#### HUD shows LEVEL: 1 throughout Level 1

1. Press Enter to start.
2. **Expected:** `LEVEL: 1` appears at the top-centre of the canvas immediately.

#### Bullet kills invader on overlap

1. Move the player under an invader in the bottom row.
2. Press **Space** to fire.
3. **Expected:** The invader disappears on the same frame the bullet bounding box overlaps.

#### Explosion effect

1. Kill an invader.
2. **Expected:** A coloured cross/spark shape appears for approximately 20 frames, then disappears.

#### Score increments

1. Kill an invader.
2. **Expected:** `SCORE:` counter increments by 10.

---

### 21. ES modules + file:// compatibility

1. Reload `index.html` from `file://` with network disconnected.
2. **Expected:** Page loads, title screen displays, no console errors about module loading.
3. Confirm `level2.js` uses `export` / `import` — no `require()` or `module.exports`.

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

*All checks above should pass on the `develop` branch before the Level 2 card is moved to Done.*
