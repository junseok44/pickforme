-- @target_date를 기준으로 홈 화면 관련 지표의 구성 요소를 집계합니다.
MERGE {{- DESTINATION_TABLE -}} AS target
USING (
  SELECT
    DATE(@target_date) AS summary_date,
    -- 분모: 홈 화면 PV
    COUNTIF(event_name = 'screen_view' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'firebase_screen') = 'HomeScreen') AS home_pv,
    -- 홈화면 추천 상품 클릭 수
    COUNTIF(event_name = 'home_item_click') AS recommended_item_click_count
  FROM
    {{- GA4_EVENTS_TABLE -}}
  WHERE
    PARSE_DATE('%Y%m%d', event_date) = DATE(@target_date)
    AND event_name IN ('screen_view', 'home_item_click', 'button_click')
) AS source
ON target.summary_date = source.summary_date
WHEN MATCHED THEN
  UPDATE SET
    home_pv = source.home_pv,
    recommended_item_click_count = source.recommended_item_click_count
WHEN NOT MATCHED THEN
  INSERT (summary_date, home_pv, recommended_item_click_count)
  VALUES (source.summary_date, source.home_pv, source.recommended_item_click_count);