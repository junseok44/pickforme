import { bigqueryClient } from '../bigquery/bigquery-client';
import { log } from '../../../utils/logger/logger';
import { cacheProvider } from '../../../cache';
import { cacheKey } from '../../../constants/cacheKey';

// 캐시 TTL을 한 곳에서 관리
const CACHE_TTL_MS = 1000 * 60 * 60; // 1시간

export class StatisticsService {
  private readonly DATASET_ID = process.env.GA4_DATASET_SUMMARY_ID;

  private readonly FOUNDATION_DATASET_ID = process.env.GA4_DATASET_FOUNDATION_ID;

  /**
   * 단일 아이템의 비율 데이터를 퍼센트로 변환
   */
  private convertSingleItemRates(item: any): any {
    if (!item || typeof item !== 'object') return item;

    // const converted = { ...item };
    const converted = JSON.parse(JSON.stringify(item));

    // 비율 필드들을 퍼센트로 변환 (소수점 2자리까지)
    const rateFields = [
      'signupConversionRate',
      'loginSuccessRate',
      'loginFailureRate',
      'firstVisitorConversionRate',
      'recommendedProductClickRate',
      'searchSuccessRate',
      'searchFailureRate',
      'searchRecommendationClickRate',
      'linkSearchSuccessRate',
      'purchaseButtonClickRate',
      'purchaseCompletionRate',
      'membershipSubscribeClickRate',
      'membershipPaymentSuccessRate',
      'membershipPaymentErrorRate',
      'membershipPaymentAbandonmentRate',
      'membershipUnsubscribeRate',
      'membershipUserRatio',
      'repeatMembershipUserRatio',
      'membershipRetentionRate',
      'managerResponseConfirmationRate',
    ];

    rateFields.forEach((field) => {
      if (converted[field] !== undefined && converted[field] !== null) {
        converted[field] = Math.round(converted[field] * 10000) / 100; // 소수점 2자리까지
      }
    });

    // 중첩된 객체들도 처리
    if (converted.buttonClickRates && typeof converted.buttonClickRates === 'object') {
      Object.keys(converted.buttonClickRates).forEach((key) => {
        if (converted.buttonClickRates[key].clickRate !== undefined) {
          converted.buttonClickRates[key].clickRate =
            Math.round(converted.buttonClickRates[key].clickRate * 10000) / 100;
        }
      });
    }

    if (converted.categoryClickRates && typeof converted.categoryClickRates === 'object') {
      Object.keys(converted.categoryClickRates).forEach((key) => {
        if (converted.categoryClickRates[key].clickRate !== undefined) {
          converted.categoryClickRates[key].clickRate =
            Math.round(converted.categoryClickRates[key].clickRate * 10000) / 100;
        }
      });
    }

    if (converted.socialLoginStats && typeof converted.socialLoginStats === 'object') {
      // socialLoginStats는 카운트이므로 변환하지 않음
    }

    if (converted.ttfa && typeof converted.ttfa === 'object') {
      // ttfa는 시간이므로 변환하지 않음
    }

    // tabContentProcess 내부의 successRate 변환
    if (converted.tabContentProcess && typeof converted.tabContentProcess === 'object') {
      Object.keys(converted.tabContentProcess).forEach((tab) => {
        if (
          converted.tabContentProcess[tab] &&
          typeof converted.tabContentProcess[tab] === 'object'
        ) {
          if (converted.tabContentProcess[tab].successRate !== undefined) {
            converted.tabContentProcess[tab].successRate =
              Math.round(converted.tabContentProcess[tab].successRate * 10000) / 100;
          }
        }
      });
    }

    return converted;
  }

  async getAllStatistics(startDate: string, endDate: string) {
    const data = await this.getAllStatisticsInternal(startDate, endDate);

    // 전체 통계 데이터에 비율 변환 적용
    const convertedData = data.map((item) => ({
      ...item,
    }));

    return {
      success: true,
      data: convertedData,
      queryParams: {
        startDate,
        endDate,
      },
      message: '통계 조회 성공',
    };
  }

  private async getAllStatisticsInternal(startDate: string, endDate: string) {
    try {
      // 캐시를 활용하기 위해 공개 메서드들을 호출하되, 원본 데이터만 가져오기
      const [
        allStatistics,
        homeStatistics,
        searchStatistics,
        linkSearchStatistics,
        productDetailStatistics,
        membershipStatistics,
        managerQAStatistics,
      ] = await Promise.all([
        this.getUserStatistics(startDate, endDate),
        this.getHomeStatistics(startDate, endDate),
        this.getSearchStatistics(startDate, endDate),
        this.getLinkSearchStatistics(startDate, endDate),
        this.getProductDetailStatistics(startDate, endDate),
        this.getMembershipStatistics(startDate, endDate),
        this.getManagerQAStatistics(startDate, endDate),
      ]);

      // 모든 통계를 하나의 배열로 합치기
      const allData = [
        ...allStatistics,
        ...homeStatistics,
        ...searchStatistics,
        ...linkSearchStatistics,
        ...productDetailStatistics,
        ...membershipStatistics,
        ...managerQAStatistics,
      ];

      // 날짜별로 그룹화
      const groupedByDate = new Map<
        string,
        {
          user: any;
          home: any;
          search: any;
          linkSearch: any;
          productDetail: any;
          membership: any;
          managerQA: any;
        }
      >();

      allData.forEach((item: any) => {
        const date = item.date;
        if (!groupedByDate.has(date)) {
          groupedByDate.set(date, {
            user: {},
            home: {},
            search: {},
            linkSearch: {},
            productDetail: {},
            membership: {},
            managerQA: {},
          });
        }

        const dateData = groupedByDate.get(date);

        // 각 통계 타입별로 데이터 분류
        if (item.signupConversionRate !== undefined) {
          // 사용자 통계
          Object.assign(dateData?.user, item);
        } else if (item.recommendedProductClickRate !== undefined) {
          // 홈 통계
          Object.assign(dateData?.home, item);
        } else if (
          item.searchSuccessRate !== undefined &&
          item.linkSearchSuccessRate === undefined
        ) {
          // 검색 통계 (링크 검색이 아닌 경우)
          Object.assign(dateData?.search, item);
        } else if (
          item.linkSearchSuccessRate !== undefined &&
          item.buttonClickRates === undefined
        ) {
          // 링크 검색 통계
          Object.assign(dateData?.linkSearch, item);
        } else if (item.buttonClickRates !== undefined) {
          // 상품 상세 통계
          Object.assign(dateData?.productDetail, item);
        } else if (item.membershipSubscribeClickRate !== undefined) {
          // 멤버십 통계
          Object.assign(dateData?.membership, item);
        } else if (item.managerResponseConfirmationRate !== undefined) {
          // 매니저 Q&A 통계
          Object.assign(dateData?.managerQA, item);
        }
      });

      // 날짜 순으로 정렬된 배열로 변환
      const sortedDates = Array.from(groupedByDate.keys()).sort();

      return sortedDates.map((date) => ({
        period: date,
        data: groupedByDate.get(date),
      }));
    } catch (error) {
      void log.error('전체 통계 조회 실패', 'ANALYTICS', 'HIGH', { error, startDate, endDate });
      return [];
    }
  }

