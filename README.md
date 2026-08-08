# Space Invaders – BB.Project1

A hand-written, dependency-free Space Invaders game built with plain HTML, CSS, and ES modules.

## Manual Verification

### How to open the game

1. Clone (or download) this repository to your local machine.
2. Navigate to the repository root in your file manager or terminal.
3. Open `index.html` directly in a modern browser (Chrome, Firefox, Edge, Safari):
   - **Double-click** `index.html` in your file manager, **or**
   - Drag and drop `index.html` onto an open browser window, **or**
   - From a terminal: `open index.html` (macOS) / `xdg-open index.html` (Linux) / `start index.html` (Windows).

The page loads via a `file://` URL – no local server, no npm install, no build step required.

### What to check

| Check | Expected result |
|---|---|
| Page title (browser tab) | **Space Invaders** |
| Page background | Solid black |
| Canvas element | 768 × 896 px black rectangle centred on the page |
| Title scene | "SPACE INVADERS" and "Press ENTER to start" centred on canvas |
| ENTER key (title) | Transitions to Playing scene (HUD appears, no page reload) |
| HUD (playing scene) | Score, Lives, and Hi-Score drawn on canvas |
| Lives → 0 (console: `hudState.lives = 0`) | Transitions to Game Over scene |
| Game Over scene | "GAME OVER", final score, "Press ENTER to restart" |
| ENTER key (game over) | Returns to Title scene, score resets, no page reload |
| Browser console (F12 → Console) | **No errors or warnings** |
| Network tab | No external requests; all resources loaded from `file://` |

### Verifying the fixed-timestep loop

1. Open the page, press ENTER to enter the Playing scene.
2. Switch to another tab (or minimise the window) for ~5 seconds.
3. Return to the game — the canvas should resume smoothly with **no burst of rapid updates** (the 250 ms delta cap prevents catch-up flooding).

### Verifying the exported HUD state

Open DevTools → Console and run:
```js
import('./game.js').then(m => { m.hudState.score = 9999; });
```
The on-canvas score should update to **9999** on the very next frame.

---

## Manual Verification — Keyboard Input and Player Ship

These steps verify the acceptance criteria for `input.js` and `player.js`.

### Setup

1. Open `index.html` from the filesystem (`file://` URL).
2. Press **ENTER** to start the Playing scene — the player ship should appear at the bottom-centre of the canvas.

### AC1 & AC2 — Held-key tracking, no key-repeat

| Step | Expected result |
|---|---|
| Open DevTools Console and run `import('./input.js').then(m => window._input = m)` | Resolves without error |
| Hold **ArrowLeft** and run `window._input.isKeyHeld('ArrowLeft')` in the console | Returns `true` |
| Release **ArrowLeft** and run the same call again | Returns `false` |
| Hold any key for 2+ seconds (OS key-repeat fires); run `isKeyHeld` repeatedly | Returns a stable `true` — no toggling |

### AC4 — Movement speed

| Step | Expected result |
|---|---|
| Hold **ArrowLeft** for exactly 1 second | Ship moves ~200 px to the left |
| Hold **ArrowRight** for exactly 1 second | Ship moves ~200 px to the right |
| Repeat with **KeyA** / **KeyD** | Identical behaviour |

### AC5 — Boundary clamping

| Step | Expected result |
|---|---|
| Hold **ArrowLeft** until the ship reaches the left wall | Ship stops; left edge stays at x = 0 |
| Hold **ArrowRight** until the ship reaches the right wall | Ship stops; right edge stays at x = CANVAS_WIDTH (768) |

### AC6, AC7, AC8 — Single-bullet mechanic

| Step | Expected result |
|---|---|
| Press **Space** once | A small yellow rectangle (3 × 10 px) fires upward from the ship's cannon |
| While bullet is in flight, press/hold **Space** again | No second bullet appears — only one at a time |
| Wait for bullet to reach the top of the canvas | Bullet disappears; pressing **Space** fires a new one |

### AC9 — Procedural drawing

| Step | Expected result |
|---|---|
| Inspect Network tab in DevTools | No image files (`.png`, `.jpg`, `.svg`, etc.) are loaded |
| Ship and bullet are visible | Drawn entirely with canvas `fillRect` / `arc` calls |

### AC10 — Lives initialisation

| Step | Expected result |
|---|---|
| Open Console and run `import('./player.js').then(m => { const p = new m.Player(384,800); console.log(p.lives); })` | Prints `3` (value of `STARTING_LIVES`) |

### AC11 — gameConfig.js exports

| Step | Expected result |
|---|---|
| Run `import('./gameConfig.js').then(m => console.log(m.CANVAS_WIDTH, m.STARTING_LIVES))` | Prints `768 3` |

### AC12 — No build step required

| Step | Expected result |
|---|---|
| All of the above run from a `file://` URL with no dev server | Everything works without any install step |

---

## Planned File Layout

Below is the complete planned layout for this project. Files marked *future* do not exist yet — they will be added by the task card listed.

```
index.html      – Page entry point; <canvas> host                  (game-loop card)
gameConfig.js   – Shared named constants (canvas size, speeds …)   (game-loop card)
game.js         – Fixed-timestep loop, scene machine, HUD export   (game-loop card)
README.md       – This file                                        (game-loop card)
input.js        – Keyboard state map                               (this card)
player.js       – Player ship entity, movement, shooting           (this card)

— added by later task cards —

invaders.js     – Invader grid data and movement logic             (card: "Level 1: the classic grid")
collision.js    – Sprite rendering and AABB collision detection    (card: "Sprite rendering and collision detection")
level1.js       – Level 1 configuration and wave setup             (card: "Level 1: the classic grid")
level2.js       – Level 2: invaders fire back                      (card: "Level 2: they shoot back")
level3.js       – Level 3: shields and tighter formations          (card: "Level 3: shields and formations")
boss.js         – Boss level: multi-phase finale                   (card: "Boss level: multi-phase finale")
```

---

## Project stack

- **No framework, no bundler, no package manager.**
- Plain HTML5, CSS3, and ES modules (`type="module"`).
- Runs entirely from `file://` – nothing to install.

## Development notes

- All game constants live in `gameConfig.js`; import from there, never hardcode.
- `hudState` is a named export of `game.js`. Later modules import it and mutate its properties; the next render frame will reflect the change automatically.
- `triggerGameOver()` is also exported from `game.js` — call it from any module when the game ends.
- Keep all asset paths relative to `index.html` so the `file://` constraint is maintained.
- `main.js` and `style.css` are legacy skeleton files from the initial commit; they are left untouched.
- `initInput()` must be called once before the game loop starts; `game.js` calls it during initialisation.
- `Player` exposes `bulletActive`, `bulletX`, `bulletY` getters and a `clearBullet()` method for the future collision module.
