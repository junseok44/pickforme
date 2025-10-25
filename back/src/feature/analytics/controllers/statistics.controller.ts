import { Context } from 'koa';
import { statisticsService } from '../services/statistics.service';
import { StatisticsOptions } from '../types/statistics.types';
import { log } from '../../../utils/logger/logger';

export class StatisticsController {
  /**
   * 통계 조회 (단일 날짜 또는 기간별)
   * GET /analytics/statistics?targetDate=2024-01-15 (단일 날짜)
   * GET /analytics/statistics?startDate=2024-01-01&endDate=2024-01-15 (기간별)
   */
  async getAllStatistics(ctx: Context) {
    try {
      const { targetDate, startDate, endDate, category, buttonName } = ctx.query;

      const options: StatisticsOptions = {
        targetDate: targetDate as string,
        startDate: startDate as string,
        endDate: endDate as string,
        category: category as string,
        buttonName: buttonName as string,
      };

      const startDateValue = options.startDate || options.targetDate;
      const endDateValue = options.endDate || options.targetDate;

      // targetDate가 있으면 단일 날짜, startDate/endDate가 있으면 기간별
      const result = await statisticsService.getAllStatistics(
        startDateValue as string,
        endDateValue as string
      );

      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          data: result.data,
          queryParams: result.queryParams,
        };
      } else {
        ctx.status = 500;
        ctx.body = {
          success: false,
          message: result.message || '통계 조회 실패',
        };
      }
    } catch (error) {
      void log.error('통계 조회 API 오류', 'API', 'HIGH', { error });
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: '서버 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 통계 캐시 무효화 (analytics 범주 한정)
   * POST /analytics/statistics/cache/clear?startDate=2024-01-01&endDate=2024-01-15
   */
  async clearStatisticsCache(ctx: Context) {
    try {
      const { startDate, endDate } = ctx.query;

      if (!startDate || !endDate) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: 'startDate와 endDate가 필요합니다.',
        };
        return;
      }

      statisticsService.clearStatisticsCache(startDate as string, endDate as string);

      ctx.status = 200;
      ctx.body = {
        success: true,
        message: '해당 기간의 Analytics 캐시를 무효화했습니다.',
        queryParams: {
          startDate,
          endDate,
        },
      };
    } catch (error) {
      void log.error('통계 캐시 무효화 API 오류', 'API', 'HIGH', { error });
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: '서버 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 사용자 관련 통계만 조회
   * GET /analytics/statistics/user?startDate=2024-01-01&endDate=2024-01-15
   */
  async getUserStatistics(ctx: Context) {
    try {
      const { startDate, endDate } = ctx.query;

      if (!startDate || !endDate) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: 'startDate와 endDate가 필요합니다.',
        };
        return;
      }

      const data = await statisticsService.getUserStatistics(
        startDate as string,
        endDate as string
      );

      ctx.status = 200;
      ctx.body = {
        success: true,
        data,
        queryParams: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
      };
    } catch (error) {
      void log.error('사용자 통계 조회 API 오류', 'API', 'HIGH', { error });
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: '서버 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 홈화면 관련 통계만 조회
   * GET /analytics/statistics/home?startDate=2024-01-01&endDate=2024-01-15
   */
  async getHomeStatistics(ctx: Context) {
    try {
      const { startDate, endDate } = ctx.query;

      if (!startDate || !endDate) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: 'startDate와 endDate가 필요합니다.',
        };
        return;
      }

      const data = await statisticsService.getHomeStatistics(
        startDate as string,
        endDate as string
      );

      ctx.status = 200;
      ctx.body = {
        success: true,
        data,
        queryParams: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
      };
    } catch (error) {
      void log.error('홈화면 통계 조회 API 오류', 'API', 'HIGH', { error });
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: '서버 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 검색 관련 통계만 조회
   * GET /analytics/statistics/search?startDate=2024-01-01&endDate=2024-01-15
   */
  async getSearchStatistics(ctx: Context) {
    try {
      const { startDate, endDate } = ctx.query;

      if (!startDate || !endDate) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: 'startDate와 endDate가 필요합니다.',
        };
        return;
      }

      const data = await statisticsService.getSearchStatistics(
        startDate as string,
        endDate as string
      );

      ctx.status = 200;
      ctx.body = {
        success: true,
        data,
        queryParams: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
      };
    } catch (error) {
      void log.error('검색 통계 조회 API 오류', 'API', 'HIGH', { error });
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: '서버 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 상품 상세 관련 통계만 조회
   * GET /analytics/statistics/product-detail?startDate=2024-01-01&endDate=2024-01-15
   */
  async getProductDetailStatistics(ctx: Context) {
    try {
      const { startDate, endDate } = ctx.query;

      if (!startDate || !endDate) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: 'startDate와 endDate가 필요합니다.',
        };
        return;
      }

      const data = await statisticsService.getProductDetailStatistics(
        startDate as string,
        endDate as string
      );

      ctx.status = 200;
      ctx.body = {
        success: true,
        data,
        queryParams: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
      };
    } catch (error) {
      void log.error('상품 상세 통계 조회 API 오류', 'API', 'HIGH', { error });
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: '서버 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 멤버십 관련 통계만 조회
   * GET /analytics/statistics/membership?startDate=2024-01-01&endDate=2024-01-15
   */
  async getMembershipStatistics(ctx: Context) {
    try {
      const { startDate, endDate } = ctx.query;

      if (!startDate || !endDate) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: 'startDate와 endDate가 필요합니다.',
        };
        return;
      }

      const data = await statisticsService.getMembershipStatistics(
        startDate as string,
        endDate as string
      );

      ctx.status = 200;
      ctx.body = {
        success: true,
        data,
        queryParams: {
          startDate: startDate as string,
          endDate: endDate as string,
        },
      };
    } catch (error) {
      void log.error('멤버십 통계 조회 API 오류', 'API', 'HIGH', { error });
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: '서버 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 활성 유저 목록 조회
   * GET /analytics/statistics/active-users?date=2024-01-15
   */
  async getActiveUsers(ctx: Context) {
    try {
      const { date } = ctx.query;

      if (!date) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: 'date 파라미터가 필요합니다.',
        };
        return;
      }

      const result = await statisticsService.getActiveUsers(date as string);

      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          data: result.data,
          queryParams: result.queryParams,
        };
      } else {
        ctx.status = 500;
        ctx.body = {
          success: false,
          message: result.message || '활성 유저 목록 조회 실패',
        };
      }
    } catch (error) {
      void log.error('활성 유저 목록 조회 API 오류', 'API', 'HIGH', { error });
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: '서버 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 특정 유저의 이벤트 상세 조회
   * GET /analytics/statistics/user-events?userUniqueId=xxx&date=2024-01-15
   */
  async getUserEventDetails(ctx: Context) {
    try {
      const { userUniqueId, date } = ctx.query;

      if (!userUniqueId || !date) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: 'userUniqueId와 date 파라미터가 필요합니다.',
        };
        return;
      }

      const result = await statisticsService.getUserEventDetails(
        userUniqueId as string,
        date as string
      );

      if (result.success) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          data: result.data,
          queryParams: result.queryParams,
        };
      } else {
        ctx.status = 500;
        ctx.body = {
          success: false,
          message: result.message || '유저 이벤트 상세 조회 실패',
        };
      }
    } catch (error) {
      void log.error('유저 이벤트 상세 조회 API 오류', 'API', 'HIGH', { error });
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: '서버 오류가 발생했습니다.',
      };
    }
  }
}

export const statisticsController = new StatisticsController();