  /**
   * BigQuery 쿼리 실행 헬퍼 메서드
   */
  private async executeQuery(query: string, params: { [key: string]: any } = {}) {
    try {
      const options = {
        query,
        params,
        location: 'asia-northeast3',
      };

      const [job] = await bigqueryClient.createQueryJob(options);
      const [rows] = await job.getQueryResults();

      return rows;
    } catch (error) {
      void log.error('BigQuery 쿼리 실행 실패', 'ANALYTICS', 'HIGH', { error, query, params });
      throw error;
    }
  }

  /**
   * 특정 날짜 범위의 통계 캐시 무효화
   */
  clearStatisticsCache(startDate: string, endDate: string) {
    const keys = [
      cacheKey.analytics.userStatistics(startDate, endDate),
      cacheKey.analytics.homeStatistics(startDate, endDate),
      cacheKey.analytics.searchStatistics(startDate, endDate),
      cacheKey.analytics.linkSearchStatistics(startDate, endDate),
      cacheKey.analytics.productDetailStatistics(startDate, endDate),
      cacheKey.analytics.membershipStatistics(startDate, endDate),
      cacheKey.analytics.managerQAStatistics(startDate, endDate),
    ];

    keys.forEach((key) => cacheProvider.delete(key));
    void log.info('통계 캐시 무효화 완료', 'ANALYTICS', 'LOW', {
      startDate,
      endDate,
      clearedKeys: keys.length,
    });
  }

  /**
   * 모든 통계 캐시 무효화
   */
  clearAllStatisticsCache() {
    cacheProvider.clear();
    void log.info('모든 통계 캐시 무효화 완료', 'ANALYTICS', 'LOW');
  }

  /**
   * 사용자 관련 통계 조회 (공개 메서드)
   */
  async getUserStatistics(startDate: string, endDate: string) {
    const cacheKeyStr = cacheKey.analytics.userStatistics(startDate, endDate);

    // 캐시에서 데이터 조회
    const cachedData = cacheProvider.get<any[]>(cacheKeyStr);

    if (cachedData) {
      return cachedData.map((item) => this.convertSingleItemRates(item));
    }

    // 캐시에 없으면 DB에서 조회
    const data = await this.getUserStatisticsInternal(startDate, endDate);

    // 캐시에 저장 (1시간 TTL)
    cacheProvider.set(cacheKeyStr, data, CACHE_TTL_MS);

    return data.map((item) => this.convertSingleItemRates(item));
  }

