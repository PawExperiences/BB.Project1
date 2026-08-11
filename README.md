# Space Invaders (E2E demo)

A dependency-free Space Invaders clone: hand-written HTML/CSS/ES modules,
no bundler, no package manager. Open `index.html` directly from disk
(`file://`) -- nothing needs a server.

## Project layout

| File | Owner card | Status |
| --- | --- | --- |
| `index.html` | Game loop and canvas framework | shipped |
| `gameConfig.js` | Game loop and canvas framework | shipped |
| `game.js` | Game loop and canvas framework | shipped |
| `input.js` | Input / player card | shipped |
| `player.js` | Input / player card | shipped |
| `invaders.js` | Sprites / collision card | shipped |
| `collision.js` | Sprites / collision card | shipped |
| `level1.js` | Level 1 card | shipped |
| `level2.js` | Level 2 card | shipped |
| `level3.js` | Level 3 card | planned |
| `boss.js` | Boss card | planned |

The Game loop and canvas framework card shipped `index.html`, `gameConfig.js`
and `game.js` with placeholder comments marking where player/enemy/collision
code would hook in. The Input and player card filled in the player half of
those hooks: `input.js`, `player.js`, and the `initInput()` / `player.update()`
/ `player.draw()` calls wired into `game.js`'s loop. This card (Sprite
rendering and collision detection) fills in the enemy half: `invaders.js`
(the 11x5 invader grid and its sideways/drop movement) and `collision.js`
(the AABB collision check, the bullet-vs-invader and invader-bullet-vs-player
checks, the kill explosion effect, and the score increment), wired into
`game.js`'s loop via `invaderFormation.update()` / `collide()` (before that
frame's render) and `invaderFormation.draw()` / `drawExplosions()` (during
render). This card (Level 1: the classic grid) fills in `level1.js`: it
owns the 11x5 formation for Level 1, marching it in discrete steps whose
interval scales linearly with invaders remaining (~800ms/step at 55 alive,
down to ~100ms/step at 1 remaining), reversing direction and dropping one
invader-cell height whenever the formation's leading edge reaches a canvas
side, docking a life and restarting the formation if it reaches the
player's row, and reporting when the formation is cleared so `game.js` can
advance the HUD to "Level 2" and stop calling into Level 1. It reuses
`InvaderFormation` (grid layout and rendering) from the Sprites / collision
card rather than reinventing it. This card (Level 2: they shoot back) fills
in `level2.js`: once Level 1 reports its formation cleared, `game.js` drops
straight into Level 2 with no level-select screen, carrying the player's
lives and the session's cumulative shot count over unchanged. Level 2 reuses
the same 11x5 `InvaderFormation`, marching it on Level 1's step-interval
curve with every interval multiplied by 0.67 (~1.5x faster at every stage).
A single global timer re-arms after each shot with a random 800ms-2000ms
delay and, when it fires, lets only the lowest surviving invader in a
column shoot a bullet that falls straight down at 300 px/s. A bonus UFO
spawns every 20 seconds of level time, alternating its starting edge each
time, crosses at 120 px/s, and scores one of the fixed tiers
`[50, 100, 150, 300]` on a kill, indexed by the cumulative session shot
count mod 4 (never randomly). An invader bullet hitting the player docks a
life, respawns the ship at the fixed bottom-center start position, and
grants 2 seconds of flashing invulnerability during which further hits are
ignored. It does not create, stub, or implement any of the files above
marked "planned" -- each is its own reviewable PR from a sibling card, and
it does not add a level-select screen or a Level 2 -> Level 3 transition,
both out of scope for this card.

## Manual verification

1. Open `index.html` directly in a browser (double-click it, or drag it into
   a browser window) -- no local server, no build step.
2. Confirm a dark 768x896 canvas is shown with "SPACE INVADERS" and
   "Press ENTER to start".
3. Press **ENTER**. The scene switches to Playing: the canvas shows the HUD
   (`SCORE`, `HI-SCORE`, `LEVEL`, `LIVES`) at the top, with `LEVEL 1` shown,
   no page reload, and a green ship near the bottom-center of the canvas.
4. Hold **ArrowLeft** (or **A**): the ship moves left at a steady speed and
   stops exactly at the left edge of the canvas, never moving past it. Hold
   **ArrowRight** (or **D**): same, stopping exactly at the right edge.
