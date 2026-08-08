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

## Planned File Layout

Below is the complete planned layout for this project. Files marked *future* do not exist yet — they will be added by the task card listed.

```
index.html      – Page entry point; <canvas> host                  (this card)
gameConfig.js   – Shared named constants (canvas size, speeds …)   (this card)
game.js         – Fixed-timestep loop, scene machine, HUD export   (this card)
README.md       – This file                                        (this card)

— added by later task cards —

input.js        – Keyboard state map                               (card: "Keyboard input and the player ship")
player.js       – Player ship entity, movement, shooting           (card: "Keyboard input and the player ship")
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
