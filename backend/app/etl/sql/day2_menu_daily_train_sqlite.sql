DROP TABLE IF EXISTS menu_daily_train;

WITH
agg AS (
  SELECT
    o.menu_id,
    DATE(o.created_at) AS ds,
    MAX(0, CAST(SUM(o.quantity) AS INTEGER)) AS y
  FROM orders o
  GROUP BY o.menu_id, DATE(o.created_at)
),
range AS (
  SELECT
    (SELECT DATE(MIN(created_at)) FROM orders) AS start_ds,
    (SELECT DATE(MAX(created_at)) FROM orders) AS end_ds
),
dates(ds) AS (
  SELECT start_ds FROM range
  UNION ALL
  SELECT DATE(ds, '+1 day') FROM dates, range WHERE ds < end_ds
),
menu_dates AS (
  SELECT m.id AS menu_id, d.ds
  FROM menus m
  CROSS JOIN dates d
),
joined AS (
  SELECT
    md.menu_id,
    md.ds,
    COALESCE(a.y, 0) AS y
  FROM menu_dates md
  LEFT JOIN agg a
    ON a.menu_id = md.menu_id AND a.ds = md.ds
)
CREATE TABLE menu_daily_train AS
SELECT
  j.menu_id,
  j.ds,
  CASE WHEN j.y < 0 THEN 0 ELSE j.y END AS y,
  CAST(STRFTIME('%w', j.ds) AS INTEGER) - 1 AS dow_raw
  -- SQLite の %w は 0=日〜6=土。月曜=0 に合わせるため変換:
  -- dow = (dow_raw + 6) % 7
,
(( (CAST(STRFTIME('%w', j.ds) AS INTEGER) - 1 + 7) % 7 )) AS dow
,
CASE
  WHEN j.ds = DATE(j.ds, 'start of month', '+1 month', '-1 day') THEN 1
  ELSE 0
END AS is_month_end
FROM joined j
OPTION (/* no-op for sqlite */);