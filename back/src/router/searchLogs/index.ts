import Router from '@koa/router';
import SearchLogModel, { FieldStats } from 'models/searchLog';
import { isValidTimeZone, toZonedRange } from './utils';

const router = new Router({ prefix: '/search-logs' });

router.post('/', async (ctx) => {
  const { requestId, keyword, source, success, durationMs, resultCount, errorMsg, fieldStats } = ctx
    .request.body as {
    requestId: string;
    keyword: string;
    source: 'webview' | 'server';
    success: boolean;
    durationMs: number;
    resultCount: number;
    errorMsg?: string;
    fieldStats?: FieldStats;
  };

  if (
    !requestId ||
    !keyword ||
    !source ||
    typeof success !== 'boolean' ||
    !Number.isFinite(durationMs)
  ) {
    ctx.status = 400;
    ctx.body = { error: '필수 파라미터 누락' };
    return;
  }

  await SearchLogModel.create({
    requestId,
    keyword,
    source,
    success,
    durationMs,
    resultCount: resultCount ?? 0,
    errorMsg,
    fieldStats,
  });

  ctx.body = { message: '검색 로그 저장 완료' };
});

router.get('/list', async (ctx) => {
  const {
    page = '1',
    limit = '20',
    requestId = '',
    keyword = '',
    source = '',
  } = ctx.query as Record<string, string>;

  const toInt = (v: string, fb: number) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : fb;
  };
  const pageNum = toInt(page, 1);
  const limitNum = toInt(limit, 20);

  const q: any = {};
  if (requestId.trim()) q.requestId = requestId.trim();
  if (keyword.trim()) q.keyword = keyword.trim();
  if (source.trim()) q.source = source.trim();

  const [rows, total] = await Promise.all([
    SearchLogModel.find(q)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    SearchLogModel.countDocuments(q),
  ]);

  ctx.body = {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.max(Math.ceil(total / limitNum), 1),
    results: rows,
  };
});

/**
 * 통계 API (업데이트)
 * - todayBySource: 오늘(KST) source별 요약(횟수/성공/성공률/평균시간/평균결과수)
 * - byDateAndSource: 기간 내 일별×source 성공률/평균시간
 * - failureReasonsToday: 오늘 실패 원인 분포
 * - failureReasonsRange: 기간 전체 실패 원인 분포
 * - meta: tz, from, to
 */

