# Space Invaders (e2e project)

A hand-written, dependency-free browser game built with plain HTML, CSS and ES
modules. No bundler, no package manager, no build step — everything runs by
opening `index.html` directly from the filesystem (`file://`).

## File layout

### Game loop and canvas framework
- `index.html` — the page shell: a 768x896 `<canvas>` on a dark background, loads `game.js` as an ES module.
- `gameConfig.js` — shared constants (canvas size, player/bullet speed, starting lives).
- `game.js` — the fixed-timestep game loop, the Title/Playing/Game Over scene state machine, ENTER-driven scene transitions, and the canvas HUD (score/lives/level). Exports the `hudState` object (`score`, `lives`, `level`, `hiScore`) for later modules to mutate. While `level2` (see below) hasn't been created yet, drives `level1.update(dt, player, hudState)` once per fixed step and runs `collide(player, invaders, hudState)` for it; the moment `level1.completed` flips true, creates a `Level2` instance (`export let level2`) and from then on drives `level2.update(dt, player, hudState)` instead — Level 2 owns its own collision handling internally, so `game.js` stops calling `collide()` itself once the handoff happens. This switch happens within the same fixed step Level 1 clears, so no level-select screen or blank frame appears in between. `player` and `hudState` are never recreated on this handoff, so the player's cumulative shot counter and `hudState.lives` carry over unchanged.

### Keyboard input and the player ship
- `input.js` — tracks currently-held keys from raw `keydown`/`keyup` transitions. Exports `initInput()` (registers the listeners, called once from `game.js`) and `isKeyHeld(key)` (returns whether `key` is currently down).
- `player.js` — exports the `Player` class: a ship that moves left/right (Arrow keys or A/D) at `PLAYER_SPEED`, clamped to the canvas edges; fires a single in-flight bullet upward at `BULLET_SPEED` on Space; is drawn procedurally with canvas arcs/rects only; and owns a lives counter (`getLives()` / `decrementLives()`, initialized from `STARTING_LIVES`, floored at 0). `game.js` creates one `Player` per run and drives it via `update(dt)` / `draw(ctx)` during the Playing scene. The player's own lives counter is independent of the HUD's `hudState.lives` — wiring hit detection to decrement the player and reflect that in the HUD/game-over flow is owned by the Level and Boss cards. Also owns two things added for "Level 2: they shoot back": a session-wide cumulative shot counter (`shotCount`, exposed via `getShotCount()`), incremented once per successful `fire()` call and never reset except by creating a new `Player` on a fresh run; and post-respawn invulnerability (`respawn()` resets the ship to its fixed bottom-centre start position and starts a 2-second `invulnerableTimer`; `isInvulnerable()` reads it; `draw()` blinks the ship on/off every 0.1s while it's active). `Player` itself never decides *when* a respawn or hit happens — level2.js detects hits and calls `respawn()`.

### Sprite rendering and collision detection
- `invaders.js` — exports the `Invaders` class: an 11x5 grid (55 invaders) of identical flat-colored rectangles in classic formation spacing. `update(dt)` steps the whole formation sideways at an interval given by the instance's `stepIntervalMs` property (mutable — a level module sets the pace); when the next step would carry any alive invader past the left or right canvas edge, the formation instead drops down by one invader-cell height (the grid's row pitch) and reverses direction. `draw(ctx)` renders every alive invader plus a short fixed-duration explosion flash for invaders mid-kill. `reset()` restores a fresh full-strength 11x5 grid at the starting position/speed in place (used for both initial construction and a level restart). Also owns `bullets`, an array of invader-fired bullets that stays empty for now — no invader shooting/AI is implemented here; that is deferred to "Level 2: they shoot back".
- `collision.js` — exports `collide(player, invaders, hudState)`: one generic AABB overlap check reused for both combat pairings. Player-bullet-vs-invader: removes the bullet, replaces the invader with its explosion, removes the invader, and increments `hudState.score` by a fixed amount. Invader-bullet-vs-player: removes the bullet and calls the player's existing `decrementLives()` hook once per overlap; it implements no lives/game-over logic itself. `game.js` calls `collide()` once per update step, after `player.update()`/`level1.update()` and before that frame's `render()`, so collision resolution always completes before drawing. Also exports the underlying `overlaps(a, b)` AABB test directly, so level2.js can reuse the exact same overlap math for pairings this module doesn't know about (the bonus UFO, invulnerability-aware player hits) without duplicating it.

