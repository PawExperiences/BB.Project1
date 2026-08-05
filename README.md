# e2e Space Invaders

A plain-JavaScript, no-bundler, no-server Space Invaders clone built with hand-written HTML and ES modules. Open `index.html` directly from your filesystem — no install step required.

---

## How to Run

1. Clone or download the repository.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
   - Double-click the file in your file manager, **or**
   - Drag `index.html` into an open browser window, **or**
   - Navigate to `file:///path/to/repo/index.html` in the address bar.
3. No web server, no `npm install`, no build step is needed.

---

## File Layout

| File | Role |
|---|---|
| `index.html` | Entry point; hosts the `<canvas>` and loads `game.js` as `type="module"` |
| `gameConfig.js` | Named exports: `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`, `startingLives` |
| `game.js` | Main module: fixed-timestep loop, scene state machine, HUD render, exports `hudState` and `SCENES` |
| `input.js` | Keyboard input: `initInput()` and `isKeyHeld(key)` |
| `player.js` | Player ship: `Player` class with `update(dt)`, `draw(ctx)`, `lives` property |
| `invaders.js` | Invader grid (stub — sibling card) |
| `collision.js` | Collision detection (stub — sibling card) |

All files sit in the repository root beside `index.html`.

---

## Configuration Constants (`gameConfig.js`)

| Constant | Value | Meaning |
|---|---|---|
| `CANVAS_WIDTH` | `768` | Canvas width in pixels |
| `CANVAS_HEIGHT` | `896` | Canvas height in pixels |
| `PLAYER_SPEED` | `200` | Player movement speed (px/s) |
| `BULLET_SPEED` | `500` | Bullet travel speed (px/s) |
| `STARTING_LIVES` | `3` | Lives at the start of each round |
| `startingLives` | `3` | Alias for `STARTING_LIVES` (used by player.js) |

---

## Manual Verification Steps

Follow these steps to confirm the scaffold and player controls are working correctly after opening `index.html`.

### 1. Title Screen
- **Expected:** A black 768 × 896 canvas is centred on a dark page.  
  The text **SPACE INVADERS** appears large and centred.  
  Below it: *"Press ENTER to start"*.
- **Check:** No errors appear in the browser console (F12 → Console tab).
- **Check:** No network requests are made (F12 → Network tab stays empty).

### 2. Title → Playing transition
- **Action:** Press **Enter**.
- **Expected:** The canvas immediately switches to the Playing scene **without a page reload**.  
  The HUD appears: `SCORE: 0` top-left, `HI: 0` top-centre, `LIVES: 3` top-right.

### 3. Simulate Game Over
- **Action:** While on the Playing scene, press **G** (the temporary verification hotkey).
- **Expected:** The canvas switches to the Game Over scene, showing:  
  - **GAME OVER** (large, centred)  
  - `Score: 0` beneath it  
  - *"Press ENTER to restart"* below that.

### 4. Game Over → Title transition
- **Action:** Press **Enter** on the Game Over screen.
- **Expected:** Score resets to 0, and the Title screen is shown again — still **no page reload**.  
  The Hi-Score at the top-centre retains the highest score seen this session.

---

## Manual Verification — Keyboard Input & Player Ship

The following steps verify **`input.js`** and **`player.js`** in isolation using the browser console. Open `index.html`, then open the browser DevTools console (F12).

### 5. Verify `initInput` and `isKeyHeld`

In the console, import the module (works from `file://` in all modern browsers):

```js
const { initInput, isKeyHeld } = await import('./input.js');
initInput();
```

- **Hold ArrowLeft** on the keyboard.  
  Type `isKeyHeld('ArrowLeft')` in the console → **Expected:** `true`
- **Release ArrowLeft**.  
  Type `isKeyHeld('ArrowLeft')` again → **Expected:** `false`
- **Hold a key and keep it held** (OS will generate repeated `keydown` events after ~500 ms).  
  The value of `isKeyHeld` must stay `true` stably — it must NOT flicker to `false` and back during the hold.

### 6. Verify Player construction and `lives`

```js
const { Player } = await import('./player.js');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const player = new Player(364, 820);
console.log(player.lives); // Expected: 3
```

### 7. Verify horizontal movement (delta-time based)

With the player created above, simulate a frame while ArrowLeft is held:

```js
// Simulate ArrowLeft held
// (initInput() was already called in step 5; actually press and hold ArrowLeft
//  on the keyboard before calling update)
const xBefore = player.x;
player.update(1); // 1 second of delta time
console.log(player.x); // Expected: xBefore - 200 (moved 200 px left at 200 px/s)
```

Repeat with ArrowRight / `'d'` to confirm rightward movement at +200 px/s.

### 8. Verify canvas clamping

```js
player.x = -50;
player.update(0);        // zero-delta update just to trigger clamp
console.log(player.x);  // Expected: 0  (clamped to left edge)

player.x = 780;          // beyond CANVAS_WIDTH (768)
player.update(0);
console.log(player.x);  // Expected: 728  (768 - shipWidth 40)
```

### 9. Verify single-bullet mechanic and auto-clear

```js
// With no bullet in flight and Space held:
// (physically hold Space on the keyboard, or set up a manual test)
player.update(0.016);          // fire a bullet
console.log(player.bullet);   // Expected: object { x, y } — bullet exists

player.update(0.016);
console.log(player.bullet);   // Expected: same bullet object, y slightly decreased

// Simulate the bullet reaching the top: force y off-screen
player.bullet.y = -20;
player.update(0.016);
console.log(player.bullet);   // Expected: null — bullet was removed

// Next Space press can now fire a new bullet
```

### 10. Verify procedural drawing

```js
player.x = 364;
player.y = 820;
player.draw(ctx);
// Expected: a green ship shape (rectangles + dome arc) appears on the canvas.
// No image files are loaded; no network requests appear in the Network tab.
```

---

## Architecture Notes

- **Fixed-timestep loop:** `game.js` uses `requestAnimationFrame` with a fixed update step of `1000/60` ms (~16.67 ms). The accumulated delta is capped at `UPDATE_STEP × 5` (~83 ms) so returning from a backgrounded tab never fires more than 5 catch-up updates in a single frame.
- **Scene state machine:** Three scenes (`TITLE`, `PLAYING`, `GAME_OVER`) driven by the Enter key. Exported as the `SCENES` constant for sibling modules.
- **HUD state:** Exported from `game.js` as `hudState` — a mutable object `{ score, lives, hiScore }`. Sibling modules (player, invaders) import it and mutate properties directly.
- **Input:** `input.js` tracks physically-held keys in a `Set`. Key-repeat events (OS-generated repeated `keydown` with `e.repeat === true`) are ignored, ensuring `isKeyHeld` is stable for the full duration a key is held.
- **Single-bullet constraint:** `player.js` maintains at most one in-flight bullet object. While it is in flight, Space presses are ignored. The bullet is removed (and the lock released) once its top edge goes above `y = 0`.
- **No external dependencies:** No npm, no bundler, no CDN, no `fetch()` calls. Everything is a relative ES module import.
