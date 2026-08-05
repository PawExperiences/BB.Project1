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
| `gameConfig.js` | Named exports: canvas dimensions, speeds, lives, invader grid config, point value, explosion duration |
| `game.js` | Main module: fixed-timestep loop, scene state machine, HUD render, exports `hudState`, `SCENES`, and `startLevel(n)` |
| `input.js` | Keyboard input: `initInput()` and `isKeyHeld(key)` |
| `player.js` | Player ship: `Player` class with `update(dt)`, `draw(ctx)`, `lives` property |
| `invaders.js` | Invader grid: `initInvaders()`, `updateInvaders(dt)`, `stepFormation()`, `drawInvaders(ctx)`, `getInvaders()`, `getLivingCount()`, `triggerExplosion()` |
| `collision.js` | AABB collision: `checkBulletInvaderCollisions()`, `checkInvaderBulletPlayerCollisions()` |
| `level1.js` | Level 1 logic: `startLevel1()`, `updateLevel1(dt, player)` — formation init, speed scaling, lose detection |

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
| `INVADER_COLS` | `11` | Number of invader columns |
| `INVADER_ROWS` | `5` | Number of invader rows |
| `INVADER_WIDTH` | `36` | Invader cell width in pixels |
| `INVADER_HEIGHT` | `24` | Invader cell height in pixels |
| `INVADER_H_GAP` | `12` | Horizontal gap between invader cells |
| `INVADER_V_GAP` | `16` | Vertical gap between invader cells |
| `INVADER_STEP_X` | `8` | Horizontal pixels moved per formation step |
| `INVADER_DROP_Y` | `24` | Vertical drop on direction reversal |
| `INVADER_TOP_MARGIN` | `80` | Distance from top of canvas to first invader row |
| `INVADER_POINT_VALUE` | `10` | Score points awarded per invader kill |
| `EXPLOSION_DURATION` | `150` | Explosion effect duration in milliseconds |

---

## Manual Verification Steps

Follow these steps to confirm the full gameplay slice is working correctly after opening `index.html`.

### 1. Title Screen
- **Expected:** A black 768 × 896 canvas is centred on a dark page.  
  The text **SPACE INVADERS** appears large and centred.  
  Below it: *"Press ENTER to start"*.
- **Check:** No errors appear in the browser console (F12 → Console tab).
- **Check:** No network requests are made (F12 → Network tab stays empty).

### 2. Title → Playing transition
- **Action:** Press **Enter**.
- **Expected:** The canvas immediately switches to the Playing scene **without a page reload**.  
  The HUD appears: `SCORE: 0` top-left, `HI: 0` top-centre, `LIVES: 3` top-right, `LEVEL: 1` below the score (second HUD line, top-left).  
  An 11 × 5 grid of cyan filled rectangles (55 invaders total) is visible in the upper portion of the canvas.  
  The green player ship is visible near the bottom.

### 3. Invader formation — initial count
- **Verify:** Open the browser console and run:
  ```js
  const { getInvaders } = await import('./invaders.js');
  console.log(getInvaders().filter(i => i.alive).length); // Expected: 55
  ```
- **Expected:** `55` is logged with no errors.

### 4. Invader formation movement
- **Expected:** The invader grid moves horizontally as a unit.  
  At full count (55 alive) the march feels slow (~800 ms per step).  
  When the rightmost invader reaches the canvas right edge, the whole formation drops **24 px** and reverses direction leftward.  
  When the leftmost invader reaches the canvas left edge, the formation drops again and reverses rightward.

### 5. Speed scaling — 55 vs. 1 invader
- **Full formation (55 alive):** After pressing Enter, observe the formation. Steps should occur roughly every **800 ms** — slow enough that you can count approximately 1.25 steps per second.
- **One invader remaining:** Kill 54 invaders (or open the console and run `getInvaders().forEach((inv,i)=>{ if(i<54) inv.alive=false; })` then shoot the last one). The last invader should march noticeably faster — approximately **10 steps per second** (~100 ms per step).
- **Intermediate counts:** At ~28 invaders alive the interval should be approximately 450 ms (halfway between 800 and 100).

