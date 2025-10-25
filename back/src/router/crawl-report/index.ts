// routes/crawlReport.ts
import Router from '@koa/router';
import CrawlLogModel from 'models/crawl-log';
import { log } from 'utils/logger';
import { isValidTimeZone, toZonedRange, checkRequiredData } from './utils';
const router = new Router({ prefix: '/crawl-logs' });

/**
 * GET /crawl-report/list
 * 전체 로그 조회 (어드민용, 페이지네이션 + 필터링)
 */
router.get('/list', async (ctx) => {
  const {
    page = '1',
    limit = '20',
    productUrl = '',
    requestId = '',
    processType = '',
    success,
  } = ctx.query as Record<string, string>;

  // 안전 파싱
  const toInt = (v: string, fallback: number) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  const pageNum = toInt(page, 1);
  const limitNum = toInt(limit, 20);

  const query: Record<string, any> = {};

  // 빈 문자열/공백 무시
  if (productUrl.trim()) query.productUrl = productUrl.trim();
  if (requestId.trim()) query.requestId = requestId.trim();
  if (processType.trim()) query.processType = processType.trim();

  // success는 명시적 true/false만 반영
  if (success === 'true') query.success = true;
  if (success === 'false') query.success = false;

  const [logs, total] = await Promise.all([
    CrawlLogModel.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    CrawlLogModel.countDocuments(query),
  ]);

  ctx.body = {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.max(Math.ceil(total / limitNum), 1),
    results: logs,
  };
});

