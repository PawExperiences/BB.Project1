# Space Invaders — BB.Project1

## Planned File Layout

| File | Status | Card |
|------|--------|------|
| `index.html` | ✅ Implemented | Game Loop & Canvas Framework |
| `game.js` | ✅ Implemented | Game Loop & Canvas Framework |
| `gameConfig.js` | ✅ Implemented | Game Loop & Canvas Framework |
| `input.js` | ✅ Implemented | Input card |
| `player.js` | ✅ Implemented | Player card |
| `invaders.js` | ✅ Implemented | Invaders card |
| `collisions.js` | ✅ Implemented | Collision card |
| `explosions.js` | ✅ Implemented | Collision card |
| `level1.js` | ⏳ Future | Level 1 card |
| `level2.js` | ⏳ Future | Level 2 card |
| `level3.js` | ⏳ Future | Level 3 card |
| `boss.js` | ⏳ Future | Boss card |

---

## Architecture Overview

### `gameConfig.js`
Pure ES module — named constants only, no logic:
- `CANVAS_WIDTH = 768`
- `CANVAS_HEIGHT = 896`
- `PLAYER_SPEED = 200` (px/s)
- `BULLET_SPEED = 500` (px/s)
- `STARTING_LIVES = 3`

### `index.html`
- Single `768 × 896` canvas centred on a black background.
- Loads `game.js` as an ES module (`type="module"`).
- Works from a `file://` URL — no server needed.

### `game.js`
- **Fixed-timestep loop**: 60 update steps/second; accumulated delta capped at 0.25 s.
- **Scene state machine**: `title` → `playing` → `gameover` → `title`.
- **HUD**: drawn on-canvas; exports `hudState { score, lives, hiScore }` for later cards.
- **Playing scene**: initialises Player, InvaderGrid, and ExplosionPool on entry; wires collision pass before draw pass each tick.

### `input.js`
- `initInput()` — attaches `keydown`/`keyup` listeners to `window`. Call once at startup.
- `isKeyHeld(code)` — returns `true` while a key (identified by `KeyboardEvent.code`, e.g. `'ArrowLeft'`, `'Space'`, `'KeyA'`) is physically held; returns `false` once released. Does **not** rely on browser key-repeat.

### `player.js`
- Exports `Player` class.
- Constructor: `new Player(startX, ctx)` — `startX` is the horizontal centre of the ship.
- Movement: `ArrowLeft`/`KeyA` and `ArrowRight`/`KeyD`, at 200 px/s, delta-time scaled.
- Position clamped so ship never exits the canvas horizontally.
- Shooting: `Space` fires one bullet (4 × 14 px yellow rectangle) upward at 500 px/s. Only one bullet in flight at a time; slot re-opens when bullet exits the top.
- `draw(ctx)` renders a procedural green spaceship (rectangles + arcs) and the active bullet.
- `player.lives` initialised to `STARTING_LIVES` (3); readable and writable by level cards.

### `invaders.js`
- Exports `InvaderGrid` class and `INVADER_W`, `INVADER_H`, `GAP` constants.
- **Formation**: 11 columns × 5 rows = 55 invaders, each 24 × 16 px, filled `#00FF00`, with 8 px gaps.
- **Centred**: formation starts horizontally centred on the 768 px canvas.
- **March**: moves 8 px sideways every 30 game-loop ticks (~0.5 s at 60 fps).
- **Edge detection**: when rightmost live invader's right edge reaches 768 px, or leftmost live invader's left edge reaches 0 px — drop 16 px downward and reverse direction.
- **`invaderRect(inv)`**: returns `{x, y, w, h}` for a given invader in canvas space.
- **`liveInvaders()`**: returns only invaders with `alive === true`.

### `explosions.js`
- Exports `ExplosionPool` class.
- **`spawn(x, y)`**: adds an explosion entry `{ x, y, framesLeft: 8 }` at the dead invader's position.
- **`tick()`**: decrements all `framesLeft` counters; removes entries that reach 0. Call before draw.
- **`draw(ctx)`**: renders each active explosion as a 24 × 16 px filled rectangle in `#FFFF00` (yellow).

### `collisions.js`
- Exports `collide(player, invaderGrid, explosions, hudState)`.
- **Runs before the draw pass** every tick (enforced in `game.js`).
- **Bullet-vs-Invader**: for every live player bullet, AABB-tests against every live invader. On hit: marks invader dead, consumes bullet, spawns explosion, awards 10 points.
- **Invader-Bullet-vs-Player**: clearly commented stub for Level 2 — no implementation.

---

## Running

No build step, no server, no npm required.

```
# Simply open the file:
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

Or drag `index.html` into any modern browser (Chrome, Firefox, Edge, Safari).

---

## Manual Verification Checklist

Open `index.html` by double-clicking it (or dragging it into a browser) so the URL begins with `file://`.

### 1 — Initial load
- [ ] No console errors appear in DevTools (`F12 → Console`).
- [ ] A **768 × 896** canvas is visible, centred on a black page.

### 2 — Title scene
- [ ] **"SPACE INVADERS"** appears in large green text, centred on the canvas.
- [ ] **"Press ENTER to start"** appears below it in white.

### 3 — ENTER transition (Title → Playing)
- [ ] Pressing **ENTER** switches immediately to the Playing scene **without** a page reload.
- [ ] The title text disappears.

### 4 — Playing scene / HUD
- [ ] The HUD is visible at the top of the canvas:
  - **SCORE: 0** on the left.
  - **HI: 0** centred.
  - **LIVES: 3** on the right (in green).

### 5 — Invader formation visible
- [ ] An **11-column × 5-row** grid of green filled rectangles is visible on the canvas.
- [ ] Each rectangle is approximately **24 × 16 px**.
- [ ] The formation is **horizontally centred** on the 768 px canvas.
- [ ] There are **8 px gaps** between invaders both horizontally and vertically.
- [ ] The player ship is visible near the bottom of the canvas.

