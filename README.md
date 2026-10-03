# Space Invaders (JavaScript)

A browser Space Invaders built with hand-written HTML, CSS and ES modules --
no framework, no bundler, no package manager.

## File layout

| File | Owning card | Status |
| --- | --- | --- |
| `index.html` | Game loop and canvas framework | done |
| `gameConfig.js` | Game loop and canvas framework | done |
| `game.js` | Game loop and canvas framework | done |
| `input.js` | Keyboard input and the player ship | done |
| `player.js` | Keyboard input and the player ship | done |
| `collision.js` | Sprite rendering and collision detection | done |
| `level1.js` | Level 1: the classic grid | done |
| `level2.js` | Level 2: they shoot back | done |
| `level3.js` | Level 3 | planned |
| `boss.js` | Boss level: multi-phase finale | done |

## HUD contract

`game.js` exports a single mutable state object that every other card reads
and writes:

```js
import { hud } from './game.js';
```

`hud` has four fields:

- `hud.score` -- the current run's score. Written by `collision.js`'s
  player-bullet-vs-invader pass (+10 per invader destroyed), and any other
  card that awards points (Level 2's UFO adds 50/100/150/300 directly).
- `hud.lives` -- remaining player lives. Written by `level1.js`, which
  decrements it by 1 on an invasion (the lowest living invader reaching the
  player's row), and by `game.js`'s own Level 2 dispatch (`updateLevel2`),
  which decrements it by 1 on a bullet hit or body contact -- but only when
  `Player.invulnerable` is false. Level 1 and Level 2 intentionally have
  different death semantics; see "Level 2 contract" below.
- `hud.hiScore` -- best score seen this session (in memory only; it resets on
  page reload, which is expected). Written only by `game.js` itself, via
  `hud.hiScore = Math.max(hud.score, hud.hiScore)` when a run ends.
- `hud.playerHit` -- true only during a frame in which an invader bullet
  overlapped the player; overwritten every frame by `collision.js`'s
  invader-bullet-vs-player pass, so it never stays latched from a previous
  frame. Level 1 still doesn't consume it. Level 2's dispatch does: it ORs
  this with its own body-contact check and, outside the invulnerability
  window, turns that into the life loss described above.

`game.js` is the only source of truth for these four values; sibling cards
mutate `hud`'s fields directly instead of keeping their own copies.

`game.js` also exports `invaderBullets`, an initially-empty array that no
level currently populates -- Level 1 has no invader fire, and Level 2 owns
its own `Level2.bullets` instead (see below), mirroring how `boss.js` owns
`Boss.bullets` rather than sharing this one. It remains iterated every frame
by `collision.js`'s invader-bullet-vs-player pass in `updateLevel1`, where it
stays permanently empty.

## Player bullet contract

`player.js` exports a single `Player` entity:

```js
import { Player } from './player.js';
```

Besides the `update(dt)`/`draw(ctx)` pair the game loop drives, `Player`
exposes the seam the collision card needs to end the player bullet's flight
on impact:

- `Player.getBulletBounds()` -- returns `{ x, y, width, height }` for the
  in-flight bullet, or `null` when no bullet is active. Collision checks
  should treat `null` as "nothing to hit".
- `Player.deactivateBullet()` -- marks the bullet inactive immediately
  (e.g. on a confirmed hit), which also re-arms firing on the very next
  `update(dt)` -- the fire gate reads this same flag, not the bullet's
  position.
- `Player.shotCount` -- read-only count of bullets actually fired this
  session, incremented the instant a bullet becomes active (not on the
  key-press). Session-cumulative: it survives every level transition and is
  only zeroed by `resetShotCount()` below. Level 2's bonus UFO reads it
  (`shotCount % 4`) to pick its score tier.
- `Player.resetShotCount()` -- zeroes `shotCount`. Called only by `game.js`'s
  `startRun()`, so a brand new run restarts the UFO tier sequence from 50;
  no level transition calls this.
- `Player.respawn()` -- snaps the ship back to its fixed bottom-centre start
  position and opens a 2-second invulnerability window (see `invulnerable`
  below). Called by Level 2's death handling; Level 1's own invasion-reset
  path never calls it, so the two levels keep different death semantics (see
  "Level 2 contract").
- `Player.invulnerable` -- read-only, true for 2 seconds after each
  `respawn()`. While true, `draw(ctx)` blinks the ship on/off every 100 ms
  instead of rendering it solid; the in-flight bullet (if any) still draws
  normally. Callers (Level 2's dispatch) are expected to skip every damage
  source while this is true, not just bullets.

## Level 1 contract

`level1.js` exports a single `Level1` entity, mirroring `Player`/`Boss`:

```js
import { Level1 } from './level1.js';
```

- `Level1.fleet` -- an array of exactly 55 (11 columns x 5 rows) entries
  shaped `{ x, y, width, height, alive }`. `collision.js` reads/writes
  `alive` directly; `level1.js` never imports `collision.js`. Exposed via a
  getter (like `Boss.hp`) so callers always see the current fleet even after
  `reset()` below replaces it with a fresh one.
- `Level1.update(dt, player, hud)` -- advances the formation once per fixed
  `dt` (it accumulates its own step timer) and owns three things:
  - **Stepped marching**: steps 8 px at a time, where the tick interval
    scales linearly with how many invaders are still *alive* -- 800 ms with
    all 55 alive down to 100 ms with 1 alive -- recomputed every tick.
  - **Wall drops**: the wall test uses the bounding box of the living
    invaders only, so the block travels further sideways once outer columns
    are cleared. Crossing a wall drops the whole formation down by one
    invader-cell height and reverses direction.
  - **Invasion**: once the lowest living invader's bottom edge reaches
    `player.y`, this decrements `hud.lives` by 1 and calls `reset()`
    internally. It never ends the run itself -- `game.js` still watches
    `hud.lives <= 0` for that, the same as every other level.
- `Level1.draw(ctx)` -- draws every live invader as a plain 32x24
  `fillRect`. Dead invaders (`alive === false`) are skipped.
- `Level1.isCleared()` -- `true` once every invader is dead. `game.js`
  checks this right after the collision pass and advances
  `levelState.current` to `2` the frame it flips true.
- `Level1.reset()` -- rebuilds the 55-invader fleet at its start position,
  direction and step timer. Called internally on an invasion, and by
  `game.js`'s `startRun()` so every fresh run begins Level 1 clean.
- `Level1.stepIntervalSeconds(n)` -- the marching-cadence curve itself
  (seconds between steps when `n` invaders are alive), exposed so `level2.js`
  can derive its own faster cadence by multiplying this curve instead of
  restating the 800 ms/100 ms numbers.

## Level 2 contract

`level2.js` exports a single `Level2` entity, mirroring `Level1`/`Boss`. It
reuses Level 1's 11x5 grid (via the same `gameConfig.js` constants Level 1
reads) and Level 1's step-interval curve (via `Level1.stepIntervalSeconds`
above), but is otherwise a fully independent module with its own fleet,
timers and bullets:

```js
import { Level2 } from './level2.js';
```

- `Level2.fleet` -- same shape as `Level1.fleet`, exposed the same way (a
  getter, so callers see the current fleet across `reset()` calls).
- `Level2.update(dt)` -- advances the formation, invader fire and the bonus
  UFO. It never touches `hud` or ends the run itself -- `game.js`'s
  `updateLevel2` decides every life-losing outcome after calling this.
  - **Faster marching**: same stepping/wall-drop mechanics as `Level1.update`,
    but the tick interval is `Level1.stepIntervalSeconds(n) * 0.67` (a single
    named constant in `level2.js`), so the formation marches about 1.5x
    faster than Level 1 at every stage of the curve.
  - **Invader fire**: a single global timer (no per-column timers) counts
    down a fresh uniformly random 800-2000 ms delay; on reaching zero, it
    picks a random column that still has a living invader and fires from
    that column's *lowest* living invader only -- never from above a
    survivor in the same column. Bullets move straight down at a constant
    300 px/s (`bullet.y += 300 * dt`), and are removed once they pass the
    bottom of the canvas (a hit removes them too, but that happens in
    `collision.js`, see `Level2.bullets` below).
  - **Bonus UFO**: a level-time accumulator fires every 20 seconds
    (regardless of whether the previous UFO was hit, missed, or still
    mid-flight) and spawns a UFO that crosses the canvas at a constant
    120 px/s. Spawns alternate entry side on each call -- first from the
    left moving right, then from the right moving left, and so on -- and an
    unhit UFO that exits the far edge is simply dropped with no score
    change.
- `Level2.bullets` -- the live list of invader bullets, in the same shape
  `Boss.bullets` uses, so `game.js` runs it through `collision.js`'s existing
  `checkInvaderBulletsVsPlayer(Level2.bullets, Player, hud)` instead of a new
  hit-test. (`game.js`'s shared `invaderBullets` export is not used here --
  see "HUD contract".)
- `Level2.checkUfoHit(player, hud)` -- tests `player`'s in-flight bullet
  against the live UFO (if any) via `collision.js`'s shared `aabbOverlap`. On
  a hit, it deactivates the bullet, removes the UFO, and adds one of
  50/100/150/300 to `hud.score`, chosen as `player.shotCount % 4` mapped
  ascending (`0`->50, `1`->100, `2`->150, `3`->300). This is a pure lookup --
  no RNG -- so the same shot count always awards the same tier, and because
  `Player.shotCount` already includes the shot that just landed, the count
  that hit the UFO is the one used to pick its tier.
- `Level2.checkPlayerContact(player)` -- `true` if any living invader's body
  overlaps `player`'s bounds. This is Level 2's "descending invader touches
  the ship" death condition; it is a plain AABB test, not Level 1's
  invasion-reset mechanic.
- `Level2.draw(ctx)` -- draws every live invader (same look as Level 1),
  every live invader bullet, and the UFO when present.
- `Level2.isCleared()` -- `true` once every invader is dead. `game.js`
  checks this right after Level 2's hit detection and advances
  `levelState.current` to `3` the frame it flips true, via the same hook
  `Level1.isCleared()` uses for its own transition.
- `Level2.reset()` -- rebuilds the fleet and every timer (marching, fire,
  UFO) at their start state and empties `Level2.bullets`. Called by
  `game.js`'s `startRun()` so every fresh run begins Level 2 clean even if a
  previous run left it mid-fight.

`game.js`'s `updateLevel2` is where life loss and respawn actually happen,
since that's where both `hud.playerHit` (from the bullets collision check)
and `Level2.checkPlayerContact`'s result are available together: if either
is true *and* `Player.invulnerable` is false, it decrements `hud.lives` by 1
and calls `Player.respawn()` -- once per frame, so a bullet hit and a body
contact in the same frame can never cost two lives. This intentionally
differs from Level 1's own death handling (an invasion resets the whole
formation instead of costing exactly one life with a respawn) -- that
divergence is a known, accepted gap between the two levels' intakes, not a
bug to unify here.

