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
| `invaders.js` | Sprite rendering and collision detection | done |
| `collision.js` | Sprite rendering and collision detection | done |
| `level1.js` | Level 1 | planned |
| `level2.js` | Level 2 | planned |
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
  card that awards points.
- `hud.lives` -- remaining player lives. Not yet written by anything: no
  card currently decrements it on a player hit (see "Collision contract"
  below) -- that is a known backlog gap, not a bug in this card.
- `hud.hiScore` -- best score seen this session (in memory only; it resets on
  page reload, which is expected). Written only by `game.js` itself, via
  `hud.hiScore = Math.max(hud.score, hud.hiScore)` when a run ends.
- `hud.playerHit` -- true only during a frame in which an invader bullet
  overlapped the player; overwritten every frame by `collision.js`'s
  invader-bullet-vs-player pass, so it never stays latched from a previous
  frame. Nothing currently consumes it (no life loss, no game-over) --
  also a known backlog gap.

`game.js` is the only source of truth for these four values; sibling cards
mutate `hud`'s fields directly instead of keeping their own copies.

`game.js` also exports `invaderBullets`, an initially-empty array:

```js
import { invaderBullets } from './game.js';
```

It is iterated every frame by `collision.js`'s invader-bullet-vs-player pass.
This card never pushes into it; the later "they shoot back" card populates it.

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

## Invader fleet contract

`invaders.js` exports a single `Invaders` entity, mirroring `Player`:

```js
import { Invaders } from './invaders.js';
```

- `Invaders.fleet` -- an array of exactly 55 (11 columns x 5 rows) entries
  shaped `{ x, y, width, height, alive }`. `collision.js` reads/writes
  `alive` directly; `invaders.js` never imports `collision.js`.
- `Invaders.update(dt)` -- advances the formation. Internally it only steps
  once every 500 ms (8 px per step); calling it every fixed `dt` is correct
  because it accumulates its own step timer.
- `Invaders.draw(ctx)` -- draws every live invader as a plain 32x24
  `fillRect`. Dead invaders (`alive === false`) are skipped.

## Collision contract

`collision.js` has no canvas calls of its own -- `game.js` draws explosions,
`invaders.js` draws invaders. It exports:

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
`Player.update` / `Invaders.update` -> the two collision checks ->
`updateExplosions` -> (later) `render()`. An invader killed during the
collision step is already excluded from that same frame's `render()`.

## Level switch contract

`game.js` exports a second mutable state object, mirroring `hud`:

```js
import { levelState } from './game.js';
```

- `levelState.current` -- which level is live while `scene` is `PLAYING`.
  `game.js`'s `updatePlaying`/`renderPlaying` switch on it; `case 4` routes to
  the boss level (`boss.js`), anything else currently falls through to the
  plain invader fleet (`invaders.js`) as a placeholder for the not-yet-landed
  Level 1-3 cards. `startRun()` resets it to `1` at the start of every run.
- Levels 1-3 have no card wiring them in yet, so **there is currently no
  in-play way to advance past Level 1** -- see "Level 4: boss fight" below
  for the devtools path used to reach Level 4 for manual verification until
  the "Level 3: shields and formations" card lands.

## Boss contract

`boss.js` exports a single `Boss` entity, mirroring `Player`/`Invaders`:

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

### Invader fleet and collision (this card)

21. **Formation shape**: on reaching Playing (press ENTER from Title),
    confirm a grid of 55 identically-sized, identically-coloured rectangles
    appears in the upper part of the canvas -- count 11 across and 5 down.
    All 55 look exactly alike (same size, same colour); nothing is an image.
22. **Centring and spacing**: confirm the grid is horizontally centred on
    the canvas, with even gaps between columns and between rows, and the
    top row starts a small, consistent distance below the canvas top.
23. **Marching step**: watch the formation for a few seconds. Confirm it
    moves sideways in small, discrete jumps roughly twice a second (not a
    smooth continuous glide) -- the spacing between invaders never changes
    as the whole block moves together.
24. **Edge-drop-reverse, right side**: let the formation march right until
    its rightmost column nears the right edge of the canvas. Confirm that
    on the step where it would cross the edge, it instead shifts down by
    one row-height and then starts marching left.
25. **Edge-drop-reverse, left side**: keep watching until it marches back
    to the left edge. Confirm the same drop-then-reverse happens there too,
    and it resumes marching right.
