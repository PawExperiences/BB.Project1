# Space Invaders — BuildBoard Project

A hand-written Space Invaders clone using plain HTML, CSS, and ES modules. No bundler, no framework, no npm packages. Opens directly from the filesystem (`file://`).

## File Structure

```
index.html       — entry point
game.js          — scene manager, game loop, menu/level/gameover scenes
gameConfig.js    — shared constants (lives, canvas height)
player.js        — Player class, CANVAS_WIDTH constant
invaders.js      — InvaderGrid class
collision.js     — bullet–invader collision helper
input.js         — keyboard input tracker
```

## How to Run

1. Clone or download the repository.
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari).
   - Double-click the file, or drag it into a browser tab.
   - No local server needed — works on `file://`.
3. Press **Space** or **Enter** on the title screen to start.

## Controls

| Action     | Keys                   |
|------------|------------------------|
| Move left  | `←` Arrow or `A`       |
| Move right | `→` Arrow or `D`       |
| Fire       | `Space`                |

## Levels

### Level 1
- Classic 11×5 invader grid moving left-right, dropping on reversal.
- Shoot all invaders to clear the level and advance to Level 2.
- Top rows worth 30 pts, middle rows 20 pts, bottom row 10 pts.

### Level 2 — They Shoot Back
- Invader grid moves **60% faster** than Level 1 (`speedMultiplier = 1.6`).
- **Invaders fire back**: the bottom-most alive invader in each column fires a downward projectile at random intervals (between 0.6 s and 2.2 s). At least one shot should be visible within the first 10 seconds of play.
- **UFO bonus**: a red saucer crosses the top of the screen every ~18 seconds. Shooting it scores **50, 100, 150, or 300 points** depending on `playerShotCount % 4` (deterministic, not random).
- **Invulnerability**: after being hit by an invader shot the player **loses one life**, respawns at the centre-bottom, and is **invulnerable for 2 seconds** (ship flashes). A second hit during this window is ignored.
- **Game over**: losing your last life triggers the Game Over screen. Score and lives carry over from Level 1 — lives are not reset.

## Manual Verification Checklist

### General
- [ ] Page opens with no console errors on `file://`.
- [ ] Title screen displays; Space/Enter starts Level 1.
- [ ] Game Over screen shows final score; Space/Enter returns to title.

### Level 1
- [ ] 11×5 invader grid appears and moves.
- [ ] Player can move and fire; bullets destroy invaders.
- [ ] Clearing all invaders immediately advances to Level 2 (no score/lives reset).

### Level 2
- [ ] "LEVEL 2" label visible in HUD.
- [ ] Invaders move noticeably faster than in Level 1.
- [ ] Within ~10 s of play, at least one orange invader shot is visible on screen.
- [ ] Orange shots travel downward and are removed when they leave the canvas.
- [ ] A red UFO saucer appears at the top of the screen, moves horizontally, and disappears at the edge.
- [ ] Shooting the UFO adds 50 / 100 / 150 / 300 pts depending on shot count mod 4.
- [ ] Being hit by an invader shot removes one life from the HUD.
- [ ] After the hit, the ship flashes for ~2 seconds; a second shot during this time does not remove a life.
- [ ] Flashing stops after the invulnerability window expires.
- [ ] Losing the last life shows the Game Over screen with correct score.
- [ ] Clearing Level 2 returns to the title screen (future: Level 3).

## Architecture Notes

- **Scene system**: `registerScene` / `switchScene` in `game.js` swap between `menu`, `level1`, `level2`, and `gameover` scenes.
- **No circular imports**: `game.js` imports from `player.js`, `invaders.js`, `collision.js`, and `input.js`. Those modules do not import from `game.js`.
- **`file://` safe**: no `fetch()`, no dynamic imports, no HTTP-only APIs.
