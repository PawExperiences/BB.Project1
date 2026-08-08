#!/usr/bin/env python3
"""profile_db.py — Unattended Database Profiler

Connects to a PostgreSQL database via BB_SOURCE_DSN (or DATABASE_URL fallback)
and prints a human-readable profile of the three most substantial tables.

Usage:
    python profile_db.py

Environment variables:
    BB_SOURCE_DSN   Primary DSN (preferred)
    DATABASE_URL    Fallback DSN
"""

import os
import sys


def get_dsn():
    """Return the DSN from environment variables; may return None."""
    return os.environ.get("BB_SOURCE_DSN") or os.environ.get("DATABASE_URL")


def connect(dsn):
    """Attempt to connect to PostgreSQL; returns a connection object."""
    import psycopg2  # noqa: PLC0415
    return psycopg2.connect(dsn)


def get_top_tables(cur, limit=3):
    """Return the (limit) tables with the highest row counts.

    Excludes information_schema and pg_* system schemas.
    Uses LIMIT to bound the discovery query.
    Returns a list of (schema, table, row_count) tuples.
    """
    # We query pg_class / pg_namespace for an estimate first to ORDER BY,
    # then do an exact COUNT(*) only for the top `limit` candidates.
    # The candidate discovery query itself uses LIMIT.
    discovery_sql = """
        SELECT n.nspname AS schema_name,
               c.relname  AS table_name
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.relkind = 'r'
           AND n.nspname NOT IN ('information_schema')
           AND n.nspname NOT LIKE 'pg_%'
         ORDER BY c.reltuples DESC
         LIMIT 20
    """
    cur.execute(discovery_sql)
    candidates = cur.fetchall()  # [(schema, table), ...]

    results = []
    for schema, table in candidates:
        if len(results) >= limit:
            break
        # Exact row count — the table identifier is safely quoted.
        count_sql = "SELECT COUNT(*) FROM \"{}\".\"{}\"".format(schema, table)
        cur.execute(count_sql)
        row_count = cur.fetchone()[0]
        results.append((schema, table, row_count))

    # Re-sort by exact count descending and keep top `limit`.
    results.sort(key=lambda x: x[2], reverse=True)
    return results[:limit]


def get_column_info(cur, schema, table):
    """Return column names for the given table."""
    sql = """
        SELECT column_name
          FROM information_schema.columns
         WHERE table_schema = %s
           AND table_name   = %s
         ORDER BY ordinal_position
         LIMIT 500
    """
    cur.execute(sql, (schema, table))
    return [row[0] for row in cur.fetchall()]


def get_null_shares(cur, schema, table, columns, sample_limit=10000):
    """Return a dict {column_name: null_pct} using a LIMIT-capped sample."""
    if not columns:
        return {}

    # Build a single query that counts NULLs for every column in one pass.
    # We wrap the table scan in a subquery with LIMIT.
    null_exprs = ",\n               ".join(
        "SUM(CASE WHEN \"{}\" IS NULL THEN 1 ELSE 0 END) AS null_{}".format(
            col, idx
        )
        for idx, col in enumerate(columns)
    )
    sql = """
        SELECT COUNT(*) AS total,
               {null_exprs}
          FROM (
              SELECT *
                FROM \"{schema}\".\"{table}\"
               LIMIT {sample_limit}
          ) AS _sample
    """.format(
        null_exprs=null_exprs,
        schema=schema,
        table=table,
        sample_limit=sample_limit,
    )
    cur.execute(sql)
    row = cur.fetchone()
    total = row[0]
    if total == 0:
        return {col: 0.0 for col in columns}

    result = {}
    for idx, col in enumerate(columns):
        null_count = row[idx + 1] or 0
        result[col] = (null_count / total) * 100.0
    return result


def get_lowest_cardinality_column(cur, schema, table, columns, sample_limit=10000):
    """Return the name of the non-null column with the lowest distinct-value count.

    Uses a LIMIT-capped sample per column.
    Returns None if columns is empty.
    """
    if not columns:
        return None

    best_col = None
    best_card = None

    for col in columns:
        sql = """
            SELECT COUNT(DISTINCT \"{col}\") AS cardinality
              FROM (
                  SELECT \"{col}\"
                    FROM \"{schema}\".\"{table}\"
                   WHERE \"{col}\" IS NOT NULL
                   LIMIT {sample_limit}
              ) AS _sample
        """.format(
            col=col,
            schema=schema,
            table=table,
            sample_limit=sample_limit,
        )
        cur.execute(sql)
        card = cur.fetchone()[0]
        if best_card is None or card < best_card:
            best_card = card
            best_col = col

    return best_col


def get_top_values(cur, schema, table, column, top_n=5):
    """Return the top_n most common non-null values and their counts.

    Uses LIMIT top_n.
    """
    sql = """
        SELECT \"{col}\" AS value,
               COUNT(*) AS cnt
          FROM \"{schema}\".\"{table}\"
         WHERE \"{col}\" IS NOT NULL
         GROUP BY \"{col}\"
         ORDER BY cnt DESC
         LIMIT {top_n}
    """.format(
        col=column,
        schema=schema,
        table=table,
        top_n=top_n,
    )
    cur.execute(sql)
    return cur.fetchall()  # [(value, count), ...]


def profile_table(cur, schema, table, row_count):
    """Print the full profile for one table."""
    print("=" * 60)
    print("Table : {}.{}".format(schema, table))
    print("Rows  : {:,}".format(row_count))

    columns = get_column_info(cur, schema, table)
    print("Columns: {:,}".format(len(columns)))

    if not columns:
        print("  (no columns found)")
        return

    # Null shares
    null_shares = get_null_shares(cur, schema, table, columns)
    print("\nNull share per column (sampled):")
    for col in columns:
        pct = null_shares.get(col, 0.0)
        print("  {}: {:.1f}% null".format(col, pct))

    # Lowest-cardinality column
    low_card_col = get_lowest_cardinality_column(cur, schema, table, columns)
    if low_card_col:
        print("\nLowest-cardinality non-null column: {}".format(low_card_col))
        top_vals = get_top_values(cur, schema, table, low_card_col, top_n=5)
        if top_vals:
            print("Top 5 most common values:")
            for val, cnt in top_vals:
                print("  {!r}: {:,}".format(val, cnt))
        else:
            print("  (no non-null values found)")
    else:
        print("\nNo non-null column found for cardinality analysis.")


def main():
    dsn = get_dsn()

    try:
        if not dsn:
            raise ValueError(
                "No DSN configured. Set BB_SOURCE_DSN or DATABASE_URL."
            )
        conn = connect(dsn)
    except Exception as exc:  # noqa: BLE001
        print(
            "Error: could not connect to the database — {}".format(exc),
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        with conn:
            with conn.cursor() as cur:
                top_tables = get_top_tables(cur, limit=3)

                if not top_tables:
                    print(
                        "Error: no user tables found in the database.",
                        file=sys.stderr,
                    )
                    sys.exit(1)

                print("Database Profile — Top {} Tables by Row Count".format(
                    len(top_tables)
                ))

                for schema, table, row_count in top_tables:
                    profile_table(cur, schema, table, row_count)

                print("=" * 60)
                print("Profile complete.")
    except Exception as exc:  # noqa: BLE001
        print(
            "Error: profiling failed — {}".format(exc),
            file=sys.stderr,
        )
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
