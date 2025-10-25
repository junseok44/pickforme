import { MetricJob } from '../types/types';

// 공통 target_date 생성 함수
const getTargetDate = () => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - 1);
  return targetDate.toISOString().split('T')[0];
};

//  기초 공사(중간 테이블 생성) 작업 목록
export const foundationJobs: MetricJob[] = [
  {
    name: '활성 유저 지표',
    sqlFile: 'summary/foundation/getDailyActiveUniqueIds.sql',
    destinationTable: 'daily_active_unique_ids',
    writeDisposition: 'MERGE',
    getQueryParams: () => ({
      target_date: getTargetDate(),
    }),
  },
];

// MongoDB 동기화 작업 목록
export const mongodbSyncJobs: MetricJob[] = [
  {
    name: 'MongoDB 유저 데이터 동기화',
    type: 'mongodb_sync',
    collection: 'users',
    destinationTable: 'users',
  },
  {
    name: 'MongoDB 구매 데이터 동기화',
    type: 'mongodb_sync',
    collection: 'purchases',
    destinationTable: 'purchases',
  },
  {
    name: 'MongoDB 구매 실패 데이터 동기화',
    type: 'mongodb_sync',
    collection: 'purchase_failures',
    destinationTable: 'purchase_failures',
  },
  {
    name: 'MongoDB 요청 데이터 동기화',
    type: 'mongodb_sync',
    collection: 'requests',
    destinationTable: 'requests',
  },
];

// 최종 요약 테이블 생성 작업 목록
export const summaryJobs: MetricJob[] = [
  {
    name: '로그인/회원가입 관련 집계',
    sqlFile: 'summary/getDailyLoginMetrics.sql',
    destinationTable: 'daily_login_metrics',
    writeDisposition: 'MERGE',
    getQueryParams: () => ({
      target_date: getTargetDate(),
    }),
  },
  {
    name: '홈 화면 관련 지표',
    sqlFile: 'summary/getDailyHomeMetrics.sql',
    destinationTable: 'daily_home_metrics',
    writeDisposition: 'MERGE',
    getQueryParams: () => ({
      target_date: getTargetDate(),
    }),
  },
  {
    name: '홈 화면 카테고리별 클릭 지표',
    sqlFile: 'summary/getDailyHomeCategoryClick.sql',
    destinationTable: 'daily_home_category_click_metrics',
    writeDisposition: 'MERGE',
    getQueryParams: () => ({
      target_date: getTargetDate(),
    }),
  },
  {
    name: '키워드 검색 관련 지표',
    sqlFile: 'summary/getDailySearchMetrics.sql',
    destinationTable: 'daily_search_metrics',
    writeDisposition: 'MERGE',
    getQueryParams: () => ({
      target_date: getTargetDate(),
    }),
  },
  {
    name: '링크 검색 관련 지표',
    sqlFile: 'summary/getDailyLinkSearchMetrics.sql',
    destinationTable: 'daily_link_search_metrics',
    writeDisposition: 'MERGE',
    getQueryParams: () => ({
      target_date: getTargetDate(),
    }),
  },
  {
    name: 'Time To First Action (TTFA)',
    sqlFile: 'summary/getDailyTTFA.sql',
    destinationTable: 'daily_ttfa_metrics',
    writeDisposition: 'MERGE',
    getQueryParams: () => ({
      target_date: getTargetDate(),
    }),
  },
  {
    name: '첫 방문자 전환율',
    sqlFile: 'summary/getDailyFirstVisitorConversion.sql',
    destinationTable: 'daily_first_visitor_conversion_metrics',
    writeDisposition: 'MERGE',
    getQueryParams: () => ({
      target_date: getTargetDate(),
    }),
  },
  {
    name: '멤버십(구독) 퍼널 지표',
    sqlFile: 'summary/getDailySubscriptionFunnelMetrics.sql',
    destinationTable: 'daily_subscription_funnel_metrics',
    writeDisposition: 'MERGE',
    getQueryParams: () => ({
      target_date: getTargetDate(),
    }),
  },
  {
    name: '매니저 Q&A 응답 확인 지표',
    sqlFile: 'summary/getDailyManagerQAMetrics.sql',
    destinationTable: 'daily_manager_qa_metrics',
    writeDisposition: 'MERGE',
    getQueryParams: () => ({
      target_date: getTargetDate(),
    }),
  },
  {
    name: '상품 상세페이지 관련 지표',
    sqlFile: 'summary/getDailyPdpMetrics.sql',
    destinationTable: 'daily_pdp_metrics',
    writeDisposition: 'MERGE',
    getQueryParams: () => ({
      target_date: getTargetDate(),
    }),
  },
  {
    name: '멤버십 상태 지표',
    sqlFile: 'summary/membership/getMembershipMetrics.sql',
    destinationTable: 'membership_metrics',
    writeDisposition: 'MERGE',
    getQueryParams: () => ({
      target_date: getTargetDate(),
    }),
  },
];