## Collision contract

`collision.js` has no canvas calls of its own -- `game.js` draws explosions,
`level1.js` draws its invaders and `boss.js` draws the boss. It exports:

- `aabbOverlap(a, b)` -- the shared axis-aligned bounding-box test; both
  arguments are any `{ x, y, width, height }` shape.
- `checkPlayerBulletVsInvaders(player, fleet, hud)` -- reads `player`'s
  in-flight bullet via `getBulletBounds()`/`deactivateBullet()`, tests it
  against every live entry in `fleet`, and on a hit marks that invader dead,
  deactivates the bullet, spawns an explosion at the invader's bounds, and
  adds 10 to `hud.score`.
- `checkInvaderBulletsVsPlayer(invaderBullets, player, hud)` -- tests every
  bullet in `invaderBullets` against `player`'s bounds; on a hit, removes
  that bullet from the list and spawns an explosion at the player's bounds.
  Sets `hud.playerHit` to whether any hit happened this call (so it is
  always current, never stale from a previous frame).
- `updateExplosions(dt)` -- ticks every spawned explosion's ~200 ms lifetime
  down and drops the ones that expired.
- `getExplosions()` -- the live list of `{ x, y, width, height }` explosion
  rectangles for `game.js` to draw.

`game.js` runs these every fixed update step, strictly in this order:
`Player.update` / `Level1.update` -> the two collision checks ->
`updateExplosions` -> (later) `render()`. An invader killed during the
collision step is already excluded from that same frame's `render()`.

