# SCHEMA.md — Database Schema Documentation

> **CONNECTION FAILED**

## ⚠ Connection Failure Notice

| Field | Value |
|---|---|
| Status | FAILED |
| UTC Timestamp | `2025-01-01T00:00:00Z` |
| Error | See below |

```
No DSN provided.  Neither BB_SOURCE_DSN nor DATABASE_URL is set in the environment.
```

This file was produced by `generate_schema.py` during the initial commit when
no live database connection was available.  **No further work should proceed
until database connectivity is restored.**

To regenerate this file against the live database:

```bash
export BB_SOURCE_DSN="postgresql://user:password@host:5432/dbname"
python generate_schema.py
```

The script will overwrite this file with the full schema documentation
(tables, columns, types, nullability, defaults, foreign keys, inferred
relationships, row counts, and a Gaps / Unknowns section) once it can
reach the database.
