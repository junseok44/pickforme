-- @target_date를 기준으로 매니저 Q&A 응답 확인 관련 지표를 집계합니다.
MERGE {{- DESTINATION_TABLE -}} AS target
USING (
  WITH manager_responses AS (
    -- 매니저가 응답한 요청 수 (status가 PENDING이 아니고 type이 QUESTION인 것들)
    SELECT COUNT(*) AS manager_response_count
    FROM {{- FOUNDATION_DATASET -}}.requests
    WHERE DATE(createdAt) = DATE(@target_date)
      AND status != 'PENDING'
      AND type = 'QUESTION'
  ),
  firebase_events AS (
    -- Firebase 이벤트에서 응답 확인 클릭 수
    SELECT 
      COUNTIF(event_name = 'manager_answer_push_click') AS manager_answer_push_click_count
    FROM {{- GA4_EVENTS_TABLE -}}
    WHERE PARSE_DATE('%Y%m%d', event_date) = DATE(@target_date)
  )
  SELECT
    DATE(@target_date) AS summary_date,
    COALESCE(mr.manager_response_count, 0) AS manager_response_count,
    COALESCE(fe.manager_answer_push_click_count, 0) AS manager_answer_push_click_count
  FROM manager_responses mr
  CROSS JOIN firebase_events fe
) AS source
ON target.summary_date = source.summary_date
WHEN MATCHED THEN
  UPDATE SET
    manager_response_count = source.manager_response_count,
    manager_answer_push_click_count = source.manager_answer_push_click_count
WHEN NOT MATCHED THEN
  INSERT (summary_date, manager_response_count, manager_answer_push_click_count)
  VALUES (source.summary_date, source.manager_response_count, source.manager_answer_push_click_count);