router.get('/stats', async (ctx) => {
  const tz = (ctx.query.tz as string) || 'Asia/Seoul';
  const from = ctx.query.from as string | undefined;
  const to = ctx.query.to as string | undefined;

  if (!isValidTimeZone(tz)) {
    ctx.status = 400;
    ctx.body = { message: `Invalid timezone: ${tz}` };
    return;
  }

  // 먼저 안전한 범위를 계산
  let baseFrom: string, baseTo: string, guardStart: Date, guardEnd: Date;
  try {
    ({ baseFrom, baseTo, guardStart, guardEnd } = toZonedRange(tz, from, to));
  } catch (e: any) {
    ctx.status = 400;
    ctx.body = { message: e?.message || 'invalid range' };
    return;
  }

  // 필드 충족률 집계 (fieldStats 있는 문서만)
  const fieldStatsAgg = await SearchLogModel.aggregate([
    { $match: { createdAt: { $gte: guardStart, $lte: guardEnd }, fieldStats: { $exists: true } } },
    {
      $addFields: {
        ymd: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz } },
      },
    },
    { $match: { ymd: { $gte: baseFrom, $lte: baseTo } } },
    {
      $group: {
        _id: { date: '$ymd', source: '$source' },
        total: { $sum: { $ifNull: ['$fieldStats.total', 0] } },
        title: { $sum: { $ifNull: ['$fieldStats.title', 0] } },
        thumbnail: { $sum: { $ifNull: ['$fieldStats.thumbnail', 0] } },
        price: { $sum: { $ifNull: ['$fieldStats.price', 0] } },
        originPrice: { $sum: { $ifNull: ['$fieldStats.originPrice', 0] } },
        discountRate: { $sum: { $ifNull: ['$fieldStats.discountRate', 0] } },
        ratings: { $sum: { $ifNull: ['$fieldStats.ratings', 0] } },
        reviews: { $sum: { $ifNull: ['$fieldStats.reviews', 0] } },
        url: { $sum: { $ifNull: ['$fieldStats.url', 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const fieldCompletenessByDate: Array<{
    date: string;
    source: 'webview' | 'server';
    field: string;
    ratio: number;
    num: number;
    den: number;
  }> = [];

  for (const row of fieldStatsAgg) {
    const den = row.total || 0;
    const date = row._id.date;
    const source = row._id.source;
    const pct = (n: number) => (den > 0 ? (n / den) * 100 : 0);
    const push = (field: string, num: number) =>
      fieldCompletenessByDate.push({ date, source, field, ratio: pct(num), num, den });

    push('title', row.title);
    push('thumbnail', row.thumbnail);
    push('price', row.price);
    push('originPrice', row.originPrice);
    push('discountRate', row.discountRate);
    push('ratings', row.ratings);
    push('reviews', row.reviews);
    push('url', row.url);
  }

  // 나머지 통계 파이프라인
  const pipeline: any[] = [
    { $match: { createdAt: { $gte: guardStart, $lte: guardEnd } } },
    {
      $addFields: {
        localDate: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: tz } },
      },
    },
    // localDate 필터는 $facet 내부로 이동하여 각 파이프라인이 독립적으로 필터링하게 함
    {
      $facet: {
        /** (A) ✅ 오늘의 통계 요약 (소스별) - 추가된 부분 */
        todayBySource: [
          { $match: { localDate: baseTo } }, // 오늘 날짜(`to` 날짜)로 필터링
          {
            $group: {
              _id: '$source',
              total: { $sum: 1 },
              success: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
              fail: { $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] } },
              avgDurationMs: { $avg: '$durationMs' },
              avgResultCount: { $avg: '$resultCount' },
            },
          },
          {
            $project: {
              _id: 0,
              source: '$_id',
              total: 1,
              success: 1,
              fail: 1,
              successRate: {
                $cond: [
                  { $gt: ['$total', 0] },
                  { $multiply: [{ $divide: ['$success', '$total'] }, 100] },
                  0,
                ],
              },
              avgDurationMs: 1,
              avgResultCount: 1,
            },
          },
        ],

        /** (B) 선택한 기간 전체 요약(소스별) */
        rangeBySource: [
          { $match: { localDate: { $gte: baseFrom, $lte: baseTo } } },
          {
            $group: {
              _id: '$source',
              total: { $sum: 1 },
              success: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
              fail: { $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] } },
              avgDurationMs: { $avg: '$durationMs' },
              avgResultCount: { $avg: '$resultCount' },
            },
          },
          {
            $project: {
              _id: 0,
              source: '$_id',
              total: 1,
              success: 1,
              fail: 1,
              successRate: {
                $cond: [
                  { $gt: ['$total', 0] },
                  { $multiply: [{ $divide: ['$success', '$total'] }, 100] },
                  0,
                ],
              },
              avgDurationMs: 1,
              avgResultCount: 1,
            },
          },
        ],

        /** (C) 일자 × 소스 */
        byDateAndSource: [
          { $match: { localDate: { $gte: baseFrom, $lte: baseTo } } },
          {
            $group: {
              _id: { date: '$localDate', source: '$source' },
              total: { $sum: 1 },
              success: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
              fail: { $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] } },
              avgDurationMs: { $avg: '$durationMs' },
              avgResultCount: { $avg: '$resultCount' },
            },
          },
          {
            $project: {
              _id: 0,
              date: '$_id.date',
              source: '$_id.source',
              total: 1,
              success: 1,
              fail: 1,
              successRate: {
                $cond: [
                  { $gt: ['$total', 0] },
                  { $multiply: [{ $divide: ['$success', '$total'] }, 100] },
                  0,
                ],
              },
              avgDurationMs: 1,
              avgResultCount: 1,
            },
          },
          { $sort: { date: 1, source: 1 } },
        ],

        /** (D) 웹뷰 실패 원인 - 오늘 */
        failureReasonsWebviewToday: [
          { $match: { localDate: baseTo, source: 'webview', success: false } },
          {
            $project: {
              category: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $regexMatch: { input: { $ifNull: ['$errorMsg', ''] }, regex: /timeout/i },
                      },
                      then: 'timeout',
                    },
                    { case: { $eq: ['$resultCount', 0] }, then: 'no_results' },
                  ],
                  default: 'other',
                },
              },
            },
          },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $project: { _id: 0, reason: '$_id', count: 1 } },
          { $sort: { count: -1 } },
        ],

        /** (E) 웹뷰 실패 원인 - 기간 전체 */
        failureReasonsWebviewRange: [
          {
            $match: {
              localDate: { $gte: baseFrom, $lte: baseTo },
              source: 'webview',
              success: false,
            },
          },
          {
            $project: {
              category: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $regexMatch: { input: { $ifNull: ['$errorMsg', ''] }, regex: /timeout/i },
                      },
                      then: 'timeout',
                    },
                    { case: { $eq: ['$resultCount', 0] }, then: 'no_results' },
                  ],
                  default: 'other',
                },
              },
            },
          },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $project: { _id: 0, reason: '$_id', count: 1 } },
          { $sort: { count: -1 } },
        ],
      },
    },
  ];

  const [agg] = await SearchLogModel.aggregate(pipeline).allowDiskUse(true);

  ctx.body = {
    todayBySource: agg?.todayBySource ?? [], // ✅ 오늘 데이터 추가
    rangeBySource: agg?.rangeBySource ?? [],
    byDateAndSource: agg?.byDateAndSource ?? [],
    fieldCompletenessByDate,
    failureReasonsWebviewToday: agg?.failureReasonsWebviewToday ?? [],
    failureReasonsWebviewRange: agg?.failureReasonsWebviewRange ?? [],
    meta: { tz, range: { from: baseFrom, to: baseTo } },
  };
});

export default router;
