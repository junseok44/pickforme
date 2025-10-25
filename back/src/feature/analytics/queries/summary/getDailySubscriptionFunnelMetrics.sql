-- @target_date를 기준으로 멤버십(구독) 관련 퍼널 지표를 집계합니다.
-- 테이블을 단 한 번만 스캔하고 COUNTIF를 사용하여 효율적으로 계산합니다.

MERGE {{- DESTINATION_TABLE -}} AS target
USING (
  SELECT
    DATE(@target_date) AS summary_date,

    -- 1. 멤버십 가입 버튼 클릭률의 분모: 멤버십 페이지 PV
    COUNTIF(event_name = 'screen_view' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'firebase_screen') = 'SubscriptionScreen') AS subscription_page_pv,

    -- 2. 가입 시도: 가입 버튼 클릭 수
    COUNTIF(event_name = 'subscription_request') AS subscription_request_count,

    -- 3. 결제 성공: 최종 결제 완료 유저 수 
    COUNTIF(event_name = 'subscription_request_success') AS payment_success_count,

    -- 4. 결제 실패 (시스템 오류): 사용자가 취소한 경우가 아닌 모든 실패
    COUNTIF(
        event_name = 'subscription_request_failure' AND
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'failure_reason') != 'user_cancelled'
    ) AS payment_error_count,

    -- 5. 결제 취소 (사용자): 사용자가 직접 취소한 경우
    COUNTIF(
        event_name = 'subscription_request_failure' AND
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'failure_reason') = 'user_cancelled'
    ) AS payment_cancelled_count,

    -- 6. 구독 해지
    COUNTIF(event_name = 'subscription_unsubscribe') AS unsubscribe_count
  FROM
    {{- GA4_EVENTS_TABLE -}}
  WHERE
    PARSE_DATE('%Y%m%d', event_date) = DATE(@target_date)
    -- 분석에 필요한 이벤트만 필터링하여 스캔 범위를 줄입니다.
    AND event_name IN (
        'screen_view',
        'subscription_request',
        'subscription_request_success',
        'subscription_request_failure',
        'subscription_unsubscribe'
    )
) AS source
ON target.summary_date = source.summary_date
WHEN MATCHED THEN
  UPDATE SET
    subscription_page_pv = source.subscription_page_pv,
    subscription_request_count = source.subscription_request_count,
    payment_success_count = source.payment_success_count,
    payment_error_count = source.payment_error_count,
    payment_cancelled_count = source.payment_cancelled_count,
    unsubscribe_count = source.unsubscribe_count
WHEN NOT MATCHED THEN
  INSERT (summary_date, subscription_page_pv, subscription_request_count, payment_success_count, payment_error_count, payment_cancelled_count, unsubscribe_count)
  VALUES (source.summary_date, source.subscription_page_pv, source.subscription_request_count, source.payment_success_count, source.payment_error_count, source.payment_cancelled_count, source.unsubscribe_count);