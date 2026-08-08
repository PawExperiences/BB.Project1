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

### Files owned by later cards

| File | Owning card |
|------|-------------|
| `invaders.js` | Invader grid and movement |
| `collision.js` | Collision detection |
| `level1.js` | Level 1 |
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
- All files (`index.html`, `game.js`, `gameConfig.js`, `input.js`, `player.js`, `README.md`) in the same directory.

---

### 1. Open from `file://`

1. In your file manager, double-click `index.html`, **or** drag it into a browser tab,  
   **or** use the browser menu `File → Open File…`.
2. Confirm the address bar shows a `file://…/index.html` URL.
3. **Expected:** A black page with a centred black canvas (800 × 600).

---

### 2. Title scene

1. The canvas should immediately display the Title scene.
2. **Expected:**
   - Green text `SPACE INVADERS` centred horizontally and vertically.
   - White text `Press ENTER to start` below it.
   - Grey text `HI-SCORE: 0` below that.

---

### 3. Title → Playing transition

1. Press **Enter**.
2. **Expected:** Canvas clears to black, HUD shows `SCORE: 0` (top-left) and `LIVES: 3` (top-right). No page reload.

---

### 4. Verify `gameConfig.js` exports (AC: gameConfig constants)

1. On any page, open DevTools → Console.
2. Run:
   ```js
   import('./gameConfig.js').then(m => console.log(
     m.CANVAS_WIDTH, m.CANVAS_HEIGHT, m.PLAYER_SPEED, m.BULLET_SPEED, m.INITIAL_LIVES
   ));
   ```
3. **Expected output:** `800 600 200 500 3`

---

### 5. Verify `input.js` — key hold and release (AC: isKeyHeld)

1. Open DevTools → Console.
2. Run:
   ```js
   import('./input.js').then(({ initInput, isKeyHeld }) => {
     initInput();
     window._isKeyHeld = isKeyHeld;
   });
   ```
3. Click on the page so it has focus.
4. Hold down **ArrowLeft**. In the console run `_isKeyHeld('ArrowLeft')`.  
   **Expected:** `true`
5. Release **ArrowLeft**. Run `_isKeyHeld('ArrowLeft')` again.  
   **Expected:** `false`

---

### 6. Verify key-repeat suppression (AC: event.repeat guard)

1. Open `input.js` in a text editor.
2. Confirm that the `keydown` listener contains `if (event.repeat) return;`.
3. (Optionally) hold a key for 2+ seconds; run `_isKeyHeld(key)` repeatedly in the console — value stays `true` but never flickers to `false` and back.

---

### 7. Instantiate Player and test movement (AC: PLAYER_SPEED, clamping)

1. In DevTools console (Playing scene active), run:
   ```js
   import('./input.js').then(({ initInput }) => initInput());
   import('./player.js').then(({ Player }) => {
     const p = new Player();
     window._p = p;
     console.log('initial x:', p.x, 'lives:', p.lives);
   });
   ```
2. **Expected:** `initial x: 375` (i.e. `(800 - 50) / 2`), `lives: 3`.
3. Call `_p.update(1)` (1 second of ArrowLeft held via `_isKeyHeld` mock or actual input).  
   With no keys held: `_p.update(0.1)` → x should be unchanged.  
   Programmatically verify: after `_p.x = 0; _p.update(0.1)` with ArrowLeft held, x clamps to 0.
4. Verify right-edge clamp: `_p.x = 760; _p.update(0.1)` with ArrowRight held → x clamps to `750` (`800 - 50`).

---

### 8. Single-bullet rule (AC: one bullet at a time)

1. In DevTools console with a `Player` instance (`_p`):
   ```js
   // Simulate Space held: patch isKeyHeld temporarily or use keyboard
   ```
2. Press **Space** once (no bullet in flight) → `_p.bullet` should be an object `{ x, y }`.
3. Call `_p.update(0.016)` while Space is held → `_p.bullet` is still exactly **one** object (not replaced or doubled).
4. Keep updating until `_p.bullet` becomes `null` (bullet exits top) → press Space again → new bullet created.

---

### 9. Bullet travel and expiry (AC: BULLET_SPEED, bullet=null at y=0)

1. With `_p.bullet` in flight, note its `y` value.
2. Call `_p.update(0.1)` → bullet.y should decrease by `500 * 0.1 = 50` px.
3. Set `_p.bullet.y = -11` then call `_p.update(0)` → `_p.bullet` should be `null`  
   (top edge `y + 12 <= 0`).

---

### 10. Ship drawn procedurally within 50 × 40 px (AC: procedural draw, bounding box)

1. With a `Player` instance, open DevTools and inspect `player.js`.  
2. Confirm there are no `Image`, `drawImage`, or `src` references — only `ctx.fillRect`,  
   `ctx.arc`, `ctx.beginPath`, `ctx.fill` etc.
3. Run `_p.draw(ctx)` (pass in the canvas context).  
   **Expected:** A green spaceship shape appears near the bottom of the canvas, within a ~50 × 40 px bounding box.

---

### 11. Bullet drawn as small filled rectangle (AC: bullet draw)

1. While `_p.bullet !== null`, call `_p.draw(ctx)`.
2. **Expected:** A small yellow rectangle (~4 × 12 px) appears centred on the ship's x, above the ship.

---

### 12. ES module syntax + file:// compatibility (AC: ES modules, no bundler)

1. Check that `input.js` and `player.js` each use `export` / `import` at the top level.
2. Confirm no `require()`, `module.exports`, or CommonJS patterns.
3. Reload `index.html` from `file://` with network disconnected.  
   **Expected:** Page loads, title screen displays, no console errors about module loading.

---

### Legacy checks (Game loop card ACs — still valid)

See steps 1–12 of the original README for the full Game loop verification checklist (fixed-timestep loop, HUD, scene transitions, hi-score, etc.). All those checks continue to apply unchanged.

---

*All checks above should pass on the `develop` branch before this card is moved to Done.*
