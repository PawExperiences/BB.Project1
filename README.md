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
| `invaders.js`    | Invaders                             | **created** |
| `collision.js`   | Collision detection                  | **created** |
| `level1.js`      | Level 1                              | **created** |
| `level2.js`      | Level 2                              | **created** |
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

## Sprite rendering and collision detection (this card)

- `invaders.js`: exports an `InvaderFormation` class with `update(dt)` /
  `draw(ctx)`, matching the same per-frame contract as `Player`.
  - Builds the classic 11-column x 5-row grid (55 invaders) as identical
    coloured rectangles, drawn with `fillRect` (no sprite art/visual
    variation between invaders).
  - The whole formation moves sideways as one rigid block. Whenever any
    invader in the formation would cross a canvas edge on the next step, the
    formation reverses direction and steps down one row *instead* of moving
    sideways that frame; it resumes sideways movement in the new direction
    on the following frame.
  - Exposes an (always-empty, for this card) `bullets` array, reserved for
    the invader-firing logic of a later card ("Level 2: they shoot back") to
    push bullets into -- this card implements no invader shooting/firing AI.
  - Reuses `CANVAS_WIDTH` from `gameConfig.js` rather than redefining canvas
    dimensions.
- `collision.js`: an AABB (axis-aligned bounding box) collision pass, run
  from `game.js`'s `update()` step strictly before `render()`
  ("collide, then draw"):
  - Player-bullet-vs-invader: on overlap, both the bullet and the invader
    are removed, a short fading-circle explosion effect plays at the
    invader's last position for `0.3s`, and `hud.score` increments by `10`.
  - Invader-bullet-vs-player: written generically over any array of bullet
    objects (`invaders.bullets`) so it is already correct once invader
    firing lands in a later card, even though that array is always empty
    here. On overlap, calls the `player.loseLife()` hook exposed by
    `player.js`, mirrors the result into `hud.lives`, and calls
    `game.js`'s exported `triggerGameOver()` once lives reach `0`.
  - Reuses the player bullet's size (`BULLET_WIDTH`/`BULLET_HEIGHT`,
    exported from `player.js`) rather than redefining the bullet's
    dimensions.
- `game.js`: touched only to wire the two modules into the existing loop --
  imports `InvaderFormation` and the `collision` module, constructs one
  `InvaderFormation` alongside the existing `Player`, calls
  `invaders.update(dt)` then `collision.update(dt, player, invaders)` in the
  `Playing` branch of `update()`, and calls `invaders.draw(ctx)` /
  `collision.draw(ctx)` (for explosions) ahead of `player.draw(ctx)` in
  `renderPlaying()`. The loop and canvas machinery themselves are
  unchanged, per "Game loop and canvas framework".

## Level 1: the classic grid (this card)

