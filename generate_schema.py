#!/usr/bin/env python3
"""
generate_schema.py — Schema Documentation Generator

Connects to the bound PostgreSQL source (read-only) and writes SCHEMA.md
at the repository root.  Run this script whenever the schema may have changed.

Connection DSN is read from:
  1. BB_SOURCE_DSN  (preferred)
  2. DATABASE_URL   (fallback)

Exit codes:
  0  — SCHEMA.md written successfully (connection succeeded)
  1  — SCHEMA.md written with failure notice (connection failed or no DSN)
  2  — Unexpected error writing SCHEMA.md itself
"""

import os
import sys
import datetime

OUTPUT_FILE = "SCHEMA.md"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def utc_now() -> str:
    return datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def write_file(path: str, content: str) -> None:
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)


def failure_doc(error_text: str, timestamp: str) -> str:
    return f"""# SCHEMA.md — Database Schema Documentation

> **CONNECTION FAILED**

## ⚠ Connection Failure Notice

| Field | Value |
|---|---|
| Status | FAILED |
| UTC Timestamp | `{timestamp}` |
| Error | See below |

```
{error_text}
```

**No further work should proceed until database connectivity is restored.**
Re-run `python generate_schema.py` once `BB_SOURCE_DSN` is set and the
database is reachable.
"""


# ---------------------------------------------------------------------------
# Schema introspection queries
# ---------------------------------------------------------------------------

TABLES_SQL = """
SELECT
    t.table_schema,
    t.table_name
FROM information_schema.tables t
WHERE t.table_type = 'BASE TABLE'
  AND t.table_schema NOT IN ('pg_catalog', 'information_schema')
  AND t.table_schema NOT LIKE 'pg_toast%'
  AND t.table_schema NOT LIKE 'pg_temp%'
ORDER BY t.table_schema, t.table_name;
"""

COLUMNS_SQL = """
SELECT
    c.column_name,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale
FROM information_schema.columns c
WHERE c.table_schema = %s
  AND c.table_name   = %s
ORDER BY c.ordinal_position;
"""

FOREIGN_KEYS_SQL = """
SELECT
    kcu.table_schema         AS fk_schema,
    kcu.table_name           AS fk_table,
    kcu.column_name          AS fk_column,
    ccu.table_schema         AS ref_schema,
    ccu.table_name           AS ref_table,
    ccu.column_name          AS ref_column,
    rc.constraint_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu
    ON kcu.constraint_name   = rc.constraint_name
   AND kcu.constraint_schema = rc.constraint_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name   = rc.unique_constraint_name
   AND ccu.constraint_schema = rc.unique_constraint_schema
WHERE kcu.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY fk_schema, fk_table, fk_column;
"""

ROW_COUNTS_SQL = """
SELECT
    schemaname,
    relname,
    n_live_tup
FROM pg_stat_user_tables
ORDER BY schemaname, relname;
"""


def pg_type_display(row: dict) -> str:
    """Return a human-readable PostgreSQL type string."""
    dt = row["data_type"]
    udt = row["udt_name"]
    char_max = row["character_maximum_length"]
    num_prec = row["numeric_precision"]
    num_scale = row["numeric_scale"]

    if dt == "character varying":
        return f"varchar({char_max})" if char_max else "varchar"
    if dt == "character":
        return f"char({char_max})" if char_max else "char"
    if dt == "numeric":
        if num_prec is not None and num_scale is not None:
            return f"numeric({num_prec},{num_scale})"
        return "numeric"
    if dt == "USER-DEFINED":
        return udt
    if dt == "ARRAY":
        # udt_name starts with "_" for arrays in pg
        base = udt.lstrip("_")
        return f"{base}[]"
    return dt


# ---------------------------------------------------------------------------
# Inferred relationships (naming-convention heuristic)
# ---------------------------------------------------------------------------