  /**
   * 사용자 관련 통계 조회 (내부 메서드)
   */
  private async getUserStatisticsInternal(startDate: string, endDate: string) {
    try {
      // 통합된 로그인/회원가입 메트릭 조회
      const loginQuery = `
        SELECT
          summary_date,
          login_attempt_count,
          login_success_count,
          kakao_login_attempt_count,
          google_login_attempt_count,
          apple_login_attempt_count,
          signup_page_pv,
          register_success_count
        FROM \`${this.DATASET_ID}.daily_login_metrics\`
        WHERE summary_date BETWEEN @start_date AND @end_date
        ORDER BY summary_date
      `;

      const loginParams = {
        start_date: startDate,
        end_date: endDate,
      };

      const loginData = await this.executeQuery(loginQuery, loginParams);

      // 날짜별로 데이터 매핑
      const loginMap = new Map();
      loginData.forEach((row: any) => {
        const dateStr = row.summary_date?.value || row.summary_date;
        loginMap.set(dateStr, {
          login_attempt_count: row.login_attempt_count || 0,
          login_success_count: row.login_success_count || 0,
          kakao_login_attempt_count: row.kakao_login_attempt_count || 0,
          google_login_attempt_count: row.google_login_attempt_count || 0,
          apple_login_attempt_count: row.apple_login_attempt_count || 0,
          signup_page_pv: row.signup_page_pv || 0,
          register_success_count: row.register_success_count || 0,
        });
      });

      // TTFA 조회
      const ttfaQuery = `
        SELECT
          summary_date,
          total_sessions_with_first_action,
          avg_ttfa_seconds
        FROM \`${this.DATASET_ID}.daily_ttfa_metrics\`
        WHERE summary_date BETWEEN @start_date AND @end_date
        ORDER BY summary_date
      `;

      const ttfaData = await this.executeQuery(ttfaQuery, loginParams);

      // 날짜별로 데이터 매핑
      const ttfaMap = new Map();
      ttfaData.forEach((row: any) => {
        const dateStr = row.summary_date?.value || row.summary_date;
        ttfaMap.set(dateStr, {
          total_sessions_with_first_action: row.total_sessions_with_first_action || 0,
          avg_ttfa_seconds: row.avg_ttfa_seconds || 0,
        });
      });

      // 첫 방문자 전환율 조회
      const firstVisitorQuery = `
        SELECT
          summary_date,
          new_users_count,
          converted_within_24h_count
        FROM \`${this.DATASET_ID}.daily_first_visitor_conversion_metrics\`
        WHERE summary_date BETWEEN @start_date AND @end_date
        ORDER BY summary_date
      `;

      const firstVisitorData = await this.executeQuery(firstVisitorQuery, loginParams);

      // 날짜별로 데이터 매핑
      const firstVisitorMap = new Map();
      firstVisitorData.forEach((row: any) => {
        const dateStr = row.summary_date?.value || row.summary_date;
        firstVisitorMap.set(dateStr, {
          new_users_count: row.new_users_count || 0,
          converted_within_24h_count: row.converted_within_24h_count || 0,
        });
      });

      // 날짜 범위 생성
      const dateRange: string[] = [];
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        dateRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      // 날짜별 배열 반환
      return dateRange.map((date) => {
        const login = loginMap.get(date) || {
          login_attempt_count: 0,
          login_success_count: 0,
          kakao_login_attempt_count: 0,
          google_login_attempt_count: 0,
          apple_login_attempt_count: 0,
          signup_page_pv: 0,
          register_success_count: 0,
        };
        const ttfa = ttfaMap.get(date) || {
          total_sessions_with_first_action: 0,
          avg_ttfa_seconds: 0,
        };
        const firstVisitor = firstVisitorMap.get(date) || {
          new_users_count: 0,
          converted_within_24h_count: 0,
        };

        // 전환율 계산
        const signupConversionRate =
          login.signup_page_pv > 0 ? login.register_success_count / login.signup_page_pv : 0;
        const loginSuccessRate =
          login.login_attempt_count > 0 ? login.login_success_count / login.login_attempt_count : 0;
        const loginFailureRate =
          login.login_attempt_count > 0
            ? (login.login_attempt_count - login.login_success_count) / login.login_attempt_count
            : 0;
        const firstVisitorConversionRate =
          firstVisitor.new_users_count > 0
            ? firstVisitor.converted_within_24h_count / firstVisitor.new_users_count
            : 0;

        return {
          date,
          signupConversionRate,
          signupPageViews: login.signup_page_pv,
          signupCompletions: login.register_success_count,
          loginSuccessRate,
          loginFailureRate,
          loginAttempts: login.login_attempt_count,
          loginSuccesses: login.login_success_count,
          loginFailures: login.login_attempt_count - login.login_success_count,
          socialLoginStats: {
            google: login.google_login_attempt_count,
            apple: login.apple_login_attempt_count,
            kakao: login.kakao_login_attempt_count,
          },
          ttfa: {
            averageTime: ttfa.avg_ttfa_seconds,
            medianTime: 0, // TODO: 중간값은 별도 계산 필요
          },
          firstVisitorConversionRate,
          firstVisitors: firstVisitor.new_users_count,
          firstVisitorDetailViews: firstVisitor.converted_within_24h_count,
        };
      });
    } catch (error) {
      void log.error('사용자 통계 조회 실패', 'ANALYTICS', 'HIGH', { error, startDate, endDate });
      return [];
    }
  }

  /**
   * 홈화면 관련 통계 조회 (공개 메서드)
   */
  async getHomeStatistics(startDate: string, endDate: string) {
    const cacheKeyStr = cacheKey.analytics.homeStatistics(startDate, endDate);

    // 캐시에서 데이터 조회
    const cachedData = cacheProvider.get<any[]>(cacheKeyStr);

    if (cachedData) {
      return cachedData.map((item) => this.convertSingleItemRates(item));
    }

    // 캐시에 없으면 DB에서 조회
    const data = await this.getHomeStatisticsInternal(startDate, endDate);

    // 캐시에 저장 (1시간 TTL)
    cacheProvider.set(cacheKeyStr, data, CACHE_TTL_MS);

    return data.map((item) => this.convertSingleItemRates(item));
  }