26. **Kill an invader**: aim the ship (ArrowLeft/ArrowRight or A/D) under
    an invader and fire (Space). Confirm that on the frame the bullet
    reaches it: the invader rectangle disappears immediately, a brief
    differently-coloured explosion rectangle flashes at that spot for
    roughly a third of a second and then vanishes leaving nothing drawn
    there, the bullet itself disappears (it does not pass through), and
    `SCORE` on the canvas increases by exactly 10.
27. **Miss**: fire straight up through a gap with no invader above it (or
    after killing the invaders in a column). Confirm the bullet keeps
    travelling straight up and off the top of the canvas exactly as before,
    with no explosion and no score change.
28. **Clear the fleet**: keep firing until all 55 invaders are destroyed.
    Confirm `SCORE` reads exactly `550` above whatever it was when this
    card's verification started, and the canvas now shows an empty
    formation area (the game keeps running -- no win screen is expected
    from this card).
29. **Player-hit flag (manual injection)**: `invaderBullets` starts empty,
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
30. **No false hit**: push a bullet far from the player instead
    (`{ x: 0, y: 0, width: 1, height: 1 }`) and confirm no explosion appears
    at the player and `hud.playerHit` reads `false`.
31. Throughout steps 21-30, check the browser console: there should be no
    uncaught errors or error-level output.

### Level 4: boss fight (this card)

Levels 1-3 are not wired into the level switch yet (their cards have not
landed), so there is currently no in-play way to advance `levelState.current`
past `1` -- **Level 4 is implemented and wired but unreachable by play**
until the "Level 3: shields and formations" card lands. Jump straight to it
for manual verification with one devtools console command, run from Firefox
with `index.html` open (press ENTER from Title first, so a run is in
progress and `scene` is `PLAYING`):

```js
const { levelState } = await import('./game.js');
levelState.current = 4;
```

32. **Boss appears, health bar full**: immediately after running the
    snippet above, confirm a large pink/red rectangle (160x80) appears below
    a segmented bar across the very top of the canvas, and all 10 segments
    of that bar are lit (full health). The 55-invader grid from earlier
    levels is no longer drawn.
33. **Horizontal drift, no descent**: watch the boss for 10-15 seconds.
    Confirm it drifts sideways smoothly (not in discrete jumps like the
    invader formation), visibly reverses direction on touching both the left
    and right edges of the canvas without any part of it leaving the canvas,
    and its vertical position never changes for the whole fight.
34. **Phase 1 fire rate and spread shape**: with the health bar still above
    half (6-10 segments lit), watch the boss fire. Confirm a volley of
    exactly three bullets leaves the boss' centre roughly every 1.5 seconds
    (about 2 volleys every 3 seconds) -- one travelling straight down, one
    angled slightly left, one angled slightly right, fanning out as they
    fall.
35. **Health bar shrinks in steps, hit registers**: aim the ship under the
    boss and fire. Confirm each confirmed hit removes exactly one of the 10
    health-bar segments (never a partial segment) and the player's bullet
    disappears on impact.
36. **Phase 2 fire rate**: keep damaging the boss until the health bar drops
    to half (5 segments) or below. Confirm volleys now visibly arrive about
    twice as often as step 34 (roughly every 0.7 seconds), with the same
    three-bullet fan shape as before.
37. **Sudden death**: let a boss bullet touch the player ship (or manually
    move the ship into one). Confirm the run ends immediately -- the game
    shows the regular `GAME OVER` screen with the score at the moment of the
    hit -- even if the lives readout shown earlier in the run was still above
    zero. Press ENTER twice (Game Over -> Title -> Playing) and confirm the
    new run starts at Level 1 (the invader grid, not the boss).
38. **Win screen**: start a fresh run, jump back to Level 4 with the console
    snippet above, and destroy the boss (10 confirmed hits total; repeat
    step 35 until the health bar is fully empty). Confirm a `YOU WIN` screen
    appears showing `SCORE:` followed by the run's final score, and `Press
    ENTER to restart`.
39. **Restart from win**: press ENTER on the win screen. Confirm a new run
    starts immediately at Level 1 (the invader grid is shown, `SCORE: 0`,
    `LIVES: 3`) -- no need to pass back through the Title screen.
40. Throughout steps 32-39, check the browser console: there should be no
    uncaught errors or error-level output.