def infer_relationships(tables_cols: dict, formal_fks: list) -> list:
    """
    Return a list of dicts describing probable FK relationships inferred from
    column-naming conventions (e.g. 'user_id' -> probable ref to 'users.id').
    Excludes pairs that are already covered by a formal FK.
    """
    # Build a set of (fk_schema.fk_table, fk_column) already covered formally
    formal_set = set()
    for fk in formal_fks:
        key = (f"{fk['fk_schema']}.{fk['fk_table']}", fk["fk_column"])
        formal_set.add(key)

    # Build lookup of table base-names -> fully qualified names
    # e.g. {"users": ["public.users"], "order": ["public.orders"]}
    table_bases: dict[str, list[str]] = {}
    for fqt in tables_cols:
        schema, tbl = fqt.split(".", 1)
        # Try singular/plural variants
        for candidate in {tbl, tbl.rstrip("s"), tbl + "s"}:
            table_bases.setdefault(candidate, []).append(fqt)

    inferred = []
    for fqt, cols in tables_cols.items():
        for col in cols:
            if not col.endswith("_id"):
                continue
            key = (fqt, col)
            if key in formal_set:
                continue
            # Guess referenced table from the prefix before _id
            prefix = col[:-3]  # strip "_id"
            candidates = []
            for variant in {prefix, prefix + "s", prefix.rstrip("s")}:
                candidates.extend(table_bases.get(variant, []))
            candidates = list(dict.fromkeys(candidates))  # deduplicate, preserve order
            # Remove self-reference noise
            candidates = [c for c in candidates if c != fqt]
            inferred.append({
                "fk_table": fqt,
                "fk_column": col,
                "probable_ref": candidates[0] if candidates else None,
                "note": "inferred from _id suffix" + (
                    f" → probable ref: {candidates[0]}" if candidates else " (no matching table found)"
                ),
            })
    return inferred


# ---------------------------------------------------------------------------
# Markdown builders
# ---------------------------------------------------------------------------

