// BigQuery 테이블 스키마 정의
export const TABLE_SCHEMAS: Record<string, any[]> = {
  // 로그인/회원가입 관련 집계
  daily_login_metrics: [
    { name: 'summary_date', type: 'DATE' },
    { name: 'login_attempt_count', type: 'INTEGER' },
    { name: 'login_success_count', type: 'INTEGER' },
    { name: 'kakao_login_attempt_count', type: 'INTEGER' },
    { name: 'google_login_attempt_count', type: 'INTEGER' },
    { name: 'apple_login_attempt_count', type: 'INTEGER' },
    { name: 'signup_page_pv', type: 'INTEGER' },
    { name: 'register_success_count', type: 'INTEGER' },
  ],

  // 홈 화면 관련 지표
  daily_home_metrics: [
    { name: 'summary_date', type: 'DATE' },
    { name: 'home_pv', type: 'INTEGER' },
    { name: 'recommended_item_click_count', type: 'INTEGER' },
  ],

  // 홈 화면 카테고리별 클릭 지표
  daily_home_category_click_metrics: [
    { name: 'summary_date', type: 'DATE' },
    { name: 'total_home_pv', type: 'INTEGER' },
    { name: 'category', type: 'STRING' },
    { name: 'click_count', type: 'INTEGER' },
    { name: 'category_ctr', type: 'FLOAT' },
  ],

  // 키워드 검색 관련 지표
  daily_search_metrics: [
    { name: 'summary_date', type: 'DATE' },
    { name: 'keyword_search_submit_count', type: 'INTEGER' },
    { name: 'keyword_search_success_count', type: 'INTEGER' },
    { name: 'keyword_search_failure_count', type: 'INTEGER' },
    { name: 'search_item_click_count', type: 'INTEGER' },
    { name: 'search_result_pv', type: 'INTEGER' },
  ],

  // 검색 시도 지표
  daily_search_attempt_metrics: [
    { name: 'summary_date', type: 'DATE' },
    { name: 'search_total', type: 'INTEGER' },
    { name: 'search_success_count', type: 'INTEGER' },
  ],

  // 링크 검색 관련 지표
  daily_link_search_metrics: [
    { name: 'summary_date', type: 'DATE' },
    { name: 'link_search_attempt_count', type: 'INTEGER' },
    { name: 'link_search_success_count', type: 'INTEGER' },
  ],

  // Time To First Action (TTFA)
  daily_ttfa_metrics: [
    { name: 'summary_date', type: 'DATE' },
    { name: 'total_sessions_with_first_action', type: 'INTEGER' },
    { name: 'avg_ttfa_seconds', type: 'FLOAT' },
  ],

  // 첫 방문자 전환율
  daily_first_visitor_conversion_metrics: [
    { name: 'summary_date', type: 'DATE' },
    { name: 'new_users_count', type: 'INTEGER' },
    { name: 'converted_within_24h_count', type: 'INTEGER' },
  ],

  // 멤버십(구독) 퍼널 지표
  daily_subscription_funnel_metrics: [
    { name: 'summary_date', type: 'DATE' },
    { name: 'subscription_page_pv', type: 'INTEGER' },
    { name: 'subscription_request_count', type: 'INTEGER' },
    { name: 'payment_success_count', type: 'INTEGER' },
    { name: 'payment_error_count', type: 'INTEGER' },
    { name: 'payment_cancelled_count', type: 'INTEGER' },
    { name: 'unsubscribe_count', type: 'INTEGER' },
  ],

  // 매니저 Q&A 응답 확인 지표
  daily_manager_qa_metrics: [
    { name: 'summary_date', type: 'DATE' },
    { name: 'manager_response_count', type: 'INTEGER' },
    { name: 'manager_answer_push_click_count', type: 'INTEGER' },
  ],

  // 상품 상세페이지 관련 지표
  daily_pdp_metrics: [
    { name: 'summary_date', type: 'DATE' },
    { name: 'pdp_pv', type: 'INTEGER' },
    { name: 'buy_button_click_count', type: 'INTEGER' },
    { name: 'wishlist_button_click_count', type: 'INTEGER' },
    { name: 'caption_tab_click_count', type: 'INTEGER' },
    { name: 'report_tab_click_count', type: 'INTEGER' },
    { name: 'review_tab_click_count', type: 'INTEGER' },
    // question_tab_click_count 제거
    // 탭 콘텐츠 프로세스 통계 추가
    { name: 'caption_success_count', type: 'INTEGER' },
    { name: 'caption_failed_count', type: 'INTEGER' },
    { name: 'caption_avg_duration_ms', type: 'FLOAT' },
    { name: 'report_success_count', type: 'INTEGER' },
    { name: 'report_failed_count', type: 'INTEGER' },
    { name: 'report_avg_duration_ms', type: 'FLOAT' },
    { name: 'review_success_count', type: 'INTEGER' },
    { name: 'review_failed_count', type: 'INTEGER' },
    { name: 'review_avg_duration_ms', type: 'FLOAT' },
    // question 관련 컬럼들 제거
  ],

  // 멤버십 관련 지표
  membership_metrics: [
    { name: 'date', type: 'DATE' },
    { name: 'membershipUserRatio', type: 'FLOAT' },
    { name: 'repeatMembershipUserRatio', type: 'FLOAT' },
    { name: 'membershipRetentionRate', type: 'FLOAT' },
    { name: 'totalUsers', type: 'INTEGER' },
    { name: 'membershipUsers', type: 'INTEGER' },
    { name: 'repeatMembershipUsers', type: 'INTEGER' },
    { name: 'monthlyMembershipPurchases', type: 'INTEGER' },
    { name: 'previousMonthMembershipPurchases', type: 'INTEGER' },
    { name: 'currentMonthRenewalUsers', type: 'INTEGER' },
    { name: 'createdAt', type: 'TIMESTAMP' },
  ],

  // 활성 유저 지표
  daily_active_unique_ids: [
    { name: 'summary_date', type: 'DATE' },
    { name: 'user_unique_id', type: 'STRING' },
    { name: 'total_events', type: 'INTEGER' },
    { name: 'first_event_time', type: 'TIMESTAMP' },
    { name: 'last_event_time', type: 'TIMESTAMP' },
  ],

  // Foundation 데이터셋 - MongoDB 동기화용 테이블들
  users: [
    { name: '_id', type: 'STRING' },
    { name: 'email', type: 'STRING' },
    { name: 'point', type: 'INTEGER' },
    { name: 'aiPoint', type: 'INTEGER' },
    { name: 'level', type: 'INTEGER' },
    { name: 'lastLoginAt', type: 'TIMESTAMP' },
    { name: 'MembershipAt', type: 'TIMESTAMP' },
    { name: 'lastMembershipAt', type: 'TIMESTAMP' },
    { name: 'event', type: 'INTEGER' },
    { name: 'createdAt', type: 'TIMESTAMP' },
    { name: 'updatedAt', type: 'TIMESTAMP' },
  ],

  purchases: [
    { name: '_id', type: 'STRING' },
    { name: 'userId', type: 'STRING' },
    { name: 'productId', type: 'STRING' },
    { name: 'platform', type: 'STRING' },
    { name: 'type', type: 'INTEGER' },
    { name: 'isExpired', type: 'BOOLEAN' },
    { name: 'createdAt', type: 'TIMESTAMP' },
    { name: 'updatedAt', type: 'TIMESTAMP' },
  ],

  purchase_failures: [
    { name: '_id', type: 'STRING' },
    { name: 'userId', type: 'STRING' },
    { name: 'productId', type: 'STRING' },
    { name: 'status', type: 'STRING' },
    { name: 'createdAt', type: 'TIMESTAMP' },
    { name: 'updatedAt', type: 'TIMESTAMP' },
    { name: 'platform', type: 'STRING' },
  ],

  requests: [
    { name: '_id', type: 'STRING' },
    { name: 'userId', type: 'STRING' },
    { name: 'status', type: 'STRING' },
    { name: 'type', type: 'STRING' },
    { name: 'name', type: 'STRING' },
    { name: 'text', type: 'STRING' },
    { name: 'product', type: 'JSON' },
    { name: 'review', type: 'JSON' },
    { name: 'answer', type: 'JSON' },
    { name: 'createdAt', type: 'TIMESTAMP' },
    { name: 'updatedAt', type: 'TIMESTAMP' },
  ],
};
