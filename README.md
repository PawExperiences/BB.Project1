# BB.Project1 — e2e Data Science

## Project Overview

TBD — see [FINDINGS.md](FINDINGS.md). This section should be updated once the sibling findings task is complete to describe what was investigated, the analytical questions posed, and the conclusions reached.

---

## Prerequisites

- **Python 3.9** (the project runs in a Python 3.9 container; use a matching local interpreter to ensure reproducibility)
- **pip dependencies** — install from [`requirements.txt`](requirements.txt):

  ```bash
  pip install -r requirements.txt
  ```

  Current dependencies include `numpy`, `pandas`, `scikit-learn`, `matplotlib`, `boto3`, and `psycopg2-binary` (see `requirements.txt` for pinned minimum versions).

---

## Configuration

The scripts connect to a third-party, read-only PostgreSQL database via the environment variable **`BB_SOURCE_DSN`**.

| Variable | Description |
|---|---|
| `BB_SOURCE_DSN` | PostgreSQL connection string pointing at the third-party read-only database |

Export the variable in your shell before running any script:

```bash
export BB_SOURCE_DSN="postgresql://user:password@host:5432/dbname"
```

Replace `user`, `password`, `host`, and `dbname` with the actual (redacted) credentials. **Do not commit real credentials to this repository.**

---

## Generating the Schema Documentation

```bash
python generate_schema.py
```

This command connects to the database specified by `BB_SOURCE_DSN`, introspects the schema via `information_schema` and `pg_catalog` (read-only), and writes [`SCHEMA.md`](SCHEMA.md) to the repository root.

- If the connection succeeds, `SCHEMA.md` will contain every non-system table, its columns (name, type, nullability, default), formal foreign keys, inferred relationships, approximate row counts, and a Gaps / Unknowns section.
- If the connection fails, `SCHEMA.md` will record the exact error, the UTC timestamp, and a stop notice.

The script exits `0` on success, `1` on connection/introspection failure, and `2` if the output file cannot be written.

---

## Running the Profiler

```bash
python profile_db.py
```

This command runs the profiling script unattended. It connects to the database specified by `BB_SOURCE_DSN`, inspects the schema and data, and writes its output to disk. The exact output location will be documented here once the profiling-script sibling task clarifies the output path.