## Level switch contract

`game.js` exports a second mutable state object, mirroring `hud`:

```js
import { levelState } from './game.js';
```

- `levelState.current` -- which level is live while `scene` is `PLAYING`.
  `game.js`'s `updatePlaying`/`renderPlaying` switch on it: `case 1` routes
  to the classic grid (`level1.js`), `case 2` routes to the faster formation
  and invader fire (`level2.js`), `case 4` routes to the boss level
  (`boss.js`), and anything else (`3`, or beyond) ends the run immediately
  via the Game Over scene. `startRun()` resets it to `1` at the start of
  every run.
- Clearing Level 1 (destroying all 55 invaders) advances `levelState.current`
  to `2`, with no level-select, menu or intermission screen in between --
  the very next frame renders Level 2's formation, and `hud.lives` is left
  untouched by the transition, so it reads whatever it was the instant
  before the last Level 1 invader died.
- Clearing Level 2 (destroying all 55 of its invaders) likewise advances
  `levelState.current` to `3`. Level 3 has no card wiring it in yet, so
  reaching `3` lands straight on the Game Over default -- this is the
  specified interim behaviour for this card, the same way reaching `2` was
  for the Level 1 card before this one landed. See "Level 4: boss fight"
  below for the devtools path used to reach Level 4 directly for manual
  verification until the Level 3 card lands.

