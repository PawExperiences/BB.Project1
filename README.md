# BB.Project1 — E2E Data Science

## Project Overview

This project examines a third-party, read-only PostgreSQL database to understand its structure, data distributions, and key patterns. The analytical goal is to profile the database schema — documenting tables, columns, relationships, and row-level statistics — and to surface data-quality observations and findings that inform downstream modelling and reporting work. All analysis is non-destructive: the project reads from the database and writes nothing back.

---

## Repository Structure

| File | Description |
|------|-------------|
| `README.md` | This file — project overview, setup, and run instructions |
| [`SCHEMA.md`](SCHEMA.md) | Database schema documentation: tables, columns, types, and relationships *(pending — added when sibling PR merges)* |
| [`FINDINGS.md`](FINDINGS.md) | Query-backed analytical findings and data-quality observations *(pending — added when sibling PR merges)* |
| `profile_db.py` | Unattended profiling script — connects to the database and produces schema and summary statistics *(pending — added when sibling PR merges)* |
| `requirements.txt` | Python dependency manifest |
| `src/main.py` | Project entry point / scaffold |
| `Dockerfile` | Container image definition |

---

## Prerequisites

- **Python 3.11** or later (the Docker image uses `python:3.11-slim`)
- Install all dependencies before running any script:

```bash
pip install -r requirements.txt
```

---

## Configuration — `BB_SOURCE_DSN`

`BB_SOURCE_DSN` is a **required** environment variable that holds the PostgreSQL connection string used by every script in this project.

**Syntax:**

```bash
export BB_SOURCE_DSN="postgresql://user:password@host:5432/dbname"
```

- Replace `user`, `password`, `host`, and `dbname` with the actual credentials and hostname for the target database.
- This DSN **must** point to a read-only replica or a database user that has been granted read-only privileges. No script in this repository issues write operations, but the DSN itself should enforce that constraint at the database level.

> **⚠ Caution:** `BB_SOURCE_DSN` must be set in your shell session **before** running any script. Scripts will fail immediately with a configuration error if the variable is absent or empty.

---

## Running the Profiling Script

> **Note:** `profile_db.py` is implemented in a sibling task and will be merged separately. The instructions below describe the intended usage once that PR merges.

1. Set the connection string:

```bash
export BB_SOURCE_DSN="postgresql://user:password@host:5432/dbname"
```

2. Run the script:

```bash
python profile_db.py
```

**Expected output:** The script connects to the PostgreSQL database, enumerates all accessible tables, and prints a structured summary to standard output. The summary includes table names, column names and types, approximate row counts, and any notable data-quality observations. Results may also be written to a local output file or displayed as formatted console output — see inline comments in `profile_db.py` for details once that file is present.

---

## Database Notice

> **Read-only, third-party database**

- The PostgreSQL database targeted by this project is **read-only** and **owned by a third party**. No writes, schema changes, or administrative operations are made or should ever be made against it.
- The project team **does not control** the database schema, data, or availability. Schema changes or outages on the third-party side are outside the team's purview.
- **Credentials must never be committed to this repository.** The `BB_SOURCE_DSN` environment variable is the only sanctioned mechanism for supplying connection details. Check your `.gitignore` and CI secrets configuration to ensure no credentials are inadvertently captured in version control.

---

## Related Documents

- [SCHEMA.md](SCHEMA.md) — full database schema documentation
- [FINDINGS.md](FINDINGS.md) — query-backed findings and observations
