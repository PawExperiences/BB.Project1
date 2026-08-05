# BB.Project1

Reset by BuildBoard.

---

## Space Invaders — Planned File Layout

### Files owned by this card (Game loop and canvas framework)

| File            | Purpose                                                      |
|-----------------|--------------------------------------------------------------|
| `index.html`    | HTML shell: `<canvas>` element, dark background, loads `game.js` as ES module |
| `game.js`       | Fixed-timestep game loop, scene state machine, HUD renderer, `hudState` export |
| `gameConfig.js` | Shared named constants (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`) |

### Files owned by later cards

| File            | Owning card                                      |
|-----------------|--------------------------------------------------|
| `input.js`      | "Keyboard input and the player ship"             |
| `player.js`     | "Keyboard input and the player ship"             |
| `invaders.js`   | "Sprite rendering and collision detection"       |
| `collision.js`  | "Sprite rendering and collision detection"       |
| `explosion.js`  | "Sprite rendering and collision detection"       |
| `level1.js`     | "Level 1: the classic grid"                      |
| `level2.js`     | "Level 2: they shoot back"                       |
| `level3.js`     | "Level 3: shields and formations"                |
| `boss.js`       | "Boss level: multi-phase finale"                 |

---

## Manual Verification Checklist

Open `index.html` directly from the filesystem (double-click or use `File → Open` in your browser — no local server required).

### 1. Canvas and background
- [ ] A black (`#000`) page is shown with a 768 × 896 canvas centred in the viewport.
- [ ] No browser console errors about missing files or network requests.

### 2. Title scene
- [ ] The canvas displays **SPACE INVADERS** in large white monospace text near the vertical centre.
- [ ] Below that, **"Press ENTER to start"** is shown in smaller text.
- [ ] The green HUD line at the top shows `SCORE: 0`, `HI: 0`, and `LIVES: 3`.

### 3. Title → Playing transition
- [ ] Press **Enter**.
- [ ] The canvas switches immediately to the Playing scene — **no page reload**.
- [ ] Pressing Enter again during play has no effect.

### 4. HUD during play
- [ ] `SCORE`, `HI`, and `LIVES` values remain visible and legible at the top of the canvas.

### 5. Game Over scene (manual trigger)
- [ ] Open the browser DevTools console and run:
  ```js
  import('./game.js').then(m => m.enterGameOver());
  ```
- [ ] The canvas shows **GAME OVER**, `Score: 0` (or current score), and **"Press ENTER to restart"**.

### 6. Game Over → Title transition
- [ ] While on the Game Over scene, press **Enter**.
- [ ] The canvas returns to the Title scene — **no page reload**.
- [ ] Score resets to 0 in the HUD.

### 7. Delta cap (backgrounding test)
- [ ] Start playing (press Enter to reach the Playing scene).
- [ ] Switch to another application or tab for 5–10 seconds.
- [ ] Return to the game tab.
- [ ] Observe: no visual jump, no flood of console messages — the accumulated delta was capped at 250 ms.

### 8. `hudState` export
- [ ] In the DevTools console (after the module is loaded), run:
  ```js
  import('./game.js').then(m => { m.hudState.score = 1234; });
  ```
- [ ] The HUD score updates to **1234** on the very next rendered frame.

---

## Manual Verification — Keyboard Input & Player Ship

Open `index.html` directly from the filesystem. Press **Enter** to reach the Playing scene, then verify:

### 9. input.js — key held detection
- [ ] Open DevTools console and run:
  ```js
  import('./input.js').then(m => {
    window._isKeyHeld = m.isKeyHeld;
  });
  ```
- [ ] Hold **ArrowLeft** and run `window._isKeyHeld('ArrowLeft')` in the console — it should return `true`.
- [ ] Release the key and run it again — it should return `false`.

### 10. Player ship rendering
- [ ] A green ship shape (hull rectangle + dome arc + wing nubs) is visible near the bottom of the canvas during the Playing scene.
- [ ] No external image files are loaded; the ship is drawn entirely with Canvas 2D calls.

### 11. Horizontal movement
- [ ] Hold **ArrowLeft** — the ship moves left smoothly.
- [ ] Hold **KeyA** — the ship also moves left.
- [ ] Hold **ArrowRight** — the ship moves right smoothly.
- [ ] Hold **KeyD** — the ship also moves right.
- [ ] The ship never moves outside the canvas edges (left edge ≥ 0, right edge ≤ 768).

### 12. Single-bullet constraint
- [ ] Press **Space** once — a yellow rectangle travels upward from the ship.
- [ ] While that bullet is in flight, pressing **Space** again fires no additional bullet.
- [ ] When the bullet exits the top of the canvas, pressing **Space** fires a new bullet.

### 13. Lives counter
- [ ] In DevTools console, after importing player.js:
  ```js
  import('./player.js').then(m => {
    const p = new m.Player();
    console.log(p.lives); // should print 3
    p.lives = 2;
    console.log(p.lives); // should print 2
  });
  ```
- [ ] `p.lives` reads as `3` initially (from `STARTING_LIVES`).
- [ ] `p.lives` can be decremented by external code.

---

## Manual Verification — Sprite Rendering & Collision Detection

Open `index.html` from the filesystem, press **Enter** to enter the Playing scene, then verify:

### 14. Invader formation renders
- [ ] 55 lime-green (`#00FF00`) rectangles are visible, arranged in 11 columns × 5 rows.
- [ ] Each rectangle is 30 × 20 px with 10 px horizontal and 10 px vertical gaps.
- [ ] The formation is horizontally centred on the canvas.

### 15. Formation movement
- [ ] The entire grid moves horizontally at 1 px per frame.
- [ ] When the leading edge reaches either canvas boundary the formation reverses direction and drops 20 px.

### 16. Collision pass order
- [ ] Verify in `game.js` that the call order inside the main loop is: `update()` → `collide()` → `render()`.

### 17. Bullet-vs-invader collision
- [ ] Move the ship under an invader and press **Space**.
- [ ] The bullet travels up; on contact, the invader disappears and the SCORE counter increments by 10.
- [ ] The bullet is also removed on hit (no pass-through).

### 18. Explosion effect
- [ ] A bright yellow (`#FFFF00`) rectangle appears at the killed invader's position for approximately 20 frames (~333 ms) then disappears.
- [ ] Killing multiple invaders in quick succession shows multiple independent yellow rectangles.

### 19. Score display
- [ ] `SCORE: 0` is shown in the HUD from the first frame of the Playing scene.
- [ ] Each kill increments the displayed score by exactly 10.
- [ ] Destroying all 55 invaders results in `SCORE: 550` (or higher if replaying).

### 20. onPlayerHit stub
- [ ] In DevTools console, run:
  ```js
  import('./collision.js').then(m => m.onPlayerHit());
  ```
- [ ] The string `'Player hit'` appears in the console.

### 21. collideEnemyBulletsWithPlayer stub wired
- [ ] Verify in `game.js` that `collideEnemyBulletsWithPlayer` is imported from `collision.js` and called in the `collide()` function.

### 22. file:// compatibility
- [ ] The game runs with no errors in the browser console when opened directly from the filesystem (no server, no npm, no bundler).

---

## Manual Verification — Level 1: The Classic Grid

Open `index.html` from the filesystem and press **Enter** to enter the Playing scene. `level1.js` loads automatically.

### 23. Formation renders on level load
- [ ] Exactly 55 lime-green (`#00FF00`) rectangles are visible, arranged in **11 columns × 5 rows**.
- [ ] The formation is horizontally centred on the canvas, starting near the top.
- [ ] **`LEVEL: 1`** is displayed in the HUD (below the score line, top-left area).

### 24. Formation movement and speed scaling
- [ ] The formation moves horizontally (left/right) as a unit, stepping at a timed interval.
- [ ] With all 55 invaders alive, observe the step timing — steps should occur approximately **every 800 ms** (roughly 1.25 steps per second).
- [ ] Shoot invaders until only a few remain. The formation should noticeably speed up — with 1 invader left, steps occur approximately **every 100 ms** (about 10 steps per second).
- [ ] Intermediate counts interpolate: ~450 ms at 28 invaders.

### 25. Edge-drop behaviour
- [ ] Watch the formation reach the right canvas boundary.
- [ ] On contact: the entire formation **drops downward by exactly 20 px** (one `INVADER_HEIGHT`) and **reverses direction** (begins moving left) in the same step.
- [ ] The same happens when it reaches the left boundary — drops 20 px and begins moving right.
- [ ] The formation does **not** drift past the canvas edge before reversing.

### 26. Bullet-vs-invader collision (Level 1 path)
- [ ] Move the ship under an invader and press **Space**.
- [ ] The bullet travels upward; on contact, the invader disappears.
- [ ] `SCORE` increments by 10 per kill.
- [ ] The step interval visibly increases speed as fewer invaders remain.

### 27. Loss condition — formation reaches player
- [ ] Let the formation descend repeatedly (by allowing it to bounce many times without shooting).
- [ ] When any invader's **bottom edge** reaches the **top edge of the player ship**, observe:
  - [ ] `LIVES` counter decrements by 1.
  - [ ] The formation **resets** to full 55 invaders at the initial position.
  - [ ] The level restarts (formation speed resets to ~800 ms interval).
  - [ ] **`LEVEL: 1`** remains in the HUD after restart.

### 28. Win condition — all invaders destroyed
- [ ] Destroy all 55 invaders.
- [ ] `transitionTo('level2')` is called exactly once.
- [ ] Level 2 loads automatically (see Level 2 checks below).
- [ ] No duplicate transition calls (no repeated scene changes).

### 29. HUD level number persistence
- [ ] `LEVEL: 1` is shown throughout the entire level, including:
  - [ ] Immediately after the Playing scene starts.
  - [ ] After a life-loss restart (formation reset).
  - [ ] While the last invader is being destroyed (before transition).

### 30. No out-of-scope side-effects
- [ ] No invader shooting occurs in Level 1 (bullets only come from the player).
- [ ] No shields are rendered.
- [ ] Score increments only on kills, not at level load or restart.
- [ ] The browser console shows no errors during normal play.

---

## Manual Verification — Level 2: They Shoot Back

Complete Level 1 (destroy all 55 invaders) to enter Level 2 automatically, then verify:

### 31. Automatic transition from Level 1
- [ ] After destroying all invaders in Level 1, the game immediately transitions to Level 2 — **no level-select screen**.
- [ ] **`LEVEL: 2`** appears in the HUD.
- [ ] The lives counter is **unchanged** from the end of Level 1 (no reset).
- [ ] The score carries over as well.

### 32. Formation layout
- [ ] A fresh 5 rows × 11 columns invader grid appears, arranged identically to Level 1.
- [ ] The formation is horizontally centred on the canvas, starting near the top.

### 33. Formation speed (1.5× Level 1)
- [ ] Observe the step interval with all 55 invaders alive — steps should occur approximately **every 536 ms** (800 ms × 0.67).
- [ ] With 1 invader remaining, steps should occur approximately **every 67 ms** (100 ms × 0.67).
- [ ] The formation is noticeably faster than Level 1 at every invader count.

### 34. Invader shooting — random timer
- [ ] After entering Level 2, observe invader bullets (red rectangles) appearing periodically.
- [ ] Bullets fire at random intervals between approximately **0.8 s and 2.0 s**.
- [ ] Each interval is independently re-randomised after the previous shot.

### 35. Invader shooting — lowest in column
- [ ] Verify that bullets always originate from the **bottom-most living invader** in a column.
- [ ] Kill all invaders in a column except one — the surviving invader fires bullets.
- [ ] Bullets travel **straight down** at 300 px/s.

### 36. Player hit and respawn
- [ ] Allow an invader bullet to hit the player ship.
- [ ] The **`LIVES`** counter decrements by 1.
- [ ] The player ship **immediately reappears** at the fixed bottom-centre position.
- [ ] The formation and enemy bullets are unaffected by the respawn.

### 37. Invulnerability flash
- [ ] For exactly **2 seconds** after respawn, the ship **flashes** visibly (rapidly alternating visible/invisible).
- [ ] Invader bullets that would hit the ship during this window are **ignored** (ship not destroyed, no life lost).
- [ ] After 2 seconds, the ship stops flashing and is collidable again.

### 38. Game Over on last life
- [ ] Reduce lives to 1 (by taking hits), then allow another invader bullet to hit the ship.
- [ ] A **static Game Over screen** is displayed immediately.
- [ ] The screen shows **GAME OVER** and the current score.
- [ ] **No auto-restart occurs** — the game remains on this screen.
- [ ] A **page reload** returns to the Title screen.

### 39. UFO spawn — timing and alternating sides
- [ ] Wait approximately 20 seconds after entering Level 2.
- [ ] A **magenta UFO** appears and travels across the **top** of the play field.
- [ ] The **first UFO** enters from the **left**.
- [ ] If the UFO is not shot and disappears, wait another 20 seconds — the next UFO enters from the **right**.
- [ ] Subsequent UFOs continue to alternate sides.

### 40. UFO speed and silent disappearance
- [ ] The UFO travels at approximately **120 px/s**.
- [ ] If not shot, the UFO **disappears silently** upon reaching the far edge (no explosion, no score change).

### 41. UFO scoring tiers
- [ ] Shoot the UFO and observe the score increment.
- [ ] The score increases by one of: **50, 100, 150, or 300**.
- [ ] The score tier is determined by `cumulativeShotCount % 4`:
  - 0 → **100**
  - 1 → **50**
  - 2 → **150**
  - 3 → **300**
- [ ] `cumulativeShotCount` is the total player shots (bullets fired) across the entire session, never reset between levels.
- [ ] Shooting invaders increments this counter; shooting the UFO also increments it.

### 42. Win condition — clear Level 2
- [ ] Destroy all 55 invaders in Level 2.
- [ ] `transitionTo('level3')` is called exactly once.
- [ ] Currently transitions to the Game Over screen (Level 3 not yet implemented) — this is expected behaviour.
- [ ] **`LEVEL: 2`** is shown throughout the entire level until transition.

### 43. No out-of-scope side-effects
- [ ] No shields are rendered.
- [ ] Level 2 does not affect or reset the score from Level 1.
- [ ] The browser console shows no errors during normal Level 2 play.
- [ ] The game runs correctly when opened directly from the filesystem (`file://` URL).

---

## Notes

- **Score module**: Score increments are handled directly via `hudState.score` in both `game.js` (legacy collision path) and `level1.js` / `level2.js`. A dedicated shared score module is not yet present; if one is introduced in a later card, all call sites should be updated.
- **`INVADER_HEIGHT`**: The actual exported value from `invaders.js` is `20` px. The task description mentions 32 px, but level modules import and use the live `INVADER_HEIGHT` constant from `invaders.js` (20 px) — this is the single source of truth.
- **Level 2 transition**: When all invaders are cleared, `transitionTo('level3')` is called. Until `level3.js` is implemented, this falls back to the Game Over screen.
- **UFO score tiers**: The mapping is fixed as `[100, 50, 150, 300]` indexed by `cumulativeShotCount % 4`. This is documented here and in `level2.js` as the authoritative reference.
- **Cumulative shot count**: `cumulativeShotCount` in `level2.js` counts player shots (invader kills + UFO hits) from level 2 entry onward, as level 1 does not export this counter. If a future card introduces a shared session counter, `level2.js` should import it instead.
- **Player draw patching**: `level2.js` monkey-patches `player.draw` on the live player instance to implement the invulnerability flash. This patch is local to the instance and does not affect Level 1 or other levels.