## Boss contract

`boss.js` exports a single `Boss` entity, mirroring `Player`/`Level1`:

```js
import { Boss } from './boss.js';
```

- `Boss.update(dt)` -- drifts the boss horizontally at a fixed 90 px/s,
  reversing at each canvas edge; its vertical position is set once at module
  load and never written again. Also ticks its fire timer and spawns a fixed
  three-bullet spread (straight down, and the same speed rotated +/-20
  degrees from that down vector) from the boss' centre, every 1500 ms while
  HP is 6-10 and every 700 ms once HP drops to 5 or below.
- `Boss.draw(ctx)` -- draws the boss body, its live bullets, and the 10-step
  health bar across the reserved strip at the top of the canvas, all with
  plain canvas 2D primitives (no image assets).
- `Boss.checkPlayerBulletHit(player)` -- tests `player`'s in-flight bullet
  against the boss' bounds using `collision.js`'s shared `aabbOverlap` (no
  second overlap implementation in `boss.js`); each confirmed hit removes
  exactly 1 HP and deactivates the bullet.
- `Boss.bullets` -- the live list of boss projectiles, in the same shape
  `invaderBullets` uses, so `game.js` runs it through `collision.js`'s
  existing `checkInvaderBulletsVsPlayer(Boss.bullets, Player, hud)` instead
  of a new hit-test. The boss fight is sudden death: `game.js` treats any
  `hud.playerHit === true` from that call as an immediate run-ending hit,
  regardless of `hud.lives`.
- `Boss.hp` -- read-only current HP (starts at 10; 0 means defeated).
- `Boss.reset()` -- returns the boss to its starting position/HP/empty
  bullet list; `game.js` calls this from `startRun()` so every fresh run
  (including one started from the win screen) begins the fight clean.

Reaching 0 HP ends the run via `game.js`'s `Scene.WIN` (final score + restart
control, restart starts a fresh run at Level 1). A boss bullet touching the
player ends the run via the existing `Scene.GAME_OVER` (lives are never
consulted on this path).

## Manual verification

This project has no automated test runner; verify by hand.

