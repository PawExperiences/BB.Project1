# Space Invaders

A classic Space Invaders game built with hand-written HTML, CSS, and ES modules — no framework, no bundler, no npm.

## Planned File Layout

| File | Owner / Card | Purpose |
|---|---|---|
| `index.html` | Game loop and canvas framework | Entry point — canvas element, loads `game.js` |
| `game.js` | Game loop and canvas framework | Fixed-timestep loop, scene state machine, HUD, `hudState` export |
| `gameConfig.js` | Game loop and canvas framework | Shared constants (dimensions, speeds, lives) |
| `input.js` | Keyboard input and the player ship | Keyboard input abstraction |
| `player.js` | Keyboard input and the player ship | Player ship entity (movement, shooting) |
| `invaders.js` | Level 1: the classic grid | Invader grid logic |
| `collision.js` | Sprite rendering and collision detection | AABB collision detection, sprite rendering helpers |
| `level1.js` | Level 1: the classic grid | Level 1 setup and wave configuration |
| `level2.js` | Level 2: they shoot back | Level 2 — invaders fire bullets |
| `level3.js` | Level 3: shields and formations | Level 3 — shields and new formations |
| `boss.js` | Boss level: multi-phase finale | Boss entity, multi-phase AI |

## How to Run

1. Clone or download this repository to your local machine.
2. Open `index.html` directly in a modern browser (Chrome, Firefox, Edge, Safari) using the `file://` protocol — double-click the file in your file manager, or drag it into the browser window.
3. No build step, no server, no npm install required.

## Scene Transitions

| From | To | Trigger |
|---|---|---|
| Title | Playing | Press **ENTER** |
| Playing | Game Over | Press **ENTER** (manual test) *or* `hudState.lives` reaches `0` (set by sibling modules) |
| Game Over | Title | Press **ENTER** (score is reset to 0) |

> **Note:** During the Playing scene, pressing ENTER is a convenience shortcut for manual testing. In the finished game, sibling cards decrement `hudState.lives`; when lives hit `0` the scene automatically transitions to Game Over.

## `hudState` — Shared Score/Lives Object

`game.js` exports a named `hudState` object:

```js
import { hudState } from './game.js';
// hudState.score   — current score (starts at 0)
// hudState.lives   — remaining lives (starts at STARTING_LIVES = 3)
// hudState.hiScore — all-time high score for the session (never resets)
```

Sibling modules **import and mutate** this object directly. It is the single source of truth — do not create a second score variable elsewhere.

## Manual Verification Checklist

Work through these steps after opening `index.html` from a `file://` URL:

### Canvas and Page
- [ ] The page background is visibly black (no white flash, no scrollbars).
- [ ] A canvas 768 px wide × 896 px tall is visible, centred on the page.
- [ ] The browser developer console (F12) shows **no errors** on load.

### Title Scene
- [ ] The text **SPACE INVADERS** is displayed, centred on the canvas.
- [ ] The text **Press ENTER to start** is displayed beneath it.
- [ ] No other text or graphics appear on the title screen.

### Title → Playing Transition
- [ ] Pressing **ENTER** from the Title scene transitions immediately to the Playing scene **without a page reload**.

### Playing Scene / HUD
- [ ] The canvas clears to black each frame (no trail artefacts).
- [ ] The HUD shows **SCORE: 0** in the top-left corner.
- [ ] The HUD shows **HI: 0** at the top centre.
- [ ] The HUD shows **LIVES: 3** in the top-right corner.
- [ ] The frame rate is smooth (approximately 60 fps).

### Playing → Game Over Transition
- [ ] Pressing **ENTER** from the Playing scene transitions to the Game Over scene (manual test shortcut).
- [ ] Alternatively, in the browser console run `hudState.lives = 0` — the next update tick should trigger the transition automatically.

### Game Over Scene
- [ ] The text **GAME OVER** is displayed, centred on the canvas.
- [ ] The final **SCORE** value is displayed.
- [ ] The text **Press ENTER to restart** is displayed.

### Game Over → Title Transition
- [ ] Pressing **ENTER** from Game Over returns to the Title scene **without a page reload**.
- [ ] After returning, **SCORE** is reset to 0 (visible if you go Title → Playing → Game Over → Title → Playing).
- [ ] `hiScore` is preserved across resets (it only increases, never resets).

### Delta Cap / Background Test
- [ ] Switch to another browser tab for 5+ seconds, then return.
- [ ] The game resumes smoothly without a visible burst of catch-up updates (the accumulated delta is capped at 250 ms, so at most ~15 fixed steps fire on resume).

### `gameConfig.js` Exports
- [ ] In the browser console, run:
  ```js
  import('./gameConfig.js').then(m => console.log(m));
  ```
  Confirm the logged module object contains:
  - `CANVAS_WIDTH: 768`
  - `CANVAS_HEIGHT: 896`
  - `PLAYER_SPEED: 200`
  - `BULLET_SPEED: 500`
  - `STARTING_LIVES: 3`

### `hudState` Export
- [ ] In the browser console, run:
  ```js
  // game.js is already the running module; access hudState via the module system
  // or verify by reading from the HUD display on screen.
  ```
  Confirm `hudState` has `{ score, lives, hiScore }` properties visible through the HUD.

## Tech Stack

- Plain HTML5, CSS3, and ES modules
- No build step required; runs entirely from `file://`
- No npm, no bundler, no transpiler
