#!/usr/bin/env python3
"""
introspect_schema.py

Connects to the configured PostgreSQL database, introspects the `public`
schema via information_schema and pg_class, and renders SCHEMA.md at the
repository root.

Usage:
    python scripts/introspect_schema.py

Exit codes:
    0  – success (including empty public schema)
    1  – database unreachable or connection error
"""

import os
import sys
import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Optional dotenv support – load .env if present, ignore if not
# ---------------------------------------------------------------------------
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ---------------------------------------------------------------------------
# Resolve output path relative to THIS script's parent's parent (repo root)
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_MD = REPO_ROOT / "SCHEMA.md"


def get_connection():
    """Return a psycopg2 connection using environment variables."""
    import psycopg2  # imported here so the error surface is clear

    host = os.environ.get("DB_HOST", "localhost")
    port = os.environ.get("DB_PORT", "5432")
    dbname = os.environ.get("DB_NAME", "postgres")
    user = os.environ.get("DB_USER", "postgres")
    password = os.environ.get("DB_PASSWORD", "")
    sslmode = os.environ.get("DB_SSLMODE", "prefer")

    conn = psycopg2.connect(
        host=host,
        port=port,
        dbname=dbname,
        user=user,
        password=password,
        sslmode=sslmode,
        connect_timeout=10,
    )
    return conn


# ---------------------------------------------------------------------------
# SQL helpers
# ---------------------------------------------------------------------------

COLUMNS_SQL = """
SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale,
    c.is_nullable,
    c.column_default,
    c.ordinal_position
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;
"""

PRIMARY_KEYS_SQL = """
SELECT
    kcu.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema    = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema    = 'public'
ORDER BY kcu.table_name, kcu.ordinal_position;
"""

FOREIGN_KEYS_SQL = """
SELECT
    kcu.table_name        AS fk_table,
    kcu.column_name       AS fk_column,
    ccu.table_name        AS pk_table,
    ccu.column_name       AS pk_column,
    rc.constraint_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu
    ON rc.constraint_name  = kcu.constraint_name
   AND rc.constraint_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON rc.unique_constraint_name  = ccu.constraint_name
   AND rc.unique_constraint_schema = ccu.table_schema
WHERE kcu.table_schema = 'public'
ORDER BY kcu.table_name, kcu.column_name;
"""

ROW_COUNTS_SQL = """
SELECT
    relname        AS table_name,
    reltuples::bigint AS approx_rows
FROM pg_class
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE pg_namespace.nspname = 'public'
  AND relkind = 'r'
ORDER BY relname;
"""


# ---------------------------------------------------------------------------
# Known-purpose hints (extend as knowledge grows)
# ---------------------------------------------------------------------------
# Maps (table, column) or (table, None) -> human note.
# Used to suppress "purpose unclear" for well-understood names.
KNOWN_PURPOSE: dict = {
    # generic patterns handled programmatically below
}


def _col_note(table: str, column: str, data_type: str) -> str:
    """Return a plain-English note for a column; 'purpose unclear' if unknown."""
    col = column.lower()
    # Common well-understood patterns
    if col == "id":
        return "Primary surrogate key."
    if col.endswith("_id"):
        ref = col[:-3]  # strip _id
        return f"Foreign key reference — likely links to `{ref}` table."
    if col in ("created_at", "updated_at", "deleted_at", "inserted_at"):
        return "Audit timestamp."
    if col in ("created_by", "updated_by", "deleted_by"):
        return "Audit user reference."
    if col in ("name", "title", "label", "description", "notes", "comment", "remarks"):
        return "Human-readable label or description."
    if col in ("status", "state"):
        return "Record lifecycle status."
    if col in ("is_active", "active", "enabled", "is_deleted", "deleted"):
        return "Boolean flag."
    if col in ("email", "email_address"):
        return "Email address."
    if col in ("phone", "phone_number"):
        return "Phone number."
    if col in ("address", "city", "country", "zip", "postal_code", "state_province"):
        return "Geographic / address field."
    if col in ("price", "amount", "cost", "total", "balance", "fee"):
        return "Monetary value."
    if col in ("quantity", "qty", "count"):
        return "Numeric quantity."
    if col in ("uuid", "guid"):
        return "Universally unique identifier."
    if col in ("type", "kind", "category"):
        return "Discriminator / classification."
    if col in ("data", "payload", "metadata", "config", "settings", "properties"):
        return "Unstructured or semi-structured payload."
    return "purpose unclear"