  /**
   * 홈화면 관련 통계 조회 (내부 메서드)
   */
  private async getHomeStatisticsInternal(startDate: string, endDate: string) {
    try {
      // 홈화면 기본 메트릭 조회
      const homeMetricsQuery = `
        SELECT
          summary_date,
          home_pv,
          recommended_item_click_count
        FROM \`${this.DATASET_ID}.daily_home_metrics\`
        WHERE summary_date BETWEEN @start_date AND @end_date
        ORDER BY summary_date
      `;

      const homeParams = {
        start_date: startDate,
        end_date: endDate,
      };

      const homeMetrics = await this.executeQuery(homeMetricsQuery, homeParams);

      // 날짜별로 데이터 매핑
      const homeMap = new Map();
      homeMetrics.forEach((row: any) => {
        const dateStr = row.summary_date?.value || row.summary_date;
        homeMap.set(dateStr, {
          home_pv: row.home_pv || 0,
          recommended_item_click_count: row.recommended_item_click_count || 0,
        });
      });

      // 카테고리별 클릭률 조회
      const categoryClickQuery = `
        SELECT
          summary_date,
          category,
          click_count,
          category_ctr
        FROM \`${this.DATASET_ID}.daily_home_category_click_metrics\`
        WHERE summary_date BETWEEN @start_date AND @end_date
        ORDER BY summary_date, click_count DESC
      `;

      const categoryData = await this.executeQuery(categoryClickQuery, homeParams);

      // 날짜별 카테고리 클릭률 매핑
      const categoryMap = new Map();
      categoryData.forEach((row: any) => {
        const dateStr = row.summary_date?.value || row.summary_date;
        if (!categoryMap.has(dateStr)) {
          categoryMap.set(dateStr, {});
        }
        const dateCategories = categoryMap.get(dateStr);
        dateCategories[row.category] = {
          clickRate: row.category_ctr || 0,
          clicks: row.click_count || 0,
          pageViews: homeMap.get(dateStr)?.home_pv || 0,
        };
      });

      // 날짜 범위 생성
      const dateRange: string[] = [];
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        dateRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      // 날짜별 배열 반환
      return dateRange.map((date) => {
        const homeData = homeMap.get(date) || { home_pv: 0, recommended_item_click_count: 0 };
        const categoryClickRates = categoryMap.get(date) || {};

        const recommendedProductClickRate =
          homeData.home_pv > 0 ? homeData.recommended_item_click_count / homeData.home_pv : 0;

        return {
          date,
          recommendedProductClickRate,
          homePageViews: homeData.home_pv,
          recommendedProductClicks: homeData.recommended_item_click_count,
          categoryClickRates,
        };
      });
    } catch (error) {
      void log.error('홈화면 통계 조회 실패', 'ANALYTICS', 'HIGH', { error, startDate, endDate });
      return [];
    }
  }

  /**
   * 검색 관련 통계 조회 (공개 메서드)
   */
  async getSearchStatistics(startDate: string, endDate: string) {
    const cacheKeyStr = cacheKey.analytics.searchStatistics(startDate, endDate);

    // 캐시에서 데이터 조회
    const cachedData = cacheProvider.get<any[]>(cacheKeyStr);
    if (cachedData) {
      return cachedData.map((item) => this.convertSingleItemRates(item));
    }

    // 캐시에 없으면 DB에서 조회
    const data = await this.getSearchStatisticsInternal(startDate, endDate);

    // 캐시에 저장 (1시간 TTL)
    cacheProvider.set(cacheKeyStr, data, CACHE_TTL_MS);

    return data.map((item) => this.convertSingleItemRates(item));
  }

  /**
   * 검색 관련 통계 조회 (내부 메서드)
   */
  private async getSearchStatisticsInternal(startDate: string, endDate: string) {
    try {
      // 검색 기본 메트릭 조회
      const searchMetricsQuery = `
        SELECT
          summary_date,
          keyword_search_submit_count,
          keyword_search_success_count,
          keyword_search_failure_count,
          search_item_click_count,
          search_result_pv
        FROM \`${this.DATASET_ID}.daily_search_metrics\`
        WHERE summary_date BETWEEN @start_date AND @end_date
        ORDER BY summary_date
      `;

      const searchMetrics = await this.executeQuery(searchMetricsQuery, {
        start_date: startDate,
        end_date: endDate,
      });

      // 날짜별로 데이터 매핑
      const searchMap = new Map();
      searchMetrics.forEach((row: any) => {
        const dateStr = row.summary_date?.value || row.summary_date;
        searchMap.set(dateStr, {
          keyword_search_submit_count: row.keyword_search_submit_count || 0,
          keyword_search_success_count: row.keyword_search_success_count || 0,
          keyword_search_failure_count: row.keyword_search_failure_count || 0,
          search_item_click_count: row.search_item_click_count || 0,
          search_result_pv: row.search_result_pv || 0,
        });
      });

      // 날짜 범위 생성
      const dateRange: string[] = [];
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        dateRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      // 날짜별 배열 반환
      return dateRange.map((date) => {
        const searchData = searchMap.get(date) || {
          keyword_search_submit_count: 0,
          keyword_search_success_count: 0,
          keyword_search_failure_count: 0,
          search_item_click_count: 0,
          search_result_pv: 0,
        };

        // 성공률/실패률 계산
        const searchSuccessRate =
          searchData.keyword_search_submit_count > 0
            ? searchData.keyword_search_success_count / searchData.keyword_search_submit_count
            : 0;
        const searchFailureRate =
          searchData.keyword_search_submit_count > 0
            ? searchData.keyword_search_failure_count / searchData.keyword_search_submit_count
            : 0;
        const searchRecommendationClickRate =
          searchData.search_result_pv > 0
            ? searchData.search_item_click_count / searchData.search_result_pv
            : 0;

        return {
          date,
          searchSuccessRate,
          searchFailureRate,
          searchAttempts: searchData.keyword_search_submit_count,
          searchSuccesses: searchData.keyword_search_success_count,
          searchFailures: searchData.keyword_search_failure_count,
          searchRecommendationClickRate,
          searchResultPageViews: searchData.search_result_pv,
          searchRecommendationClicks: searchData.search_item_click_count,
        };
      });
    } catch (error) {
      void log.error('검색 통계 조회 실패', 'ANALYTICS', 'HIGH', { error, startDate, endDate });
      return [];
    }
  }

  /**
   * 링크 검색 관련 통계 조회 (공개 메서드)
   */
  async getLinkSearchStatistics(startDate: string, endDate: string) {
    const cacheKeyStr = cacheKey.analytics.linkSearchStatistics(startDate, endDate);

    // 캐시에서 데이터 조회
    const cachedData = cacheProvider.get<any[]>(cacheKeyStr);
    if (cachedData) {
      return cachedData.map((item) => this.convertSingleItemRates(item));
    }

    // 캐시에 없으면 DB에서 조회
    const data = await this.getLinkSearchStatisticsInternal(startDate, endDate);

    // 캐시에 저장 (1시간 TTL)
    cacheProvider.set(cacheKeyStr, data, CACHE_TTL_MS);

    return data.map((item) => this.convertSingleItemRates(item));
  }

