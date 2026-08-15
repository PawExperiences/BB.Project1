# Space Invaders (file:// only, no build step)

A hand-written HTML/Canvas/ES-modules Space Invaders clone. No framework, no
bundler, no package manager, no server -- every file is opened directly from
disk (`file://`).

## Planned file layout

This card ("Game loop and canvas framework") ships only the four files
marked **(this card)**. Every other file is owned by a sibling card and is
intentionally **not** created, stubbed, or imported here.

| File            | Owner card                          | Status                |
|------------------|--------------------------------------|------------------------|
| `index.html`     | Game loop and canvas framework       | **this card** |
| `game.js`        | Game loop and canvas framework       | **this card** |
| `gameConfig.js`  | Game loop and canvas framework       | **this card** |
| `README.md`      | Game loop and canvas framework       | **this card** |
| `input.js`       | Player & Input                       | **created** |
| `player.js`      | Player & Input                       | **created** |
| `invaders.js`    | Invaders                             | not yet created |
| `collision.js`   | Collision detection                  | not yet created |
| `level1.js`      | Level 1                              | not yet created |
| `level2.js`      | Level 2                              | not yet created |
| `level3.js`      | Level 3                              | not yet created |
| `boss.js`        | Boss                                 | not yet created |

Everywhere `game.js` will eventually wire one of the files above in, it
carries a one-line comment naming the owning card instead of a real
`import` (a real import to a file that doesn't exist yet would fail to
resolve under `file://`).

## What this card provides

- `gameConfig.js`: named constants `CANVAS_WIDTH`, `CANVAS_HEIGHT`,
  `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`, consumed by `index.html`
  (via `game.js`, which sizes the canvas) and by `game.js` itself, instead of
  literals being duplicated.
- `index.html`: a dark-background page with a single canvas
  (`id="game"`), loading `game.js` as `<script type="module">`.
- `game.js`:
  - A fixed-timestep loop using the accumulator pattern: `update()` is
    called exactly 60 times per simulated second, with `update()` and
    `render()` kept as separate functions.
  - The per-frame delta fed into the accumulator is clamped to a maximum
    (`MAX_FRAME_DELTA = 0.25s`) so that resuming a backgrounded tab produces
    a bounded number of catch-up `update()` calls instead of a
    burst/"spiral of death".
  - A three-state scene machine -- `Title`, `Playing`, `GameOver` -- with
    exactly one scene active/rendered at a time:
    - `Title`: renders "SPACE INVADERS" and "Press ENTER to start"; ENTER
      moves to `Playing`.
    - `Playing`: runs the loop and draws the HUD (score, hi-score, lives);
      contains no gameplay logic of its own -- that's added by sibling
      cards. Exports `triggerGameOver()` so a future card (e.g. collision
      detection, once lives reach 0) can request the `Playing -> GameOver`
      transition; this card does not call it itself.
    - `GameOver`: renders "GAME OVER", the final score, and "Press ENTER to
      restart"; ENTER moves back to `Title` and resets `score`/`lives` for a
      new run (`hiScore` is preserved, and only persists for the current
      page session -- no `localStorage`).
  - Exports a named HUD state object, `hud = { score, lives, hiScore }`
    (initialised to `0`, `STARTING_LIVES`, `0`), so later cards can read and
    mutate it directly.

## Keyboard input and the player ship (this card)

- `input.js`: `initInput()` registers a single `keydown`/`keyup` listener pair
  and tracks currently-held keys in a `Set` (add on `keydown`, delete on
  `keyup`); `isKeyHeld(key)` reports whether a key is in that set. Because
  the set only changes on down/up transitions, native key-repeat `keydown`
  events for an already-held key are a no-op -- `isKeyHeld` keeps returning
  `true` continuously instead of toggling.
- `player.js`: exports a `Player` class with `update(dt)` / `draw(ctx)`,
  matching `game.js`'s per-frame contract:
  - Moves left/right with ArrowLeft/ArrowRight or `a`/`A`/`d`/`D` at
    `PLAYER_SPEED` (from `gameConfig.js`), scaled by `dt`, clamped every
    frame so the ship stays within `[0, CANVAS_WIDTH]`.
  - Drawn procedurally (an `arc` nose plus a `fillRect` hull) -- no image
    assets.
  - Space fires a single bullet at a time at `BULLET_SPEED` (from
    `gameConfig.js`); no new bullet spawns while one is active, and it's
    removed once its `y` passes the top edge of the canvas, freeing the
    next shot.
  - Tracks its own `lives` counter (seeded from `STARTING_LIVES`) with a
    `loseLife()` hook for later collision/level cards to call, and draws a
    minimal `Lives: N` readout near the bottom-left of the canvas.