Chrome, Chromium and Safari refuse to load `<script type="module">` from a
`file://` document (the module fetch is treated as cross-origin and blocked
by CORS), so opening `index.html` by double-clicking it fails silently in
those browsers -- the canvas stays blank and the console shows a "Cross
origin requests are only supported for protocol schemes: http, data,
chrome, chrome-extension, https" error. **Firefox** has no such
restriction and loads local ES modules over `file://` with no flag or
server needed; use it for this manual path:

1. Open `index.html` directly in Firefox, e.g. `firefox index.html` from
   the repo root, or File > Open File. No local server is required or used.
2. **Title**: confirm the canvas shows `SPACE INVADERS` and
   `Press ENTER to start`.
3. Press ENTER: confirm the scene switches to **Playing**, with `SCORE: 0`
   and `LIVES: 3` drawn on the canvas.
4. **Move right**: hold ArrowRight for about a second, then release.
   Confirm the ship glides smoothly to the right (no teleporting) and ends
   up noticeably further right than where it started.
5. **Move left**: hold `A` for about a second. Confirm the ship moves
   left by roughly the same distance as step 4 moved it right (`A` and `D`
   behave the same as the arrow keys).
6. **Case/modifier insensitivity**: turn on Caps Lock, then hold Shift and
   press `A`/`D`. Confirm the ship still moves left/right -- held-key
   matching is unaffected by Shift or Caps Lock.
7. **Left clamp**: hold ArrowLeft (or `A`) for several seconds until the
   ship visibly stops at the left wall. Confirm it stops flush with the
   left edge of the canvas and does not travel past it or jitter.
8. **Right clamp**: hold ArrowRight (or `D`) for several seconds until the
   ship stops at the right wall. Confirm it stops flush with the right
   edge of the canvas (ship fully visible, none of it off-screen) and does
   not travel past it.
9. **Simultaneous left+right**: hold ArrowLeft and ArrowRight (or `A` and
   `D`) together for a couple of seconds. Confirm the ship does not move
   at all while both are held.
10. **Single shot**: with no keys held, press Space once. Confirm exactly
    one small bullet rectangle appears at the ship's nose and travels
    straight up.
11. **Held-Space, no refire**: press and hold Space continuously while the
    bullet from step 10 is still visibly on screen (watch for at least
    2 seconds). Confirm no second bullet appears -- only the one bullet is
    ever visible at a time.
12. **Re-arm**: keep holding Space from step 11 until the bullet travels
    off the top of the canvas. Confirm a new bullet spawns again at the
    ship's nose shortly after the first one disappears, still with only
    one bullet visible at a time.
13. **No page scroll**: confirm that pressing ArrowLeft/ArrowRight/Space
    during steps 4-12 never scrolls the page or otherwise changes focus --
    the handled keys' default browser action is suppressed.
14. **Lives readout**: confirm `LIVES: 3` stayed on screen, unchanged,
    throughout steps 4-13 -- nothing added by this card decrements it.
15. Switch to another browser tab and wait ~10 seconds, then switch back:
    confirm the game resumes at normal speed with no visible fast-forward
    through the missed time.
16. No card decrements `hud.lives` on a hit yet (tracked as a backlog gap,
    not something this card owns), so force the end of the run from the
    devtools console instead:
    ```js
    const { hud } = await import('./game.js');
    hud.score = 50;
    hud.lives = 0;
    ```
17. **Game Over**: confirm the canvas now shows `GAME OVER`, `SCORE: 50`, and
    `Press ENTER to restart`.
18. Press ENTER: confirm the scene returns to **Title** with no page reload
    (re-run the `import('./game.js')` snippet above and check `hud.hiScore` is
    still `50` -- a reload would have zeroed it).
19. Press ENTER again to start a new run and confirm `hud.score` is back to
    `0` and `hud.lives` is back to `3`.
20. Throughout, check the browser console: there should be no uncaught
    errors or error-level output.

### Level 1: the classic grid (this card)

