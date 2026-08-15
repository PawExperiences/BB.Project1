# Space Invaders (e2e project)

A hand-written, dependency-free browser game built with plain HTML, CSS and ES
modules. No bundler, no package manager, no build step — everything runs by
opening `index.html` directly from the filesystem (`file://`).

## File layout

### Game loop and canvas framework
- `index.html` — the page shell: a 768x896 `<canvas>` on a dark background, loads `game.js` as an ES module.
- `gameConfig.js` — shared constants (canvas size, player/bullet speed, starting lives).
- `game.js` — the fixed-timestep game loop, the Title/Playing/Game Over scene state machine, ENTER-driven scene transitions, and the canvas HUD (score/lives/level). Exports the `hudState` object (`score`, `lives`, `level`, `hiScore`) for later modules to mutate. Drives the active level by calling `level1.update(dt, player, hudState)` once per fixed step (instead of stepping an `Invaders` instance directly), then runs collision as before.

### Keyboard input and the player ship
- `input.js` — tracks currently-held keys from raw `keydown`/`keyup` transitions. Exports `initInput()` (registers the listeners, called once from `game.js`) and `isKeyHeld(key)` (returns whether `key` is currently down).
- `player.js` — exports the `Player` class: a ship that moves left/right (Arrow keys or A/D) at `PLAYER_SPEED`, clamped to the canvas edges; fires a single in-flight bullet upward at `BULLET_SPEED` on Space; is drawn procedurally with canvas arcs/rects only; and owns a lives counter (`getLives()` / `decrementLives()`, initialized from `STARTING_LIVES`, floored at 0). `game.js` creates one `Player` per run and drives it via `update(dt)` / `draw(ctx)` during the Playing scene. The player's own lives counter is independent of the HUD's `hudState.lives` — wiring hit detection to decrement the player and reflect that in the HUD/game-over flow is owned by the Level and Boss cards.

### Sprite rendering and collision detection
- `invaders.js` — exports the `Invaders` class: an 11x5 grid (55 invaders) of identical flat-colored rectangles in classic formation spacing. `update(dt)` steps the whole formation sideways at an interval given by the instance's `stepIntervalMs` property (mutable — a level module sets the pace); when the next step would carry any alive invader past the left or right canvas edge, the formation instead drops down by one invader-cell height (the grid's row pitch) and reverses direction. `draw(ctx)` renders every alive invader plus a short fixed-duration explosion flash for invaders mid-kill. `reset()` restores a fresh full-strength 11x5 grid at the starting position/speed in place (used for both initial construction and a level restart). Also owns `bullets`, an array of invader-fired bullets that stays empty for now — no invader shooting/AI is implemented here; that is deferred to "Level 2: they shoot back".
- `collision.js` — exports `collide(player, invaders, hudState)`: one generic AABB overlap check reused for both combat pairings. Player-bullet-vs-invader: removes the bullet, replaces the invader with its explosion, removes the invader, and increments `hudState.score` by a fixed amount. Invader-bullet-vs-player: removes the bullet and calls the player's existing `decrementLives()` hook once per overlap; it implements no lives/game-over logic itself. `game.js` calls `collide()` once per update step, after `player.update()`/`level1.update()` and before that frame's `render()`, so collision resolution always completes before drawing.

### Level 1: the classic grid
- `level1.js` — exports the `Level1` class, which owns an `Invaders` instance and drives it for the opening level:
  - **Formation**: constructs a fresh 11x5 (55-invader) grid via `Invaders`, at that class's defined starting layout.
  - **Step speed**: after every `update()` call, recomputes `invaders.stepIntervalMs` from the current alive count using `intervalMs = 100 + (aliveCount - 1) * (700 / 54)` — ~800ms at 55 alive down to ~100ms at 1 alive, only writing the value when the alive count actually changed.
  - **Edge & drop**: unchanged from `invaders.js`'s own behavior (see above) — `Level1` just drives `invaders.update(dt)` each frame.
  - **Loss & restart**: each update, checks whether the formation's front (bottom) grid row has reached the player's row (`invader bottom edge >= player.y`); if so, decrements `hudState.lives` (floored at 0) and calls `invaders.reset()`, which restores the full 11x5 layout, original position and ~800ms starting speed. `hudState.score` and `hudState.lives` (beyond the one decrement) are untouched.
  - **Win & transition**: once the alive count reaches 0, sets `this.completed = true` and `hudState.level = 2` (the `NEXT_LEVEL_NUMBER` constant); the level object then no-ops on further `update()` calls. Level 2's actual gameplay is a separate, not-yet-implemented card — clearing Level 1 only flips the HUD level number and stops Level 1's own stepping/loss logic.
  - `draw(ctx)` delegates straight to the wrapped `Invaders` instance.