### Level 1: the classic grid
- `level1.js` — exports the `Level1` class, which owns an `Invaders` instance and drives it for the opening level:
  - **Formation**: constructs a fresh 11x5 (55-invader) grid via `Invaders`, at that class's defined starting layout.
  - **Step speed**: after every `update()` call, recomputes `invaders.stepIntervalMs` from the current alive count using `intervalMs = 100 + (aliveCount - 1) * (700 / 54)` — ~800ms at 55 alive down to ~100ms at 1 alive, only writing the value when the alive count actually changed.
  - **Edge & drop**: unchanged from `invaders.js`'s own behavior (see above) — `Level1` just drives `invaders.update(dt)` each frame.
  - **Loss & restart**: each update, checks whether the formation's front (bottom) grid row has reached the player's row (`invader bottom edge >= player.y`); if so, decrements `hudState.lives` (floored at 0) and calls `invaders.reset()`, which restores the full 11x5 layout, original position and ~800ms starting speed. `hudState.score` and `hudState.lives` (beyond the one decrement) are untouched.
  - **Win & transition**: once the alive count reaches 0, sets `this.completed = true` and `hudState.level = 2` (the `NEXT_LEVEL_NUMBER` constant); the level object then no-ops on further `update()` calls. `game.js` reacts to `level1.completed` by creating and switching to a `Level2` instance on the very next check within the same fixed step — see "Level 2: they shoot back" below.
  - Also exports `stepIntervalForAliveCount(aliveCount)` (the formula above) so level2.js can reuse the identical curve, scaled by its own speed multiplier, instead of duplicating it.
  - `draw(ctx)` delegates straight to the wrapped `Invaders` instance.