- `level1.js`: exports a `Level1` class with `update(dt, player)` / `draw(ctx)`
  / a `cleared` flag, matching the same per-frame contract as `Player` and
  `InvaderFormation`. Owns the level-1-specific formation lifecycle; it does
  not re-implement invader sprites, the grid layout, or collision detection --
  those stay owned by `invaders.js` and `collision.js` (from "Sprite
  rendering and collision detection"):
  - On construction (and every restart) spawns a fresh `InvaderFormation`
    (11x5, 55 invaders) from `invaders.js`, reusing its data/`draw()` as-is.
  - Steps the whole formation sideways at a fixed interval (rather than
    `InvaderFormation`'s own continuous per-frame movement, which this card
    does not use) that ramps linearly with how many invaders are still
    alive: ~800ms with all 55 alive down to ~100ms with 1 alive
    (`interval = 100 + (aliveCount - 1) * 700 / 54`), recalculated every
    frame from the live invader count.
  - Whenever the formation's leading edge would cross the canvas boundary on
    its next step, it reverses direction and drops the whole formation down
    by exactly one invader-cell height instead of stepping sideways that
    step.
  - Each frame, checks whether any invader has reached the player ship's
    y-position. If so: calls `player.loseLife()` and mirrors the result into
    `hud.lives` (the same hook `collision.js` already uses), calls `game.js`'s
    `triggerGameOver()` if lives reach `0`, and immediately respawns a fresh
    full 11x5 formation with the step interval reset to ~800ms.
- `game.js`: adds a `level` counter and a level dispatcher in the `Playing`
  branch of `update()`/`renderPlaying()`:
  - `level === 1` routes to the `Level1` instance's `update()`/`draw()`, runs
    the existing `collision.update(dt, player, level1.formation)` pass
    against its formation, and advances `level` to `2` (constructing a new
    `Level2` instance) once `level1.cleared` is `true`.
  - Any other `level` value (i.e. `3`, since `level3.js` does not exist yet)
    falls through to the existing `default` branch, which calls
    `triggerGameOver()` -- a placeholder for the future "Level 3" card to
    replace with real level-3 content.
  - The `Level1` instance is created (and re-created) in `goToPlaying()`, so
    every fresh playthrough (including replaying after a `GameOver`) starts
    `level` back at `1` with a brand-new formation.
  - `renderHud()` now also prints `Level: <n>` centered at the top of the HUD.

## Level 2: they shoot back (this card)

- `level2.js`: exports a `Level2` class with `update(dt, player)` / `draw(ctx)`
  / a `cleared` flag, matching the same per-frame contract as `Level1`. Reuses
  `InvaderFormation` from `invaders.js` for the grid data/draw() (the same
  11x5 layout as Level 1) instead of re-implementing it:
  - Steps the formation sideways on the same edge-drop/reversal pattern as
    Level 1, but using Level 1's step-interval ramp with every resulting
    interval multiplied by `0.67`, so the whole speed-up curve runs ~1.5x
    faster throughout (not just at its endpoints).
  - Invaders shoot back via a single global timer (re-armed at a new random
    interval between 800ms-2000ms after every shot, never one timer per
    column). Each time it fires, invaders are grouped into columns by their
    shared `x` (the whole formation always moves rigidly together, so column
    membership never needs tracking separately), a column with survivors is
    picked uniformly at random, and its lowest surviving invader (the one
    closest to the player) fires. Bullets are owned by `Level2` itself (a
    `bullets` array separate from `InvaderFormation.bullets`, which stays
    empty) and fall straight down at 300px/s.
  - Every 20 seconds (only counted while no UFO is currently on screen) a
    bonus UFO spawns and crosses the screen at 120px/s, entering from
    alternating sides on successive spawns (left, then right, then left...).
    A player bullet that overlaps it scores `tiers[player.shotsFired % 4]`
    points (`[50, 100, 150, 300]`) -- deterministic, never randomly rolled --
    and consumes both the bullet and the UFO before `collision.js`'s
    player-bullet-vs-invader pass runs the same frame, so one bullet never
    scores twice.
  - Player hits (an invader bullet reaching the player, or the formation
    reaching the player's row) cost exactly one life and call the new
    `player.respawn(invulnerableMs)` hook (see `player.js` below), *unless*
    `player.invulnerable` is already `true`, in which case the hit is
    ignored outright: no life lost, no invulnerability restart. Reaching
    `0` lives calls the existing `triggerGameOver()` hook instead of
    respawning.
  - Clearing every invader sets `cleared = true`, the same signal Level 1
    uses, so `game.js` can advance `level` the same way both times.
- `player.js`: touched only to add what Level 2's hit/respawn/invulnerability
  state machine needs, without changing any of Level 1's behavior (these are
  all purely additive -- Level 1 never sets them):
  - `shotsFired`: incremented every time a new bullet is fired, tracked on
    the long-lived `Player` instance so it naturally carries over, unreset,
    from Level 1 into Level 2 (and beyond) -- consumed by `level2.js` for
    deterministic UFO scoring.
  - `respawn(invulnerableMs)`: resets the ship back to its fixed spawn
    position (`x` = horizontally centered, `y` = `SHIP_Y`, both unchanged
    from the constructor's start position) and grants `invulnerableMs` of
    invulnerability.
  - `invulnerable` (a getter) and an internal `invulnerableMs` countdown,
    ticked down in `update(dt)`; while it's `> 0`, `draw(ctx)` flickers the
    ship on/off (skipping just `drawShip()`, not the bullet or the `Lives:`
    readout) instead of drawing it solid every frame.
- `game.js`: gains the `level2.js` import and a `level === 2` branch in both
  `update()`'s level dispatcher and `renderPlaying()`, mirroring the existing
  `level === 1` branch in each: runs `level2.update(dt, player)` then the
  existing `collision.update(dt, player, level2.formation)` pass (still used
  for player-bullet-vs-invader; Level 2's own invader-bullet-vs-player and
  UFO checks are handled entirely inside `level2.js`), advances `level` to
  `3` once `level2.cleared`, and draws `level2.draw(ctx)` in `renderPlaying()`
  when `level === 2`. `Level1 -> Level2` happens automatically the instant
  `level1.cleared` becomes `true` (no level-select screen), constructing the
  `Level2` instance at that point while reusing the same `player` object, so
  `player.lives` and `player.shotsFired` carry over unchanged.

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
   near the bottom-left. Confirm the invader swarm is also visible: an
   11-column x 5-row grid of identical coloured rectangles positioned above
   the player ship.
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
7. Watch the invader formation for a few seconds: confirm it drifts
   sideways as one rigid block (every invader moves together, none
   individually), and that when the formation reaches a canvas edge it
   reverses direction and steps down one row before continuing sideways
   again, rather than overlapping the edge.
8. Move the ship under an invader column and press **Space** to fire.
   Confirm that when the bullet reaches an invader: both the bullet and
   that invader disappear immediately, a brief fading circle "explosion"
   appears at the invader's last position, and `Score:` in the top-left HUD
   increases by `10`. Confirm a bullet that reaches the top of the canvas
   without hitting anything does *not* change the score.
9. Open the browser devtools console and run
   `document.title` (sanity check the page didn't navigate), then run a
   sibling-card smoke check by importing the module's exported state, e.g.
   inspect that `hud.lives === 3` holds via the console if the module was
   exposed for debugging, or simply trust step 4's on-canvas HUD reading.
10. There is no invader-firing AI yet (that's "Level 2: they shoot back"),
    so the invader-bullet-vs-player path can't be triggered from play. To
    exercise it manually, open devtools console and run:
    `const g = await import('./game.js'); const inv = await import('./invaders.js');`
    then push a synthetic bullet at the player's position and confirm a
    life is lost and both `Lives:` readouts (top-right HUD and the
    bottom-left player readout) drop together and stay in sync.
11. To manually reach the `GameOver` scene (since no invader can yet reduce
    lives to `0` through play), open devtools console and run:
    `const m = await import('./game.js'); m.triggerGameOver()`
    Confirm the canvas now shows "GAME OVER", the current score, and
    "Press ENTER to restart".
12. Press **ENTER** again. Confirm it returns immediately to the `Title`
    scene (no reload), and that a subsequent ENTER into `Playing` shows
    `Score: 0` and `Lives: 3` again (reset), while any non-zero hi-score
    from step 11 is preserved.

**Level 1: the classic grid** (continue from a fresh `Playing` scene, e.g.
press ENTER from `Title` again):

13. Confirm the HUD shows `Level: 1` centered at the top for the entire time
    Level 1 is running, and that the 11x5 invader formation from step 4 is
    present and stepping sideways (rather than sliding continuously).
14. Shoot invaders (as in step 8) and confirm the formation's sideways
    stepping visibly speeds up as more invaders are destroyed -- slow
    (roughly one step per ~0.8s) near the start, and noticeably faster
    (roughly one step per ~0.1s) once only a few invaders remain.
15. Let the formation reach a canvas edge (left or right). Confirm the
    entire formation drops down by one invader-row's height and reverses
    horizontal direction, then resumes stepping sideways in the new
    direction -- it should never overlap or cross the canvas edge.
16. To observe the life-loss/restart path without waiting for the full
    formation to descend naturally, open devtools console and run:
    `const m = await import('./game.js');` then, once in `Playing`,
    force an invader down to the player's row (this requires access to the
    live `Level1` instance; if it isn't exposed for debugging, instead let
    play continue until an invader naturally reaches the player ship's row).
    Confirm: `Lives:` in the HUD drops by exactly one, and immediately a
    fresh full 11x5 formation appears at the top of the screen with the
    sideways step visibly back to its slow (~800ms) starting pace.
17. Destroy all 55 invaders in a single Level 1 run (shooting each one, per
    step 8) without letting any reach the player's row. Confirm that the
    instant the last invader is destroyed, the screen transitions straight to
    Level 2 with **no level-select screen** in between: the HUD's `Level:`
    readout changes to `2`, a fresh 11x5 invader formation appears, and the
    `Lives:` readout (both HUD copies) keeps whatever value it had at the end
    of Level 1 (i.e. is *not* reset back to `3`).

**Level 2: they shoot back** (continue from having just reached Level 2 in
step 17; if you lost a life or two clearing Level 1, that's expected and
useful for checking lives carry over):

18. Watch the formation for a few seconds. Confirm it steps sideways the same
    way Level 1's did (discrete steps, edge-drop + reversal, never crossing
    the canvas edge), but noticeably faster at a comparable alive-count than
    Level 1 was (~1.5x the step rate throughout, not just at the start/end).
19. Watch for invader bullets: confirm individual invaders (not the whole
    formation) periodically fire a bullet that falls straight down at a
    steady rate, that bullets appear roughly 0.8-2 seconds apart from each
    other (never in a tight burst from multiple columns at once), and that
    each bullet always originates from the *front* (bottom-most surviving)
    invader of whichever column fired -- never from behind a still-alive
    invader in the same column.
20. Let an invader bullet hit the player ship. Confirm: `Lives:` drops by
    exactly one, the ship immediately reappears at its fixed bottom-center
    start position, and for about 2 seconds it visibly flickers on/off
    (invulnerable) -- confirm that any invader bullet that touches the ship
    during that flicker window does *not* cost another life and does *not*
    restart the 2-second flicker window. Confirm normal hits resume costing
    a life once the flicker stops.
21. Wait up to 20 seconds. Confirm a bonus UFO (a distinctly colored small
    rectangle) crosses the screen at a steady horizontal speed near the top,
    entering from one side and exiting the other. Let it despawn off-screen
    (or shoot it), then wait for the next one and confirm it enters from the
    *opposite* side this time (alternating left/right on successive spawns).
22. Shoot a bonus UFO. Confirm the score jumps by one of `50`, `100`, `150`,
    or `300` (never a value outside that set), and that hitting several UFOs
    across a run cycles through that same fixed set of point values in a
    repeatable order (not randomly) as your total shots-fired count grows --
    the exact value depends on how many shots you've fired all game, so this
    is easiest to eyeball as "always one of those four numbers, changing
    predictably" rather than predicting the exact sequence by hand.
23. Lose all remaining lives (either to invader bullets or the formation
    reaching the player's row). Confirm control passes to the existing
    `GameOver` scene exactly as it did at the end of the original card ("Game
    loop and canvas framework"): final score shown, "Press ENTER to restart".
    Press **ENTER** and confirm it returns to `Title` exactly as before (this
    behavior is reused unmodified, not touched by this card).
24. Destroy every invader in Level 2's grid without losing all lives. Confirm
    the HUD's `Level:` readout advances to `3` the instant the last invader
    is destroyed (there is no Level 3 content yet, so the dispatcher's
    `default` branch will immediately show `GameOver` as a placeholder --
    confirm that happens rather than the game hanging or erroring, which
    confirms the `2 -> 3` transition itself is reachable).

### Automated sanity check performed by the coder agent

This sandboxed environment has no GUI browser available (headless Chromium
and Firefox both failed to launch here due to missing system libraries, and
package installation is blocked in this sandbox), so the coder agent could
not literally double-click `index.html` in a windowed browser. As a
substitute, `game.js`, `invaders.js`, `collision.js`, `player.js` and
`level1.js` were exercised programmatically with plain Node ES module
imports (scratch tooling, not part of this repo) using a stubbed
`document.getElementById` canvas/context, confirming:

- the canvas is sized `768x896` from `gameConfig.js` and the exported `hud`
  object starts at `{ score: 0, lives: 3, hiScore: 0 }`;
- `game.js` and `collision.js` import from each other (a circular ES module
  reference) and load without a temporal-dead-zone error, since `hud` and
  `triggerGameOver` are only read from inside `collision.js` functions,
  never at its module top level;
- `new InvaderFormation()` produces exactly 55 invaders (11x5) and exposes
  an empty `bullets` array;
- calling `update(dt)` repeatedly moves every invader sideways together;
  forcing the formation past a canvas edge and calling `update(dt)` again
  steps every invader down by the fixed step-down amount and flips
  `direction`, without any sideways movement on that same call;
- placing a player bullet exactly on an invader and calling
  `collision.update(dt, player, formation)` removes that invader, clears
  the player's bullet, and increments `hud.score` by `10`;
- pushing a synthetic bullet into `formation.bullets` at the player's
  position and calling `collision.update(...)` calls `player.loseLife()`,
  syncs `hud.lives` to `player.lives`, and consumes the bullet;
- driving `player.lives` to `0` via that same path calls the imported
  `triggerGameOver()` (observed via the resulting scene state).
- `game.js` and `level1.js` also import from each other (a second circular
  ES module reference, alongside the existing `game.js`/`collision.js` one)
  and load without a temporal-dead-zone error regardless of which of the two
  is imported first -- verified both ways, since `level1.js`'s use of `hud`
  and `triggerGameOver` is confined to method bodies, and `game.js` only
  constructs a `Level1` lazily inside `goToPlaying()` rather than at module
  top level;
- `new Level1()` spawns a fresh 55-invader formation; the reference step
  interval formula (`100 + (aliveCount - 1) * 700 / 54`) evaluates to `800`
  at 55 alive and `100` at 1 alive;
- repeatedly calling `update(dt, player)` with a fixed `dt = 1/60s` steps the
  formation sideways in fixed increments (not a continuous slide), and
  forcing the formation to the canvas edge and continuing to call `update()`
  drops the whole formation down by exactly one invader-cell height (`24px`)
  and reverses `direction` on the step that crosses the boundary;
- placing an invader at the player's `y` and calling `update(dt, player)`
  calls `player.loseLife()`, and the formation is immediately replaced with
  a fresh full 55-invader formation (`level1.formation.invaders.length` back
  to `55`);
- emptying `level1.formation.invaders` and calling `update()` sets
  `level1.cleared = true`.

`level2.js` and the `player.js` additions (`respawn()`, `shotsFired`,
`invulnerable`) were exercised the same way, via the same stubbed-DOM Node
harness, confirming:

- `game.js` and `level2.js` also import from each other without a
  temporal-dead-zone error, the same circular-reference pattern as
  `level1.js`;
- `new Level2()` spawns a fresh 55-invader formation and seeds its global
  fire timer to a value inside `[800, 2000)` ms;
- the Level 2 step-interval formula evaluates to `536` (`800 * 0.67`) at 55
  alive and `67` (`100 * 0.67`) at 1 alive -- exactly Level 1's reference
  values from `100`/`800` multiplied by `0.67`;
- forcing the global fire timer to `0` and calling `updateFiring()` pushes
  exactly one bullet, and grouping the formation by column confirms each
  column holds all 5 rows (so the "lowest surviving invader" pick has real
  rows to choose between) -- the invader picked to fire always has the
  largest `y` (frontmost/closest to the player) among its column;
- placing an invader bullet exactly on the player and calling
  `checkPlayerHit(player)` costs one life, moves the player back to its
  fixed start `(x, y)`, and sets `player.invulnerable = true`; immediately
  placing a second bullet on the (now-relocated) player and calling
  `checkPlayerHit(player)` again leaves `lives` and the invulnerability
  countdown unchanged -- confirming the ignore-hits-while-invulnerable rule;
- `spawnUfo()` alternates entry side/direction on successive calls; placing
  a player bullet on the UFO and calling `checkUfoHit(player)` with
  `player.shotsFired = 6` (`6 % 4 == 2`) awards exactly `150` points (the
  tier at index `2` in `[50, 100, 150, 300]`), clears the UFO, and consumes
  the player's bullet;
- forcing an invader down to the player's row and calling
  `update(dt, player)` with `player.lives = 1` costs the last life and
  calls the imported `triggerGameOver()`, mirroring Level 1's reach-row
  handling through the same hit path bullets use.

This does not replace a real visual check. **The manual steps above should
still be run by a human (or the QA agent) in an actual Firefox window**
before this card is considered fully verified end-to-end -- in particular,
the explosion effect's visual appearance and the formation's edge-bounce
timing/feel can only be judged by eye.
