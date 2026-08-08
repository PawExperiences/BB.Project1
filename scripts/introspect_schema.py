#!/usr/bin/env python3
"""
introspect_schema.py

Connects to a PostgreSQL database specified by the DATABASE_URL environment
variable and writes a SCHEMA.md file to the repository root documenting the
live state of the database.

Exits 0 on success, 1 if the connection fails or DATABASE_URL is unset.
"""

import os
import sys
import datetime
from pathlib import Path

OUTPUT_PATH = Path(__file__).resolve().parent.parent / "SCHEMA.md"


def _write(text: str) -> None:
    OUTPUT_PATH.write_text(text, encoding="utf-8")


def _fail(message: str) -> None:
    """Write error SCHEMA.md and exit 1."""
    timestamp = datetime.datetime.utcnow().isoformat(timespec="seconds") + "Z"
    content = (
        "# SCHEMA.md\n\n"
        "## Connection Status\n\n"
        f"**FAILED** — {message}\n\n"
        f"_Generated: {timestamp} UTC_\n"
    )
    _write(content)
    print(f"ERROR: {message}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        _fail("DATABASE_URL environment variable is not set or is empty.")

    # ------------------------------------------------------------------ #
    #  Import psycopg2 here so a missing install produces a clean message  #
    # ------------------------------------------------------------------ #
    try:
        import psycopg2
        import psycopg2.extras
    except ImportError as exc:
        _fail(f"psycopg2 is not installed: {exc}")

    # ------------------------------------------------------------------ #
    #  Connect                                                             #
    # ------------------------------------------------------------------ #
    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
    except Exception as exc:  # noqa: BLE001
        _fail(f"Could not connect to database: {exc}")

    # Extract host for metadata (no credentials)
    try:
        db_host = conn.get_dsn_parameters().get("host", "unknown")
        db_port = conn.get_dsn_parameters().get("port", "")
        db_name = conn.get_dsn_parameters().get("dbname", "unknown")
        host_info = f"{db_host}:{db_port}/{db_name}" if db_port else f"{db_host}/{db_name}"
    except Exception:  # noqa: BLE001
        host_info = "unknown"

    timestamp = datetime.datetime.utcnow().isoformat(timespec="seconds") + "Z"

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    gaps: list[str] = []

    # ------------------------------------------------------------------ #
    #  Non-system schemas                                                  #
    # ------------------------------------------------------------------ #
    try:
        cur.execute(
            """
            SELECT schema_name
            FROM information_schema.schemata
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
              AND schema_name NOT LIKE 'pg_toast%'
              AND schema_name NOT LIKE 'pg_temp_%'
            ORDER BY schema_name;
            """
        )
        schemas = [row["schema_name"] for row in cur.fetchall()]
    except Exception as exc:  # noqa: BLE001
        conn.close()
        _fail(f"Failed to query schemas: {exc}")

    # ------------------------------------------------------------------ #
    #  Per-table detail helpers                                            #
    # ------------------------------------------------------------------ #

    def get_columns(schema: str, table: str) -> list[dict]:
        cur.execute(
            """
            SELECT column_name,
                   data_type,
                   is_nullable,
                   column_default
            FROM information_schema.columns
            WHERE table_schema = %s
              AND table_name   = %s
            ORDER BY ordinal_position;
            """,
            (schema, table),
        )
        return cur.fetchall()

    def get_primary_keys(schema: str, table: str) -> list[str]:
        cur.execute(
            """
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema    = kcu.table_schema
             AND tc.table_name      = kcu.table_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_schema    = %s
              AND tc.table_name      = %s
            ORDER BY kcu.ordinal_position;
            """,
            (schema, table),
        )
        return [row["column_name"] for row in cur.fetchall()]

    def get_foreign_keys(schema: str, table: str) -> list[dict]:
        cur.execute(
            """
            SELECT kcu.column_name,
                   ccu.table_schema  AS foreign_schema,
                   ccu.table_name    AS foreign_table,
                   ccu.column_name   AS foreign_column,
                   rc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema    = kcu.table_schema
             AND tc.table_name      = kcu.table_name
            JOIN information_schema.referential_constraints rc
              ON tc.constraint_name = rc.constraint_name
             AND tc.table_schema    = rc.constraint_schema
            JOIN information_schema.constraint_column_usage ccu
              ON rc.unique_constraint_name   = ccu.constraint_name
             AND rc.unique_constraint_schema = ccu.constraint_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_schema    = %s
              AND tc.table_name      = %s
            ORDER BY kcu.ordinal_position;
            """,
            (schema, table),
        )
        return cur.fetchall()

    def get_row_count(schema: str, table: str) -> tuple[int | None, str]:
        """Return (approx_count, method_label)."""
        # Try fast path via pg_class / pg_namespace first
        try:
            cur.execute(
                """
                SELECT c.reltuples::bigint AS estimate
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = %s
                  AND c.relname = %s;
                """,
                (schema, table),
            )
            row = cur.fetchone()
            if row is not None and row["estimate"] >= 0:
                return int(row["estimate"]), "pg_class estimate"
        except Exception:  # noqa: BLE001
            pass
        # Fallback: exact count
        try:
            qualified = f'"{schema}"."{table}"'
            cur.execute(f"SELECT COUNT(*) AS cnt FROM {qualified};")  # noqa: S608
            row = cur.fetchone()
            if row:
                return int(row["cnt"]), "exact COUNT(*)"
        except Exception as exc:  # noqa: BLE001
            return None, f"unavailable ({exc})"
        return None, "unavailable"

    # ------------------------------------------------------------------ #
    #  Build the Markdown                                                  #
    # ------------------------------------------------------------------ #
    lines: list[str] = [
        "# SCHEMA.md",
        "",
        "## Connection Status",
        "",
        f"**Connected** to `{host_info}`",
        "",
        "---",
        "",
        "## Schemas",
        "",
    ]

    if not schemas:
        lines.append("_No non-system schemas found._")
        lines.append("")
    else:
        lines.append(f"Non-system schemas found: {', '.join(f'`{s}`' for s in schemas)}")
        lines.append("")

    for schema in schemas:
        lines.append(f"---")
        lines.append("")
        lines.append(f"## Schema: `{schema}`")
        lines.append("")

        # List tables
        try:
            cur.execute(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = %s
                  AND table_type   = 'BASE TABLE'
                ORDER BY table_name;
                """,
                (schema,),
            )
            tables = [row["table_name"] for row in cur.fetchall()]
        except Exception as exc:  # noqa: BLE001
            gaps.append(
                f"Schema `{schema}`: could not list tables — {exc}"
            )
            lines.append(f"_Could not list tables: {exc}_")
            lines.append("")
            continue

        if not tables:
            lines.append("_No base tables found in this schema._")
            lines.append("")
            continue

        for table in tables:
            qualified = f"`{schema}.{table}`"
            lines.append(f"### Table: {qualified}")
            lines.append("")

            # --- Columns ---
            try:
                columns = get_columns(schema, table)
            except Exception as exc:  # noqa: BLE001
                gaps.append(
                    f"`{schema}.{table}`: could not retrieve columns — {exc}"
                )
                lines.append(f"_Could not retrieve columns: {exc}_")
                lines.append("")
                continue

            if columns:
                lines.append("**Columns:**")
                lines.append("")
                lines.append("| Column | Data Type | Nullable | Default |")
                lines.append("|--------|-----------|----------|---------|")
                for col in columns:
                    nullable = "YES" if col["is_nullable"] == "YES" else "NO"
                    default = col["column_default"] or ""
                    # Escape pipe characters inside cells
                    default_safe = str(default).replace("|", "\\|")
                    lines.append(
                        f"| `{col['column_name']}` "
                        f"| {col['data_type']} "
                        f"| {nullable} "
                        f"| {default_safe} |"
                    )
                lines.append("")
            else:
                lines.append("_No columns found (or table has no accessible columns)._")
                gaps.append(f"`{schema}.{table}`: no columns returned from information_schema.")
                lines.append("")

            # --- Primary Keys ---
            try:
                pks = get_primary_keys(schema, table)
            except Exception as exc:  # noqa: BLE001
                pks = []
                gaps.append(
                    f"`{schema}.{table}`: could not retrieve primary keys — {exc}"
                )

            if pks:
                pk_list = ", ".join(f"`{c}`" for c in pks)
                lines.append(f"**Primary Key:** {pk_list}")
                lines.append("")
            else:
                lines.append("**Primary Key:** _none detected_")
                lines.append("")

            # --- Foreign Keys ---
            try:
                fks = get_foreign_keys(schema, table)
            except Exception as exc:  # noqa: BLE001
                fks = []
                gaps.append(
                    f"`{schema}.{table}`: could not retrieve foreign keys — {exc}"
                )

            if fks:
                lines.append("**Foreign Keys:**")
                lines.append("")
                lines.append("| Column | References |")
                lines.append("|--------|------------|")
                for fk in fks:
                    ref = (
                        f"`{fk['foreign_schema']}.{fk['foreign_table']}`"
                        f".`{fk['foreign_column']}`"
                    )
                    lines.append(f"| `{fk['column_name']}` | {ref} |")
                lines.append("")
            else:
                lines.append("**Foreign Keys:** _none detected_")
                lines.append("")

            # --- Row Count ---
            try:
                count, method = get_row_count(schema, table)
            except Exception as exc:  # noqa: BLE001
                count, method = None, f"unavailable ({exc})"
                gaps.append(
                    f"`{schema}.{table}`: could not retrieve row count — {exc}"
                )

            if count is not None:
                lines.append(f"**Approximate Row Count:** {count:,} _{method}_")
            else:
                lines.append(f"**Approximate Row Count:** {method}")
                if "unavailable" in method:
                    gaps.append(
                        f"`{schema}.{table}`: row count unavailable — {method}"
                    )
            lines.append("")

    # ------------------------------------------------------------------ #
    #  Gaps section                                                        #
    # ------------------------------------------------------------------ #
    lines.append("---")
    lines.append("")
    lines.append("## Gaps")
    lines.append("")

    if gaps:
        lines.append(
            "The following tables or relationships could not be fully introspected. "
            "Each entry gives the qualified name and the reason:"
        )
        lines.append("")
        for gap in gaps:
            lines.append(f"- {gap}")
        lines.append("")
    else:
        lines.append(
            "_No gaps detected. All tables, columns, keys, and row counts were "
            "retrieved successfully._"
        )
        lines.append("")

    # ------------------------------------------------------------------ #
    #  Generation metadata                                                 #
    # ------------------------------------------------------------------ #
    lines.append("---")
    lines.append("")
    lines.append("## Generation Metadata")
    lines.append("")
    lines.append(f"| Field | Value |")
    lines.append(f"|-------|-------|")
    lines.append(f"| Generated at | {timestamp} |")
    lines.append(f"| Database host | `{host_info}` |")
    lines.append(
        f"| Script | `scripts/introspect_schema.py` |"
    )
    lines.append("")
    lines.append(
        "_Credentials (username, password) are intentionally omitted from this file._"
    )
    lines.append("")

    cur.close()
    conn.close()

    _write("\n".join(lines))
    print(f"SCHEMA.md written to {OUTPUT_PATH}")
    sys.exit(0)


if __name__ == "__main__":
    main()
