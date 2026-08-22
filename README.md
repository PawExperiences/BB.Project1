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
  by "Sprite rendering and collision detection".
- `level1.js` — Level 1: the classic grid. Owned by "Level 1: the classic
  grid".
- `level2.js` — Level 2: invaders that shoot back, plus the UFO bonus.
  Owned by "Level 2: they shoot back".
- `level3.js` — Level 3: four destructible shield bunkers plus the 28-kill
  formation split into independently-marching halves. Owned by "Level 3:
  shields and formations".
- `boss.js` — the multi-phase boss fight (Level 4). Owned by "Boss level:
  multi-phase finale".

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

### Verifying player movement, firing and lives

Open `index.html` via a `file://` URL, press ENTER to start a game, and
check:

- [ ] Holding ArrowLeft moves the ship left, and holding ArrowRight moves it
      right; releasing the key stops the movement immediately.
- [ ] Holding A moves the ship left and holding D moves it right, exactly
      like ArrowLeft/ArrowRight.
- [ ] Holding ArrowLeft and ArrowRight (or A and D) at the same time leaves
      the ship stationary — no drift in either direction.
- [ ] Holding a direction key drives the ship all the way to that edge of
      the canvas, where it stops flush with the edge (left edge at `x = 0`,
      right edge at `x = 768`) instead of leaving the canvas; releasing that
      key and holding the opposite one moves the ship away from the edge
      immediately.
- [ ] Movement speed looks the same regardless of the browser's actual frame
      rate — e.g. throttling the tab (DevTools → Performance → CPU
      throttling, or backgrounding/restoring the tab) does not make the ship
      cover more or less ground per second of wall-clock time.
- [ ] Pressing Space fires a single small white bullet from the ship's nose
      that travels straight up.
- [ ] While that bullet is on screen, pressing or holding Space again fires
      nothing — at no point are two bullets visible at once.
- [ ] Once the bullet reaches the top of the canvas and disappears, the next
      Space press fires a new bullet.
- [ ] In the DevTools console, `import('./game.js').then((m) =>
      console.log(m.player.lives));` reports `3` at the start of a run (the
      `STARTING_LIVES` value from `gameConfig.js`).

### Verifying the invader formation and collisions

Open `index.html` via a `file://` URL, press ENTER to start a game, and
check:

1. The invader grid on screen is 11 columns wide and 5 rows tall (55
   identical white rectangles), positioned entirely within the canvas.
2. Watch the grid march: it steps sideways at a steady pace, moving as one
   unit; releasing focus from the tab and returning does not change how far
   it has travelled per second of wall-clock time.
3. Keep watching until the formation reaches either side of the canvas: on
   that step it drops down one row and reverses horizontal direction, then
   resumes stepping sideways in the new direction on the next step.
4. Move the ship under an invader and fire (Space). On a hit: the bullet
   disappears, a brief orange flash (the explosion) appears where the
   invader was, the invader is gone, and the `Score` in the HUD increases.
5. Keep firing at invaders in one column until the whole column is cleared,
   then watch the next few steps: the column stays empty (the grid does not
   re-flow to fill the hole), and the formation's surviving invaders now
   travel further on that side before the next edge drop.
6. In the DevTools console, `import('./invaders.js').then((m) => { const f
   = new m.InvaderFormation(); f.update(5); console.log(f.aliveCount(),
   f.lowestBottom()); });` runs without throwing and logs `55` and a
   positive number — `update()` with a large `dt` advances the formation by
   several steps (including any edge drops) instead of skipping past a
   boundary.
7. Keep clearing invaders and watch the marching pace: it visibly quickens
   as the count drops (~800 ms per step near 55 alive, ~450 ms per step
   around 28 alive, ~100 ms per step with 1 left) — the fewer invaders
   remain, the faster the survivors step.
8. Let the formation march down (or use the console snippet in step 6
   repeatedly) until the lowest invader's row reaches the player's ship:
   `Lives` in the HUD drops by exactly one, the formation resets to a fresh
   55-invader grid at its starting position and pace, the ship re-centres,
   and any bullet/explosion on screen is cleared. If that was the last
   life, the scene switches to Game Over instead of restarting the level.
