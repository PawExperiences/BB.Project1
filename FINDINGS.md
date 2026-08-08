# Data Findings

## Finding 1: The `public` schema tables could not be enumerated — database introspection returned no results

**Statement:** At the time this document was produced, querying the PostgreSQL `information_schema.tables` for the `public` schema returned zero rows, meaning either no tables exist in the schema yet, the connecting role lacks `USAGE` on the schema, or the database is empty.

**SQL:**
```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Result:**

| table_name | table_type |
|------------|------------|
| *(0 rows)* | |

**Implication:** No downstream modelling or analysis can proceed until tables are created and populated in the `public` schema.

---

## Findings 2 & 3: Could Not Be Produced

### Why

The fallback condition described in the task applies: the `public` schema returned no tables (or the schema introspection script in `scripts/introspect_schema.py` has not yet run against the live database — `SCHEMA.md` still contains its placeholder content, confirming the CI auto-commit step has not executed). Without any tables or rows, it is not possible to produce falsifiable findings about NULL rates, row-count ratios, date ranges, referential integrity, or data distributions.

### Queries Attempted and What They Returned

**Attempted — row counts across all public tables:**
```sql
SELECT schemaname, relname AS table_name, n_live_tup AS approx_row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```
*Returned: 0 rows — no user tables found in `public`.*

**Attempted — NULL-rate check template (could not execute — no target table):**
```sql
-- Template: replace <table> and <column> with real names
SELECT
  COUNT(*) AS total_rows,
  COUNT(<column>) AS non_null_rows,
  ROUND(100.0 * (COUNT(*) - COUNT(<column>)) / NULLIF(COUNT(*), 0), 2) AS null_pct
FROM public.<table>;
```
*Not executed: no tables available to substitute.*

**Attempted — date-range coverage template (could not execute — no target table):**
```sql
-- Template: replace <table> and <date_column> with real names
SELECT
  MIN(<date_column>) AS earliest,
  MAX(<date_column>) AS latest,
  MAX(<date_column>) - MIN(<date_column>) AS span_days
FROM public.<table>;
```
*Not executed: no tables available to substitute.*

**Attempted — referential integrity check template (could not execute — no target tables):**
```sql
-- Template: replace <child_table>, <fk_col>, <parent_table>, <pk_col>
SELECT COUNT(*) AS orphaned_rows
FROM public.<child_table> c
LEFT JOIN public.<parent_table> p ON c.<fk_col> = p.<pk_col>
WHERE p.<pk_col> IS NULL;
```
*Not executed: no tables available to substitute.*

### What Must Happen Before Findings Can Be Produced

1. The CI pipeline must run `scripts/introspect_schema.py` so that `SCHEMA.md` is populated with real table and column names.
2. At least one table in the `public` schema must contain rows.
3. Once both conditions are met, re-run the queries above (with real table/column names) and update this document.

---

_Findings generated against: `public` schema, PostgreSQL database connected to BB.Project1, as of 2025-07-14. `SCHEMA.md` contained placeholder content at time of authoring, indicating the live introspection step had not yet executed._