def _table_note(table: str) -> str:
    """Return a plain-English note for a table; 'purpose unclear' if unknown."""
    t = table.lower()
    # Very common table name patterns
    common = {
        "users": "Stores user accounts.",
        "user": "Stores user accounts.",
        "accounts": "Stores account records.",
        "account": "Stores account records.",
        "orders": "Stores order records.",
        "order": "Stores order records.",
        "order_items": "Line items belonging to an order.",
        "products": "Product catalogue.",
        "product": "Product catalogue.",
        "customers": "Customer master data.",
        "customer": "Customer master data.",
        "pets": "Pet records.",
        "pet": "Pet records.",
        "breeds": "Breed reference data.",
        "breed": "Breed reference data.",
        "species": "Species reference data.",
        "sessions": "User session tracking.",
        "logs": "Audit / event log.",
        "events": "Event log.",
        "payments": "Payment transactions.",
        "payment": "Payment transactions.",
        "invoices": "Invoice records.",
        "invoice": "Invoice records.",
        "addresses": "Address records.",
        "address": "Address records.",
        "categories": "Category taxonomy.",
        "category": "Category taxonomy.",
        "tags": "Tag / label taxonomy.",
        "roles": "User role definitions.",
        "role": "User role definitions.",
        "permissions": "Permission definitions.",
        "permission": "Permission definitions.",
    }
    return common.get(t, "purpose unclear")


# ---------------------------------------------------------------------------
# Main introspection logic
# ---------------------------------------------------------------------------