- `game.js` changes: `hudState` gained a `level` field (initialized to `level1.js`'s exported `LEVEL_NUMBER` constant, reset on every new run). `game.js` now creates a `Level1` instance (`export let level1`) instead of an `Invaders` instance directly, and calls `level1.update(dt, player, hudState)` in place of the old direct `invaders.update(dt)`. `export let invaders` is kept as a live alias of `level1.invaders` (the exact same instance) purely so existing devtools-console verification steps that poke `invaders.bullets` etc. keep working. The HUD gained a third line, `LEVEL: <n>`, drawn from `hudState.level`.

### Planned future cards (not yet created)
- `level2.js` — level 2 wave/layout definition (introduces invader shooting/AI).
- `level3.js` — level 3 wave/layout definition.
- `boss.js` — boss enemy behavior and encounter.

Each future module has a one-line comment marking its future import point at
the top of `game.js`; none of them are created, stubbed, or imported by this
card.

## Manual verification (file://, no server)

1. Open `index.html` directly in a browser (double-click it, or use
   `File > Open` — a `file://...` URL). Do not run a local server.
2. **Title screen**: confirm a 768x896 canvas appears on a dark page
   background showing the text "SPACE INVADERS" and "Press ENTER to start".
   Check the browser devtools console — there should be no errors.
3. **Start**: press ENTER. The scene switches to Playing (no page reload)
   and the HUD in the top-left shows `SCORE: 0`, `LIVES: 3` and `LEVEL: 1`.
   A procedurally drawn ship (arcs and rectangles, no images) appears near
   the bottom-center of the canvas.
4. **Movement**: hold ArrowLeft or `A` — the ship moves left smoothly and
   stops exactly at the left canvas edge (it never moves partially off-screen).
   Hold ArrowRight or `D` — same behavior at the right edge. Movement speed
   should look identical regardless of frame rate.
5. **Firing**: press Space — a small yellow bullet spawns at the ship and
   travels upward off the top of the canvas. While that bullet is on screen,
   further Space presses/holds do not spawn another bullet. Once the bullet
   scrolls off the top, pressing (or continuing to hold) Space fires a new one.
6. **Backgrounding**: switch to another tab for several seconds, then switch
   back. The game should resume smoothly, without visibly "catching up" or
   freezing — the accumulated update time is clamped, so a large gap does not
   trigger a burst of queued update steps.
7. **Game Over**: no invader currently fires back (that's added by "Level 2:
   they shoot back"), so the only way lives drop today is the formation
   reaching the player's row (see step 13) — slow to trigger through normal
   play. To verify Game Over directly, temporarily set `hudState.lives = 0`
   from the browser devtools console while in the Playing scene, and confirm
   on the next frame the scene switches to Game Over, rendering "GAME OVER",
   the numeric score, and "Press ENTER to restart".
8. **Restart**: with Game Over showing, press ENTER. The scene switches back
   to Title (no page reload), the ship resets to its starting position, and
   any in-flight bullet is cleared, ready to start again.
9. **Invader formation**: start a run. Confirm an 11-column by 5-row grid
   (55 total) of identically colored/sized red rectangles appears near the
   top of the canvas, laid out at Level 1's starting position. Watch it: the
   whole formation steps sideways together, starting at a leisurely pace
   (roughly one step every 800ms with all 55 alive); when its leading edge
   reaches a canvas edge, it drops down by one row's worth of vertical
   spacing and reverses direction, repeating indefinitely.
10. **Step speed scaling**: fire at the formation and thin it out over time
    (or use the devtools shortcut in step 12 to mass-kill invaders). Confirm
    the formation visibly speeds up as invaders die — by the time only a
    few remain, it steps noticeably faster (down to roughly one step every
    100ms with a single invader left), matching
    `intervalMs = 100 + (aliveCount - 1) * (700 / 54)`.
11. **Player-bullet-vs-invader collision**: fire at the formation (Space).
    When a bullet's bounding box overlaps an invader: the bullet disappears,
    a brief yellow explosion flashes where the invader was, the invader is
    then gone, and the HUD's `SCORE` value increases by the same fixed
    amount every time.
12. **Invader-bullet-vs-player collision** (no invader fires within this
    card's scope, so this path can't be reached through normal play — it is
    verified manually instead). With the Playing scene active, open the
    browser devtools console and run:
    ```js
    const m = await import('./game.js');
    const before = m.player.getLives();
    m.invaders.bullets.push({ x: m.player.x, y: m.player.y, width: 4, height: 4 });
    ```
    On the next frame the pushed bullet overlaps the player's bounding box,
    so the generic collision pass removes it from `m.invaders.bullets` and
    calls the player's existing `decrementLives()` hook exactly once. Confirm
    with `m.player.getLives() === before - 1` and that
    `m.invaders.bullets.length === 0`.
13. **Loss condition & Level 1 restart**: with the Playing scene active,
    open the devtools console and force the formation down to the player's
    row:
    ```js
    const m = await import('./game.js');
    m.hudState.score = 250; // pick any non-zero value to confirm it survives the restart
    m.level1.invaders.offsetY = 800;
    ```
    Within a moment, confirm: `m.hudState.lives` drops by exactly 1 from
    whatever it was before, `m.hudState.score` is unchanged (still `250`),
    and the formation snaps back to a full 11x5 grid at its original
    on-screen position, moving at the slow ~800ms starting pace again
    (`m.level1.invaders.stepIntervalMs === 800`, `m.level1.invaders.offsetX
    === 0`, `m.level1.invaders.offsetY === 0`).
14. **Win condition & Level 2 transition**: with the Playing scene active,
    open the devtools console and clear the formation directly:
    ```js
    const m = await import('./game.js');
    for (const inv of m.level1.invaders.getAliveInvaders()) m.level1.invaders.kill(inv);
    ```
    Within a moment, confirm the HUD's `LEVEL` line updates from `1` to `2`
    (also readable as `m.hudState.level === 2`), and no invaders remain
    on screen.
15. **HUD level indicator**: throughout the above steps, confirm the HUD's
    `LEVEL:` line is visible at all times during Playing, starts at `1` on
    a fresh run/restart, and updates immediately (same frame it changes,
    no page reload) when Level 1 is cleared per step 14.
