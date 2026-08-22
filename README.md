# Space Invaders (JavaScript)

A hand-written HTML/CSS/ES-modules Space Invaders clone. No framework, no
bundler, no package manager, no npm install.

## Running the game

Open `index.html` directly in a browser — double-click it, or open the
`file://` path. There is no build step and no dev server: the page loads
`game.js` as an ES module and runs. Use a browser that allows ES modules
over `file://` (Firefox or Safari; Chrome blocks module scripts on
`file://` unless launched with `--allow-file-access-from-files`).

Controls: ArrowLeft/ArrowRight (or A/D) to move, Space to fire, Enter to
advance every scene transition (Title → Playing, Game Over → Title, Win →
Title).

## Planned file layout

- `index.html` — the canvas page (768×896, dark background), loads
  `game.js` as an ES module. Owned by this card.
- `gameConfig.js` — shared constants (`CANVAS_WIDTH`, `CANVAS_HEIGHT`,
  `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`). Owned by this card.
- `game.js` — the fixed-timestep loop (60 updates/s, 250 ms delta clamp),
  the Title/Playing/Game Over/Win scene machine, the on-canvas HUD, the
  exported `hud` state, and the level-registry wiring that hands each
  level module its slice of game state. Owned by this card.
- `input.js` — keyboard input (held-key tracking). Owned by "Keyboard
  input and the player ship".
- `player.js` — the player ship: movement, shooting, lives. Owned by
  "Keyboard input and the player ship".
- `collision.js` — AABB collision detection and explosion effects. Owned
  by "Sprite rendering and collision detection".
- `invaders.js` — the invader formation (grid, marching, drawing). Owned
  by "Level 1: the classic grid".
- `level1.js` — Level 1: the classic grid. Owned by "Level 1: the classic
  grid".
- `level2.js` — Level 2: invaders that shoot back, plus the UFO bonus.
  Owned by "Level 2: they shoot back".
- `level3.js` — shields and formations. Not yet created — owned by
  "Level 3: shields and formations".
- `boss.js` — the multi-phase boss fight and win screen. Owned by "Boss
  level: multi-phase finale".

Every module above `game.js` in this list already exists in the repo; this
card only reconciles `index.html`, `gameConfig.js` and `game.js` and does
not touch any of them.

## Manual verification checklist

Open `index.html` via a `file://` URL and check:

- [ ] Title scene shows "SPACE INVADERS" and "Press ENTER to start" on a
      768×896 canvas over a dark page background.
- [ ] Pressing ENTER on the Title scene moves to the Playing scene; the
      HUD shows `Score: 0` and `Lives: 3` and `LEVEL 1`.
- [ ] During Playing, the HUD (score, lives, level, hi-score) is drawn on
      the canvas itself, and the Level 1 invader grid is visible and
      marching.
- [ ] Clearing Level 1 (or losing all lives) either advances to Level 2 or
      ends the run — both without any page reload or navigation.
- [ ] Losing all lives (e.g. letting an invader breach the player's row,
      or taking enough hits) moves to the Game Over scene, which shows
      "GAME OVER", the final score, and "Press ENTER to restart".
- [ ] Pressing ENTER on the Game Over scene returns to the Title scene,
      and the `Hi` value on the next run reflects the previous run's
      score if it was higher.
- [ ] Browser DevTools console shows no errors throughout the whole flow.

### Verifying the game-over path without playing a full round

To reach Game Over quickly by hand instead of losing legitimately:

1. Start a game (ENTER on the Title scene).
2. In the DevTools console run:
   `import('./game.js').then((m) => { m.hud.lives = 0; });`
3. The scene switches to Game Over within a frame, and `Hi` is updated to
   the greater of its previous value and the final score.

### Verifying the 250 ms delta clamp

1. Start a game and let it run for a few seconds.
2. Switch to another browser tab (or minimize the window) for at least 10
   seconds, then switch back.
3. The ship and invaders should resume from roughly where they were, not
   jump or teleport — at most 250 ms (15 fixed steps) of simulation runs
   on the first frame after resuming, regardless of how long the tab was
   backgrounded.
