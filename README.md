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
| `gameConfig.js` | Named exports: `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES` |
| `game.js` | Main module: fixed-timestep loop, scene state machine, HUD render, exports `hudState` and `SCENES` |
| `input.js` | Keyboard input (stub — owned by sibling card; directory position established here) |
| `player.js` | Player ship (stub — sibling card) |
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

---

## Manual Verification Steps

Follow these steps to confirm the scaffold is working correctly after opening `index.html`.

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

## Architecture Notes

- **Fixed-timestep loop:** `game.js` uses `requestAnimationFrame` with a fixed update step of `1000/60` ms (~16.67 ms). The accumulated delta is capped at `UPDATE_STEP × 5` (~83 ms) so returning from a backgrounded tab never fires more than 5 catch-up updates in a single frame.
- **Scene state machine:** Three scenes (`TITLE`, `PLAYING`, `GAME_OVER`) driven by the Enter key. Exported as the `SCENES` constant for sibling modules.
- **HUD state:** Exported from `game.js` as `hudState` — a mutable object `{ score, lives, hiScore }`. Sibling modules (player, invaders) import it and mutate properties directly.
- **No external dependencies:** No npm, no bundler, no CDN, no `fetch()` calls. Everything is a relative ES module import.