### 6 — Formation march
- [ ] Watch the formation for ~0.5 seconds — it steps **8 px sideways** approximately once every 30 frames (visually: a smooth, discrete hop roughly twice per second).
- [ ] The direction starts moving **right**.

### 7 — Edge detection and drop
- [ ] Wait (or watch) until the formation's right edge reaches the canvas right edge (768 px).
- [ ] The formation **drops 16 px downward** and begins moving **left**.
- [ ] When the formation's left edge reaches 0 px, it **drops 16 px** again and reverses to the **right**.
- [ ] This repeats indefinitely.

### 8 — Bullet fires (Space)
- [ ] Press **Space** — a small **yellow bullet** appears above the player ship and travels upward.
- [ ] Holding **Space** does not fire a second bullet while one is in flight.

### 9 — Bullet kills invader (collision)
- [ ] Manoeuvre the player ship under any live invader using **ArrowLeft / ArrowRight** (or **A / D**).
- [ ] Fire with **Space**.
- [ ] When the bullet overlaps the invader:
  - The **invader disappears** from the canvas.
  - The **bullet disappears** (consumed).
  - A **yellow flash rectangle** (24 × 16 px) appears at the invader's last position.

### 10 — Explosion flash duration
- [ ] The yellow flash rectangle is visible for **approximately 8 game frames** (~0.13 s at 60 fps), then vanishes.
- [ ] No lingering artifact remains after 8 frames.

### 11 — Score increments
- [ ] After killing one invader the HUD shows **SCORE: 10**.
- [ ] After killing a second invader the HUD shows **SCORE: 20**.
- [ ] Score increments by exactly **10** for each kill; it never resets mid-session.

### 12 — Dead invaders excluded
- [ ] After an invader is killed, firing another bullet through the same grid position where the dead invader was does **not** trigger a collision — the bullet passes through.
- [ ] The dead invader's rectangle is not drawn on the canvas.

### 13 — Collision pass ordering
- [ ] (Code review) Open `game.js` and confirm that in `updatePlaying()` the call to `collide(…)` appears **before** the draw pass (`explosions.tick()` / `player.draw()` / `invaderGrid.draw()`).
- [ ] No collision logic appears inside `invaderGrid.draw()`, `explosions.draw()`, or `player.draw()`.

### 14 — Invader-bullet stub
- [ ] Open `collisions.js` and confirm a clearly commented stub/hook for **invader-bullet-vs-player** collision exists.
- [ ] The stub contains **no executable invader-firing logic**.

### 15 — Game Over transition
- [ ] Press **G** — the Game Over scene appears showing the current score.
- [ ] Press **ENTER** — returns to the Title scene; score resets to 0.

### 16 — No server required
- [ ] Close the browser, re-open `index.html` by double-clicking it from the file system.
- [ ] All of the above steps still work with a `file://` URL (no "blocked by CORS" errors).

---

## Manual Verification — Keyboard Input & Player Ship

> These steps verify `input.js` and `player.js` in isolation using a small
> inline test page. No bundler or server is required.

### Setup: Temporary test page

Create a file called `player-test.html` **next to `index.html`** (do not commit
it; it is a scratch file) with the content below, then open it from a
`file://` URL:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Player / Input Test</title>
  <style>
    body { margin: 0; background: #111; }
    canvas { display: block; }
    #log { color: #0f0; font: 14px monospace; padding: 8px; }
  </style>
</head>
<body>
  <canvas id="c" width="768" height="896"></canvas>
  <div id="log">Hold arrow keys / A / D to move. Space to shoot.</div>
  <script type="module">
    import { initInput, isKeyHeld } from './input.js';
    import { Player } from './player.js';

    initInput();

    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const player = new Player(384, ctx); // start centred
    const log = document.getElementById('log');

    let last = null;
    function loop(ts) {
      const dt = last === null ? 0 : Math.min((ts - last) / 1000, 0.25);
      last = ts;

      player.update(dt);

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 768, 896);
      player.draw(ctx);

      // HUD
      ctx.fillStyle = '#0f0';
      ctx.font = '16px monospace';
      ctx.fillText(`x=${player.x.toFixed(1)}  lives=${player.lives}  bullet=${player.bulletActive}`, 10, 20);
      ctx.fillText(`ArrowLeft=${isKeyHeld('ArrowLeft')} ArrowRight=${isKeyHeld('ArrowRight')} Space=${isKeyHeld('Space')}`, 10, 40);

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  </script>
</body>
</html>
```

### 17 — `initInput()` / `isKeyHeld()`
- [ ] Open `player-test.html` from a `file://` URL. No console errors.
- [ ] Hold **ArrowLeft** — the on-screen label shows `ArrowLeft=true`.
- [ ] Release **ArrowLeft** — label immediately shows `ArrowLeft=false` (no key-repeat lag).
- [ ] Same check for **ArrowRight** and **Space**.

### 18 — Ship renders
- [ ] A **green spaceship shape** is visible near the bottom of the canvas.
- [ ] The shape is built from arcs and rectangles (no external image).

### 19 — Movement
- [ ] Holding **ArrowLeft** moves the ship left; releasing stops it.
- [ ] Holding **ArrowRight** moves the ship right; releasing stops it.
- [ ] **A** and **D** produce the same result as the arrow keys.
- [ ] The ship cannot be moved off the left or right edge.

### 20 — Shooting
- [ ] Press **Space** — a small **yellow rectangle** (bullet) appears above the ship and travels upward.
- [ ] Only **one** bullet exists at a time.
- [ ] The bullet disappears once it exits the top of the canvas; a new one can then be fired.