  /**
   * 링크 검색 관련 통계 조회 (내부 메서드)
   */
  private async getLinkSearchStatisticsInternal(startDate: string, endDate: string) {
    try {
      const linkSearchQuery = `
        SELECT
          summary_date,
          link_search_attempt_count,
          link_search_success_count
        FROM \`${this.DATASET_ID}.daily_link_search_metrics\`
        WHERE summary_date BETWEEN @start_date AND @end_date
        ORDER BY summary_date
      `;

      const linkSearchData = await this.executeQuery(linkSearchQuery, {
        start_date: startDate,
        end_date: endDate,
      });

      // 날짜별로 데이터 매핑
      const linkSearchMap = new Map();
      linkSearchData.forEach((row: any) => {
        const dateStr = row.summary_date?.value || row.summary_date;
        linkSearchMap.set(dateStr, {
          link_search_attempt_count: row.link_search_attempt_count || 0,
          link_search_success_count: row.link_search_success_count || 0,
        });
      });

      // 날짜 범위 생성
      const dateRange: string[] = [];
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        dateRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      // 날짜별 배열 반환
      return dateRange.map((date) => {
        const data = linkSearchMap.get(date) || {
          link_search_attempt_count: 0,
          link_search_success_count: 0,
        };

        // 성공률 계산
        const linkSearchSuccessRate =
          data.link_search_attempt_count > 0
            ? data.link_search_success_count / data.link_search_attempt_count
            : 0;

        return {
          date,
          linkSearchSuccessRate,
          linkSearchAttempts: data.link_search_attempt_count,
          linkSearchSuccesses: data.link_search_success_count,
        };
      });
    } catch (error) {
      void log.error('링크 검색 통계 조회 실패', 'ANALYTICS', 'HIGH', {
        error,
        startDate,
        endDate,
      });
      return [];
    }
  }

  /**
   * 상품 상세 관련 통계 조회 (공개 메서드)
   */
  async getProductDetailStatistics(startDate: string, endDate: string) {
    const cacheKeyStr = cacheKey.analytics.productDetailStatistics(startDate, endDate);

    // 캐시에서 데이터 조회
    const cachedData = cacheProvider.get<any[]>(cacheKeyStr);
    if (cachedData) {
      return cachedData.map((item) => this.convertSingleItemRates(item));
    }

    // 캐시에 없으면 DB에서 조회
    const data = await this.getProductDetailStatisticsInternal(startDate, endDate);

    // 캐시에 저장 (1시간 TTL)
    cacheProvider.set(cacheKeyStr, data, CACHE_TTL_MS);

    return data.map((item) => this.convertSingleItemRates(item));
  }