5. Press **Space**: a small white bullet spawns at the ship and travels
   straight up. While it is on screen, pressing/holding Space again spawns no
   further bullets. Once it travels off the top of the canvas, Space fires a
   new bullet.
6. Press **ENTER** again. The scene switches to Game Over: "GAME OVER" and
   "Final Score: <score>" are shown, along with "Press ENTER to restart".
7. Press **ENTER** once more. The scene returns to Title, score and lives
   are reset (hi-score is preserved), and the page has not reloaded or
   navigated -- the URL bar / history is unchanged throughout.
8. Press **ENTER** to start a new game. Confirm an 11-column x 5-row grid of
   55 identical red rectangles (the invaders) is shown near the top of the
   canvas, and `LEVEL 1` is shown in the HUD. Watch it march sideways in
   small discrete steps (a brief pause between each step, not a smooth
   glide); when it reaches either canvas edge, confirm the whole grid
   reverses direction and drops down by one invader-cell height before
   continuing to march sideways -- it never overlaps the canvas edge.
9. Move the ship under an invader and press **Space** to fire, repeating
   until only a few invaders remain. Confirm each kill: the invader
   disappears, a brief orange explosion flashes at that spot and then
   disappears on its own, `SCORE` in the HUD increases by a fixed amount,
   and the bullet is consumed (no bullet continues past the invader it
   struck). Confirm the formation's march visibly speeds up as fewer
   invaders remain, from a slow step with the full formation to a fast
   step with just one invader left.
10. Invader-bullet-vs-player: `collision.js` detects an invader bullet
    overlapping the ship and responds by calling the same player-hit
    response (`player.loseLife()`) already established by the Input and
    player card -- no new life/game-over behaviour is introduced here.
    Invaders don't fire bullets yet (that ships with "Level 2: they shoot
    back"), so this path has no bullets to find and isn't independently
    observable in the browser today; once Level 2 adds invader bullets, an
    invader bullet touching the ship should immediately decrement `LIVES`
    in the HUD with no other change in game flow.
11. Formation-reaches-player: start a new game and let the formation march
    downward (avoid shooting it, or shoot just a few) until an invader
    reaches the ship's row. Confirm `LIVES` in the HUD decreases by one and
    the formation immediately resets to the full 11x5 grid at its starting
    position, still on `LEVEL 1`.
12. Level clear: start a new game and destroy all 55 invaders (repeat step
    9 to the end). Confirm that once the last invader is destroyed, the
    HUD immediately updates to `LEVEL 2` and the formation stays cleared --
    no invaders reappear or continue marching.
13. Level 1 -> Level 2 entry: continuing from step 12, confirm the game
    drops straight into a new 11x5 invader grid with no level-select screen
    at any point, `LIVES` in the HUD is exactly whatever it stood at when
    Level 1 was cleared (not reset to 3), and the formation visibly marches
    faster (shorter pause between steps) than Level 1's did at a comparable
    invader count.
14. Invader fire: in Level 2, watch the formation without shooting. Confirm
    invader bullets (small pale rectangles) fall straight down from
    invaders at a steady speed, only ever from the bottommost surviving
    invader of whichever column fires, at irregular intervals roughly
    0.8-2 seconds apart -- never two bullets in flight from the same
    column's covered invader at once.
15. Bonus UFO: in Level 2, wait roughly 20 seconds. Confirm a UFO
    (small purple rectangle) crosses the canvas near the top at a steady
    speed; wait for a second one roughly 20 seconds later and confirm it
    starts from the opposite edge the first one did. Shoot a UFO and
    confirm `SCORE` jumps by one of 50, 100, 150, or 300 (never a
    seemingly random amount) -- matching `(cumulative shots fired so far)
    mod 4` against `[50, 100, 150, 300]` if you count your shots.
16. Player hit/respawn/invulnerability: in Level 2, let an invader bullet
    hit the ship. Confirm `LIVES` decreases by exactly one, the ship
    immediately snaps back to the fixed bottom-center start position, and
    for about 2 seconds afterward the ship visibly flashes and further
    invader bullets passing through it cause no additional life loss.
    After the flash stops, confirm the next hit docks a life again.
17. Game over from Level 2: let `LIVES` reach 0 while in Level 2. Confirm
    the scene switches to the same Game Over screen as from Level 1
    ("GAME OVER", final score, "Press ENTER to restart"), and pressing
    **ENTER** there returns to Title exactly as it does today.