def build_schema_doc(
    tables: list,
    tables_cols: dict,
    formal_fks: list,
    row_counts: dict,
    inferred_rels: list,
    timestamp: str,
) -> str:
    lines = []

    lines.append("# SCHEMA.md — Database Schema Documentation")
    lines.append("")
    lines.append(f"_Generated at: `{timestamp}` (UTC)_")
    lines.append("")
    lines.append(
        "This file is auto-generated by `generate_schema.py` from the live "
        "PostgreSQL source via `information_schema` and `pg_catalog` views. "
        "Re-run the script to refresh."
    )
    lines.append("")
    lines.append("---")
    lines.append("")

    # ------------------------------------------------------------------ TOC
    lines.append("## Contents")
    lines.append("")
    lines.append("1. [Tables and Columns](#tables-and-columns)")
    lines.append("2. [Relationships](#relationships)")
    lines.append("3. [Row Counts](#row-counts)")
    lines.append("4. [Gaps / Unknowns](#gaps--unknowns)")
    lines.append("")
    lines.append("---")
    lines.append("")

    # -------------------------------------------------------- Tables & Columns
    lines.append("## Tables and Columns")
    lines.append("")

    if not tables:
        lines.append("_No non-system tables found in the database._")
        lines.append("")
    else:
        for schema, tbl in tables:
            fqt = f"{schema}.{tbl}"
            lines.append(f"### `{fqt}`")
            lines.append("")
            cols = tables_cols.get(fqt, [])
            if not cols:
                lines.append("_No columns returned — table may be empty or inaccessible._")
                lines.append("")
                continue

            lines.append("| Column | Type | Nullable | Default | Notes |")
            lines.append("|---|---|---|---|---|")
            for col in cols:
                col_name = col["column_name"]
                col_type = pg_type_display(col)
                nullable = "YES" if col["is_nullable"] == "YES" else "NO"
                default = col["column_default"] or ""
                # Truncate long defaults (e.g. nextval sequences)
                if len(default) > 60:
                    default = default[:57] + "..."
                note = ""
                lines.append(
                    f"| `{col_name}` | `{col_type}` | {nullable} | `{default}` | {note} |"
                )
            lines.append("")

    lines.append("---")
    lines.append("")

    # ------------------------------------------------------- Relationships
    lines.append("## Relationships")
    lines.append("")
    lines.append("### Formal Foreign Keys")
    lines.append("")

    if not formal_fks:
        lines.append("_No formal foreign-key constraints found._")
        lines.append("")
    else:
        lines.append("| Constraint | From | Column | → | To | Column |")
        lines.append("|---|---|---|---|---|---|")
        for fk in formal_fks:
            lines.append(
                f"| `{fk['constraint_name']}` "
                f"| `{fk['fk_schema']}.{fk['fk_table']}` "
                f"| `{fk['fk_column']}` "
                f"| → "
                f"| `{fk['ref_schema']}.{fk['ref_table']}` "
                f"| `{fk['ref_column']}` |"
            )
        lines.append("")

    lines.append("### Inferred Relationships (naming convention)")
    lines.append("")
    lines.append(
        "Columns whose names end in `_id` but lack a formal FK constraint "
        "are listed here as probable relationships."
    )
    lines.append("")

    if not inferred_rels:
        lines.append("_No additional inferred relationships found._")
        lines.append("")
    else:
        lines.append("| Table | Column | Probable Reference | Note |")
        lines.append("|---|---|---|---|")
        for rel in inferred_rels:
            ref = f"`{rel['probable_ref']}`" if rel["probable_ref"] else "_unknown_"
            lines.append(
                f"| `{rel['fk_table']}` | `{rel['fk_column']}` | {ref} | {rel['note']} |"
            )
        lines.append("")

    lines.append("---")
    lines.append("")

    # ----------------------------------------------------------- Row Counts
    lines.append("## Row Counts")
    lines.append("")
    lines.append(
        "Row counts are from `pg_stat_user_tables.n_live_tup` (estimated) "
        "supplemented by `COUNT(*)` for tables where the estimate is 0 or missing."
    )
    lines.append("")

    if not tables:
        lines.append("_No tables._")
        lines.append("")
    else:
        lines.append("| Table | Approximate Row Count | Source |")
        lines.append("|---|---|---|")
        for schema, tbl in tables:
            fqt = f"{schema}.{tbl}"
            info = row_counts.get(fqt, {})
            count = info.get("count")
            source = info.get("source", "unknown")
            count_str = f"{count:,}" if isinstance(count, int) else "_unavailable_"
            lines.append(f"| `{fqt}` | {count_str} | {source} |")
        lines.append("")

    lines.append("---")
    lines.append("")

    # -------------------------------------------------------- Gaps / Unknowns
    lines.append("## Gaps / Unknowns")
    lines.append("")

    gaps = []
    for schema, tbl in tables:
        fqt = f"{schema}.{tbl}"
        cols = tables_cols.get(fqt, [])
        if not cols:
            gaps.append(f"- `{fqt}`: no columns returned — table may be empty, a view, or inaccessible.")

    if gaps:
        lines.append("The following tables could not be fully documented:")
        lines.append("")
        lines.extend(gaps)
        lines.append("")
        lines.append(
            "All other tables and columns are documented above to the extent "
            "that `information_schema` exposes them.  Column-level semantics "
            "(business meaning) remain unverified without access to application "
            "source code or data-dictionary documentation."
        )
    else:
        lines.append(
            "All non-system tables and their columns are listed above. "
            "Column-level semantics (business meaning beyond what is obvious "
            "from the name) remain unverified — no application source code or "
            "data-dictionary was available at generation time."
        )
    lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    timestamp = utc_now()

    # 1. Resolve DSN
    dsn = os.environ.get("BB_SOURCE_DSN") or os.environ.get("DATABASE_URL")
    if not dsn:
        error_text = (
            "No DSN provided.  Neither BB_SOURCE_DSN nor DATABASE_URL is set "
            "in the environment."
        )
        print(f"ERROR: {error_text}", file=sys.stderr)
        doc = failure_doc(error_text, timestamp)
        write_file(OUTPUT_FILE, doc)
        print(f"Wrote failure notice to {OUTPUT_FILE}.")
        sys.exit(1)

    # 2. Import driver
    try:
        import psycopg2
        import psycopg2.extras
    except ImportError:
        error_text = (
            "psycopg2 is not installed.  "
            "Run: pip install psycopg2-binary"
        )
        print(f"ERROR: {error_text}", file=sys.stderr)
        doc = failure_doc(error_text, timestamp)
        write_file(OUTPUT_FILE, doc)
        print(f"Wrote failure notice to {OUTPUT_FILE}.")
        sys.exit(1)

    # 3. Connect
    try:
        conn = psycopg2.connect(dsn)
        conn.set_session(readonly=True, autocommit=True)
    except Exception as exc:  # noqa: BLE001
        error_text = str(exc)
        print(f"ERROR: Cannot connect to database — {error_text}", file=sys.stderr)
        doc = failure_doc(error_text, timestamp)
        write_file(OUTPUT_FILE, doc)
        print(f"Wrote failure notice to {OUTPUT_FILE}.")
        sys.exit(1)

    try:
        cur_factory = psycopg2.extras.RealDictCursor

        # 4. List tables
        with conn.cursor(cursor_factory=cur_factory) as cur:
            cur.execute(TABLES_SQL)
            tables = [(r["table_schema"], r["table_name"]) for r in cur.fetchall()]

        # 5. Columns per table
        tables_cols: dict[str, list] = {}
        for schema, tbl in tables:
            fqt = f"{schema}.{tbl}"
            with conn.cursor(cursor_factory=cur_factory) as cur:
                cur.execute(COLUMNS_SQL, (schema, tbl))
                tables_cols[fqt] = [dict(r) for r in cur.fetchall()]

        # 6. Foreign keys
        with conn.cursor(cursor_factory=cur_factory) as cur:
            cur.execute(FOREIGN_KEYS_SQL)
            formal_fks = [dict(r) for r in cur.fetchall()]

        # 7. Row counts (from pg_stat_user_tables first)
        with conn.cursor(cursor_factory=cur_factory) as cur:
            cur.execute(ROW_COUNTS_SQL)
            stat_rows = {f"{r['schemaname']}.{r['relname']}": r["n_live_tup"] for r in cur.fetchall()}

        row_counts: dict[str, dict] = {}
        for schema, tbl in tables:
            fqt = f"{schema}.{tbl}"
            estimate = stat_rows.get(fqt)
            if estimate and estimate > 0:
                row_counts[fqt] = {"count": estimate, "source": "pg_stat_user_tables (estimate)"}
            else:
                # Fall back to COUNT(*)
                try:
                    with conn.cursor() as cur:
                        cur.execute(
                            f'SELECT COUNT(*) FROM "{schema}"."{tbl}"'
                        )
                        exact = cur.fetchone()[0]
                    row_counts[fqt] = {"count": exact, "source": "COUNT(*) (exact)"}
                except Exception as exc:  # noqa: BLE001
                    row_counts[fqt] = {"count": None, "source": f"error: {exc}"}

        # 8. Inferred relationships
        # Build a simplified map of fqt -> [column_names] for heuristic
        tables_col_names = {
            fqt: [c["column_name"] for c in cols]
            for fqt, cols in tables_cols.items()
        }
        inferred_rels = infer_relationships(tables_col_names, formal_fks)

    except Exception as exc:  # noqa: BLE001
        error_text = str(exc)
        print(f"ERROR: Schema introspection failed — {error_text}", file=sys.stderr)
        doc = failure_doc(error_text, timestamp)
        write_file(OUTPUT_FILE, doc)
        print(f"Wrote failure notice to {OUTPUT_FILE}.")
        conn.close()
        sys.exit(1)
    finally:
        conn.close()

    # 9. Build and write the document
    doc = build_schema_doc(
        tables=tables,
        tables_cols=tables_cols,
        formal_fks=formal_fks,
        row_counts=row_counts,
        inferred_rels=inferred_rels,
        timestamp=timestamp,
    )

    try:
        write_file(OUTPUT_FILE, doc)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: Could not write {OUTPUT_FILE} — {exc}", file=sys.stderr)
        sys.exit(2)

    print(f"Schema documentation written to {OUTPUT_FILE}")
    sys.exit(0)


if __name__ == "__main__":
    main()
