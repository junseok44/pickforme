-- @target_date를 기준으로 상품 상세페이지 관련 지표의 구성 요소를 집계합니다.
MERGE {{- DESTINATION_TABLE -}} AS target
USING (
  SELECT
    DATE(@target_date) AS summary_date,
    -- 분모: 상품 상세페이지 PV
    COUNTIF(event_name = 'screen_view' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'firebase_screen') = 'ProductDetailScreen') AS pdp_pv,
    -- 구매하기 버튼 클릭 수 (전용 이벤트 사용)
    COUNTIF(event_name = 'product_detail_buy_click') AS buy_button_click_count,

    COUNTIF(event_name = 'button_click' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'button_name') = 'pdp_wishlist') AS wishlist_button_click_count,

    COUNTIF(event_name = 'tab_click' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'tab') = 'caption') AS caption_tab_click_count,
    COUNTIF(event_name = 'tab_click' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'tab') = 'report') AS report_tab_click_count,
    COUNTIF(event_name = 'tab_click' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'tab') = 'review') AS review_tab_click_count,
    -- question_tab_click_count 제거

    -- 탭 콘텐츠 프로세스 통계
    -- Caption 탭
    COUNTIF(event_name = 'tab_content_process' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'tab') = 'caption' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'status') = 'success') AS caption_success_count,
    COUNTIF(event_name = 'tab_content_process' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'tab') = 'caption' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'status') = 'failed') AS caption_failed_count,
    ROUND(AVG(CASE WHEN event_name = 'tab_content_process' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'tab') = 'caption' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'status') = 'success' THEN COALESCE((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'duration_ms'), (SELECT value.double_value FROM UNNEST(event_params) WHERE key = 'duration_ms')) END), 2) AS caption_avg_duration_ms,

    -- Report 탭
    COUNTIF(event_name = 'tab_content_process' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'tab') = 'report' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'status') = 'success') AS report_success_count,
    COUNTIF(event_name = 'tab_content_process' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'tab') = 'report' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'status') = 'failed') AS report_failed_count,
    ROUND(AVG(CASE WHEN event_name = 'tab_content_process' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'tab') = 'report' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'status') = 'success' THEN COALESCE((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'duration_ms'), (SELECT value.double_value FROM UNNEST(event_params) WHERE key = 'duration_ms')) END), 2) AS report_avg_duration_ms,

    -- Review 탭
    COUNTIF(event_name = 'tab_content_process' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'tab') = 'review' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'status') = 'success') AS review_success_count,
    COUNTIF(event_name = 'tab_content_process' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'tab') = 'review' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'status') = 'failed') AS review_failed_count,
    ROUND(AVG(CASE WHEN event_name = 'tab_content_process' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'tab') = 'review' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'status') = 'success' THEN COALESCE((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'duration_ms'), (SELECT value.double_value FROM UNNEST(event_params) WHERE key = 'duration_ms')) END), 2) AS review_avg_duration_ms
    -- Question 탭 제거

  FROM
    {{- GA4_EVENTS_TABLE -}}
  WHERE
    PARSE_DATE('%Y%m%d', event_date) = DATE(@target_date)
    AND event_name IN ('screen_view', 'product_detail_buy_click', 'button_click', 'tab_click', 'tab_content_process')
) AS source
ON target.summary_date = source.summary_date
WHEN MATCHED THEN
  UPDATE SET
    pdp_pv = source.pdp_pv,
    buy_button_click_count = source.buy_button_click_count,
    wishlist_button_click_count = source.wishlist_button_click_count,
    caption_tab_click_count = source.caption_tab_click_count,
    report_tab_click_count = source.report_tab_click_count,
    review_tab_click_count = source.review_tab_click_count,
    -- question_tab_click_count 제거
    caption_success_count = source.caption_success_count,
    caption_failed_count = source.caption_failed_count,
    caption_avg_duration_ms = source.caption_avg_duration_ms,
    report_success_count = source.report_success_count,
    report_failed_count = source.report_failed_count,
    report_avg_duration_ms = source.report_avg_duration_ms,
    review_success_count = source.review_success_count,
    review_failed_count = source.review_failed_count,
    review_avg_duration_ms = source.review_avg_duration_ms
    -- question 관련 컬럼들 제거
WHEN NOT MATCHED THEN
  INSERT (summary_date, pdp_pv, buy_button_click_count, wishlist_button_click_count, caption_tab_click_count, report_tab_click_count, review_tab_click_count, caption_success_count, caption_failed_count, caption_avg_duration_ms, report_success_count, report_failed_count, report_avg_duration_ms, review_success_count, review_failed_count, review_avg_duration_ms)
  VALUES (source.summary_date, source.pdp_pv, source.buy_button_click_count, source.wishlist_button_click_count, source.caption_tab_click_count, source.report_tab_click_count, source.review_tab_click_count, source.caption_success_count, source.caption_failed_count, source.caption_avg_duration_ms, source.report_success_count, source.report_failed_count, source.report_avg_duration_ms, source.review_success_count, source.review_failed_count, source.review_avg_duration_ms);