21. **Formation shape**: on reaching Playing (press ENTER from Title),
    confirm a grid of 55 identically-sized, identically-coloured rectangles
    appears in the upper part of the canvas -- count 11 across and 5 down.
    All 55 look exactly alike (same size, same colour); nothing is an image.
22. **Centring and spacing**: confirm the grid is horizontally centred on
    the canvas, with even gaps between columns and between rows, and the
    top row starts a small, consistent distance below the canvas top.
23. **Marching step**: watch the formation for a few seconds. Confirm it
    moves sideways in small, discrete jumps (not a smooth continuous glide)
    -- the spacing between invaders never changes as the whole block moves
    together. With all 55 alive the jumps land roughly 800 ms apart.
24. **Speeding up**: aim and fire repeatedly to destroy a dozen or so
    invaders. Confirm the formation's step cadence visibly quickens as the
    living count drops -- by the time only a handful remain, the jumps land
    several times a second, much faster than the cadence from step 23.
25. **Edge-drop-reverse, right side**: let the formation march right until
    its rightmost *living* column nears the right edge of the canvas.
    Confirm that on the step where it would cross the edge, it instead
    shifts down by one invader-cell height and then starts marching left.
26. **Edge-drop-reverse, left side**: keep watching until it marches back
    to the left edge. Confirm the same drop-then-reverse happens there too,
    and it resumes marching right.
27. **Wider travel after outer columns clear**: destroy every invader in
    the leftmost and rightmost columns, so the living block is narrower
    than the full 11-column span. Confirm the formation now visibly travels
    further sideways before the next wall-drop than it did in steps 25-26
    -- the wall test uses only the living invaders' bounding box, not the
    original 11-column span.
28. **Kill an invader**: aim the ship (ArrowLeft/ArrowRight or A/D) under
    a living invader and fire (Space). Confirm that on the frame the bullet
    reaches it: the invader rectangle disappears immediately, a brief
    differently-coloured explosion rectangle flashes at that spot for
    roughly a third of a second and then vanishes leaving nothing drawn
    there, the bullet itself disappears (it does not pass through), and
    `SCORE` on the canvas increases by exactly 10.
29. **Miss**: fire straight up through a gap with no invader above it (or
    after killing the invaders in a column). Confirm the bullet keeps
    travelling straight up and off the top of the canvas exactly as before,
    with no explosion and no score change.
30. **Player-hit flag (manual injection)**: `invaderBullets` starts empty,
    so trigger the invader-bullet-vs-player pass from the devtools console
    once a run is in progress:
    ```js
    const { hud, invaderBullets } = await import('./game.js');
    const { Player } = await import('./player.js');
    invaderBullets.push({ x: Player.x, y: Player.y, width: 1, height: 1 });
    ```
    Within the next frame, confirm a brief explosion rectangle flashes at
    the player's ship and then `hud.playerHit` reads `true` immediately
    after (check in the console on the following tick). Confirm nothing
    else changes -- `hud.lives` is unaffected and there is no game-over.
31. **No false hit**: push a bullet far from the player instead
    (`{ x: 0, y: 0, width: 1, height: 1 }`) and confirm no explosion appears
    at the player and `hud.playerHit` reads `false`.
32. **Invasion -> lost life -> full restart**: reaching the player's row by
    ordinary play takes a long time (many wall-drops), so force it from the
    devtools console once Level 1 is in progress:
    ```js
    const { Level1 } = await import('./level1.js');
    for (const invader of Level1.fleet) {
      invader.y += 700;
    }
    ```
    Within one step interval (at most ~800 ms), confirm `LIVES` on the
    canvas drops by exactly 1, and the formation redraws as a fresh 11x5
    grid back at its original start position, moving in its original
    (rightward) direction at the original slow (~800 ms) cadence -- not
    wherever it was when it was bumped down.
33. **HUD level readout**: throughout steps 21-32, confirm the canvas shows
    a `LEVEL: 1` readout alongside `SCORE` and `LIVES`.