  /**
   * 상품 상세 관련 통계 조회 (내부 메서드)
   */
  private async getProductDetailStatisticsInternal(startDate: string, endDate: string) {
    try {
      // 상품 상세 페이지 메트릭 조회
      const pdpQuery = `
        SELECT
          summary_date,
          pdp_pv,
          buy_button_click_count,
          wishlist_button_click_count,
          caption_tab_click_count,
          report_tab_click_count,
          review_tab_click_count,
          caption_success_count,
          caption_failed_count,
          caption_avg_duration_ms,
          report_success_count,
          report_failed_count,
          report_avg_duration_ms,
          review_success_count,
          review_failed_count,
          review_avg_duration_ms
        FROM \`${this.DATASET_ID}.daily_pdp_metrics\`
        WHERE summary_date BETWEEN @start_date AND @end_date
        ORDER BY summary_date
      `;

      // 링크 검색 메트릭 조회
      const linkSearchQuery = `
        SELECT
          summary_date,
          link_search_attempt_count,
          link_search_success_count
        FROM \`${this.DATASET_ID}.daily_link_search_metrics\`
        WHERE summary_date BETWEEN @start_date AND @end_date
        ORDER BY summary_date
      `;

      const [pdpData, linkSearchData] = await Promise.all([
        this.executeQuery(pdpQuery, {
          start_date: startDate,
          end_date: endDate,
        }),
        this.executeQuery(linkSearchQuery, {
          start_date: startDate,
          end_date: endDate,
        }),
      ]);

      // 날짜별로 데이터 매핑
      const pdpMap = new Map();
      pdpData.forEach((row: any) => {
        const dateStr = row.summary_date?.value || row.summary_date;
        pdpMap.set(dateStr, {
          pdp_pv: row.pdp_pv || 0,
          buy_button_click_count: row.buy_button_click_count || 0,
          wishlist_button_click_count: row.wishlist_button_click_count || 0,
          caption_tab_click_count: row.caption_tab_click_count || 0,
          report_tab_click_count: row.report_tab_click_count || 0,
          review_tab_click_count: row.review_tab_click_count || 0,
          caption_success_count: row.caption_success_count || 0,
          caption_failed_count: row.caption_failed_count || 0,
          caption_avg_duration_ms: row.caption_avg_duration_ms || 0,
          report_success_count: row.report_success_count || 0,
          report_failed_count: row.report_failed_count || 0,
          report_avg_duration_ms: row.report_avg_duration_ms || 0,
          review_success_count: row.review_success_count || 0,
          review_failed_count: row.review_failed_count || 0,
          review_avg_duration_ms: row.review_avg_duration_ms || 0,
        });
      });

      // 링크 검색 데이터 매핑
      const linkSearchMap = new Map();
      linkSearchData.forEach((row: any) => {
        const dateStr = row.summary_date?.value || row.summary_date;
        linkSearchMap.set(dateStr, {
          link_search_attempt_count: row.link_search_attempt_count || 0,
          link_search_success_count: row.link_search_success_count || 0,
        });
      });

      // 날짜 범위 생성
      const dateRange: string[] = [];
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        dateRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      // 날짜별 배열 반환
      return dateRange.map((date) => {
        const pdp = pdpMap.get(date) || {
          pdp_pv: 0,
          buy_button_click_count: 0,
          wishlist_button_click_count: 0,
          caption_tab_click_count: 0,
          report_tab_click_count: 0,
          review_tab_click_count: 0,
          caption_success_count: 0,
          caption_failed_count: 0,
          caption_avg_duration_ms: 0,
          report_success_count: 0,
          report_failed_count: 0,
          report_avg_duration_ms: 0,
          review_success_count: 0,
          review_failed_count: 0,
          review_avg_duration_ms: 0,
        };

        const linkSearch = linkSearchMap.get(date) || {
          link_search_attempt_count: 0,
          link_search_success_count: 0,
        };

        // 버튼별 클릭률 계산
        const buttonClickRates: {
          [key: string]: { clickRate: number; clicks: number; pageViews: number };
        } = {};

        if (pdp.pdp_pv > 0) {
          buttonClickRates.buy_button = {
            clickRate: pdp.buy_button_click_count / pdp.pdp_pv,
            clicks: pdp.buy_button_click_count,
            pageViews: pdp.pdp_pv,
          };
          buttonClickRates.wishlist_button = {
            clickRate: pdp.wishlist_button_click_count / pdp.pdp_pv,
            clicks: pdp.wishlist_button_click_count,
            pageViews: pdp.pdp_pv,
          };
          buttonClickRates.caption_tab = {
            clickRate: pdp.caption_tab_click_count / pdp.pdp_pv,
            clicks: pdp.caption_tab_click_count,
            pageViews: pdp.pdp_pv,
          };
          buttonClickRates.report_tab = {
            clickRate: pdp.report_tab_click_count / pdp.pdp_pv,
            clicks: pdp.report_tab_click_count,
            pageViews: pdp.pdp_pv,
          };
          buttonClickRates.review_tab = {
            clickRate: pdp.review_tab_click_count / pdp.pdp_pv,
            clicks: pdp.review_tab_click_count,
            pageViews: pdp.pdp_pv,
          };
        }
        const purchaseButtonClickRate =
          pdp.pdp_pv > 0 ? pdp.buy_button_click_count / pdp.pdp_pv : 0;

        // 링크 검색 성공률 계산
        const linkSearchSuccessRate =
          linkSearch.link_search_attempt_count > 0
            ? linkSearch.link_search_success_count / linkSearch.link_search_attempt_count
            : 0;

        return {
          date,
          buttonClickRates,
          purchaseButtonClickRate,
          purchaseButtonClicks: pdp.buy_button_click_count,
          productDetailPageViews: pdp.pdp_pv,
          purchaseCompletionRate: 0, // TODO: 구매 완료율은 별도 테이블에서 조회 필요
          dailyActiveUsers: 0, // TODO: DAU는 별도 테이블에서 조회 필요
          weeklyActiveUsers: 0, // TODO: WAU는 별도 테이블에서 조회 필요
          monthlyActiveUsers: 0, // TODO: MAU는 별도 테이블에서 조회 필요
          purchaseCompletions: 0, // TODO: 구매 완료 수는 별도 테이블에서 조회 필요
          // 링크 검색 관련 데이터 추가
          linkSearchSuccessRate,
          linkSearchAttempts: linkSearch.link_search_attempt_count,
          linkSearchSuccesses: linkSearch.link_search_success_count,
          // 탭 콘텐츠 프로세스 관련 데이터 추가
          tabContentProcess: {
            caption: {
              successCount: pdp.caption_success_count,
              failedCount: pdp.caption_failed_count,
              avgDurationMs: pdp.caption_avg_duration_ms,
              successRate:
                pdp.caption_success_count + pdp.caption_failed_count > 0
                  ? pdp.caption_success_count /
                    (pdp.caption_success_count + pdp.caption_failed_count)
                  : 0,
            },
            report: {
              successCount: pdp.report_success_count,
              failedCount: pdp.report_failed_count,
              avgDurationMs: pdp.report_avg_duration_ms,
              successRate:
                pdp.report_success_count + pdp.report_failed_count > 0
                  ? pdp.report_success_count / (pdp.report_success_count + pdp.report_failed_count)
                  : 0,
            },
            review: {
              successCount: pdp.review_success_count,
              failedCount: pdp.review_failed_count,
              avgDurationMs: pdp.review_avg_duration_ms,
              successRate:
                pdp.review_success_count + pdp.review_failed_count > 0
                  ? pdp.review_success_count / (pdp.review_success_count + pdp.review_failed_count)
                  : 0,
            },
          },
        };
      });
    } catch (error) {
      void log.error('상품 상세 통계 조회 실패', 'ANALYTICS', 'HIGH', {
        error,
        startDate,
        endDate,
      });
      return [];
    }
  }

  /**
   * 멤버십 관련 통계 조회 (공개 메서드)
   */
  async getMembershipStatistics(startDate: string, endDate: string) {
    const cacheKeyStr = cacheKey.analytics.membershipStatistics(startDate, endDate);

    // 캐시에서 데이터 조회
    const cachedData = cacheProvider.get<any[]>(cacheKeyStr);
    if (cachedData) {
      return cachedData.map((item) => this.convertSingleItemRates(item));
    }

    // 캐시에 없으면 DB에서 조회
    const data = await this.getMembershipStatisticsInternal(startDate, endDate);

    // 캐시에 저장 (1시간 TTL)
    cacheProvider.set(cacheKeyStr, data, CACHE_TTL_MS);

    return data.map((item) => this.convertSingleItemRates(item));
  }

