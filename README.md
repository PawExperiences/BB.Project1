# Space Invaders — E2E Build

A hand-written, no-framework, no-bundler Space Invaders clone that runs directly from the filesystem.

## Running the Game

Open `index.html` in any modern browser — no server, no build step required:

```
file:///path/to/project/index.html
```

Or simply double-click `index.html` in your file manager.

## Controls

| Key | Action |
|-----|--------|
| ← / A | Move left |
| → / D | Move right |
| Space | Fire |
| Enter | Confirm / Start |

## File Structure

```
index.html      — Entry point and canvas host; loads game.js as an ES module
game.js         — Main loop, scene machine (title / playing / gameover), HUD, hudState export
gameConfig.js   — Shared constants (CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, BULLET_SPEED, STARTING_LIVES)
input.js        — Keyboard state; held-key tracking via KeyboardEvent.code
player.js       — Player ship: movement, single-bullet mechanic, procedural canvas drawing
invaders.js     — Invader grid: 11×5 formation state, movement stepping, drawing
collision.js    — AABB collision detection (player bullet ↔ invaders, invader bullets ↔ player)
explosion.js    — Explosion effect pool (white flicker for a fixed number of frames)
score.js        — Score state (getScore / addScore / resetScore)
level1.js       — Level 1 logic: timer-driven formation movement, edge-drop, life-loss, level-clear
level2.js       — Level 2 logic: faster formation, enemy firing, UFO bonus target
level3.js       — Level 3 logic: destructible shield bunkers, formation split
boss.js         — Boss entity: two-phase behaviour, health bar, win screen rendering
```

### Module responsibilities

| File | Responsibility |
|------|----------------|
| `index.html` | Entry point — hosts the 768×896 `<canvas>` and loads `game.js` as an ES module |
| `game.js` | Fixed-timestep game loop (1/60 s tick, 250 ms delta cap), three-scene state machine (title → playing → gameover), canvas HUD, and the exported `hudState` object |
| `gameConfig.js` | Shared constants used by every module: canvas size, speeds, starting lives |
| `input.js` | Keyboard input — tracks currently-held keys via `KeyboardEvent.code`; exports `isKeyHeld()` |
| `player.js` | Player ship class — delta-time movement, edge clamping, single-bullet mechanic, procedural canvas drawing |
| `invaders.js` | 11×5 invader grid — formation state array, per-tick movement, green rectangle rendering |
| `collision.js` | AABB collision helpers — player bullet vs. invaders, invader bullets vs. player |

## Level Progression

| Level | Description |
|-------|-------------|
| Title | Press ENTER to begin |
| 1 | Classic 11×5 invader grid — timer-driven movement |
| 2 | Second wave — enemy fire and UFO bonus |
| 3 | Third wave — destructible bunkers and formation split |
| **BOSS** | Two-phase boss finale |
| Win Screen | Displayed after defeating the boss; any key returns to title |

---

## Manual Verification Steps

The steps below cover every acceptance criterion. All tests are performed by opening `index.html` directly from the filesystem (`file://` URL) — no HTTP server is required.

### 1 — Basic startup

1. Open `index.html` via a `file://` URL in Chrome and in Firefox (drag-and-drop onto the browser, or use File → Open).
2. Confirm **no errors** appear in the browser console (F12 → Console tab).
3. Verify the canvas is **768 px wide** and **896 px tall** (right-click the canvas → Inspect, check `width` and `height` attributes).
4. Verify the page **background is black** and the canvas is **centred** horizontally and vertically on the page.

### 2 — Title scene

5. On load, the canvas must display the text **`SPACE INVADERS`** and **`Press ENTER to start`**.
6. No gameplay elements (player ship, invader grid) should be visible on the title screen.

### 3 — Title → Playing transition

7. Press **ENTER** on the title screen.
8. Verify the game transitions to the playing scene **without a page reload** (the browser address bar does not change, no flash/reload occurs).
9. The player ship and invader grid should appear; the HUD (score, lives) should be visible at the top of the canvas.

### 4 — Fixed-timestep loop and delta cap

10. Switch to a different browser tab for at least 5 seconds, then return.
11. Verify the game **does not jump or stutter** noticeably — the delta cap (250 ms) prevents a burst of catch-up updates.
12. Gameplay resumes smoothly at the point where it was when you switched away.

### 5 — HUD during playing scene

13. Confirm the HUD shows **`Score: 0`** and **`Lives: 3`** at the start of a new game.
14. The HUD text must be drawn **directly on the canvas** (not as DOM elements outside the canvas).

### 6 — Playing scene update and draw phases

15. Move the player ship left and right — confirm smooth, responsive movement.
16. Press Space — a bullet fires upward. While the bullet is in flight, pressing Space again does nothing.
17. Let the bullet exit the top of the canvas — a new bullet can then be fired.

### 7 — Invader collision and score

18. Shoot an invader. Verify it disappears, a brief white flash appears, and the **score increments by 10** in the HUD.

### 8 — Game-over condition

19. Allow the invader formation to reach the player's row (or exhaust all lives by letting invaders reach the player row repeatedly).
20. Verify the game transitions to the **gameover scene** without a page reload.
21. The gameover canvas must display: **`GAME OVER`**, the **final score value**, and **`Press ENTER to restart`**.

### 9 — Gameover → Title transition

22. On the gameover screen, press **ENTER**.
23. Verify the game returns to the **title scene** without a page reload.
24. Verify `hudState.score` and `hudState.lives` are **reset** (score = 0, lives = 3) — starting a new game immediately after should show `Score: 0`, `Lives: 3`.

### 10 — hudState shared export

25. Open the browser console on the title or playing scene.
26. Type: `import('./game.js').then(m => console.log(m.hudState))`.
27. Verify the logged object contains at least the keys **`score`**, **`lives`**, and **`hiScore`**.
28. Mutating `hudState.score` in the console and then observing the next draw call should reflect the changed value in the HUD.

### 11 — Hi-score persistence across sessions

29. Play a game, reach a non-zero score, then let the game end.
30. Verify the gameover scene shows the score.
31. Return to title (ENTER) and start a new game. If the previous score was higher than the new score when the next game ends, the hi-score should be preserved and displayed.

### 12 — Full level progression to boss and win screen

32. Play through Levels 1 → 2 → 3 → Boss.
33. Defeat the boss. Verify the **Win Screen** appears with `YOU WIN!` and the final score.
34. Press any key on the Win Screen. Verify the game returns to the **title scene** (no reload), score resets to 0.

### 13 — No external dependencies

35. Open the Network tab in DevTools before loading `index.html`.
36. Reload the page. Confirm **no requests** go to any CDN, npm registry, or external server — all loaded files are local.
37. Confirm the game is fully playable with the network tab showing **only local `file://` resources**.
