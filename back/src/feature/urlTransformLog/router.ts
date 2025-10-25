import Router from '@koa/router';
import { default as UrlTransformLog } from '../coupang/models';

const router = new Router({ prefix: '/url-transform-logs' });

// 테스트용 API - 모든 데이터 조회
router.get('/test', async (ctx) => {
  try {
    const allLogs = await UrlTransformLog.find({}).sort({ createdAt: -1 }).limit(10).lean();
    console.log('🧪 테스트 API - 전체 로그 수:', allLogs.length);

    ctx.body = {
      success: true,
      data: {
        count: allLogs.length,
        logs: allLogs,
      },
    };
  } catch (error) {
    console.error('테스트 API 오류:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '테스트 API 오류',
    };
  }
});

// URL 변환 로그 목록 조회
router.get('/list', async (ctx) => {
  try {
    const { page = 1, limit = 20, urlType, transformSuccess, deeplinkSuccess, keyword } = ctx.query;

    const filter: any = {};

    if (urlType && urlType !== '') filter.urlType = urlType;
    if (transformSuccess !== undefined && transformSuccess !== '')
      filter.transformSuccess = transformSuccess === 'true';
    if (deeplinkSuccess !== undefined && deeplinkSuccess !== '')
      filter.deeplinkSuccess = deeplinkSuccess === 'true';
    if (keyword) {
      filter.$or = [
        { originalInputUrl: { $regex: keyword, $options: 'i' } },
        { normalizedUrl: { $regex: keyword, $options: 'i' } },
        { productId: { $regex: keyword, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [results, total] = await Promise.all([
      UrlTransformLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      UrlTransformLog.countDocuments(filter),
    ]);

    console.log('📋 URL 변환 로그 목록 조회:', {
      filter,
      skip,
      limit: Number(limit),
      resultsCount: results.length,
      total,
    });

    const totalPages = Math.ceil(total / Number(limit));

    ctx.body = {
      success: true,
      data: {
        results,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
      },
    };
  } catch (error) {
    console.error('URL 변환 로그 목록 조회 오류:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'URL 변환 로그 목록 조회 중 오류가 발생했습니다.',
    };
  }
});

// URL 변환 통계 조회
router.get('/stats', async (ctx) => {
  try {
    const { startDate, endDate } = ctx.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const matchFilter: any = {};
    if (Object.keys(dateFilter).length > 0) {
      matchFilter.createdAt = dateFilter;
    }

    const stats = await UrlTransformLog.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          transformSuccessCount: {
            $sum: { $cond: ['$transformSuccess', 1, 0] },
          },
          deeplinkSuccessCount: {
            $sum: { $cond: ['$deeplinkSuccess', 1, 0] },
          },
          avgDurationMs: { $avg: '$durationMs' },
        },
      },
      {
        $project: {
          totalRequests: 1,
          transformSuccessCount: 1,
          deeplinkSuccessCount: 1,
          transformSuccessRate: {
            $multiply: [{ $divide: ['$transformSuccessCount', '$totalRequests'] }, 100],
          },
          deeplinkSuccessRate: {
            $multiply: [{ $divide: ['$deeplinkSuccessCount', '$totalRequests'] }, 100],
          },
          avgDurationMs: { $round: ['$avgDurationMs', 2] },
        },
      },
    ]);

    // URL 타입별 통계를 별도로 조회
    const urlTypeStats = await UrlTransformLog.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$urlType',
          count: { $sum: 1 },
          transformSuccess: { $sum: { $cond: ['$transformSuccess', 1, 0] } },
          deeplinkSuccess: { $sum: { $cond: ['$deeplinkSuccess', 1, 0] } },
        },
      },
      {
        $project: {
          urlType: '$_id',
          count: 1,
          transformSuccess: 1,
          deeplinkSuccess: 1,
          transformSuccessRate: {
            $multiply: [{ $divide: ['$transformSuccess', '$count'] }, 100],
          },
          deeplinkSuccessRate: {
            $multiply: [{ $divide: ['$deeplinkSuccess', '$count'] }, 100],
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const result = stats[0] || {
      totalRequests: 0,
      transformSuccessCount: 0,
      deeplinkSuccessCount: 0,
      transformSuccessRate: 0,
      deeplinkSuccessRate: 0,
      avgDurationMs: 0,
    };

    ctx.body = {
      success: true,
      data: {
        ...result,
        urlTypeStats,
      },
    };
  } catch (error) {
    console.error('URL 변환 통계 조회 오류:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'URL 변환 통계 조회 중 오류가 발생했습니다.',
    };
  }
});

// 특정 Request ID의 상세 로그 조회
router.get('/:requestId', async (ctx) => {
  try {
    const { requestId } = ctx.params;

    const log = await UrlTransformLog.findOne({ requestId }).lean();

    if (!log) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '해당 Request ID의 로그를 찾을 수 없습니다.',
      };
      return;
    }

    ctx.body = {
      success: true,
      data: log,
    };
  } catch (error) {
    console.error('URL 변환 로그 상세 조회 오류:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'URL 변환 로그 상세 조회 중 오류가 발생했습니다.',
    };
  }
});

export default router;
