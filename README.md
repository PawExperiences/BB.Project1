# Space Invaders

A hand-written, dependency-free Space Invaders clone built with plain HTML, CSS, and ES modules.

## Running the Game

Open `index.html` directly in a modern browser (Chrome, Firefox, Edge):

```
file:///path/to/project/index.html
```

No server, no build step, no npm required.

## Controls

| Key | Action |
|-----|--------|
| `ArrowLeft` / `A` | Move ship left |
| `ArrowRight` / `D` | Move ship right |
| `Space` | Fire bullet (one in flight at a time) |
| `Enter` | Start game / restart from Game Over |
| `G` | (Debug) Instantly trigger Game Over |

## Manual Verification — Level 1

1. Open `index.html` and press **Enter**.
2. The HUD should read `LEVEL: 1`, `LIVES: 3`, `SCORE: 0`.
3. Move the ship left and right with the arrow keys; confirm it clamps at the canvas edges.
4. Press Space to fire; observe a yellow bullet travelling upward.
5. Hit an invader; confirm the score increments by 10 and a yellow flash appears.
6. Let the invader formation march to the bottom of the screen; confirm one life is lost and
   the formation resets (if lives remain) or **GAME OVER** appears (if none remain).
7. Destroy all 55 invaders; confirm the game automatically advances to Level 2
   (HUD reads `LEVEL: 2`) without any intermediate screen.

## Manual Verification — Level 2

### Auto-advance and lives carry-over
1. Start a game, destroy all Level 1 invaders.
2. Confirm the scene transitions immediately to Level 2 (no menu, no pause).
3. Confirm `LEVEL: 2` in the HUD and that `LIVES:` shows the same count as at the
   end of Level 1 (not reset to 3).

### Faster invader formation
4. Watch the invader grid in Level 2 — it should visibly march faster than in Level 1.
5. Open the browser console; you should see a log line such as:
   `[Level 2] Formation speed ×1.4 vs Level 1. Step interval at full grid: ~571 ms (Level 1: ~800 ms).`

### Invader return fire
6. With 20+ invaders alive, observe red/orange bullets falling downward from the
   bottom row of each column.
7. Confirm that bullets come only from the bottom-most living invader in each column
   (destroy bottom-row invaders to see the shooter move up).
8. Let an invader bullet hit the player ship; confirm `LIVES:` decrements by exactly 1.

### Post-respawn invulnerability
9. After being hit, the ship should reappear at the horizontal centre and begin **blinking**.
10. While blinking (~2 seconds), let another invader bullet pass through the ship;
    confirm `LIVES:` does **not** change.
11. After the blink animation stops, confirm the next bullet hit does decrement lives.

### UFO bonus
12. Wait approximately 7 seconds into Level 2; a magenta UFO should appear at one
    horizontal edge and cross the top of the screen.
13. Shoot the UFO and check the console for:
    `[Level 2] UFO shot! shotCount=N → +X pts`
    where X is `UFO_SCORE_TABLE[N % 4]` = 50, 100, 150, or 300.
14. Verify the score in the HUD increases by that exact amount.
15. Let a UFO cross the screen un-shot; confirm no score change and no life loss.
16. Check the UFO score mapping across at least two shot counts:
    - `shotCount % 4 === 0` → 50 pts
    - `shotCount % 4 === 1` → 100 pts
    - `shotCount % 4 === 2` → 150 pts
    - `shotCount % 4 === 3` → 300 pts

### Level 2 → Level 3 transition
17. Destroy all invaders in Level 2.
18. Confirm the game does not crash and the browser console shows:
    `startLevel(3) called — Level 3 not yet implemented. Returning to title.`
19. Confirm the Title screen reappears with the hi-score updated.

### Game Over from Level 2
20. Lose all remaining lives in Level 2 (either via bullet hits or formation reaching player).
21. Confirm the **GAME OVER** screen appears showing the final score.
22. Press **Enter** to return to the Title screen.

## Architecture

| File | Responsibility |
|------|----------------|
| `index.html` | Canvas + entry point |
| `gameConfig.js` | Shared constants (canvas size, speeds, Level 2 config) |
| `game.js` | Main loop, scene state machine, HUD, Level dispatcher |
| `player.js` | Ship movement, bullet, shot counter, invulnerability |
| `invaders.js` | Grid state, formation stepping, explosion effects |
| `level1.js` | Level 1 update: formation timer, lose detection |
| `level2.js` | Level 2 update: return fire, UFO, faster formation |
| `collision.js` | AABB helpers, bullet-vs-invader checks |
| `input.js` | Keyboard held-key tracking |
