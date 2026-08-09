#!/usr/bin/env python3
"""profile_db.py — Unattended Database Profiler.

Connects to a PostgreSQL database and prints a structured, human-readable
profile of the three most substantial tables (by row count).

Connection string is read from BB_SOURCE_DSN; falls back to DATABASE_URL.
Exits with code 1 on any connection or configuration error (no traceback).
"""

import os
import sys


def get_dsn() -> str:
    """Return the DSN from environment variables, or exit with code 1."""
    dsn = os.environ.get("BB_SOURCE_DSN") or os.environ.get("DATABASE_URL")
    if not dsn:
        print(
            "ERROR: cannot connect to database — neither BB_SOURCE_DSN nor "
            "DATABASE_URL is set.",
            file=sys.stderr,
        )
        sys.exit(1)
    return dsn


def connect(dsn: str):
    """Return a psycopg2 connection, or exit with code 1 on failure."""
    try:
        import psycopg2
        conn = psycopg2.connect(dsn)
        return conn
    except Exception as exc:
        print(
            f"ERROR: cannot connect to database — {exc}",
            file=sys.stderr,
        )
        sys.exit(1)


def _qi(schema: str, table: str) -> str:
    """Return a safely double-quoted schema.table identifier."""
    s = schema.replace('"', '""')
    t = table.replace('"', '""')
    return f'"{s}"."{t}"'


def _qi_col(col: str) -> str:
    """Return a safely double-quoted column identifier."""
    c = col.replace('"', '""')
    return f'"{c}"'


def _fmt_int(n) -> str:
    """Format an integer with thousands separators."""
    return f"{int(n):,}"


def _fmt_pct(share: float) -> str:
    """Format a 0-1 fraction as a percentage string, e.g. '44.4%'."""
    return f"{share * 100:.1f}%"


def get_top_tables(conn, limit: int = 3) -> list:
    """Return up to `limit` (schema, table, row_count) tuples ordered by
    descending row count.

    Uses pg_class.reltuples as a fast initial ranking, then verifies each
    candidate with a capped COUNT (LIMIT 1_000_000) so that freshly-loaded
    tables (reltuples == 0) are handled correctly.
    """
    sql_estimate = """
        SELECT
            n.nspname  AS schema_name,
            c.relname  AS table_name,
            c.reltuples::bigint AS row_estimate
        FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'r'
          AND n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
          AND n.nspname NOT LIKE 'pg_%'
        ORDER BY c.reltuples DESC
        LIMIT %s
    """
    cur = conn.cursor()
    # Fetch a few more candidates in case the estimate order differs
    cur.execute(sql_estimate, (max(limit * 3, 10),))
    rows = cur.fetchall()
    cur.close()

    result = []
    for schema, table, _estimate in rows:
        count_sql = (
            "SELECT COUNT(*) FROM ("
            f"SELECT 1 FROM {_qi(schema, table)} LIMIT 1000000"
            ") AS _sample"
        )
        cur2 = conn.cursor()
        cur2.execute(count_sql)
        real_count = cur2.fetchone()[0]
        cur2.close()
        result.append((schema, table, real_count))

    result.sort(key=lambda r: r[2], reverse=True)
    return result[:limit]


def get_columns(conn, schema: str, table: str) -> list:
    """Return list of column names for the given table."""
    sql = """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = %s
          AND table_name   = %s
        ORDER BY ordinal_position
        LIMIT 1000
    """
    cur = conn.cursor()
    cur.execute(sql, (schema, table))
    cols = [row[0] for row in cur.fetchall()]
    cur.close()
    return cols


def get_null_shares(conn, schema: str, table: str, columns: list,
                    sample: int = 10000) -> dict:
    """Return {column_name: null_share} sampled over at most `sample` rows.
    null_share is in [0.0, 1.0].
    """
    if not columns:
        return {}

    col_exprs = ",\n            ".join(
        f"SUM(CASE WHEN {_qi_col(col)} IS NULL THEN 1 ELSE 0 END) AS n_{i}"
        for i, col in enumerate(columns)
    )
    sql = (
        "SELECT\n"
        "            COUNT(*) AS _total,\n"
        f"            {col_exprs}\n"
        "        FROM (\n"
        f"            SELECT * FROM {_qi(schema, table)} LIMIT {sample}\n"
        "        ) AS _sample"
    )
    cur = conn.cursor()
    cur.execute(sql)
    row = cur.fetchone()
    cur.close()

    total = row[0]
    if total == 0:
        return {col: 0.0 for col in columns}

    shares = {}
    for i, col in enumerate(columns):
        null_count = row[i + 1] or 0
        shares[col] = null_count / total
    return shares


