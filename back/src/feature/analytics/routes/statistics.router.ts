import Router from '@koa/router';
import { statisticsController } from '../controllers/statistics.controller';

const router = new Router({
  prefix: '/analytics/statistics',
});

// 전체 통계 조회 (단일 날짜 또는 기간별)
router.get('/', statisticsController.getAllStatistics.bind(statisticsController));

// 도메인별 통계 조회
router.get('/user', statisticsController.getUserStatistics.bind(statisticsController));
router.get('/home', statisticsController.getHomeStatistics.bind(statisticsController));
router.get('/search', statisticsController.getSearchStatistics.bind(statisticsController));
router.get(
  '/product-detail',
  statisticsController.getProductDetailStatistics.bind(statisticsController)
);
router.get('/membership', statisticsController.getMembershipStatistics.bind(statisticsController));

// 유저 관련 새로운 엔드포인트들
router.get('/active-users', statisticsController.getActiveUsers.bind(statisticsController));
router.get('/user-events', statisticsController.getUserEventDetails.bind(statisticsController));

// 캐시 무효화 (해당 기간의 analytics 키만)
router.post('/cache/clear', statisticsController.clearStatisticsCache.bind(statisticsController));

export default router;
