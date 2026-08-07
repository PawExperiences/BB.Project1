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
| `game.js` | Main game ES module: loop, scene state machine, HUD |
| `gameConfig.js` | Shared game constants (canvas size, speeds, lives) |
| `input.js` | Keyboard input module — `initInput()` and `isKeyHeld(code)` |
| `player.js` | Player ship entity — movement, single-bullet mechanic, procedural drawing |

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
| `invaders.js` | "Invader grid and movement" card |
| `collision.js` | "Collision detection" card |
| `level1.js` | "Level 1" card |
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

### Keyboard Input and Player Ship (this card)

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