- `game.js` changes: `hudState` gained a `level` field (initialized to `level1.js`'s exported `LEVEL_NUMBER` constant, reset on every new run). `game.js` now creates a `Level1` instance (`export let level1`) instead of an `Invaders` instance directly, and calls `level1.update(dt, player, hudState)` in place of the old direct `invaders.update(dt)`. `export let invaders` is kept as a live alias of `level1.invaders` (the exact same instance) purely so existing devtools-console verification steps that poke `invaders.bullets` etc. keep working. The HUD gained a third line, `LEVEL: <n>`, drawn from `hudState.level`.

### Level 2: they shoot back
- `level2.js` — exports the `Level2` class, reached automatically the instant Level 1's formation is cleared (no level-select screen). Owns a second `Invaders` instance and drives it for the second wave:
  - **Formation**: a fresh 11x5 (55-invader) grid, identical starting layout to Level 1 (via the same `Invaders` class).
  - **Step speed**: reuses `level1.js`'s exported `stepIntervalForAliveCount(aliveCount)` curve, but multiplies every resulting interval by `0.67`, so the formation advances ~1.5x as fast as in Level 1 at the same alive count.
  - **Lives & shot count carryover**: takes no constructor arguments for these — `hudState.lives` and `player.shotCount` are simply whatever they already are, because `game.js` neither resets `hudState` nor recreates `player` when it switches from `level1` to `level2`.
  - **Invader return fire**: a single instance-level timer (`fireTimer`/`fireDelayMs`), *not* one per column. Counts up each frame; once it reaches the current `fireDelayMs` (freshly re-rolled uniformly in `[800, 2000)` ms after every shot, including the very first), it picks uniformly at random among the columns that still have a living invader, and fires from only that column's lowest surviving invader (highest `row` index, i.e. nearest the player) — an invader with a living invader below it in its column can never fire. The bullet is a plain `{x, y}` falling at a constant 300 px/s, stored in `this.invaderBullets` (kept separate from the wrapped `Invaders` instance's own always-empty `bullets` array, so `collide()`'s generic invader-bullet-vs-player pass — which has no concept of invulnerability or respawn — never touches them).
  - **Bonus UFO**: `this.ufoTimer` accumulates level time; every 20000ms (and only if no UFO is currently on screen) spawns one, alternating entry side each successive spawn (`nextUfoFromLeft`, true for the very first UFO of the level). It crosses at a constant 120 px/s and is simply discarded with no score effect if it exits the far edge unhit. A player-bullet hit removes the UFO, consumes the bullet, and awards `UFO_SCORE_TIERS[(player.shotCount - 1) % 4]` points where `UFO_SCORE_TIERS = [50, 100, 150, 300]` — a pure function of the player's session-wide cumulative shot count at the moment of the hit (shot count already includes the shot that landed the hit, since it's incremented in `player.fire()`), so the sequence of tiers awarded across a session is fully deterministic and reproducible, never randomized.
  - **Player hits & respawn**: each `update()`, after driving the formation/bullets/UFO, calls the imported `collide(player, this.invaders, hudState)` for player-bullet-vs-base-grid scoring (identical `+10`-per-kill behavior to Level 1), then runs its own invulnerability-aware checks: if the player isn't currently invulnerable (`player.isInvulnerable()`), tests `this.invaderBullets` and every alive base-grid invader against the player's AABB (via `collision.js`'s exported `overlaps()`); any overlap decrements `hudState.lives` (floored at 0) exactly once for that frame and calls `player.respawn()` (fixed bottom-centre start position, 2s invulnerability with a visible flash — both implemented in `player.js`). A hit registered while already invulnerable is fully ignored: no life lost, no re-respawn, and any invader bullet involved is left alone to keep falling.
  - **Game Over hand-off**: `Level2` does not implement Game Over itself. It only ever decrements `hudState.lives`; `game.js`'s existing `if (hudState.lives <= 0)` check (unchanged from the framework card) is what switches the scene to `GAME_OVER`.
  - `draw(ctx)` draws the invader grid, then invader bullets, then the UFO (if present); `game.js` draws the player ship on top, same as it does for Level 1.
- `game.js` changes: see the updated `game.js` bullet above — imports `Level2`, exports `export let level2` (`null` until Level 1 clears, reset to `null` in `resetRun()`), and both `update()`/`renderPlaying()` branch on whether `level2` exists yet.

### Planned future cards (not yet created)
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
7. **Game Over**: the quickest deterministic way to reach it is still a
   console shortcut (invader return fire is added in Level 2 and verified
   separately in step 24 below). To verify Game Over directly, temporarily
   set `hudState.lives = 0` from the browser devtools console while in the
   Playing scene, and confirm on the next frame the scene switches to Game
   Over, rendering "GAME OVER", the numeric score, and "Press ENTER to
   restart".
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
14. **Win condition & Level 2 handoff**: with the Playing scene active,
    open the devtools console and clear the Level 1 formation directly:
    ```js
    const m = await import('./game.js');
    for (const inv of m.level1.invaders.getAliveInvaders()) m.level1.invaders.kill(inv);
    ```
    Within a moment, confirm the HUD's `LEVEL` line updates from `1` to `2`
    (also readable as `m.hudState.level === 2`), `m.level2` is no longer
    `null`, and — with no level-select screen or blank frame shown in
    between — a fresh 11x5 invader grid for Level 2 appears immediately in
    place of the cleared Level 1 grid.
15. **HUD level indicator**: throughout the above steps, confirm the HUD's
    `LEVEL:` line is visible at all times during Playing, starts at `1` on
    a fresh run/restart, and updates immediately (same frame it changes,
    no page reload) when Level 1 is cleared per step 14.

### Level 2 verification (continues directly from step 14 above)

16. **Lives & shot count carry over**: right after triggering the Level 2
    handoff in step 14, open the devtools console and confirm
    `m.hudState.lives` is whatever it was at the end of Level 1 (not reset
    to `3`), and `m.player.getShotCount()` equals however many shots you
    fired so far this run (not reset to `0`). Fire a few more shots in
    Level 2 and confirm `m.player.getShotCount()` keeps incrementing from
    where it left off, rather than restarting.
17. **Formation reuse & 1.5x speed**: confirm the Level 2 grid is the same
    11x5 (55-invader) layout as Level 1, at the same starting position.
    Watch it step: at full strength it should step roughly every
    `800 * 0.67 ≈ 536ms` — visibly faster than Level 1's ~800ms pace — and
    speed up further as invaders die, following the same shape of curve as
    Level 1 but 1.5x throughout. Confirm precisely via devtools:
    `m.level2.invaders.stepIntervalMs` should equal Level 1's
    `100 + (aliveCount - 1) * (700 / 54)` formula for the current alive
    count, multiplied by `0.67`.
18. **Invader return fire — global timer & targeting**: watch Level 2 play
    out for a while. Individual invaders periodically fire a bullet
    downward; confirm bullets only ever come from a column's lowest
    surviving invader (never from one with a living invader still beneath
    it in the same column), and that firings land at irregular, randomly
    spaced intervals (roughly every 0.8-2s) rather than each column having
    its own regular cadence.
19. **Invader bullet physics**: confirm each invader-fired bullet falls
    straight down (no horizontal drift) at a constant speed, and simply
    disappears once it passes the bottom of the canvas if it never hits
    the player.
20. **Bonus UFO — spawn, alternating side, speed, miss**: watch Level 2 for
    about 20 seconds of play time. A UFO should cross the very top of the
    canvas, entering from the left on its first appearance. Let it cross
    without shooting it — confirm it exits the opposite (right) side and
    the score is unaffected. Wait roughly another 20 seconds for the next
    UFO and confirm it enters from the right this time (sides alternate on
    every spawn). Its crossing speed should look constant, taking about
    `768 / 120 ≈ 6.4s` to cross the full canvas width.
21. **UFO scoring tiers**: note `m.player.getShotCount()` in the console,
    then shoot down a UFO. Confirm the score increases by exactly
    `[50, 100, 150, 300][(shotCountAtHit - 1) % 4]`, where `shotCountAtHit`
    is the shot count including the shot that hit the UFO. Repeat across
    several UFO kills, tracking your running shot count, and confirm the
    awarded tier cycles `50 -> 100 -> 150 -> 300 -> 50 -> ...` purely as a
    function of shot count — reproducible every time, never randomized.
22. **Player hit, life loss & respawn**: let an invader bullet, or the
    formation itself, touch the player ship. Confirm exactly one life is
    lost (`m.hudState.lives` drops by exactly 1), the ship immediately
    reappears at the fixed bottom-center start position, and it visibly
    flashes for about 2 seconds afterward.
23. **Invulnerability window**: immediately after a hit, while the ship is
    still flashing, try to get hit again — e.g. from devtools:
    ```js
    m.level2.invaderBullets.push({ x: m.player.x, y: m.player.y });
    ```
    Confirm no further life is lost and no re-respawn happens while the
    flash is active (`m.player.isInvulnerable() === true`); once the flash
    stops (~2s later, `isInvulnerable()` back to `false`), the next hit
    registers normally again.
24. **Level 2 Game Over hand-off**: with Level 2 active, set
    `m.hudState.lives = 0` from the devtools console (or let a real hit
    bring it to 0). Confirm the scene switches to the same existing Game
    Over screen verified in step 7 ("GAME OVER" / score / "Press ENTER to
    restart") — Level 2 implements no Game Over UI of its own.
