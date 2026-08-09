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
| `invaders.js` | Sprite rendering and collision detection | Invader grid logic, movement, explosion effects, score |
| `collision.js` | Sprite rendering and collision detection | AABB collision detection |
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
// hudState.score   — current score (starts at 0; synced from invaders.js each frame)
// hudState.lives   — remaining lives (starts at STARTING_LIVES = 3)
// hudState.hiScore — all-time high score for the session (never resets)
```

Sibling modules **import and mutate** this object directly. It is the single source of truth for lives and hi-score. The score is now owned by `invaders.js` (as a plain `let score` export) and synced into `hudState.score` every frame.

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

### Invader Grid
- [ ] An 11×5 grid of 55 filled green rectangles is visible immediately when the Playing scene starts.
- [ ] The formation moves laterally (left/right) each frame.
- [ ] When any invader reaches the left or right canvas edge, the entire formation reverses direction and drops down by one row-height.
- [ ] Dead invaders are not drawn.

### Shooting Invaders
- [ ] Press **Space** to fire a bullet upward.
- [ ] When the bullet overlaps an invader's bounding box, the invader disappears.
- [ ] A small orange/yellow rectangle flashes at the invader's last position for approximately 20 frames.
- [ ] The **SCORE** in the HUD increments by 10 for each invader destroyed.
- [ ] After shooting all 55 invaders, the SCORE reads **550** and no invaders remain on screen.

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

### `input.js` — Keyboard Input
- [ ] Open the browser console and run:
  ```js
  import('./input.js').then(({ initInput, isKeyHeld }) => {
    initInput();
    window._isKeyHeld = isKeyHeld;
  });
  ```
- [ ] Hold down the **ArrowLeft** key and in the console run `_isKeyHeld('ArrowLeft')` — it should return `true`.
- [ ] Release the key and run `_isKeyHeld('ArrowLeft')` again — it should return `false`.
- [ ] Confirm that holding a key does **not** produce multiple `true` state changes (browser key-repeat is ignored).

### `player.js` — Ship and Bullet

To manually exercise the Player without waiting for the full game integration,
paste the following into the browser console **while the Playing scene is active**:

```js
import('./input.js').then(async ({ initInput, isKeyHeld }) => {
  initInput();
  const { Player } = await import('./player.js');
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const p = new Player();

  // Check initial state
  console.assert(p.lives === 3, 'lives should start at STARTING_LIVES (3)');
  console.log('Initial x:', p.x, '(should be', 768/2, ')');
  console.log('Bullet on spawn:', p.bullet, '(should be null)');

  // Quick render test
  ctx.clearRect(0, 0, 768, 896);
  p.draw(ctx);
  console.log('draw() called — check canvas for green ship shape');
});
```

- [ ] The console shows **no assertion errors**.
- [ ] A green ship shape is visible on the canvas, horizontally centred, near the bottom.
- [ ] The ship has a recognisable cannon-style silhouette (base, body, barrel).

#### Movement
- [ ] From the Playing scene, press and hold **ArrowLeft** — the ship moves left smoothly.
- [ ] Press and hold **ArrowRight** / **D** — the ship moves right smoothly.
- [ ] Hold a direction key continuously: the ship stops at the canvas edge and does not go off-screen.
- [ ] Release the key: the ship stops immediately.

#### Shooting
- [ ] Press **Space** — a single small white bullet (≈4 × 12 px) appears at the top of the ship and travels upward.
- [ ] While the bullet is in flight, pressing **Space** again does **not** fire a second bullet.
- [ ] The bullet exits the top of the canvas and disappears; pressing **Space** afterwards fires a new bullet.

#### Lives
- [ ] In the console, create a Player instance and call `p.loseLife()` — confirm `p.lives` decrements from 3 to 2.
- [ ] Call `p.loseLife()` twice more — confirm it reaches 0 without errors.

## Tech Stack

- Plain HTML5, CSS3, and ES modules
- No build step required; runs entirely from `file://`
- No npm, no bundler, no transpiler
