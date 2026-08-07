#!/usr/bin/env python3
"""
profile_db.py — Unattended Database Profiling Script

Connects to a PostgreSQL database and prints a structured, human-readable
profile of the three most substantial tables (by row count).

Connection DSN is read from:
  1. BB_SOURCE_DSN  (preferred)
  2. DATABASE_URL   (fallback)

Optional:
  PROFILE_ROW_LIMIT — maximum rows scanned per data query (default: 100000)
"""

import os
import sys


def get_dsn():
    """Return the DSN from environment variables, or None if not set."""
    dsn = os.environ.get("BB_SOURCE_DSN") or os.environ.get("DATABASE_URL")
    return dsn


def get_row_limit():
    """Return the row limit for data queries (from env or default 100000)."""
    try:
        return int(os.environ.get("PROFILE_ROW_LIMIT", "100000"))
    except ValueError:
        return 100000


def connect(dsn):
    """
    Attempt to connect to the PostgreSQL database.
    Returns the connection object, or prints an error and exits.
    """
    try:
        import psycopg2  # noqa: PLC0415
    except ImportError:
        print(
            "ERROR: Cannot connect to database — psycopg2 is not installed. "
            "Run: pip install psycopg2-binary",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        conn = psycopg2.connect(dsn)
        conn.set_session(readonly=True, autocommit=True)
        return conn
    except Exception as exc:  # noqa: BLE001
        print(
            f"ERROR: Cannot connect to database — {exc}. "
            "Set BB_SOURCE_DSN or DATABASE_URL.",
            file=sys.stderr,
        )
        sys.exit(1)


def get_top_tables(conn, top_n=3):
    """
    Return the top N user tables by estimated row count.
    Falls back to pg_stat_user_tables n_live_tup estimate.
    Returns a list of (schema, table_name) tuples.
    """
    sql = """
        SELECT schemaname, relname
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT %s;
    """
    with conn.cursor() as cur:
        cur.execute(sql, (top_n,))
        rows = cur.fetchall()
    return [(r[0], r[1]) for r in rows]


def get_exact_row_count(conn, schema, table, row_limit):
    """
    Return the exact row count, capped at row_limit via a subquery.
    If the true count <= row_limit the result is exact; otherwise it equals
    row_limit (indicating the table has at least that many rows).
    """
    qualified = f'"{schema}"."{table}"'
    sql = f"""
        SELECT COUNT(*)
        FROM (
            SELECT 1
            FROM {qualified}
            LIMIT %s
        ) AS sample;
    """
    with conn.cursor() as cur:
        cur.execute(sql, (row_limit,))
        result = cur.fetchone()
    return result[0]


def get_columns(conn, schema, table):
    """
    Return an ordered list of column names for the given table.
    """
    sql = """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = %s
          AND table_name  = %s
        ORDER BY ordinal_position;
    """
    with conn.cursor() as cur:
        cur.execute(sql, (schema, table))
        rows = cur.fetchall()
    return [r[0] for r in rows]


def get_null_shares(conn, schema, table, columns, row_limit):
    """
    Return a dict {column_name: null_fraction_percent} for the given table,
    computed over at most row_limit rows.
    """
    if not columns:
        return {}

    qualified = f'"{schema}"."{table}"'

    # Build a single SELECT that counts NULLs for every column at once.
    null_exprs = ",\n            ".join(
        f'SUM(CASE WHEN "{col}" IS NULL THEN 1 ELSE 0 END) AS null_{i},\n            '
        f'COUNT("{col}") AS total_{i}'
        for i, col in enumerate(columns)
    )

    sql = f"""
        SELECT {null_exprs}
        FROM (
            SELECT *
            FROM {qualified}
            LIMIT %s
        ) AS sample;
    """

    with conn.cursor() as cur:
        cur.execute(sql, (row_limit,))
        row = cur.fetchone()

    result = {}
    for i, col in enumerate(columns):
        null_count = row[i * 2] or 0
        total_count = row[i * 2 + 1] or 0
        if total_count == 0:
            pct = 0.0
        else:
            # total_count here is COUNT(col) which excludes NULLs;
            # actual sampled rows = null_count + total_count
            sampled = null_count + total_count
            pct = (null_count / sampled) * 100.0
        result[col] = pct
    return result


def get_lowest_cardinality_column(conn, schema, table, columns, row_limit):
    """
    Return (column_name, distinct_count) for the column with the fewest
    distinct values (approximate, using a sample of row_limit rows).
    """
    if not columns:
        return None, None

    qualified = f'"{schema}"."{table}"'
    best_col = None
    best_count = None

    for col in columns:
        sql = f"""
            SELECT COUNT(DISTINCT "{col}")
            FROM (
                SELECT "{col}"
                FROM {qualified}
                LIMIT %s
            ) AS sample;
        """
        with conn.cursor() as cur:
            cur.execute(sql, (row_limit,))
            count = cur.fetchone()[0]
        if best_count is None or count < best_count:
            best_count = count
            best_col = col

    return best_col, best_count


def get_top_values(conn, schema, table, column, top_n=5):
    """
    Return up to top_n (value, count) tuples for the given column,
    ordered by count descending.
    No explicit LIMIT on the subquery here because we GROUP BY the column
    across the full table (the cardinality is small by design).
    """
    qualified = f'"{schema}"."{table}"'
    sql = f"""
        SELECT "{column}", COUNT(*) AS cnt
        FROM {qualified}
        GROUP BY "{column}"
        ORDER BY cnt DESC
        LIMIT %s;
    """
    with conn.cursor() as cur:
        cur.execute(sql, (top_n,))
        rows = cur.fetchall()
    return rows


def format_number(n):
    """Format an integer with thousands separators."""
    return f"{n:,}"


def profile_table(conn, schema, table, index, total, row_limit):
    """Print the profile for a single table."""
    print(f"\n=== Table: {schema}.{table} ({index} of {total}) ===")

    # Row count
    row_count = get_exact_row_count(conn, schema, table, row_limit)
    capped = " (capped)" if row_count >= row_limit else ""
    print(f"Rows      : {format_number(row_count)}{capped}")

    # Columns
    columns = get_columns(conn, schema, table)
    print(f"Columns   : {len(columns)}")

    if not columns:
        print("(No columns found — skipping further analysis)")
        return

    # Null share
    null_shares = get_null_shares(conn, schema, table, columns, row_limit)
    print("Null share:")
    col_width = max(len(c) for c in columns)
    for col in columns:
        pct = null_shares.get(col, 0.0)
        print(f"  {col:<{col_width}} : {pct:>5.1f}%")

    # Lowest-cardinality column
    low_col, low_count = get_lowest_cardinality_column(
        conn, schema, table, columns, row_limit
    )
    if low_col is None:
        return

    print(f"Lowest-cardinality column: {low_col} ({format_number(low_count)} distinct values)")

    # Top-5 values
    top_values = get_top_values(conn, schema, table, low_col, top_n=5)
    print("Top 5 values:")
    if top_values:
        val_width = max(len(str(v)) for v, _ in top_values)
        for value, count in top_values:
            print(f"  {str(value):<{val_width}} : {format_number(count)}")
    else:
        print("  (no data)")


def main():
    dsn = get_dsn()
    if not dsn:
        print(
            "ERROR: Cannot connect to database — no DSN provided. "
            "Set BB_SOURCE_DSN or DATABASE_URL.",
            file=sys.stderr,
        )
        sys.exit(1)

    row_limit = get_row_limit()

    conn = connect(dsn)

    try:
        top_tables = get_top_tables(conn, top_n=3)
    except Exception as exc:  # noqa: BLE001
        print(
            f"ERROR: Failed to query table catalog — {exc}",
            file=sys.stderr,
        )
        conn.close()
        sys.exit(1)

    if not top_tables:
        print(
            "ERROR: No user tables found in the database.",
            file=sys.stderr,
        )
        conn.close()
        sys.exit(1)

    total = len(top_tables)
    print(
        f"Database profile — top {total} tables by row count "
        f"(row scan limit: {format_number(row_limit)} rows per query)"
    )
    print("=" * 60)

    for index, (schema, table) in enumerate(top_tables, start=1):
        try:
            profile_table(conn, schema, table, index, total, row_limit)
        except Exception as exc:  # noqa: BLE001
            print(
                f"  WARNING: Could not profile {schema}.{table} — {exc}",
                file=sys.stderr,
            )

    print("\n" + "=" * 60)
    print("Profiling complete.")

    conn.close()
    sys.exit(0)


if __name__ == "__main__":
    main()
