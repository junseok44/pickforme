-- 1. 분모 계산: 홈 화면의 전체 PV를 집계하는 CTE
MERGE {{- DESTINATION_TABLE -}} AS target
USING (
  WITH home_pv_cte AS (
      SELECT
          COUNTIF(event_name = 'screen_view' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'firebase_screen') = 'HomeScreen') AS total_home_pv
      FROM
          {{- GA4_EVENTS_TABLE -}}
      WHERE
          PARSE_DATE('%Y%m%d', event_date) = DATE(@target_date)
          AND event_name = 'screen_view'
  ),

  category_clicks_cte AS (
      SELECT
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'category') AS category,
          COUNT(*) AS click_count
      FROM
          {{- GA4_EVENTS_TABLE -}}
      WHERE
          PARSE_DATE('%Y%m%d', event_date) = DATE(@target_date)
          AND event_name = 'home_item_click'
      GROUP BY
          category
  )

  SELECT
      DATE(@target_date) AS summary_date,
      pv.total_home_pv,
      clicks.category,
      clicks.click_count,
      -- Key Metric: 카테고리별 클릭률(CTR) 계산
      SAFE_DIVIDE(clicks.click_count, pv.total_home_pv) AS category_ctr
  FROM
      home_pv_cte pv, -- 1행 1열 테이블 (total_home_pv)
      category_clicks_cte clicks -- N행 2열 테이블 (category, click_count)
  ORDER BY
      clicks.click_count DESC
) AS source
ON target.summary_date = source.summary_date AND target.category = source.category
WHEN MATCHED THEN
  UPDATE SET
    total_home_pv = source.total_home_pv,
    click_count = source.click_count,
    category_ctr = source.category_ctr
WHEN NOT MATCHED THEN
  INSERT (summary_date, total_home_pv, category, click_count, category_ctr)
  VALUES (source.summary_date, source.total_home_pv, source.category, source.click_count, source.category_ctr);