def get_distinct_counts(conn, schema: str, table: str, columns: list,
                        null_shares: dict, sample: int = 10000) -> dict:
    """Return {column_name: distinct_count} for non-all-NULL columns,
    sampled over at most `sample` rows.
    """
    eligible = [c for c in columns if null_shares.get(c, 1.0) < 1.0]
    if not eligible:
        return {}

    result = {}
    for col in eligible:
        sql = (
            f"SELECT COUNT(DISTINCT {_qi_col(col)}) FROM (\n"
            f"    SELECT {_qi_col(col)} FROM {_qi(schema, table)} LIMIT {sample}\n"
            ") AS _sample"
        )
        cur = conn.cursor()
        cur.execute(sql)
        result[col] = cur.fetchone()[0]
        cur.close()
    return result


def get_top_values(conn, schema: str, table: str, column: str,
                   sample: int = 10000, top_n: int = 5) -> list:
    """Return [(value, count)] for the top `top_n` most common values of
    `column`, sampled over at most `sample` rows.
    """
    sql = (
        f"SELECT {_qi_col(column)}, COUNT(*) AS cnt\n"
        "FROM (\n"
        f"    SELECT {_qi_col(column)} FROM {_qi(schema, table)} LIMIT {sample}\n"
        ") AS _sample\n"
        f"GROUP BY {_qi_col(column)}\n"
        "ORDER BY cnt DESC\n"
        f"LIMIT {top_n}"
    )
    cur = conn.cursor()
    cur.execute(sql)
    rows = cur.fetchall()
    cur.close()
    return rows


def profile_table(conn, schema: str, table: str, row_count: int) -> None:
    """Print the profile for a single table to stdout."""
    SAMPLE = 10000

    columns = get_columns(conn, schema, table)
    col_count = len(columns)

    null_shares = get_null_shares(conn, schema, table, columns, sample=SAMPLE)
    distinct_counts = get_distinct_counts(
        conn, schema, table, columns, null_shares, sample=SAMPLE
    )

    print(
        f"=== Table: {schema}.{table} "
        f"(rows: {_fmt_int(row_count)}, columns: {col_count}) ==="
    )

    print("Null share per column:")
    max_col_len = max((len(c) for c in columns), default=0)
    for col in columns:
        share = null_shares.get(col, 0.0)
        print(f"  {col:<{max_col_len}} : {share:.2f}")

    if distinct_counts:
        low_card_col = min(distinct_counts, key=lambda c: distinct_counts[c])
        low_card_n = distinct_counts[low_card_col]
        print(
            f"Lowest-cardinality column: {low_card_col} "
            f"({_fmt_int(low_card_n)} distinct values)"
        )

        top_values = get_top_values(
            conn, schema, table, low_card_col, sample=SAMPLE, top_n=5
        )

        # Use the actual sample size as the denominator for percentages
        sample_size = min(row_count, SAMPLE)
        denom = sample_size if sample_size > 0 else 1

        print("Top 5 values:")
        for value, cnt in top_values:
            pct = cnt / denom
            print(f"  {str(value):<20} : {_fmt_int(cnt)} ({_fmt_pct(pct)})")
    else:
        print("Lowest-cardinality column: N/A (all columns are entirely NULL)")
        print("Top 5 values: N/A")

    print()


def main() -> None:
    """Entry point."""
    dsn = get_dsn()
    conn = connect(dsn)

    try:
        top_tables = get_top_tables(conn, limit=3)

        if not top_tables:
            print(
                "ERROR: no user tables found in the database.",
                file=sys.stderr,
            )
            sys.exit(1)

        print(f"Profiling {len(top_tables)} table(s)\n")

        for schema, table, row_count in top_tables:
            profile_table(conn, schema, table, row_count)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