  /**
   * 멤버십 관련 통계 조회 (내부 메서드)
   */
  private async getMembershipStatisticsInternal(startDate: string, endDate: string) {
    try {
      // 멤버십 기본 메트릭 조회
      const membershipQuery = `
        SELECT
          date,
          membershipUserRatio,
          repeatMembershipUserRatio,
          membershipRetentionRate,
          totalUsers,
          membershipUsers,
          repeatMembershipUsers,
          currentMonthRenewalUsers,
          previousMonthMembershipPurchases
        FROM \`${this.DATASET_ID}.membership_metrics\`
        WHERE date BETWEEN @start_date AND @end_date
        ORDER BY date
      `;

      const membershipData = await this.executeQuery(membershipQuery, {
        start_date: startDate,
        end_date: endDate,
      });

      // 멤버십 퍼널 메트릭 조회
      const funnelQuery = `
        SELECT
          summary_date,
          subscription_page_pv,
          subscription_request_count,
          payment_success_count,
          payment_error_count,
          payment_cancelled_count,
          unsubscribe_count
        FROM \`${this.DATASET_ID}.daily_subscription_funnel_metrics\`
        WHERE summary_date BETWEEN @start_date AND @end_date
        ORDER BY summary_date
      `;

      const funnelData = await this.executeQuery(funnelQuery, {
        start_date: startDate,
        end_date: endDate,
      });

      // 날짜별로 데이터 매핑
      const membershipMap = new Map();
      membershipData.forEach((row: any) => {
        const dateStr = row.date?.value || row.date;
        membershipMap.set(dateStr, {
          membershipUserRatio: row.membershipUserRatio || 0,
          repeatMembershipUserRatio: row.repeatMembershipUserRatio || 0,
          membershipRetentionRate: row.membershipRetentionRate || 0,
          totalUsers: row.totalUsers || 0,
          membershipUsers: row.membershipUsers || 0,
          repeatMembershipUsers: row.repeatMembershipUsers || 0,
          currentMonthRenewalUsers: row.currentMonthRenewalUsers || 0,
          previousMonthMembershipPurchases: row.previousMonthMembershipPurchases || 0,
        });
      });

      const funnelMap = new Map();
      funnelData.forEach((row: any) => {
        const dateStr = row.summary_date?.value || row.summary_date;
        funnelMap.set(dateStr, {
          subscription_page_pv: row.subscription_page_pv || 0,
          subscription_request_count: row.subscription_request_count || 0,
          payment_success_count: row.payment_success_count || 0,
          payment_error_count: row.payment_error_count || 0,
          payment_cancelled_count: row.payment_cancelled_count || 0,
          unsubscribe_count: row.unsubscribe_count || 0,
        });
      });

      // 날짜 범위 생성
      const dateRange: string[] = [];
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        dateRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      // 날짜별 배열 반환
      return dateRange.map((date) => {
        const data = membershipMap.get(date) || {
          membershipUserRatio: 0,
          repeatMembershipUserRatio: 0,
          membershipRetentionRate: 0,
          totalUsers: 0,
          membershipUsers: 0,
          repeatMembershipUsers: 0,
          currentMonthRenewalUsers: 0,
          previousMonthMembershipPurchases: 0,
        };

        const funnel = funnelMap.get(date) || {
          subscription_page_pv: 0,
          subscription_request_count: 0,
          payment_success_count: 0,
          payment_error_count: 0,
          payment_cancelled_count: 0,
          unsubscribe_count: 0,
        };

        // 클릭률 및 성공률 계산
        const membershipSubscribeClickRate =
          funnel.subscription_page_pv > 0
            ? funnel.subscription_request_count / funnel.subscription_page_pv
            : 0;
        const membershipPaymentSuccessRate =
          funnel.subscription_request_count > 0
            ? funnel.payment_success_count / funnel.subscription_request_count
            : 0;
        const membershipPaymentErrorRate =
          funnel.subscription_request_count > 0
            ? funnel.payment_error_count / funnel.subscription_request_count
            : 0;
        const membershipPaymentAbandonmentRate =
          funnel.subscription_request_count > 0
            ? funnel.payment_cancelled_count / funnel.subscription_request_count
            : 0;
        const membershipUnsubscribeRate =
          data.membershipUsers > 0 ? funnel.unsubscribe_count / data.membershipUsers : 0;

        return {
          date,
          membershipSubscribeClickRate,
          membershipPageViews: funnel.subscription_page_pv,
          membershipSubscribeClicks: funnel.subscription_request_count,
          membershipPaymentSuccessRate,
          membershipSuccessfulPurchases: funnel.payment_success_count,
          membershipPaymentErrorRate,
          membershipPaymentAbandonmentRate,
          membershipPurchaseFailures: funnel.payment_error_count,
          membershipUnsubscribeRate,
          membershipUnsubscribes: funnel.unsubscribe_count,
          membershipUserRatio: data.membershipUserRatio,
          totalUsers: data.totalUsers,
          membershipUsers: data.membershipUsers,
          repeatMembershipUserRatio: data.repeatMembershipUserRatio,
          repeatMembershipUsers: data.repeatMembershipUsers,
          membershipRetentionRate: data.membershipRetentionRate,
          currentMonthRenewalUsers: data.currentMonthRenewalUsers,
          previousMonthPurchases: data.previousMonthMembershipPurchases,
        };
      });
    } catch (error) {
      void log.error('멤버십 통계 조회 실패', 'ANALYTICS', 'HIGH', {
        error,
        startDate,
        endDate,
      });
      return [];
    }
  }

