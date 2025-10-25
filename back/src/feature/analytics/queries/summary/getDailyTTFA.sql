-- @target_date를 기준으로 TTFA(Time To First Action)를 계산합니다.
MERGE {{- DESTINATION_TABLE -}} AS target
USING (
  WITH first_action_events AS (
    SELECT
      -- 파라미터에 들어있는 elapsed_ms 값을 추출합니다. (정수형 또는 실수형일 수 있음)
      COALESCE(
        (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'elapsed_ms'),
        CAST((SELECT value.double_value FROM UNNEST(event_params) WHERE key = 'elapsed_ms') AS INT64)
      ) AS elapsed_ms
    FROM
      {{- GA4_EVENTS_TABLE -}}
    WHERE
      PARSE_DATE('%Y%m%d', event_date) = DATE(@target_date)
      AND event_name = 'first_action'
  )
  SELECT
      DATE(@target_date) AS summary_date,
      -- TTFA가 기록된 세션의 수
      COUNT(elapsed_ms) AS total_sessions_with_first_action,
      -- 밀리초(ms)의 평균을 계산한 뒤 초(s) 단위로 변환
      AVG(elapsed_ms) / 1000 AS avg_ttfa_seconds
  FROM
      first_action_events
) AS source
ON target.summary_date = source.summary_date
WHEN MATCHED THEN
  UPDATE SET
    total_sessions_with_first_action = source.total_sessions_with_first_action,
    avg_ttfa_seconds = source.avg_ttfa_seconds
WHEN NOT MATCHED THEN
  INSERT (summary_date, total_sessions_with_first_action, avg_ttfa_seconds)
  VALUES (source.summary_date, source.total_sessions_with_first_action, source.avg_ttfa_seconds);