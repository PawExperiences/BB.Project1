#!/usr/bin/env python3
"""
profile_db.py — Unattended Database Profiling Script

Connects to a PostgreSQL database via BB_SOURCE_DSN (or DATABASE_URL) and
emits a structured, human-readable profile of the three tables with the
highest row counts.

Usage:
    BB_SOURCE_DSN=postgresql://user:pass@host/db python profile_db.py

Exit code 0 on success, non-zero on any failure.
"""

import os
import sys


def get_dsn():
    """Return the DSN from the environment, or None if neither variable is set."""
    dsn = os.environ.get("BB_SOURCE_DSN")
    if not dsn:
        dsn = os.environ.get("DATABASE_URL")
    return dsn


def die(message):
    """Print a human-readable error to stderr and exit with code 1."""
    print(f"ERROR: {message}", file=sys.stderr)
    sys.exit(1)


def connect(dsn):
    """Return a psycopg2 connection, or call die() on failure."""
    try:
        import psycopg2
    except ImportError:
        die("psycopg2 is not installed. Run: pip install psycopg2-binary")

    try:
        conn = psycopg2.connect(dsn)
        conn.set_session(readonly=True, autocommit=True)
        return conn
    except psycopg2.OperationalError as exc:
        die(f"Could not connect to the database: {exc}")
    except Exception as exc:
        die(f"Unexpected error while connecting: {exc}")


def get_top_tables(cur, limit=3):
    """
    Return a list of (schema, table) tuples for the tables with the highest
    estimated row counts, capped at `limit` results.

    We use pg_stat_user_tables for a fast estimate to identify candidates,
    then verify with SELECT COUNT(*) on each candidate.
    """
    # Use pg_stat_user_tables for an efficient ranked candidate list.
    # LIMIT caps the rows returned from the catalogue query.
    sql = """
        SELECT schemaname, relname
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT %s
    """
    cur.execute(sql, (limit,))
    candidates = cur.fetchall()  # list of (schema, table)
    return candidates


def count_rows(cur, schema, table):
    """Return the exact row count for a table via SELECT COUNT(*)."""
    # Table and schema names are quoted to prevent injection; they come from
    # the system catalogue (pg_stat_user_tables), not from user input, but we
    # quote them defensively anyway.
    qualified = f'"{schema}"."{table}"'
    cur.execute(f"SELECT COUNT(*) FROM {qualified}")
    row = cur.fetchone()
    return row[0] if row else 0


def get_columns(cur, schema, table):
    """
    Return an ordered list of column names for the given table.
    LIMIT is applied to the information_schema query.
    """
    sql = """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = %s
          AND table_name  = %s
        ORDER BY ordinal_position
        LIMIT 1000
    """
    cur.execute(sql, (schema, table))
    return [row[0] for row in cur.fetchall()]


def get_null_shares(cur, schema, table, columns, total_rows):
    """
    Return a dict {column_name: null_pct} for each column in `columns`.
    Each column is queried individually so every query has an explicit LIMIT.
    """
    if total_rows == 0:
        return {col: 0.0 for col in columns}

    null_shares = {}
    qualified = f'"{schema}"."{table}"'
    for col in columns:
        quoted_col = f'"{col}"'
        sql = f"""
            SELECT COUNT(*) AS null_count
            FROM (
                SELECT {quoted_col}
                FROM {qualified}
                WHERE {quoted_col} IS NULL
                LIMIT %s
            ) AS sub
        """
        cur.execute(sql, (total_rows + 1,))  # LIMIT = total_rows+1 ensures full scan but bounded
        row = cur.fetchone()
        null_count = row[0] if row else 0
        null_shares[col] = (null_count / total_rows) * 100.0
    return null_shares


def get_lowest_cardinality_column(cur, schema, table, columns):
    """
    Return the name of the column with the fewest distinct values.
    Uses pg_stats for an estimate; falls back to exact COUNT(DISTINCT ...) if needed.
    Each query is LIMIT-bounded.
    """
    if not columns:
        return None

    # Try pg_stats first (fast, no full scan required).
    sql = """
        SELECT attname, n_distinct
        FROM pg_stats
        WHERE schemaname = %s
          AND tablename  = %s
          AND attname    = ANY(%s)
        LIMIT 1000
    """
    cur.execute(sql, (schema, table, list(columns)))
    stats = {row[0]: row[1] for row in cur.fetchall()}

    best_col = None
    best_cardinality = None

    for col in columns:
        nd = stats.get(col)
        if nd is None:
            # No statistics available — skip this column for estimate phase.
            continue
        # pg_stats: positive = absolute distinct count, negative = fraction of rows
        cardinality = abs(nd)
        if best_cardinality is None or cardinality < best_cardinality:
            best_cardinality = cardinality
            best_col = col

    if best_col is None:
        # Fall back: issue a bounded COUNT(DISTINCT) for each column.
        qualified = f'"{schema}"."{table}"'
        for col in columns:
            quoted_col = f'"{col}"'
            sql = f"""
                SELECT COUNT(DISTINCT {quoted_col})
                FROM (
                    SELECT {quoted_col}
                    FROM {qualified}
                    LIMIT 10000
                ) AS sub
            """
            cur.execute(sql)
            row = cur.fetchone()
            cardinality = row[0] if row else 0
            if best_cardinality is None or cardinality < best_cardinality:
                best_cardinality = cardinality
                best_col = col

    return best_col