### 6. 24 px drop on edge contact
- **Verify visually:** Watch the formation reach a horizontal boundary. The entire grid should drop exactly **24 px** in a single step and immediately begin moving in the opposite direction — no partial-pixel drift.
- **Console cross-check (optional):**
  ```js
  const { getInvaders } = await import('./invaders.js');
  const yBefore = getInvaders()[0].y;
  // Wait for one edge-contact drop...
  const yAfter  = getInvaders()[0].y;
  console.log(yAfter - yBefore); // Expected: 24
  ```

### 7. Player fires a bullet and kills an invader
- **Action:** Hold **Space** while the player ship is positioned under an invader.
- **Expected:**
  - A yellow bullet travels upward from the player ship.
  - When the bullet bounding box overlaps a living invader, both disappear instantly.
  - A brief yellow/orange flash (≈150 ms) appears at the invader's former position, then vanishes.
  - `SCORE` in the HUD increments by 10 for each kill.
  - The killed invader is not rendered again and is not treated as collidable.

### 8. Score preserved on lose condition (invaders reach player)
- **Setup:** Let the invader formation march downward until it approaches the player ship.  
  (Tip: kill a few invaders first to score some points, then wait.)
- **Expected when the top edge of any surviving invader reaches the top edge of the player ship:**
  - `LIVES` in the HUD decrements by **1** (e.g. 3 → 2).
  - `SCORE` is **unchanged** — it is NOT reset to 0.
  - The formation resets to the full 55-invader grid at its initial Y position.
  - `LEVEL: 1` remains displayed.
- **If lives reach 0:** The Game Over screen appears instead of resetting.

### 9. Level-clear handoff (all 55 invaders destroyed)
- **Action:** Destroy all 55 invaders.
- **Expected:** `startLevel(2)` is called exactly once.  
  Because Level 2 is not yet implemented, the game gracefully returns to the **Title** screen and the hi-score is preserved.  
  The browser console shows:  
  `startLevel(2) called — Level 2 not yet implemented. Returning to title.`
- **Verify:** No JavaScript errors appear in the console during or after the transition.

### 10. HUD LEVEL field sources from shared state
- **Verify (console):**
  ```js
  const { hudState } = await import('./game.js');
  console.log(hudState.level); // Expected during play: 1
  ```
- **Expected:** The value matches what is displayed in the HUD — it is read from `hudState.level`, not hardcoded.

### 11. Collision pass ordering
- **Verify (by inspection):** In `game.js → update()`, `checkBulletInvaderCollisions()` is called **before** `renderPlaying()` / `drawInvaders()`. No bounding-box logic appears inside `drawInvaders()` or related draw code.

### 12. Invader-bullet-vs-player stub
- **Verify (in browser console):**
```js
const { checkInvaderBulletPlayerCollisions } = await import('./collision.js');
const fakePlayer = { x: 100, y: 100, width: 40, height: 30, alive: true };
const fakeHud    = { lives: 3 };
const result = checkInvaderBulletPlayerCollisions([], fakePlayer, fakeHud);
console.log(result); // Expected: false — no error thrown, returns false
```

### 13. Score resets on restart
- **Action:** Kill several invaders to build up a score, then press **G** to trigger Game Over, then press **Enter** to return to Title, then press **Enter** again to start a new round.
- **Expected:** `SCORE` resets to `0`. The `HI` score retains the highest score seen this session.

### 14. Simulate Game Over
- **Action:** While on the Playing scene, press **G** (the temporary verification hotkey).
- **Expected:** The canvas switches to the Game Over scene, showing:  
  - **GAME OVER** (large, centred)  
  - `Score: <current value>` beneath it  
  - *"Press ENTER to restart"* below that.