9. Destroy all 55 invaders: the HUD's `LEVEL` value changes from `1` to
   `2` and a new formation appears — in this build `level2.js` is already
   registered (`registerLevel(2, ...)`), so clearing Level 1 hands off into
   Level 2's gameplay rather than Game Over. (Level 1's own unregistered-
   level fallback — asking the registry for a level with no registered
   factory — still resolves to Game Over without throwing or freezing the
   loop; it is just not reachable by clearing Level 1 in this codebase,
   since Level 2 already exists. It can still be checked directly: `import
   ('./levels.js').then((m) => console.log(m.isLevelRegistered(99),
   m.createLevel(99, {})));` logs `false` and `null`.)

### Verifying Level 2: they shoot back

Open `index.html` via a `file://` URL, press ENTER to start a game, and clear
Level 1 (or jump straight there — see the console snippet below) to reach
Level 2.

- [ ] Lives carry over: note the `Lives` value in the HUD in the moment
      Level 1 clears, and confirm the HUD still shows that same value on the
      very first frame of Level 2 — it is not reset to `3`.
- [ ] Faster formation: watch the grid march. At any given alive-count it
      steps noticeably faster than Level 1 did at the same alive-count
      (~1.5x — e.g. around 536 ms per step near 55 alive, versus Level 1's
      ~800 ms). To check the exact ratio without playing it out, run in the
      DevTools console:
      `import('./level1.js').then((m1) => import('./level2.js').then((m2) =>
      { const l1 = new m1.Level1({ player: {}, hud: {}, hostileBullets: [] });
      const l2 = new m2.Level2({ player: { lives: 3 }, hud: {},
      hostileBullets: [] }); console.log(l1.stepIntervalMs(),
      l2.stepIntervalMs(), l2.stepIntervalMs() / l1.stepIntervalMs()); }));`
      — the ratio logs as `0.67`.
- [ ] Enemy fire, lowest invader only: watch a single column that still has
      invaders in more than one row. Only the bottom-most living invader in
      that column ever fires; if it is destroyed, the invader now at the
      bottom of that column becomes the one that fires next — an invader
      with a living invader still below it in its own column never fires.
- [ ] Enemy fire is a single global volley, not one per column: count the
      hostile (red) bullets appearing over a stretch of several seconds —
      they appear one at a time, roughly 0.8–2 s apart, never several at
      once from different columns simultaneously.
- [ ] Hostile bullets travel straight down and disappear at the bottom edge
      of the canvas if they miss the ship.
