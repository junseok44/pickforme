-- @target_date를 기준으로 첫 방문자의 24시간 내 상세페이지 조회 전환율을 계산합니다.
MERGE {{- DESTINATION_TABLE -}} AS target
USING (
  SELECT
    DATE(@target_date) AS summary_date,
    -- 분모: 해당 날짜의 신규 사용자 수 (first_open 이벤트 기준)
    COUNTIF(event_name = 'first_open') AS new_users_count,

    -- 분자: 설치 후 24시간 내에 상세페이지를 조회한 횟수
    -- within_24h 파라미터 값이 true(BigQuery에서는 1)인 경우만 카운트합니다.
    COUNTIF(
        event_name = 'view_item_detail'
        AND (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'within_24h') = 1
    ) AS converted_within_24h_count

  FROM
    {{- GA4_EVENTS_TABLE -}}
  WHERE
    PARSE_DATE('%Y%m%d', event_date) = DATE(@target_date)
    AND event_name IN ('first_open', 'view_item_detail')
) AS source
ON target.summary_date = source.summary_date
WHEN MATCHED THEN
  UPDATE SET
    new_users_count = source.new_users_count,
    converted_within_24h_count = source.converted_within_24h_count
WHEN NOT MATCHED THEN
  INSERT (summary_date, new_users_count, converted_within_24h_count)
  VALUES (source.summary_date, source.new_users_count, source.converted_within_24h_count);