> **Note:** Ensure `BB_SOURCE_DSN` is exported in your shell (see [Configuration](#configuration)) before invoking the script.

---

## Repository File Guide

| File | Description |
|---|---|
| `README.md` | This file — project overview, setup, and usage instructions |
| `main.py` | Minimal entrypoint stub for BB.Project1; application logic is added in downstream tasks |
| `requirements.txt` | pip dependencies required to run the project (Python 3.9 compatible) |
| `profile_db.py` | The profiling script — connects via `BB_SOURCE_DSN` and writes database profile output |
| `generate_schema.py` | Schema documentation generator — writes `SCHEMA.md` from the live PostgreSQL source |
| [`SCHEMA.md`](SCHEMA.md) | Database schema documentation for the third-party source database |
| [`FINDINGS.md`](FINDINGS.md) | Analytical findings and conclusions from the investigation |
| `index.html` | Space Invaders game entry point — open directly from the filesystem |
| `game.js` | Main game ES module: loop, scene state machine, HUD, entity wiring |
| `gameConfig.js` | Shared game constants (canvas size, speeds, lives) |
| `input.js` | Keyboard input module — `initInput()` and `isKeyHeld(code)` |
| `player.js` | Player ship entity — movement, single-bullet mechanic, procedural drawing, `getBounds()` |
| `invaders.js` | InvaderGrid class — 11×5 formation, step-and-drop movement, per-invader alive state |
| `collision.js` | CollisionSystem class — AABB collision, explosion effects, score tracking |
| `formation.js` | Shared formation constants — cell dimensions, invader types, grid geometry |
| `level1.js` | Level 1 — classic 55-invader grid; movement, breach detection, life loss, level completion |

> Any files added to the repository after this PR must be appended to the table above.

---

## Database Notice

The database is read-only and third-party. No credentials are included in this repository.

---

## Links

- [SCHEMA.md](SCHEMA.md) — database schema documentation
- [FINDINGS.md](FINDINGS.md) — analytical findings
- [requirements.txt](requirements.txt) — pip dependencies

---

## Planned File Layout

The following source files will be added by later cards. They do **not** exist yet; stubs must not be created ahead of their owning card.

| File | Owning card |
|---|---|
| `level2.js` | "Level 2" card |
| `level3.js` | "Level 3" card |
| `boss.js` | "Boss enemy" card |

---

## Manual Verification

### Game Loop and Canvas (previous card)

1. Open `index.html` directly in a browser from the filesystem (`file://` URL — no web server needed).
2. **Title scene**: confirm the page has a black background, a centred canvas, the text `SPACE INVADERS` and a blinking `Press ENTER to start` prompt are visible.
3. **Transition to Playing**: press **Enter**; confirm the Playing scene appears (shows a HUD with score/lives).
4. **Background-tab delta cap**: switch to another tab, wait ≥ 5 seconds, switch back; confirm there is no burst of rapid updates or visual jump.
5. **Game Over scene**: open the browser console and run `import('./game.js').then(m => { m.hudState.lives = 0; })` — future cards will trigger this automatically.
6. Confirm no console errors appear at any point.

### Keyboard Input and Player Ship (previous card)

1. Open `index.html` directly in a browser (`file://` URL — no web server needed).
2. Press **Enter** to start the game (transition to Playing scene).
3. **Ship visible**: confirm a green spaceship is visible near the bottom-centre of the canvas.
4. **Left movement**: hold **ArrowLeft** or **A** — the ship moves left smoothly. Release — it stops.
5. **Right movement**: hold **ArrowRight** or **D** — the ship moves right smoothly. Release — it stops.
6. **Both keys simultaneously**: hold both a left and a right key at the same time — the ship does not move.
7. **Boundary clamping**: hold a direction key until the ship reaches the edge; confirm it stops at the edge and does not leave the canvas.
8. **Shoot**: press **Space** — a small yellow rectangle (bullet) appears above the ship and travels upward.
9. **Single bullet**: while the bullet is in flight, press **Space** again — no second bullet appears.
10. **Bullet exit**: wait for the bullet to exit the top of the canvas; then press **Space** — a new bullet fires.
11. **No key-repeat stutter**: hold **ArrowLeft** for several seconds; movement is perfectly smooth with no stutter or double-stepping.
12. Confirm no console errors appear at any point.

### Sprite Rendering and Collision Detection (previous card)

1. Open `index.html` directly in a browser (`file://` URL — no web server needed).
2. Press **Enter** to start the game.
3. **Invader grid visible**: confirm 55 green rectangles (11 columns × 5 rows) are visible on the canvas immediately, above the player ship.
4. **Formation movement**: watch the grid move sideways as a unit across the canvas.
5. **Step-and-drop**: when the leading edge of the formation reaches the canvas boundary, confirm the entire grid drops down by one step and reverses horizontal direction.
6. **Player shoots invader**: move the ship under an invader and press **Space**. Confirm:
   - The invader disappears immediately.
   - A brief orange flash/burst appears at the kill site and fades within ~0.5 seconds.
   - The score in the top-left of the canvas increments by exactly 10.
7. **Score accuracy**: shoot several more invaders; confirm the score increases by 10 for each kill, with no incorrect increments.
8. **Dead invaders skipped**: after killing an invader, shoot at the same location again; confirm no second score increment occurs (ghost hit prevention).
9. **Bullet consumed on hit**: after hitting an invader, the bullet is gone and a new one can be fired immediately with **Space**.
10. **Collision-before-draw order**: confirm that there is no frame where a killed invader is visible after the bullet reaches it (collision runs before draw each tick).
11. **No new dependencies**: confirm the game still opens from a `file://` URL with no server required and no console errors about missing modules or network requests.
12. Confirm no console errors appear at any point.

### Level 1 — Classic Grid (this card)

1. Open `index.html` directly in a browser from the filesystem (`file://` URL — no web server needed). Confirm no console errors on load.
2. Press **Enter** to start the game.
3. **Formation visible**: confirm exactly 55 green rectangles (11 columns × 5 rows) appear on the canvas above the player ship.
4. **HUD level number**: confirm the text `Level 1` (or `1`) is displayed in the HUD area on every frame.
5. **Formation movement**: watch the formation — it should move horizontally in discrete steps (not continuously). At 55 invaders alive the step interval is approximately 800 ms; you should see roughly one lateral step per 0.8 seconds.
6. **Speed increase**: shoot invaders one by one. After reducing the count to a handful (e.g. 5 or fewer), observe that the formation steps noticeably faster — at 1 invader remaining the step interval is approximately 100 ms (approximately 10 steps per second).
7. **Edge-drop and direction reversal**: watch the formation reach the left or right canvas edge. Confirm:
   - The entire formation drops down by exactly one cell height (32 px) in a single step.
   - The formation immediately reverses horizontal direction.
   - No invader leaves the canvas horizontally.
8. **Breach → life loss → restart**:
   a. Either let the formation descend naturally (takes time) or open the browser console and run:
      ```js
      // Force the formation to nearly breach (adjust the level reference as wired in game.js)
      ```
   b. When any invader's Y position reaches or exceeds `canvasHeight - cellHeight` (i.e. `896 - 32 = 864` px), confirm:
      - The player's life count in the HUD decrements by exactly 1.
      - The formation immediately resets to its original 55-invader layout at the top of the canvas.
      - The step interval resets to ~800 ms (slow speed).
9. **Level completion**: destroy all 55 invaders. Confirm that `game.nextLevel()` (or `game.setLevel(2)`) is called — in the current build this transitions to whatever Level 2 state is wired; if Level 2 is not yet implemented, a console log or scene change from `game.js` is acceptable evidence.
10. **Interval formula spot-check** (optional, console): after shooting exactly 28 invaders (27 alive), open the console and verify the step interval is approximately `100 + 26 * (700 / 54) ≈ 437 ms`.
11. **No bundler / server required**: confirm the game still opens and runs from a `file://` URL with no web server, no npm, and no console errors about missing modules or failed network requests.
12. Confirm no console errors appear at any point during the above steps.
