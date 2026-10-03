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
| `invaders.js` | Invaders | planned |
| `collision.js` | Collision detection | planned |
| `level1.js` | Level 1 | planned |
| `level2.js` | Level 2 | planned |
| `level3.js` | Level 3 | planned |
| `boss.js` | Boss | planned |

## HUD contract

`game.js` exports a single mutable state object that every other card reads
and writes:

```js
import { hud } from './game.js';
```

`hud` has three fields:

- `hud.score` -- the current run's score. Written by `invaders.js` (and any
  other card that awards points).
- `hud.lives` -- remaining player lives. Written by `collision.js` when the
  player is hit.
- `hud.hiScore` -- best score seen this session (in memory only; it resets on
  page reload, which is expected). Written only by `game.js` itself, via
  `hud.hiScore = Math.max(hud.score, hud.hiScore)` when a run ends.

`game.js` is the only source of truth for these three values; sibling cards
mutate `hud`'s fields directly instead of keeping their own copies.

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
16. `collision.js` (which will decrement `hud.lives` on a hit) doesn't exist
    yet, so force the end of the run from the devtools console instead:
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
