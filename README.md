# Space Invaders

A classic Space Invaders clone in hand-written HTML, CSS and ES modules.
No framework, no bundler, no package manager — and no build step.

## Run

Open `index.html` directly from the filesystem (double-click it, or drag
it into a browser window). The game runs from a `file://` URL; there is
no server and nothing to install or build.

Browser note: the game uses ES modules, which some browsers refuse to
load from `file://` URLs. Firefox and Safari load them out of the box;
on Chrome/Edge, start the browser with `--allow-file-access-from-files`
or use a different browser.

## Controls

| Key                             | Action                                        |
| ------------------------------- | --------------------------------------------- |
| ArrowLeft / ArrowRight or A / D | Move the ship (hold)                          |
| Space                           | Fire — at most one bullet in flight at a time |
| ENTER                           | Advance screens (start / restart)             |

Pressing ENTER mid-game ends the run: a manual stand-in so the full
title -> playing -> game over loop stays verifiable by hand (see
game.js).

## How a run works

- You start with 3 lives. Each destroyed invader scores 10 points. The
  HUD shows score, lives, the current level number and the session
  hi-score (kept in memory only — nothing is persisted).
- Losing your last life ends the run on the GAME OVER screen. ENTER
  returns to the title screen; ENTER again starts a fresh run at
  Level 1.

### Level 1 — the classic grid

55 invaders (11 columns x 5 rows) march in discrete steps, accelerating
linearly from one step every ~800 ms (all 55 alive) down to ~100 ms (one
left). When the edge-most living invader reaches a canvas edge, the
whole grid snaps flush to the edge, drops exactly one row and reverses
direction. If the bottom of the lowest invader reaches the player's row
(a breach), you lose exactly one life and the level restarts in its
initial state — score and remaining lives carry over.

### Level 2 — they shoot back

Invaders fire at the ship; a hit costs a life. After being hit the ship
flashes and is briefly invulnerable. A UFO bonus tied to your session
shot counter can appear. (Implemented by level2.js.)

### Level 3 — shields and formations

Not implemented yet — the level3.js card has not landed. Clearing
Level 2 currently leaves an empty playfield on LEVEL 3, because the
level registry has no module for that number. When the card lands,
clearing Level 3 will start the boss fight (Level 4) through the same
level-number dispatch used for the 1 -> 2 -> 3 transitions; the boss is
already registered for level 4, so no further wiring will be needed.

### Level 4 — the boss fight

The finale, implemented by boss.js:

- One boss, 160 x 80 px, drawn purely with canvas primitives (rects and
  arcs — no image assets). It drifts horizontally at 90 px/s, reversing
  direction at each canvas edge, and never descends.
- The boss has 10 HP and every player bullet that lands deals 1 damage.
  A health bar spans the top of the canvas for the whole fight; its
  filled length is always current HP / 10 of the track and updates on
  the very frame a hit lands.
- Attack: a three-bullet spread from the boss's centre — one bullet
  straight down, one at -20 deg and one at +20 deg from straight down,
  each travelling at 260 px/s.
- Phases: while HP > 5 the spread fires every 1500 ms; from the moment
  HP reaches 5 the same spread fires every 700 ms. The interval is the
  only change — pattern, bullet speed and movement are identical.
- Sudden death: a single hit from any boss projectile ends the run
  immediately, regardless of remaining lives. The restart that follows
  is a fresh run at Level 1 — there is no boss retry.
- Victory: at 0 HP the fight ends on a win screen showing the final
  score as it stands (there is no boss-kill bonus). Press ENTER to
  restart with a new run at Level 1.
- Level 4 spawns no shields; the arena is just the boss and the player.
- All boss hit-testing (player bullet vs boss, boss bullet vs player)
  goes through the shared `overlaps()` helper imported from
  collision.js.

## Manual verification

Everything below runs from `file://` — no server, no build. Several
checks use the DevTools console, where the game's modules are reachable
through a dynamic import (run once per page load):

```js
const g = await import('./game.js');        // player, hud, currentLevel
const levels = await import('./levels.js'); // the level registry
const boss = await import('./boss.js');     // BossLevel
```

1. Open `index.html`. The title screen shows "SPACE INVADERS" and the
   start prompt.
2. Press ENTER: Level 1 starts — the HUD reads LEVEL 1, 55 invaders in
   an 11 x 5 grid, 3 lives, score 0.
3. Hold Left/Right (or A/D): the ship moves and stops at the canvas
   edges. Hold Space: bullets fire one at a time; a new one appears
   only once the previous one has left the screen or hit something.
4. Shoot an invader: it disappears, an orange explosion flashes and the
   score increases by 10. The march quickens with every kill.
5. Let the formation reach a canvas edge: the whole grid drops one row
   and reverses. (Optional) let it march down to the player's row:
   exactly one life is lost and Level 1 restarts in its initial state.
6. Clear all 55 invaders — or shortcut with
   `g.currentLevel.cleared = true` in the console: Level 2 starts in
   the same tick, the HUD reads LEVEL 2 and the invaders now shoot
   back. Take a hit: the ship flashes and is briefly immune.
7. Boss wiring check: `levels.isLevelRegistered(4)` returns `true` —
   the fight is entered through the ordinary level-number dispatch
   (clearing Level 3 advances the counter to 4 and the registry
   creates the boss). Until level3.js lands there is no registered
   Level 3, so to playtest the boss today, temporarily register it
   under number 3 and then clear Level 2:

   ```js
   levels.registerLevel(3, (context) => new boss.BossLevel(context));
   g.currentLevel.cleared = true; // clearing Level 2 now starts the boss
   ```

   (Under this shim the HUD reads LEVEL 3; once level3.js exists, the
   same fight is reached as LEVEL 4 simply by playing through.)
8. In the fight: the boss is 160 x 80 px at a constant height and the
   health bar across the top starts full (10/10). The boss drifts
   sideways and reverses exactly at each canvas edge;
   `g.currentLevel.y` stays 120 for the whole fight.
9. Watch the firing: volleys of three bullets — one straight down, two
   angled symmetrically outward — leave the boss's centre every
   ~1.5 s.
10. Land five hits (or run `g.currentLevel.hp = 5`): the health bar
    shows 5/10 and from that moment the volleys come every ~0.7 s.
    The pattern and bullet speed are unchanged.
11. Sudden death: with 3 lives left, take a single boss bullet — the
    run ends on the spot with GAME OVER. ENTER -> title, ENTER -> a
    fresh run at Level 1 (score 0, lives 3, `g.hud.level === 1`).
12. Victory: reduce the boss to 0 HP (ten hits, or
    `g.currentLevel.hp = 1` then one more hit). The win screen shows
    "YOU WIN!", the final score and "Press ENTER to restart". ENTER
    starts a new run at Level 1.
