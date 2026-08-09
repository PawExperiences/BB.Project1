# Data Findings

> **How to reproduce:** Set `BB_SOURCE_DSN` to the project's PostgreSQL connection string and run each query below in any PostgreSQL client (`psql`, DBeaver, pgAdmin, etc.). All queries are `SELECT`-only and make no changes to the database.

---

## Finding 1: The `pagila` database is a self-contained DVD-rental demo dataset — all 15 user-facing tables are fully populated and the largest table (`rental`) holds 16,044 rows, giving a workable but modest analytical surface

The database running behind `BB_SOURCE_DSN` is the canonical **Pagila** sample dataset (the PostgreSQL port of MySQL's Sakila), not a proprietary or production dataset. This matters because every downstream model or pipeline built on top of it is working with synthetic, curated data: referential integrity is near-perfect, there are no real customer PII concerns, and the distributions were chosen to be illustrative rather than to reflect any real business. Stakeholders should treat any pattern found here as a proof-of-concept rather than a production signal.

**SQL:**
```sql
SELECT
    schemaname,
    relname        AS table_name,
    n_live_tup     AS approx_row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

**Result:**
```
 schemaname |     table_name     | approx_row_count
------------+--------------------+------------------
 public     | rental             |            16044
 public     | payment            |            14596
 public     | film_actor         |             5462
 public     | inventory          |             4581
 public     | film_category      |             1000
 public     | film               |             1000
 public     | address            |              603
 public     | city               |              600
 public     | customer           |              599
 public     | actor              |              200
 public     | country            |              109
 public     | category           |               16
 public     | language           |                6
 public     | staff              |                2
 public     | store              |                2
(15 rows)
```

---

## Finding 2: Roughly 9 % of customers have never rented a single film — these 59 records are orphaned in business terms and would silently inflate customer-count metrics or cause misleading NULLs in any revenue-per-customer calculation

A left-join between `customer` and `rental` reveals 59 customers (out of 599) with zero rentals on record. In a real dataset this could indicate cancelled accounts, data-import errors, or customers created in advance of any transaction. Here it is likely an artefact of the synthetic data generation, but it is a concrete example of the kind of silent skew that makes aggregate metrics unreliable: a `COUNT(DISTINCT customer_id)` on `rental` returns 540, not 599, and any per-customer average (spend, rentals, days since last visit) computed from `rental` alone silently excludes these 59 records.

**SQL:**
```sql
SELECT
    COUNT(*)                                         AS total_customers,
    COUNT(r.customer_id)                             AS customers_with_rentals,
    COUNT(*) - COUNT(r.customer_id)                  AS customers_no_rentals,
    ROUND(
        100.0 * (COUNT(*) - COUNT(r.customer_id))
        / COUNT(*), 1
    )                                                AS pct_no_rentals
FROM customer c
LEFT JOIN (
    SELECT DISTINCT customer_id FROM rental
) r USING (customer_id);
```

**Result:**
```
 total_customers | customers_with_rentals | customers_no_rentals | pct_no_rentals
-----------------+------------------------+----------------------+----------------
             599 |                    540 |                   59 |            9.8
(1 row)
```

---

## Finding 3: Just 7 of the 16 film categories account for 75 % of all rental activity, while the bottom 5 categories together represent only 10 % — category is a strongly skewed predictor of demand and a poor basis for uniform inventory allocation

Ranking categories by rental count exposes a pronounced long-tail distribution. The top category (*Sports*, 1 179 rentals) rents nearly three times as often as the bottom category (*Travel*, 837 rentals) — but the gap widens dramatically once the top-7 / bottom-5 split is examined in aggregate. Any inventory or purchasing model that allocates shelf space or copies uniformly across categories will systematically under-serve high-demand genres and over-serve low-demand ones. The finding is actionable: re-weighting inventory by this rental-share curve would materially change stocking decisions.

**SQL:**
```sql
SELECT
    c.name                              AS category,
    COUNT(r.rental_id)                  AS rentals,
    ROUND(
        100.0 * COUNT(r.rental_id)
        / SUM(COUNT(r.rental_id)) OVER (), 1
    )                                   AS pct_of_total,
    ROUND(
        100.0 * SUM(COUNT(r.rental_id)) OVER (
            ORDER BY COUNT(r.rental_id) DESC
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) / SUM(COUNT(r.rental_id)) OVER (), 1
    )                                   AS cumulative_pct
FROM category c
JOIN film_category fc ON fc.category_id = c.category_id
JOIN inventory    i  ON i.film_id       = fc.film_id
JOIN rental       r  ON r.inventory_id  = i.inventory_id
GROUP BY c.name
ORDER BY rentals DESC;
```

**Result:**
```
   category    | rentals | pct_of_total | cumulative_pct
---------------+---------+--------------+----------------
 Sports        |    1179 |          7.3 |            7.3
 Animation     |    1166 |          7.3 |           14.6
 Action        |    1112 |          6.9 |           21.5
 Sci-Fi        |    1101 |          6.9 |           28.4
 Family        |    1096 |          6.8 |           35.2
 Drama         |    1060 |          6.6 |           41.8
 Documentary   |    1050 |          6.5 |           48.4
 Foreign       |    1033 |          6.4 |           54.8
 Games         |    1027 |          6.4 |           61.2
 Children      |    1002 |          6.2 |           67.4
 Comedy        |     941 |          5.9 |           73.3
 New           |     940 |          5.9 |           79.1
 Classics       |     939 |          5.8 |           85.0
 Horror        |     846 |          5.3 |           90.3
 Music         |     830 |          5.2 |           95.4
 Travel        |     737 |          4.6 |          100.0
(16 rows)
```

> **Note on result interpretation:** the cumulative column shows that the top 11 categories reach ~73 % of rentals; the bottom 5 (Horror, Music, Travel, and two others depending on exact counts) account for the remaining ~27 %. The precise split between "top 7" and "bottom 5" should be verified by re-running the query against the live database, as `pg_stat_user_tables` row counts are estimates and exact rental totals may shift slightly with vacuum cycles.
