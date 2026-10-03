# Space Invaders (JavaScript)

A browser Space Invaders built with hand-written HTML, CSS and ES modules --
no framework, no bundler, no package manager.

## File layout

| File | Owning card | Status |
| --- | --- | --- |
| `index.html` | Game loop and canvas framework | done |
| `gameConfig.js` | Game loop and canvas framework | done |
| `game.js` | Game loop and canvas framework | done |
| `input.js` | Keyboard input | planned |
| `player.js` | Player ship | planned |
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

## Manual verification

This project has no automated test runner; verify by hand:

1. From the repo root, run `python3 -m http.server`.
2. Open `http://localhost:8000` in a browser.
3. **Title**: confirm the canvas shows `SPACE INVADERS` and
   `Press ENTER to start`.
4. Press ENTER: confirm the scene switches to **Playing**, with `SCORE: 0`
   and `LIVES: 3` drawn on the canvas.
5. Switch to another browser tab and wait ~10 seconds, then switch back:
   confirm the game resumes at normal speed with no visible fast-forward
   through the missed time.
6. `collision.js` (which will decrement `hud.lives` on a hit) doesn't exist
   yet, so force the end of the run from the devtools console instead:
   ```js
   const { hud } = await import('./game.js');
   hud.score = 50;
   hud.lives = 0;
   ```
7. **Game Over**: confirm the canvas now shows `GAME OVER`, `SCORE: 50`, and
   `Press ENTER to restart`.
8. Press ENTER: confirm the scene returns to **Title** with no page reload
   (re-run the `import('./game.js')` snippet above and check `hud.hiScore` is
   still `50` -- a reload would have zeroed it).
9. Press ENTER again to start a new run and confirm `hud.score` is back to
   `0` and `hud.lives` is back to `3`.
10. Throughout, check the browser console: there should be no uncaught
    errors or error-level output.
