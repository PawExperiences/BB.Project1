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

> Any files added to the repository after this PR must be appended to the table above.

---

## Database Notice

The database is read-only and third-party. No credentials are included in this repository.

---

## Links

- [SCHEMA.md](SCHEMA.md) — database schema documentation
- [FINDINGS.md](FINDINGS.md) — analytical findings
- [requirements.txt](requirements.txt) — pip dependencies