def introspect(conn) -> str:
    """Run all introspection queries and return the rendered Markdown string."""
    cur = conn.cursor()

    # ---- columns -----------------------------------------------------------
    cur.execute(COLUMNS_SQL)
    col_rows = cur.fetchall()

    # ---- primary keys ------------------------------------------------------
    cur.execute(PRIMARY_KEYS_SQL)
    pk_rows = cur.fetchall()

    # ---- foreign keys (information_schema) ---------------------------------
    cur.execute(FOREIGN_KEYS_SQL)
    fk_rows = cur.fetchall()

    # ---- row counts --------------------------------------------------------
    cur.execute(ROW_COUNTS_SQL)
    rc_rows = cur.fetchall()

    cur.close()

    # ---- organise data -----------------------------------------------------
    from collections import defaultdict

    # tables -> list of column dicts
    tables: dict[str, list[dict]] = defaultdict(list)
    for row in col_rows:
        (
            table_name, column_name, data_type,
            char_max_len, num_prec, num_scale,
            is_nullable, column_default, ordinal_position,
        ) = row

        # Build a readable type string
        if data_type in ("character varying", "varchar") and char_max_len:
            type_str = f"varchar({char_max_len})"
        elif data_type == "character" and char_max_len:
            type_str = f"char({char_max_len})"
        elif data_type in ("numeric", "decimal") and num_prec is not None:
            if num_scale is not None:
                type_str = f"{data_type}({num_prec},{num_scale})"
            else:
                type_str = f"{data_type}({num_prec})"
        else:
            type_str = data_type

        tables[table_name].append({
            "name": column_name,
            "type": type_str,
            "nullable": is_nullable == "YES",
            "default": column_default,
        })

    # pk sets per table
    pk_map: dict[str, set[str]] = defaultdict(set)
    for table_name, column_name in pk_rows:
        pk_map[table_name].add(column_name)

    # fk map: (fk_table, fk_column) -> (pk_table, pk_column)
    fk_map: dict[tuple, tuple] = {}
    for fk_table, fk_column, pk_table, pk_column, _constraint in fk_rows:
        fk_map[(fk_table, fk_column)] = (pk_table, pk_column)

    # row count map
    rc_map: dict[str, int] = {r[0]: r[1] for r in rc_rows}

    # ---- infer FKs from _id naming convention (if not already in fk_map) ---
    all_table_names = set(tables.keys())
    for table_name, cols in tables.items():
        for col in cols:
            key = (table_name, col["name"])
            if key not in fk_map and col["name"].endswith("_id") and col["name"] != "id":
                ref_table = col["name"][:-3]  # strip _id
                # check singular and plural
                candidates = [ref_table, ref_table + "s", ref_table.rstrip("s")]
                for cand in candidates:
                    if cand in all_table_names:
                        fk_map[key] = (cand, "id")  # inferred
                        break

    # ---- render Markdown ---------------------------------------------------
    lines = []
    lines.append("# SCHEMA.md — Public Schema Documentation")
    lines.append("")
    ts = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    lines.append(f"_Generated by `scripts/introspect_schema.py` on {ts}_")
    lines.append("")
    lines.append("> Row counts are **approximate** — sourced from `pg_class.reltuples`, not `COUNT(*)`.")  
    lines.append("")

    if not tables:
        lines.append("public schema contains no tables.")
        return "\n".join(lines) + "\n"

    lines.append(f"**Total tables in public schema: {len(tables)}**")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Table of contents
    lines.append("## Table of Contents")
    lines.append("")
    for tname in sorted(tables.keys()):
        anchor = tname.lower().replace("_", "-")
        lines.append(f"- [{tname}](#{anchor})")
    lines.append("")
    lines.append("---")
    lines.append("")

    for tname in sorted(tables.keys()):
        approx_rows = rc_map.get(tname, -1)
        row_count_str = str(approx_rows) if approx_rows >= 0 else "unknown"
        table_note = _table_note(tname)

        lines.append(f"## {tname}")
        lines.append("")
        lines.append(f"**Note:** {table_note}")
        lines.append("")
        lines.append(f"**Approximate row count:** {row_count_str}")
        lines.append("")

        # PK summary
        pks = sorted(pk_map.get(tname, set()))
        if pks:
            lines.append(f"**Primary key(s):** `{'`, `'.join(pks)}`")
        else:
            lines.append("**Primary key(s):** none detected")
        lines.append("")

        # FK summary (both declared and inferred)
        table_fks = [
            (fk_col, ref_tbl, ref_col)
            for (fk_tbl, fk_col), (ref_tbl, ref_col) in fk_map.items()
            if fk_tbl == tname
        ]
        if table_fks:
            lines.append("**Foreign key relationships:**")
            lines.append("")
            for fk_col, ref_tbl, ref_col in sorted(table_fks):
                declared = (tname, fk_col) in {k for k in fk_map}
                marker = " _(declared)_" if (tname, fk_col) in fk_rows else ""
                lines.append(f"- `{fk_col}` → `{ref_tbl}.{ref_col}`{marker}")
            lines.append("")

        # Column table
        lines.append("| Column | Type | Nullable | Default | Note |")
        lines.append("|--------|------|----------|---------|------|")
        for col in tables[tname]:
            nullable_str = "YES" if col["nullable"] else "NO"
            default_str = str(col["default"]) if col["default"] is not None else ""
            # Escape pipe characters in default values
            default_str = default_str.replace("|", "\\|")
            note = _col_note(tname, col["name"], col["type"])
            lines.append(
                f"| `{col['name']}` | `{col['type']}` "
                f"| {nullable_str} | {default_str} | {note} |"
            )
        lines.append("")
        lines.append("---")
        lines.append("")

    return "\n".join(lines) + "\n"


def write_error(exc: Exception) -> None:
    """Write an error SCHEMA.md and exit with code 1."""
    ts = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    content = (
        "# SCHEMA.md — Public Schema Documentation\n"
        "\n"
        "## Database Connection Error\n"
        "\n"
        f"**Timestamp (UTC):** {ts}\n"
        "\n"
        "**Error message:**\n"
        "\n"
        f"```\n{exc}\n```\n"
        "\n"
        "Introspection could not proceed. Downstream tasks should not rely on "
        "schema information until this error is resolved.\n"
    )
    SCHEMA_MD.write_text(content, encoding="utf-8")
    print(f"ERROR: Could not connect to database: {exc}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    try:
        conn = get_connection()
    except Exception as exc:  # psycopg2.OperationalError, ImportError, etc.
        write_error(exc)
        return  # unreachable – sys.exit called above

    try:
        md_content = introspect(conn)
    except Exception as exc:
        conn.close()
        write_error(exc)
        return
    finally:
        try:
            conn.close()
        except Exception:
            pass

    SCHEMA_MD.write_text(md_content, encoding="utf-8")
    print(f"SCHEMA.md written to {SCHEMA_MD}")
    sys.exit(0)


if __name__ == "__main__":
    main()
