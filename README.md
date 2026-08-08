# BB.Project1

## Project Overview

This project analyses a read-only, third-party PostgreSQL database to characterise its structure, data distributions, and any notable patterns or anomalies. The analysis set out to answer questions about table composition, column null rates, row-count distributions, and low-cardinality value frequencies across the database's public schema. Findings and the SQL queries that produced them are documented in [`FINDINGS.md`](FINDINGS.md).

---

## Prerequisites

- **Python 3.47** (supplied via the project container; ensure this version is active in your environment)
- Python dependencies listed in `requirements.txt`

Install dependencies before running any script:

```bash
pip install -r requirements.txt
```

---

## Configuration

The profiling script connects to the database using the `BB_SOURCE_DSN` environment variable. Set it to a PostgreSQL connection string in the following format:

```
BB_SOURCE_DSN=postgresql://user:password@host:port/dbname
```

> **Important:** The database is **read-only and third-party**. You must not attempt to modify, write to, or alter the database in any way. The connection is opened in read-only mode by the script, but access controls on the database side also enforce this.

Export the variable in your shell before running any script:

```bash
export BB_SOURCE_DSN=postgresql://user:password@host:5432/dbname
```

---

## Running the Profiling Script

With `BB_SOURCE_DSN` set, run:

```bash
python profile_db.py
```

All output is written to **stdout only**. No files are created or modified by the script. To capture the output, redirect stdout:

```bash
python profile_db.py > profile_output.txt
```

The script exits with code `0` on success and a non-zero code on any failure; error messages are written to **stderr**.

---

## Repository File Inventory

| File | Description |
|---|---|
| `README.md` | This file — project overview, setup instructions, and reproduction guide |
| `profile_db.py` | Profiling script — introspects the connected database and prints a structured profile to stdout |
| `SCHEMA.md` | Human-readable description of every table, column, and relationship found in the database |
| `FINDINGS.md` | Three key findings from the analysis, each accompanied by the SQL query that produced it |
| `requirements.txt` | Python package dependencies (`psycopg2-binary`, `pytest`) |
| `scripts/introspect_schema.py` | Schema introspection script used by the CI pipeline to generate `SCHEMA.md` |
| `src/__init__.py` | Python package initialisation for the `src` module |
| `tests/__init__.py` | Python package initialisation for the `tests` module |
| `tests/test_smoke.py` | Smoke tests — verify the package is importable and the test runner exits cleanly |

---

## Related Documents

- [**SCHEMA.md**](SCHEMA.md) — A complete, human-readable description of every table, column, data type, and relationship discovered in the database by the introspection script.
- [**FINDINGS.md**](FINDINGS.md) — A record of the three key findings produced by the analysis, each paired with the exact SQL query used to derive it.

---

## Reproducibility Note

The database examined by this project is **read-only and third-party** — it is not owned or controlled by this repository. All results produced by `profile_db.py` and documented in `FINDINGS.md` reflect the state of the external database **at the time the script was run**. Because the database is managed by a third party, its contents may change between runs; results are therefore point-in-time snapshots and may not be reproducible if the underlying data has changed. To reproduce results exactly, ensure you are connecting to the same database snapshot that was used when the findings were originally recorded.
