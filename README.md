# Space Invaders

A hand-written Space Invaders clone in vanilla HTML + ES modules.
No build step, no npm, no server required.

## Running

Open `index.html` directly in a browser from the filesystem (`file://` URL).

```
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

Chrome / Edge work best for `file://` ES module imports.
Firefox may require setting `security.fileuri.strict_origin_policy` to `false`
in `about:config`, or just serve with a simple HTTP server:

```
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Controls

| Key | Action |
|-----|--------|
| ← / A | Move left |
| → / D | Move right |
| Space | Fire |
| Enter | Confirm (title / game over screens) |

## Architecture

| File | Purpose |
|------|---------|
| `index.html` | Canvas + bootstrap |
| `game.js` | Scene manager, main loop, Title + Game Over scenes |
| `gameConfig.js` | Shared constants (canvas size, speeds, lives) |
| `input.js` | Keyboard state abstraction |
| `collision.js` | AABB helper (`aabbOverlap`) |
| `level1.js` | Level 1 scene — passive invader grid |
| `level2.js` | Level 2 scene — invaders shoot back, UFO |
| `player.js` | Standalone Player class (legacy; not used by scenes) |
| `invaders.js` | Standalone invader helpers (legacy; not used by scenes) |

## Scene flow

```
Title  --ENTER-->  Level 1  --clear-->  Level 2  --clear-->  Level 3 (TBD)
                     |                    |
                  game over            game over
                     |                    |
                     v                    v
                  Game Over  --ENTER-->  Title
```

## Manual Verification Path

### Level 1
1. Open `index.html`. Press ENTER. Verify the 11×5 green invader grid appears.
2. Move with arrow keys; shoot with Space. Verify bullet travels upward and
   destroys the invader it hits, incrementing the score by 10.
3. Destroy all 55 invaders. Verify the scene transitions automatically to
   Level 2 with the same score and lives (no lives deducted).

### Level 2 — formation speed
4. Note the invader movement in Level 1. In Level 2 the grid should visibly
   step faster (step interval × 0.67 ≈ 402 ms vs 600 ms).

### Level 2 — invader shooting
5. Wait. Within ≤ 2 s an invader bullet (red) should appear travelling
   downward from the bottom row of the grid.
6. Verify only one red bullet exists on screen at a time.
7. Let the bullet hit the player ship. Verify the life counter decreases by 1
   and the ship reappears at bottom-centre flashing.
8. During the 2-second flash window, let another bullet reach the ship.
   Verify no additional life is deducted.
9. After the flash stops, verify the ship can be hit normally again.

### Level 2 — UFO
10. Wait 20 seconds. A magenta UFO should appear at the top of the screen
    crossing left-to-right.
11. Wait another 20 seconds. The next UFO crosses right-to-left.
12. Shoot the UFO. Verify the score increases by one of 50 / 100 / 150 / 300.
    To verify the correct tier:
    - Count the total shots fired since the start of the session (Level 1 + Level 2).
    - `tier = shotCount % 4`; expected score delta = `[50, 100, 150, 300][tier]`.

### Level 2 — sessionShotCount continuity
13. Note the total shots fired in Level 1. Start Level 2. Fire additional shots.
    The UFO scoring tier should reflect the **combined** shot count, confirming
    `sessionShotCount` was not reset at the level transition.

### Game Over
14. Lose all lives. Verify the Game Over screen appears with the final score.
15. Press ENTER. Verify the Title screen appears.

### Level 2 → Level 3 handoff (stub)
16. Clear Level 2 (destroy all invaders). Verify the Game Over screen appears
    temporarily (Level 3 is not yet implemented; the stub routes there).
    Lives and score are passed forward in the state object logged to the console.
