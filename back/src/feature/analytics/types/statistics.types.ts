// 통계 조회 관련 타입 정의

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface StatisticsResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 1. 사용자 관련 통계
export interface UserStatistics {
  // 회원가입 전환율
  signupConversionRate: number;
  signupPageViews: number;
  signupCompletions: number;

  // 로그인 성공률/실패율
  loginSuccessRate: number;
  loginFailureRate: number;
  loginAttempts: number;
  loginSuccesses: number;
  loginFailures: number;

  // 소셜 로그인별 사용자 수
  socialLoginStats: {
    google: number;
    apple: number;
    kakao: number;
  };

  // TTFA (Time To First Action)
  ttfa: {
    averageTime: number; // 평균 시간 (초)
    medianTime: number; // 중간값 시간 (초)
  };

  // 첫 방문자 전환율
  firstVisitorConversionRate: number;
  firstVisitors: number;
  firstVisitorDetailViews: number;
}

// 2. 홈화면 관련 통계
export interface HomeStatistics {
  // 홈화면 추천 상품 클릭률
  recommendedProductClickRate: number;
  homePageViews: number;
  recommendedProductClicks: number;

  // 카테고리별 클릭률
  categoryClickRates: {
    [category: string]: {
      clickRate: number;
      clicks: number;
      pageViews: number;
    };
  };
}

// 3. 검색 관련 통계
export interface SearchStatistics {
  // 검색 성공률/실패율
  searchSuccessRate: number;
  searchFailureRate: number;
  searchAttempts: number;
  searchSuccesses: number;
  searchFailures: number;

  // 검색 화면 추천 상품 탐색 추이
  searchRecommendationClickRate: number;
  searchResultPageViews: number;
  searchRecommendationClicks: number;
}

// 4. 링크 검색 관련 통계
export interface LinkSearchStatistics {
  // 링크 검색 성공률
  linkSearchSuccessRate: number;
  linkSearchAttempts: number;
  linkSearchSuccesses: number;
}

// 5. 상품 상세 관련 통계
export interface ProductDetailStatistics {
  // 버튼별 클릭률
  buttonClickRates: {
    [buttonName: string]: {
      clickRate: number;
      clicks: number;
      pageViews: number;
    };
  };

  // 구매하기 버튼 클릭률
  purchaseButtonClickRate: number;
  purchaseButtonClicks: number;
  productDetailPageViews: number;

  // 구매 완료율
  purchaseCompletionRate: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  purchaseCompletions: number;
}

// 6. 멤버십 관련 통계
export interface MembershipStatistics {
  // 멤버십 가입 버튼 클릭률
  membershipSubscribeClickRate: number;
  membershipPageViews: number;
  membershipSubscribeClicks: number;

  // 멤버십 결제 성공률
  membershipPaymentSuccessRate: number;
  membershipSuccessfulPurchases: number;

  // 멤버십 결제 실패율
  membershipPaymentErrorRate: number;
  membershipPaymentAbandonmentRate: number;
  membershipPurchaseFailures: number;

  // 멤버십 해지율
  membershipUnsubscribeRate: number;
  membershipUnsubscribes: number;

  // 멤버십 유저 비율
  membershipUserRatio: number;
  totalUsers: number;
  membershipUsers: number;

  // 멤버십 재결제 유저 비율
  repeatMembershipUserRatio: number;
  repeatMembershipUsers: number;

  // 멤버십 유지율
  membershipRetentionRate: number;
  currentMonthRenewalUsers: number;
  previousMonthPurchases: number;
}

// 7. 매니저 Q&A 관련 통계
export interface ManagerQAStatistics {
  // 매니저 질문하기 응답 확인율
  managerResponseConfirmationRate: number;
  managerResponses: number;
  responseConfirmationPageViews: number;
}

// 통합 통계 타입
export interface AllStatistics {
  user: UserStatistics;
  home: HomeStatistics;
  search: SearchStatistics;
  linkSearch: LinkSearchStatistics;
  productDetail: ProductDetailStatistics;
  membership: MembershipStatistics;
  managerQA: ManagerQAStatistics;
}

// 통계 조회 파라미터
export interface StatisticsQueryParams {
  dateRange?: DateRange;
  category?: string;
  buttonName?: string;
}

// 날짜별 통계 데이터
export interface DailyStatistics {
  date: string;
  data: AllStatistics;
}

// 기간별 통계 데이터
export interface PeriodStatistics {
  period: string; // '2024-01-01' 또는 '2024-01' 또는 '2024-W01'
  data: AllStatistics;
}

// 통계 조회 결과 (단일 날짜)
export interface StatisticsResult<T = AllStatistics> {
  success: boolean;
  data: T;
  message?: string;
  queryParams: StatisticsQueryParams;
}

// 통계 조회 결과 (기간별)
export interface PeriodStatisticsResult {
  success: boolean;
  data: PeriodStatistics[];
  message?: string;
  queryParams: StatisticsQueryParams;
}

// 통계 조회 옵션
export interface StatisticsOptions {
  // 특정 날짜의 지표 (예: 2024-01-15)
  targetDate?: string;

  // 기간별 추이 (예: 2024-01-15 기준으로 7일간)
  endDate?: string;
  periodDays?: number; // 7, 14, 30 등

  // 직접 날짜 범위 지정
  startDate?: string;

  // 세부 옵션
  category?: string;
  buttonName?: string;
}