// routes/crawlReport.ts (추가)
router.get('/list-grouped', async (ctx) => {
  const {
    page = '1',
    limit = '20',
    productUrl = '',
    requestId = '',
    processType = '', // 선택: 필터 필요하면 유지
    success, // 선택: true/false
  } = ctx.query as Record<string, string>;

  const toInt = (v: string, fb: number) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : fb;
  };
  const pageNum = toInt(page, 1);
  const limitNum = toInt(limit, 20);

  const match: any = {};
  if (productUrl.trim()) match.productUrl = productUrl.trim();
  if (requestId.trim()) match.requestId = requestId.trim();
  if (processType.trim()) match.processType = processType.trim();
  if (success === 'true') match.success = true;
  if (success === 'false') match.success = false;

  // 1) 최신 로그 우선 정렬
  // 2) (requestId, processType)별 최신 1개만 추출
  // 3) requestId 단위로 묶어서 processes 맵 구성
  // 4) requestId별 최신 createdAt으로 정렬
  // 5) facet: total(고유 requestId 개수) + 페이지 슬라이스
  const pipeline: any[] = [
    { $match: match },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { requestId: '$requestId', process: '$processType' },
        logId: { $first: '$_id' },
        requestId: { $first: '$requestId' },
        productUrl: { $first: '$productUrl' },
        processType: { $first: '$processType' },
        success: { $max: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
        durationMs: { $first: '$durationMs' },
        createdAt: { $first: '$createdAt' },
      },
    },
    {
      $group: {
        _id: '$requestId',
        requestId: { $first: '$requestId' },
        productUrl: { $first: '$productUrl' },
        lastCreatedAt: { $max: '$createdAt' },
        processes: {
          $push: {
            k: '$processType',
            v: {
              logId: '$logId',
              success: '$success',
              durationMs: '$durationMs',
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        requestId: 1,
        productUrl: 1,
        lastCreatedAt: 1,
        processes: { $arrayToObject: '$processes' },
      },
    },
    { $sort: { lastCreatedAt: -1 } },
    {
      $facet: {
        paged: [{ $skip: (pageNum - 1) * limitNum }, { $limit: limitNum }],
        totalCount: [{ $count: 'total' }],
      },
    },
  ];

  const [agg] = await CrawlLogModel.aggregate(pipeline).allowDiskUse(true);
  const results = agg?.paged ?? [];
  const total = (agg?.totalCount?.[0]?.total as number) ?? 0;

  ctx.body = {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.max(Math.ceil(total / limitNum), 1),
    results,
  };
});

/**
 * POST /crawl-report
 * 크롤링 결과 저장
 */
router.post('/', async (ctx) => {
  const { requestId, productUrl, processType, success, durationMs, fields, attemptLabel } = ctx
    .request.body as {
    requestId: string;
    productUrl: string;
    processType: string;
    success: boolean;
    durationMs: number;
    fields: Record<string, boolean>;
    attemptLabel?: string;
  };

  if (!requestId || !productUrl || !processType || typeof success !== 'boolean' || !durationMs) {
    ctx.status = 400;
    ctx.body = { error: '필수 파라미터 누락' };
    return;
  }

  try {
    const crawlLog = new CrawlLogModel({
      requestId,
      productUrl,
      processType,
      success,
      durationMs,
      fields: fields ?? {},
      attemptLabel,
    });

    await crawlLog.save();

    ctx.body = { message: '크롤링 로그 저장 완료' };
  } catch (e) {
    void log.error('크롤링 로그 저장 실패', 'PRODUCT', 'MEDIUM', {
      error: {
        name: e instanceof Error ? e.name : 'UnknownError',
        message: e instanceof Error ? e.message : 'UnknownError',
        stack: e instanceof Error ? e.stack : 'UnknownError',
      },
    });
    ctx.status = 500;
    ctx.body = { error: '크롤링 로그 저장 실패' };
    return;
  }
});

/**
 * GET /crawl-logs/stats
 * 크롤링 전체 통계 (어드민용)
 */

router.get('/stats', async (ctx) => {
  const tz = (ctx.query.tz as string) || 'Asia/Seoul';
  const from = ctx.query.from as string | undefined; // YYYY-MM-DD
  const to = ctx.query.to as string | undefined;

  if (!isValidTimeZone(tz)) {
    ctx.status = 400;
    ctx.body = { message: `Invalid timezone: ${tz}` };
    return;
  }

  const { baseFrom, baseTo, guardStart, guardEnd } = toZonedRange(tz, from, to);

  const pipeline: any[] = [
    { $match: { createdAt: { $gte: guardStart, $lte: guardEnd } } },
    {
      $addFields: {
        localDate: {
          $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: tz },
        },
      },
    },
    {
      $match: {
        localDate: { $gte: baseFrom, $lte: baseTo },
      },
    },
    {
      $facet: {
        // 날짜 × 프로세스별 원시 합계(평균시간 포함)
        processCounts: [
          {
            $group: {
              _id: { date: '$localDate', process: '$processType' },
              total: { $sum: 1 },
              success: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
              fail: { $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] } },
              avgDurationMs: { $avg: '$durationMs' },
            },
          },
        ],
        // 날짜별 웹뷰 분모: requestId 합집합 크기
        webviewDenoms: [
          { $match: { processType: { $in: ['webview-detail', 'webview-review'] } } },
          {
            $group: {
              _id: { date: '$localDate' },
              reqs: { $addToSet: '$requestId' },
            },
          },
          { $project: { _id: 0, date: '$_id.date', denom: { $size: '$reqs' } } },
        ],
        // 날짜 × 프로세스별 웹뷰 "고유 성공"(requestId 단위 dedup)
        webviewSuccessUnique: [
          { $match: { processType: { $in: ['webview-detail', 'webview-review'] } } },
          {
            $group: {
              _id: { date: '$localDate', process: '$processType', requestId: '$requestId' },
              successAny: { $max: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
            },
          },
          {
            $group: {
              _id: { date: '$_id.date', process: '$_id.process' },
              successUnique: { $sum: '$successAny' },
            },
          },
          { $project: { _id: 0, date: '$_id.date', process: '$_id.process', successUnique: 1 } },
        ],
        // 오늘(= 선택 범위의 끝 날짜) 원시 집계
        todayStatsRaw: [
          { $match: { localDate: baseTo } },
          {
            $group: {
              _id: '$processType',
              total: { $sum: 1 },
              success: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
              fail: { $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] } },
              avgDurationMs: { $avg: '$durationMs' },
            },
          },
        ],
        // 오늘의 웹뷰 분모
        todayWebviewDenom: [
          {
            $match: {
              localDate: baseTo,
              processType: { $in: ['webview-detail', 'webview-review'] },
            },
          },
          {
            $group: { _id: null, reqs: { $addToSet: '$requestId' } },
          },
          { $project: { _id: 0, denom: { $size: '$reqs' } } },
        ],
        // 오늘의 웹뷰 "고유 성공"
        todayWebviewSuccessUnique: [
          {
            $match: {
              localDate: baseTo,
              processType: { $in: ['webview-detail', 'webview-review'] },
            },
          },
          {
            $group: {
              _id: { process: '$processType', requestId: '$requestId' },
              successAny: { $max: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
            },
          },
          {
            $group: {
              _id: '$_id.process',
              successUnique: { $sum: '$successAny' },
            },
          },
          { $project: { _id: 0, process: '$_id', successUnique: 1 } },
        ],
        // Attempt별 통계 (webview-detail만)
        attemptStats: [
          { $match: { processType: 'webview-detail', attemptLabel: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: { date: '$localDate', attempt: '$attemptLabel' },
              total: { $sum: 1 },
              success: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
              fail: { $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] } },
              avgDurationMs: { $avg: '$durationMs' },
            },
          },
        ],
        // 오늘의 Attempt별 통계
        todayAttemptStats: [
          {
            $match: {
              localDate: baseTo,
              processType: 'webview-detail',
              attemptLabel: { $exists: true, $ne: null },
            },
          },
          {
            $group: {
              _id: '$attemptLabel',
              total: { $sum: 1 },
              success: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
              fail: { $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] } },
              avgDurationMs: { $avg: '$durationMs' },
            },
          },
        ],
      },
    },
  ];

  const [agg] = await CrawlLogModel.aggregate(pipeline).allowDiskUse(true);

  // ====== 맵 준비 ======
  const webviewDenomByDate = new Map<string, number>(); // date -> denom
  for (const w of (agg.webviewDenoms as Array<{ date: string; denom: number }>) ?? []) {
    webviewDenomByDate.set(w.date, w.denom);
  }

  const webviewSuccessUniqueMap = new Map<string, number>(); // `${date}::${process}` -> successUnique
  for (const r of (agg.webviewSuccessUnique as Array<{
    date: string;
    process: string;
    successUnique: number;
  }>) ?? []) {
    webviewSuccessUniqueMap.set(`${r.date}::${r.process}`, r.successUnique);
  }

  const todayWebviewSuccessMap = new Map<string, number>(); // process -> successUnique
  for (const r of (agg.todayWebviewSuccessUnique as Array<{
    process: string;
    successUnique: number;
  }>) ?? []) {
    todayWebviewSuccessMap.set(r.process, r.successUnique);
  }

  // ====== 일자별 결과(byDateAndProcess) 구성 ======
  const byDateAndProcess: Record<
    string,
    Record<
      string,
      { total: number; success: number; fail: number; successRate: number; avgDurationMs: number }
    >
  > = {};

  for (const row of (agg.processCounts as Array<{
    _id: { date: string; process: string };
    total: number;
    success: number;
    fail: number;
    avgDurationMs: number;
  }>) ?? []) {
    const date = row._id.date;
    const process = row._id.process;
    if (!byDateAndProcess[date]) byDateAndProcess[date] = {};

    const isWebview = process === 'webview-detail' || process === 'webview-review';

    if (isWebview) {
      const denom = webviewDenomByDate.get(date) ?? 0;
      const successUnique = webviewSuccessUniqueMap.get(`${date}::${process}`) ?? 0;
      const cappedSuccess = Math.min(successUnique, denom);
      const fail = Math.max(denom - cappedSuccess, 0);
      const successRate = denom ? (cappedSuccess / denom) * 100 : 0;

      byDateAndProcess[date][process] = {
        total: denom, // 분모 고정
        success: cappedSuccess, // 고유 성공
        fail,
        successRate,
        avgDurationMs: row.avgDurationMs ?? 0, // 평균시간은 원시 평균 사용
      };
    } else {
      // server: 기존 로직(방어적으로 success cap)
      const denom = row.total;
      const cappedSuccess = Math.min(row.success, denom);
      const successRate = denom ? (cappedSuccess / denom) * 100 : 0;

      byDateAndProcess[date][process] = {
        total: denom,
        success: cappedSuccess,
        fail: row.fail,
        successRate,
        avgDurationMs: row.avgDurationMs ?? 0,
      };
    }
  }

  // ====== 오늘(todayStats) 섹션 ======
  const todayStats: Record<
    string,
    { total: number; success: number; fail: number; successRate: number; avgDurationMs: number }
  > = {};
  const todayDenom = (agg.todayWebviewDenom?.[0]?.denom as number | undefined) ?? 0;

  for (const row of (agg.todayStatsRaw as Array<{
    _id: string;
    total: number;
    success: number;
    fail: number;
    avgDurationMs: number;
  }>) ?? []) {
    const process = row._id;
    const isWebview = process === 'webview-detail' || process === 'webview-review';

    if (isWebview) {
      const successUnique = todayWebviewSuccessMap.get(process) ?? 0;
      const denom = todayDenom;
      const cappedSuccess = Math.min(successUnique, denom);
      const fail = Math.max(denom - cappedSuccess, 0);
      const successRate = denom ? (cappedSuccess / denom) * 100 : 0;

      todayStats[process] = {
        total: denom,
        success: cappedSuccess,
        fail,
        successRate,
        avgDurationMs: row.avgDurationMs ?? 0,
      };
    } else {
      const denom = row.total;
      const cappedSuccess = Math.min(row.success, denom);
      const successRate = denom ? (cappedSuccess / denom) * 100 : 0;

      todayStats[process] = {
        total: denom,
        success: cappedSuccess,
        fail: row.fail,
        successRate,
        avgDurationMs: row.avgDurationMs ?? 0,
      };
    }
  }

  // 탭별 성공률 계산
  const calculateTabStats = async (targetDate: string) => {
    // 1. 각 requestId별로 모든 프로세스의 fields를 병합
    const requestData = await CrawlLogModel.aggregate([
      { $match: { createdAt: { $gte: guardStart, $lte: guardEnd } } },
      {
        $addFields: {
          localDate: {
            $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: tz },
          },
        },
      },
      { $match: { localDate: targetDate } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { requestId: '$requestId', process: '$processType' },
          fields: { $first: '$fields' },
        },
      },
      {
        $group: {
          _id: '$_id.requestId',
          requestId: { $first: '$_id.requestId' },
          allFields: { $push: '$fields' },
        },
      },
    ]);

    // 2. 각 requestId의 fields를 병합하고 탭별 성공 여부 판정
    const tabStats = { CAPTION: 0, REPORT: 0, REVIEW: 0 };
    const totalRequests = requestData.length;

    for (const item of requestData) {
      // 모든 fields를 병합
      const mergedFields = item.allFields.reduce((acc: any, fields: any) => {
        if (!fields) return acc;
        for (const [key, val] of Object.entries(fields)) {
          if (val !== undefined && val !== null && !acc[key] && val) {
            acc[key] = val;
          }
        }
        return acc;
      }, {});

      // 각 탭별로 성공 여부 판정
      const tabs = ['CAPTION', 'REPORT', 'REVIEW'] as const;
      for (const tab of tabs) {
        if (checkRequiredData(tab, mergedFields)) {
          tabStats[tab]++;
        }
      }
    }

    // 성공률 계산
    const tabStatsWithRates = Object.entries(tabStats).reduce(
      (acc, [tab, successCount]) => {
        acc[tab] = {
          total: totalRequests,
          success: successCount,
          fail: totalRequests - successCount,
          successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
        };
        return acc;
      },
      {} as Record<string, any>
    );

    return tabStatsWithRates;
  };

  // 오늘 탭별 성공률
  const todayTabStats = await calculateTabStats(baseTo);

  // 기간별 탭별 성공률
  const byDateAndTab: Record<string, any> = {};

  // 날짜별로 탭 통계 계산
  const dateKeys = Object.keys(byDateAndProcess);
  for (const date of dateKeys) {
    const tabStatsForDate = await calculateTabStats(date);
    byDateAndTab[date] = tabStatsForDate;
  }

  // ====== Attempt별 통계 처리 ======
  const byDateAndAttempt: Record<
    string,
    Record<
      string,
      {
        total: number;
        success: number;
        fail: number;
        successRate: number;
        avgDurationMs: number;
      }
    >
  > = {};

  for (const row of (agg.attemptStats as Array<{
    _id: { date: string; attempt: string };
    total: number;
    success: number;
    fail: number;
    avgDurationMs: number;
  }>) ?? []) {
    const date = row._id.date;
    const attempt = row._id.attempt;
    if (!byDateAndAttempt[date]) byDateAndAttempt[date] = {};

    const successRate = row.total ? (row.success / row.total) * 100 : 0;
    byDateAndAttempt[date][attempt] = {
      total: row.total,
      success: row.success,
      fail: row.fail,
      successRate,
      avgDurationMs: row.avgDurationMs ?? 0,
    };
  }

  // 오늘의 Attempt별 통계
  const todayAttemptStats: Record<
    string,
    {
      total: number;
      success: number;
      fail: number;
      successRate: number;
      avgDurationMs: number;
    }
  > = {};

  for (const row of (agg.todayAttemptStats as Array<{
    _id: string;
    total: number;
    success: number;
    fail: number;
    avgDurationMs: number;
  }>) ?? []) {
    const attempt = row._id;
    const successRate = row.total ? (row.success / row.total) * 100 : 0;
    todayAttemptStats[attempt] = {
      total: row.total,
      success: row.success,
      fail: row.fail,
      successRate,
      avgDurationMs: row.avgDurationMs ?? 0,
    };
  }

  ctx.body = {
    todayStats,
    byDateAndProcess,
    todayTabStats,
    byDateAndTab,
    todayAttemptStats,
    byDateAndAttempt,
    meta: { tz, range: { from: baseFrom, to: baseTo } },
  };
});

/**
 * GET /crawl-report/:requestId
 * 특정 requestId의 모든 프로세스 결과 조회
 */
router.get('/:requestId', async (ctx) => {
  const { requestId } = ctx.params;

  const logs = await CrawlLogModel.find({ requestId }).sort({ createdAt: 1 }).lean();

  ctx.body = logs;
});

export default router;
