-- @target_date를 기준으로 로그인 및 회원가입 관련 모든 메트릭을 집계합니다.
MERGE {{- DESTINATION_TABLE -}} AS target
USING (
  SELECT
    DATE(@target_date) AS summary_date,
    
    -- 로그인 시도 및 성공 수
    COUNTIF(event_name = 'login_attempt') AS login_attempt_count,
    COUNTIF(event_name = 'login_success') AS login_success_count,
    
    -- 각 소셜 로그인 시도(버튼 클릭) 수
    COUNTIF(event_name = 'login_attempt' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'method') = 'kakao') AS kakao_login_attempt_count,
    COUNTIF(event_name = 'login_attempt' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'method') = 'google') AS google_login_attempt_count,
    COUNTIF(event_name = 'login_attempt' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'method') = 'apple') AS apple_login_attempt_count,
    
    -- 회원가입 관련 메트릭
    COUNTIF(event_name = 'screen_view' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'firebase_screen') = 'LoginScreen') AS signup_page_pv,
    COUNTIF(event_name = 'register_success') AS register_success_count

  FROM
    {{- GA4_EVENTS_TABLE -}}
  WHERE
    -- 파티션된 날짜가 @target_date와 일치하는 데이터만 스캔
    PARSE_DATE('%Y%m%d', event_date) = DATE(@target_date)
    -- 분석에 필요한 이벤트만 필터링하여 스캔 비용 절감
    AND event_name IN ('login_attempt', 'login_success', 'register_success', 'screen_view')
) AS source
ON target.summary_date = source.summary_date
WHEN MATCHED THEN
  UPDATE SET
    login_attempt_count = source.login_attempt_count,
    login_success_count = source.login_success_count,
    kakao_login_attempt_count = source.kakao_login_attempt_count,
    google_login_attempt_count = source.google_login_attempt_count,
    apple_login_attempt_count = source.apple_login_attempt_count,
    signup_page_pv = source.signup_page_pv,
    register_success_count = source.register_success_count
WHEN NOT MATCHED THEN
  INSERT (summary_date, login_attempt_count, login_success_count, kakao_login_attempt_count, google_login_attempt_count, apple_login_attempt_count, signup_page_pv, register_success_count)
  VALUES (source.summary_date, source.login_attempt_count, source.login_success_count, source.kakao_login_attempt_count, source.google_login_attempt_count, source.apple_login_attempt_count, source.signup_page_pv, source.register_success_count);