- `game.js` now calls `initInput()` once at load, and during the `Playing`
  scene calls `player.update(dt)` / `player.draw(ctx)` each frame.

## Manual verification path

This stack has no test runner, no server, and no build step by design (see
`PROJECT TECH STACK` in the card brief), so verification is manual,
step-by-step, over a direct `file://` open.

**Browser compatibility note:** some Chromium-based browsers block
`<script type="module">` fetches over `file://` via CORS, while Firefox
generally allows same-directory ES module loading over `file://`. Prefer
Firefox for the manual check below; if you must use a Chromium-based
browser, expect the module script to fail to load unless you serve the
folder instead of double-clicking it.

Steps (verify in **Firefox**):

1. Locate `index.html` in this folder and double-click it (or open it via
   `File > Open File...` in Firefox) -- no server, no build step.
2. Confirm the page background is dark and a `768x896` canvas is visible,
   centered on the page.
3. Confirm the canvas shows "SPACE INVADERS" and "Press ENTER to start"
   (the `Title` scene) and that nothing is animating/updating gameplay.
4. Press **ENTER**. Confirm the screen switches immediately (no page
   reload/navigation, no URL change) to the `Playing` scene, which shows
   the HUD: `Score: 0`, `Hi-Score: 0` in the top-left and `Lives: 3` in the
   top-right, plus the player ship (a small green rounded-nose-and-hull
   shape) near the bottom-center of the canvas and a `Lives: 3` readout
   near the bottom-left. There are no invaders yet -- that's expected, as
   this is a sibling card's scope.
5. Hold **ArrowRight** (or **D**): confirm the ship moves smoothly right
   and stops exactly at the canvas's right edge, never sliding past it.
   Hold **ArrowLeft** (or **A**): confirm it moves left and stops exactly
   at the left edge (`x = 0`), never going negative. Confirm holding a key
   down produces continuous smooth movement (no jittering/toggling from
   key-repeat) and that the browser devtools console shows no errors.
6. Press **Space**: confirm a small bullet rectangle appears at the ship's
   nose and travels upward at a steady rate. While it's on-screen, press
   **Space** repeatedly: confirm no second bullet appears. Once the bullet
   reaches the top of the canvas and disappears, confirm pressing **Space**
   again fires a new bullet.
7. Open the browser devtools console and run
   `document.title` (sanity check the page didn't navigate), then run a
   sibling-card smoke check by importing the module's exported state, e.g.
   inspect that `hud.lives === 3` holds via the console if the module was
   exposed for debugging, or simply trust step 4's on-canvas HUD reading.
8. To manually reach the `GameOver` scene (since no lives-loss trigger
   exists yet), open devtools console and run:
   `const m = await import('./game.js'); m.triggerGameOver()`
   Confirm the canvas now shows "GAME OVER", the score (`0`), and
   "Press ENTER to restart".
9. Press **ENTER** again. Confirm it returns immediately to the `Title`
   scene (no reload), and that a subsequent ENTER into `Playing` shows
   `Score: 0` and `Lives: 3` again (reset), while any non-zero hi-score
   from step 8 is preserved.

### Automated sanity check performed by the coder agent

This sandboxed environment has no GUI browser available (headless Chromium
and Firefox both failed to launch here due to missing system libraries, and
package installation is blocked in this sandbox), so the coder agent could
not literally double-click `index.html` in a windowed browser. As a
substitute, `game.js` was exercised programmatically with Node + jsdom
(scratch tooling, not part of this repo) using a stubbed
`HTMLCanvasElement.getContext`, confirming:

- the canvas is sized `768x896` from `gameConfig.js`;
- the exported `hud` object starts at `{ score: 0, lives: 3, hiScore: 0 }`;
- `Title -> Playing` and `GameOver -> Title` both fire on a synthetic
  `keydown` `Enter` event, with no page navigation;
- the `Playing` scene's HUD draw calls reflect the live `hud` values;
- `triggerGameOver()` renders "GAME OVER" + the score and updates
  `hiScore` to the max of itself and the final score;
- returning to `Title` resets `score`/`lives` but preserves `hiScore`;
- the `requestAnimationFrame` loop keeps scheduling frames steadily over
  time without throwing.

This does not replace a real visual check. **Steps 1-7 above should still be
run by a human (or the QA agent) in an actual Firefox window** before this
card is considered fully verified end-to-end.