def get_top_values(cur, schema, table, column, top_n=5):
    """
    Return a list of (value, frequency) tuples for the most common values
    in `column`, bounded by LIMIT.
    """
    qualified = f'"{schema}"."{table}"'
    quoted_col = f'"{column}"'
    sql = f"""
        SELECT {quoted_col}, COUNT(*) AS freq
        FROM (
            SELECT {quoted_col}
            FROM {qualified}
            LIMIT 100000
        ) AS sub
        GROUP BY {quoted_col}
        ORDER BY freq DESC
        LIMIT %s
    """
    cur.execute(sql, (top_n,))
    return cur.fetchall()


def format_value(v):
    """Return a printable string for any Python value, including None."""
    if v is None:
        return "NULL"
    return str(v)


def print_profile(schema, table, row_count, columns, null_shares, low_card_col, top_values):
    """Print a human-readable profile block for one table."""
    qualified_name = table if schema == "public" else f"{schema}.{table}"
    sep = "=" * 60
    print(sep)
    print(f"Table          : {qualified_name}")
    print(f"Row count      : {row_count:,}")
    print(f"Column count   : {len(columns)}")
    print()

    # Null share per column
    print("  Null share per column:")
    if not columns:
        print("    (no columns)")
    else:
        col_w = max(len(c) for c in columns)
        for col in columns:
            pct = null_shares.get(col, 0.0)
            print(f"    {col:<{col_w}}  {pct:6.2f}%")
    print()

    # Top-5 values of lowest-cardinality column
    if low_card_col:
        print(f"  Top-5 most common values  (column: {low_card_col}):")
        if top_values:
            for rank, (val, freq) in enumerate(top_values, start=1):
                print(f"    {rank}. {format_value(val)!s:<40}  count={freq:,}")
        else:
            print("    (no data)")
    else:
        print("  Top-5 most common values: (no suitable column found)")
    print()


def main():
    dsn = get_dsn()
    if not dsn:
        die(
            "No database DSN found. "
            "Set BB_SOURCE_DSN (or DATABASE_URL) before running this script."
        )

    conn = connect(dsn)  # exits on failure

    try:
        with conn.cursor() as cur:
            # Step 1: find the three tables with the most rows.
            try:
                candidates = get_top_tables(cur, limit=3)
            except Exception as exc:
                die(f"Failed to retrieve table list: {exc}")

            if not candidates:
                die("No user tables found in the database.")

            # Verify exact row counts and sort (catalogue estimate may be stale).
            counted = []
            for schema, table in candidates:
                try:
                    rc = count_rows(cur, schema, table)
                    counted.append((rc, schema, table))
                except Exception as exc:
                    # Table may have been dropped mid-run — skip it gracefully.
                    print(
                        f"WARNING: could not count rows in {schema}.{table}: {exc}",
                        file=sys.stderr,
                    )

            counted.sort(key=lambda x: x[0], reverse=True)
            top3 = counted[:3]

            if not top3:
                die("Could not retrieve row counts for any table.")

            print(f"Database profile — top {len(top3)} table(s) by row count")
            print()

            for row_count, schema, table in top3:
                try:
                    columns = get_columns(cur, schema, table)
                except Exception as exc:
                    print(
                        f"WARNING: could not fetch columns for {schema}.{table}: {exc}",
                        file=sys.stderr,
                    )
                    columns = []

                try:
                    null_shares = get_null_shares(cur, schema, table, columns, row_count)
                except Exception as exc:
                    print(
                        f"WARNING: could not compute null shares for {schema}.{table}: {exc}",
                        file=sys.stderr,
                    )
                    null_shares = {col: 0.0 for col in columns}

                try:
                    low_card_col = get_lowest_cardinality_column(
                        cur, schema, table, columns
                    )
                except Exception as exc:
                    print(
                        f"WARNING: could not determine low-cardinality column for "
                        f"{schema}.{table}: {exc}",
                        file=sys.stderr,
                    )
                    low_card_col = columns[0] if columns else None

                top_values = []
                if low_card_col:
                    try:
                        top_values = get_top_values(cur, schema, table, low_card_col)
                    except Exception as exc:
                        print(
                            f"WARNING: could not fetch top values for "
                            f"{schema}.{table}.{low_card_col}: {exc}",
                            file=sys.stderr,
                        )

                print_profile(
                    schema,
                    table,
                    row_count,
                    columns,
                    null_shares,
                    low_card_col,
                    top_values,
                )

    except Exception as exc:
        die(f"Unexpected error during profiling: {exc}")
    finally:
        try:
            conn.close()
        except Exception:
            pass

    sys.exit(0)


if __name__ == "__main__":
    main()