  /**
   * 매니저 Q&A 관련 통계 조회 (공개 메서드)
   */
  async getManagerQAStatistics(startDate: string, endDate: string) {
    const cacheKeyStr = cacheKey.analytics.managerQAStatistics(startDate, endDate);

    // 캐시에서 데이터 조회
    const cachedData = cacheProvider.get<any[]>(cacheKeyStr);
    if (cachedData) {
      return cachedData.map((item) => this.convertSingleItemRates(item));
    }

    // 캐시에 없으면 DB에서 조회
    const data = await this.getManagerQAStatisticsInternal(startDate, endDate);

    // 캐시에 저장 (1시간 TTL)
    cacheProvider.set(cacheKeyStr, data, CACHE_TTL_MS);

    return data.map((item) => this.convertSingleItemRates(item));
  }

  /**
   * 활성 유저 목록 조회 (공개 메서드)
   */
  async getActiveUsers(date: string) {
    try {
      const query = `
        SELECT 
          user_unique_id,
          total_events,
          first_event_time,
          last_event_time
        FROM \`${this.FOUNDATION_DATASET_ID}.daily_active_unique_ids\`
        WHERE 
          summary_date = DATE(@target_date)
        ORDER BY total_events DESC
      `;

      const data = await this.executeQuery(query, {
        target_date: date,
      });

      return {
        success: true,
        data: data.map((row: any) => ({
          user_unique_id: row.user_unique_id,
          total_events: row.total_events,
          first_event_time: row.first_event_time?.value || row.first_event_time,
          last_event_time: row.last_event_time?.value || row.last_event_time,
        })),
        queryParams: { date },
        message: '활성 유저 목록 조회 성공',
      };
    } catch (error) {
      void log.error('활성 유저 목록 조회 실패', 'ANALYTICS', 'HIGH', { error, date });
      return { success: false, data: [], message: '활성 유저 목록 조회 실패' };
    }
  }

  /**
   * 특정 유저의 이벤트 상세 조회 (공개 메서드)
   */
  async getUserEventDetails(userUniqueId: string, date: string) {
    try {
      const query = `
        SELECT 
          user_pseudo_id as user_unique_id,
          event_name,
          event_timestamp,
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'category') as category,
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'keyword') as search_query,
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'session_id') as session_id,
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'tab') as tab,
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'type') as type,
          COALESCE((SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'firebase_screen'), (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'firebase_screen_class'), (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'screen')) as screen
        FROM \`${process.env.BIGQUERY_PROJECT_ID}.${process.env.GA4_DATASET_RAW_ID}.events_*\`
        WHERE 
          event_date = FORMAT_DATE('%Y%m%d', @target_date)
          AND user_pseudo_id = @user_unique_id
          AND (
            (event_name = 'keyword_search_result' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'status') = 'started')
            OR (event_name = 'screen_view' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'firebase_screen') IS NOT NULL)
            OR event_name = 'link_search_attempt'  
            OR event_name = 'search_item_click'
            OR event_name = 'home_item_click'
            OR event_name = 'tab_click'
            OR event_name = 'question_send'
            OR event_name = 'manager_answer_push_click'
            OR event_name = 'product_detail_buy_click'
          )
        ORDER BY event_timestamp ASC
      `;

      const data = await this.executeQuery(query, {
        target_date: date,
        user_unique_id: userUniqueId,
      });

      return {
        success: true,
        data: data.map((row: any) => ({
          user_unique_id: row.user_unique_id,
          event_name: row.event_name,
          event_timestamp: row.event_timestamp,
          category: row.category,
          search_query: row.search_query,
          session_id: row.session_id,
          screen: row.screen,
          tab: row.tab,
          type: row.type,
        })),
        queryParams: { userUniqueId, date },
        message: '유저 이벤트 상세 조회 성공',
      };
    } catch (error) {
      void log.error('유저 이벤트 상세 조회 실패', 'ANALYTICS', 'HIGH', {
        error,
        userUniqueId,
        date,
      });
      return { success: false, data: [], message: '유저 이벤트 상세 조회 실패' };
    }
  }

  /**
   * 매니저 Q&A 관련 통계 조회 (내부 메서드)
   */
  private async getManagerQAStatisticsInternal(startDate: string, endDate: string) {
    try {
      const managerQAQuery = `
        SELECT
          summary_date,
          manager_response_count,
          manager_answer_push_click_count
        FROM \`${this.DATASET_ID}.daily_manager_qa_metrics\`
        WHERE summary_date BETWEEN @start_date AND @end_date
        ORDER BY summary_date
      `;

      const managerQAData = await this.executeQuery(managerQAQuery, {
        start_date: startDate,
        end_date: endDate,
      });

      // 날짜별로 데이터 매핑
      const managerQAMap = new Map();
      managerQAData.forEach((row: any) => {
        const dateStr = row.summary_date?.value || row.summary_date;
        managerQAMap.set(dateStr, {
          manager_response_count: row.manager_response_count || 0,
          manager_answer_push_click_count: row.manager_answer_push_click_count || 0,
        });
      });

      // 날짜 범위 생성
      const dateRange: string[] = [];
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        dateRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      // 날짜별 배열 반환
      return dateRange.map((date) => {
        const data = managerQAMap.get(date) || {
          manager_response_count: 0,
          manager_answer_push_click_count: 0,
        };

        // 매니저 응답 확인률 계산
        const managerResponseConfirmationRate =
          data.manager_response_count > 0
            ? data.manager_answer_push_click_count / data.manager_response_count
            : 0;

        return {
          date,
          managerResponseConfirmationRate,
          managerResponses: data.manager_response_count,
          responseConfirmationPageViews: data.manager_answer_push_click_count,
        };
      });
    } catch (error) {
      void log.error('매니저 Q&A 통계 조회 실패', 'ANALYTICS', 'HIGH', {
        error,
        startDate,
        endDate,
      });
      return [];
    }
  }
}
export const statisticsService = new StatisticsService();