34. **Clear the grid -> Level 2, lives carry over**: note the current
    `LIVES` reading, then keep firing until all 55 invaders are destroyed (or
    shortcut it from the console:
    `Level1.fleet.forEach((invader) => { invader.alive = false; })`). Confirm
    `SCORE` reads exactly `550` above whatever it was when this section's
    verification started, and on the very next frame the canvas shows a
    fresh 11x5 formation (same look as Level 1's grid) with no level-select,
    menu or intermission screen in between, `LEVEL` now reads `2`, and
    `LIVES` is exactly whatever it read the instant before the last Level 1
    invader died (unchanged by the transition).
35. Throughout steps 21-34, check the browser console: there should be no
    uncaught errors or error-level output.

### Level 2: they shoot back (this card)

Continue directly from step 34 above (already in Level 2, run in progress).

36. **Faster marching**: watch the new formation step for a few seconds and
    compare the cadence to Level 1's from step 23. Confirm the jumps land
    noticeably faster than Level 1's ~800 ms-at-full-strength cadence --
    roughly 535 ms (800 ms x 0.67) with all 55 alive -- and that the cadence
    still visibly quickens as invaders die, the same relationship as Level 1
    just uniformly faster.
37. **Invader fire -- single global timer, lowest-in-column**: without
    firing, watch Level 2 for 15-20 seconds. Confirm individual invaders
    occasionally fire a distinctly-coloured bullet straight downward, shots
    land roughly every 0.8-2 seconds apart (not synchronized across columns,
    not from every column at once), and every shot visibly originates from
    the bottom-most living invader of whichever column fires -- never from
    an invader with a living invader still below it in the same column.
    Confirm unblocked invader bullets travel straight down and disappear off
    the bottom of the canvas.
38. **Invader bullet hit -> life lost, respawn, flash**: let an invader
    bullet strike the ship (or move into one deliberately). Confirm `LIVES`
    drops by exactly 1, the ship immediately reappears at the fixed
    bottom-centre start position, and for about 2 seconds afterward it
    visibly blinks on and off rather than rendering solid.
39. **Invulnerability suppresses every hit**: during the flash window from
    step 38, deliberately move the ship into another invader bullet, or let
    a descending invader's body touch it. Confirm `LIVES` does not change and
    the ship does not move or re-respawn while still flashing. Once the
    flash stops (~2 s after step 38), confirm a new hit behaves like step 38
    again (life lost, respawn, new flash window).
40. **Body contact with a descending invader**: reaching the player's row by
    ordinary play takes a while, so force it instead (once any earlier flash
    window has ended) by teleporting one living invader onto the ship's
    current position from the devtools console:
    ```js
    const { Level2 } = await import('./level2.js');
    const { Player } = await import('./player.js');
    const invader = Level2.fleet.find((i) => i.alive);
    invader.x = Player.x;
    invader.y = Player.y;
    ```
    Within a step or two, confirm contact between that invader and the ship
    costs exactly 1 life and respawns the ship, the same as step 38 -- Level 2
    does not reset the whole formation the way Level 1's invasion does.
41. **UFO cadence and alternating sides**: watch for about 20 seconds from
    entering Level 2 (or keep watching from step 34). Confirm a UFO enters
    from the left edge and crosses to the right at a slow, constant speed;
    confirm that roughly 20 seconds later a second UFO enters from the
    *right* edge and crosses to the left. If either is left un-hit, confirm
    it simply exits the far edge and disappears with no score change.
42. **UFO scoring is deterministic, not random**: check the cumulative shot
    count in the devtools console (`const { Player } = await
    import('./player.js'); Player.shotCount`). Fire until `Player.shotCount`
    is about to become a multiple of 4 (e.g. currently 3, 7, 11...), then
    land the next shot on a UFO: confirm `SCORE` increases by exactly 50.
    Repeat, landing a hit at shot counts 1, 2 and 3 mod 4: confirm the
    awards are 100, then 150, then 300, in that fixed order, with no
    variation if repeated.
43. **Shot count carries over from Level 1**: note that `Player.shotCount`
    from step 42 already reflects shots fired back in Level 1 (it was never
    zero on first entering Level 2 if any shots were fired in Level 1) --
    confirming the UFO tier sequence continues across the Level 1 -> Level 2
    boundary instead of restarting at 0.
44. **Clear Level 2 -> Level 3**: destroy all 55 Level 2 invaders (or
    shortcut via console: `Level2.fleet.forEach((invader) => { invader.alive
    = false; })`). Confirm `LEVEL` immediately reads `3` -- Level 3 has no
    module yet, so the dispatch's default branch ends the run via the
    regular Game Over screen, the same interim behaviour Level 1 -> Level 2
    had before this card landed.
45. **Game Over -> Title**: starting a fresh run and reducing `hud.lives` to
    0 while in Level 2 (via ordinary hits, or forced in the console with
    `const { hud } = await import('./game.js'); hud.lives = 0;`) shows the
    same `GAME OVER` screen as the base framework. Press ENTER: confirm the
    scene returns to Title, same as steps 17-18 earlier.
46. Throughout steps 36-45, check the browser console: there should be no
    uncaught errors or error-level output.

### Level 4: boss fight (this card)

Level 3 has no card wiring it in yet, so clearing Level 2 lands straight on
the Game Over default described above -- there is
currently no in-play way to reach Level 4. Jump straight to it for manual
verification with one devtools console command, run from Firefox with
`index.html` open (press ENTER from Title first, so a run is in progress
and `scene` is `PLAYING`):

```js
const { levelState } = await import('./game.js');
levelState.current = 4;
```

47. **Boss appears, health bar full**: immediately after running the
    snippet above, confirm a large pink/red rectangle (160x80) appears below
    a segmented bar across the very top of the canvas, and all 10 segments
    of that bar are lit (full health). The invader grid from Level 1 is no
    longer drawn.
48. **Horizontal drift, no descent**: watch the boss for 10-15 seconds.
    Confirm it drifts sideways smoothly (not in discrete jumps like the
    invader formation), visibly reverses direction on touching both the left
    and right edges of the canvas without any part of it leaving the canvas,
    and its vertical position never changes for the whole fight.
49. **Phase 1 fire rate and spread shape**: with the health bar still above
    half (6-10 segments lit), watch the boss fire. Confirm a volley of
    exactly three bullets leaves the boss' centre roughly every 1.5 seconds
    (about 2 volleys every 3 seconds) -- one travelling straight down, one
    angled slightly left, one angled slightly right, fanning out as they
    fall.
50. **Health bar shrinks in steps, hit registers**: aim the ship under the
    boss and fire. Confirm each confirmed hit removes exactly one of the 10
    health-bar segments (never a partial segment) and the player's bullet
    disappears on impact.
51. **Phase 2 fire rate**: keep damaging the boss until the health bar drops
    to half (5 segments) or below. Confirm volleys now visibly arrive about
    twice as often as step 49 (roughly every 0.7 seconds), with the same
    three-bullet fan shape as before.
52. **Sudden death**: let a boss bullet touch the player ship (or manually
    move the ship into one). Confirm the run ends immediately -- the game
    shows the regular `GAME OVER` screen with the score at the moment of the
    hit -- even if the lives readout shown earlier in the run was still above
    zero. Press ENTER twice (Game Over -> Title -> Playing) and confirm the
    new run starts at Level 1 (the invader grid, not the boss).
53. **Win screen**: start a fresh run, jump back to Level 4 with the console
    snippet above, and destroy the boss (10 confirmed hits total; repeat
    step 50 until the health bar is fully empty). Confirm a `YOU WIN` screen
    appears showing `SCORE:` followed by the run's final score, and `Press
    ENTER to restart`.
54. **Restart from win**: press ENTER on the win screen. Confirm a new run
    starts immediately at Level 1 (the invader grid is shown, `SCORE: 0`,
    `LIVES: 3`, `LEVEL: 1`) -- no need to pass back through the Title screen.
55. Throughout steps 47-54, check the browser console: there should be no
    uncaught errors or error-level output.
