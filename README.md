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
- [ ] Currently transitions to the Game Over screen (Level 2 not yet implemented) — this is expected behaviour.
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

## Notes

- **Score module**: Score increments are handled directly via `hudState.score` in both `game.js` (legacy collision path) and `level1.js`. A dedicated shared score module is not yet present; if one is introduced in a later card, both call sites should be updated.
- **`INVADER_HEIGHT`**: The actual exported value from `invaders.js` is `20` px. The task description mentions 32 px, but `level1.js` imports and uses the live `INVADER_HEIGHT` constant from `invaders.js` (20 px) — this is the single source of truth.
- **Level 2 transition**: When all invaders are cleared, `transitionTo('level2')` is called. Until `level2.js` is implemented, this falls back to the Game Over screen.
