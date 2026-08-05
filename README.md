# Space Invaders — BB.Project1

## Planned File Layout

| File | Status | Card |
|------|--------|------|
| `index.html` | ✅ Implemented | Game Loop & Canvas Framework |
| `game.js` | ✅ Implemented | Game Loop & Canvas Framework |
| `gameConfig.js` | ✅ Implemented | Game Loop & Canvas Framework |
| `input.js` | ✅ Implemented | Input card |
| `player.js` | ✅ Implemented | Player card |
| `invaders.js` | ⏳ Future | Invaders card |
| `collision.js` | ⏳ Future | Collision card |
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
- **Stub comments**: marks every future import site with the owning card.

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
- [ ] A placeholder message `"(Press G to simulate Game Over)"` is shown mid-canvas.

### 5 — Game Over transition (Playing → Game Over)
- [ ] Pressing **G** switches to the Game Over scene **without** a page reload.
- [ ] **"GAME OVER"** appears in large red text.
- [ ] The final score is shown below it.
- [ ] **"Press ENTER to restart"** appears below the score.

### 6 — ENTER transition (Game Over → Title)
- [ ] Pressing **ENTER** returns to the **Title scene** (no page reload).
- [ ] Score has been reset to 0; HI score (if any) is preserved for the session.

### 7 — Background-tab behaviour
- [ ] Switch away from the browser tab for 5+ seconds, then switch back.
- [ ] The game does **not** stutter or fire a burst of updates on return (delta cap works).

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

### 8 — `initInput()` / `isKeyHeld()`
- [ ] Open `player-test.html` from a `file://` URL. No console errors.
- [ ] Hold **ArrowLeft** — the on-screen label shows `ArrowLeft=true`.
- [ ] Release **ArrowLeft** — label immediately shows `ArrowLeft=false` (no key-repeat lag).
- [ ] Same check for **ArrowRight** and **Space**.

### 9 — Ship renders
- [ ] A **green spaceship shape** is visible near the bottom of the canvas.
- [ ] The shape is built from arcs and rectangles (no external image).
- [ ] Right-click → "Inspect" confirms no `<img>` or `drawImage` call.

### 10 — Movement (ArrowLeft / ArrowRight / A / D)
- [ ] Holding **ArrowLeft** moves the ship left; releasing stops it.
- [ ] Holding **ArrowRight** moves the ship right; releasing stops it.
- [ ] **A** and **D** produce the same result as the arrow keys.
- [ ] The ship cannot be moved off the left edge (left edge stays ≥ 0).
- [ ] The ship cannot be moved off the right edge (right edge stays ≤ 768).

### 11 — Speed calibration (200 px/s)
- [ ] Start the ship somewhere in the middle of the canvas.
- [ ] Hold **ArrowRight** for exactly **1 second** (use the browser's performance timer or a stopwatch).
- [ ] The `x=` readout in the HUD increases by approximately **200 px** (±2 px acceptable).

### 12 — Shooting (Space)
- [ ] Press **Space** — a small **yellow rectangle** (bullet) appears above the ship and travels upward.
- [ ] While the bullet is in flight, `bullet=true` shows in the HUD.
- [ ] Press/hold **Space** repeatedly while the bullet is visible — only **one** bullet exists at a time (second bullet is not created).
- [ ] The bullet disappears once it exits the top of the canvas.
- [ ] Immediately after the bullet disappears, pressing **Space** fires a **new** bullet.

### 13 — Lives counter
- [ ] The HUD shows `lives=3` on load.
- [ ] In the browser console, type: `/* no direct access from devtools module scope — see below */`.
- [ ] Alternatively, add `window._player = player;` temporarily in the test script, then in DevTools Console run `_player.lives = 2;` — the HUD immediately shows `lives=2`, confirming the property is writable.

### 14 — No server required
- [ ] Close the browser, re-open `player-test.html` by double-clicking it from the file system.
- [ ] All of the above steps still work with a `file://` URL (no "blocked by CORS" or "not allowed to load local resource" errors).

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