### 15. Game Over → Title transition
- **Action:** Press **Enter** on the Game Over screen.
- **Expected:** The Title screen is shown again — still **no page reload**.  
  The Hi-Score at the top-centre retains the highest score seen this session.

---

## Manual Verification — Keyboard Input & Player Ship

The following steps verify **`input.js`** and **`player.js`** in isolation using the browser console. Open `index.html`, then open the browser DevTools console (F12).

### 16. Verify `initInput` and `isKeyHeld`

In the console, import the module (works from `file://` in all modern browsers):

```js
const { initInput, isKeyHeld } = await import('./input.js');
initInput();
```

- **Hold ArrowLeft** on the keyboard.  
  Type `isKeyHeld('ArrowLeft')` in the console → **Expected:** `true`
- **Release ArrowLeft**.  
  Type `isKeyHeld('ArrowLeft')` again → **Expected:** `false`

### 17. Verify Player construction and `lives`

```js
const { Player } = await import('./player.js');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const player = new Player(364, 820);
console.log(player.lives); // Expected: 3
```

### 18. Verify horizontal movement (delta-time based)

With the player created above, simulate a frame while ArrowLeft is held:

```js
const xBefore = player.x;
player.update(1); // 1 second of delta time
console.log(player.x); // Expected: xBefore - 200
```

---

## Architecture Notes

- **Fixed-timestep loop:** `game.js` uses `requestAnimationFrame` with a fixed update step of `1000/60` ms (~16.67 ms). The accumulated delta is capped at `UPDATE_STEP × 5` (~83 ms) so returning from a backgrounded tab never fires more than 5 catch-up updates in a single frame.
- **Scene state machine:** Three scenes (`TITLE`, `PLAYING`, `GAME_OVER`) driven by the Enter key. Exported as the `SCENES` constant for sibling modules.
- **HUD state:** Exported from `game.js` as `hudState` — a mutable object `{ score, lives, hiScore, level }`. Collision module increments `hudState.score` directly; `hudState.level` is set by `startLevel(n)`.
- **Level dispatcher:** `startLevel(n)` is exported from `game.js`. Level 1 calls `startLevel(2)` on win; the dispatcher owns the transition logic.
- **Input:** `input.js` tracks physically-held keys in a `Set`. Key-repeat events are ignored.
- **Single-bullet constraint:** `player.js` maintains at most one in-flight bullet object.
- **Collision ordering:** In `game.js → update()`: (1) player update, (2) level update (explosions + stepping + lose check), (3) collision pass — always before the render pass.
- **Formation stepping:** `invaders.js` separates explosion-timer ticking (`updateInvaders(dt)`, called every frame) from formation movement (`stepFormation()`, called by `level1.js` on the interval timer). This keeps the step-rate logic entirely within `level1.js`.
- **Speed scaling:** `level1.js` computes `getStepInterval(aliveCount)` = `100 + (aliveCount−1)×(700/54)` ms, clamped to [100, 800]. The interval is re-evaluated every tick so invader kills take effect immediately.
- **Lose condition:** Each tick, `updateLevel1` checks whether any living invader's top edge (`inv.y`) has reached or passed the player's top edge (`player.y`). On 'lose': `game.js` decrements `hudState.lives`; if lives > 0 the formation is reset via `startLevel1()` (score preserved); if lives reach 0 the game-over flow runs.
- **Win condition:** After the collision pass, `game.js` calls `getLivingCount()`; when it returns 0, `startLevel(2)` is called once. Level 2 internals are out of scope; the stub gracefully returns to title.
- **Explosion effect:** A `{ x, y, timeLeft }` record is pushed to `explosions` on each kill. `updateInvaders(dt)` counts down `timeLeft`; `drawInvaders()` renders the flash while positive.
- **No external dependencies:** No npm, no bundler, no CDN, no `fetch()` calls. Everything is a relative ES module import.