- [ ] UFO timing and side alternation: watch the top band of the playfield
      (below the HUD text, above the grid's home row). A small red saucer
      crosses it roughly every 20 s. Note which side it enters from each
      time — left, then right, then left, and so on, alternating every
      appearance.
- [ ] UFO scoring tiers: let a UFO cross unhit — no score change and no
      other effect. Then shoot a UFO with the player's bullet — it
      disappears and `Score` jumps by one of `50`, `100`, `150` or `300`.
      Sink four UFOs in a row (or check the shot count in the console via
      `import('./game.js').then((m) => console.log(m.player.shotsFired))`)
      and confirm the tiers cycle in the fixed order `50, 100, 150, 300,
      50, 100, ...` keyed off the player's cumulative shot count — never at
      random.
- [ ] Death and respawn: let a hostile bullet (or a breaching invader) hit
      the ship. `Lives` drops by exactly one, the ship reappears at its
      fixed bottom-centre starting position, and it visibly flashes
      (blinks on/off) for about 2 seconds. Any hit landing during that
      flashing window causes no further life loss and no second respawn —
      only after the flash stops does the next hit cost a life again.
- [ ] Game Over and restart still work from Level 2: run the lives down to
      zero while in Level 2 (or set `Lives` to `0` directly — see the
      Game-Over console snippet earlier in this README). The scene switches
      to Game Over, and pressing ENTER there returns to the Title scene.
- [ ] Grid clear advances to Level 3: destroy all 55 invaders in Level 2
      (or repeatedly run the invader-formation console snippet from the
      Level 1 verification section against `currentLevel.formation`, then
      let the level's own `update()` notice the clear). The HUD's `LEVEL`
      value changes from `2` to `3`, four shield bunkers appear and a fresh
      11x5 formation of invaders spawns — see the Level 3 section below for
      the full verification path.
- [ ] No console errors: throughout the whole Level 2 sequence above
      (formation, enemy fire, UFO, death/respawn, level clear), the
      DevTools console shows no errors or unhandled promise rejections.

To jump straight into Level 2 for testing instead of clearing Level 1 by
hand, start a game and run in the DevTools console:
`import('./game.js').then((m) => { m.currentLevel.formation.invaders.forEach
((i) => { i.alive = false; }); });` — on the next fixed update tick Level 1
notices all 55 invaders are gone and hands off to Level 2 exactly as a real
clear would.

### Verifying Level 3: shields and formations

To jump straight into Level 3 for testing instead of clearing Levels 1 and 2
by hand, start a game and run this DevTools console snippet, which empties
whichever formation is currently active and so advances one level per run:
`import('./game.js').then((m) => { m.currentLevel.formation.invaders.forEach
((i) => { i.alive = false; }); });`. Run it once from Level 1 (advances to
Level 2), wait a moment, then run it again from Level 2 (advances to Level
3). Once the HUD shows `LEVEL 3`, check:

- [ ] Fresh 11x5 grid and Level 2 behaviours: 55 invaders appear in the
      classic grid, invader fire (red bullets) appears, a bonus UFO
      eventually crosses the top band, and losing a life still respawns the
      ship at its bottom-centre start with ~2 s of flashing invulnerability
      — exactly as in Level 2.
- [ ] Four shield bunkers: evenly spaced across the width, each a small
      solid-colour 4x4 block of square cells, sitting with their tops at
      roughly 80% of the way down the canvas (well above the ship, below the
      invaders' home row).
- [ ] Bunker erosion from the player's own bullet: stand under a bunker and
      fire straight up into it. The bullet stops at the bunker — a single
      cell disappears and the bullet does not reappear above the bunker or
      go on to hit an invader.
- [ ] Bunker erosion from hostile fire: wait for a hostile (red) bullet to
      fall through a bunker's column. A cell in its path disappears and the
      bullet vanishes at the bunker instead of continuing down to the ship
      — position the ship directly behind an intact cell and confirm a
      hostile bullet aimed at it is stopped by the bunker rather than
      costing a life.
- [ ] Bunker erosion from a descending invader: let the formation march down
      (drop by drop) until it reaches a bunker's row. Cells directly under
      the passing invaders disappear as the invader's body crosses them,
      while the invader itself is unaffected (still alive, same speed).
- [ ] Erosion is permanent: note which cells are gone, then lose a life
      (respawn) without breaching. The same cells are still gone — nothing
      is rebuilt. Only a full level restart (a breach, or re-entering Level
      3 from scratch) produces four intact 4x4 bunkers again.
- [ ] No split before the 28th kill: destroy invaders one at a time (or in
      small numbers) and confirm the formation still marches, drops and
      reverses as a single unit while 28 or more remain alive (27 or fewer
      killed).
- [ ] The 28-kill split: destroy invaders until exactly 27 remain (a quick
      way, from the DevTools console right after entering Level 3):
      `import('./game.js').then((m) => { const invaders =
      m.currentLevel.formation.invaders; for (let i = 0; i < 28; i++)
      invaders[i].alive = false; });` — on the next tick the formation
      visibly splits into two groups with no invader jumping position: a
      left group (originally columns 1-6, including the middle column) and
      a right group (columns 7-11).
- [ ] Opposite initial directions: the instant of the split, the left group
      visibly starts moving left and the right group starts moving right —
      confirm in the console with `import('./game.js').then((m) =>
      console.log(m.currentLevel.leftGroup.direction,
      m.currentLevel.rightGroup.direction));`, which logs `-1 1`.
- [ ] Independent sweeps: keep watching — each group reverses at the canvas
      edges and drops on its own schedule (they do not stay in lockstep),
      while both keep stepping at the same pace as each other and both keep
      firing hostile bullets.
- [ ] Clear and advance to the boss: destroy every invader in both groups
      (or, from the console, set every remaining invader's `alive` to
      `false` the same way as above). The HUD's `LEVEL` value changes from
      `3` to `4` and the boss fight begins — the same `advanceLevel()`
      handoff used for every earlier level transition.
- [ ] No console errors: throughout the whole Level 3 sequence above
      (bunkers, split, independent sweeps, clear), the DevTools console
      shows no errors or unhandled promise rejections.

### Verifying Level 4: the boss fight

To reach Level 4 without clearing three levels' worth of invaders by hand,
start a game and run the same "empty out the current formation" console
snippet used in the Level 2/3 sections above, once per level:
`import('./game.js').then((m) => { m.currentLevel.formation.invaders.forEach
((i) => { i.alive = false; }); });`. Run it, wait a moment for the level's own
`update()` to notice the clear, then run it again, wait, then run it a third
time — the HUD's `LEVEL` value goes `1` -> `2` -> `3` -> `4`. Once `LEVEL 4`
is showing, the invader grid is gone and the boss fight has begun; check:

- [ ] Single boss, no grid: a single boss roughly 160x80 px, built entirely
      from filled rects/arcs (no image assets), occupies the upper part of
      the playfield in place of the invader grid. A health bar spans the
      full width of the canvas at the very top.
- [ ] Health bar starts full: the bar's filled portion covers the whole
      track when the fight begins (10/10 HP).
- [ ] Drift and edge reversal: watch the boss move — it drifts sideways at a
      steady pace and never moves down or up. The instant its body reaches
      either edge of the canvas it reverses direction, staying fully
      on-screen (it never runs off either side).
- [ ] Health-bar depletion: fire at the boss (Space, same as any other
      level). Each bullet that lands removes exactly one hit's worth of HP —
      the health bar's filled width visibly shrinks by 1/10 of the track per
      hit, the bullet disappears, and the boss flashes white briefly.
- [ ] Phase 1 -> Phase 2 fire-rate change: while HP is 6 or higher, time the
      gap between volleys (three bullets fired together — one straight down,
      one angled to each side) — roughly 1.5 s apart. Land a hit that brings
      HP down to 5 and keep watching: from that hit on, volleys fire roughly
      every 0.7 s instead, with the identical three-bullet spread. To reach
      Phase 2 without landing five hits by hand, use the console:
      `import('./game.js').then((m) => { m.currentLevel.hp = 5; });`, then
      watch the very next volley land on the faster cadence.
- [ ] Sudden death: let any single boss bullet touch the ship, regardless of
      how many lives the HUD shows. The run ends immediately on that one
      touch — straight to the Game Over scene — even with 2 or 3 lives
      showing a moment before.
- [ ] Win screen: reduce the boss to 0 HP (continue landing hits, or jump
      ahead with `import('./game.js').then((m) => { m.currentLevel.hp = 1;
      });` and land one more shot). The scene switches to "YOU WIN!",
      showing the final score and "Press ENTER to restart"; pressing ENTER
      starts a fresh run at Level 1 with `Score: 0`, `Lives: 3` and
      `LEVEL 1`.
- [ ] Only one end screen ever appears: 0 HP always shows the win screen
      (never Game Over), and a boss bullet touching the ship always shows
      Game Over (never the win screen) — the two outcomes are mutually
      exclusive.
- [ ] No console errors: throughout the whole Level 4 sequence above (drift,
      hits, the phase change, and either sudden death or the win screen),
      the DevTools console shows no errors or unhandled promise rejections.

### Verifying the 250 ms delta clamp

1. Start a game and let it run for a few seconds.
2. Switch to another browser tab (or minimize the window) for at least 10
   seconds, then switch back.
3. The ship and invaders should resume from roughly where they were, not
   jump or teleport — at most 250 ms (15 fixed steps) of simulation runs
   on the first frame after resuming, regardless of how long the tab was
   backgrounded.
