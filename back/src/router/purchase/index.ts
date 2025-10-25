import Router from '@koa/router';
import { Receipt } from 'in-app-purchase';
import requireAuth from 'middleware/jwt';
import { log } from 'utils/logger';
import PurchaseFailure from 'models/purchase/failure';
import { formatError } from 'utils/error';
import { purchaseFailureService } from 'feature/subscription/service/purchase-failure.service';
import { subscriptionQueryService } from 'feature/subscription/service/subscription-query.service';
import { subscriptionManagementService } from 'feature/subscription/service/subscription-management.service';
import { subscriptionCreationService } from 'feature/subscription/service/subscription-creation.service';

const router = new Router({
  prefix: '/purchase',
});

// 구독 구매
router.post('/', requireAuth, async (ctx) => {
  const { receipt, _id: productId } = <{ _id: string; receipt: Receipt }>ctx.request.body;
  const userId = ctx.state?.user?._id;

  if (!receipt || !productId || !userId) {
    // 요청 자체가 잘못된 경우도 로깅
    void log.error('구독 요청 파라미터 누락', 'PURCHASE', 'CRITICAL', {
      receipt,
      productId,
      userId,
      endPoint: '/purchase',
      method: 'POST',
    });

    ctx.status = 400;
    ctx.body = '잘못된 요청입니다.';

    return;
  }

  try {
    const purchaseFailure = await purchaseFailureService.checkPurchaseFailure(userId);
    if (purchaseFailure.hasFailedPurchase) {
      throw new Error('아직 처리되지 않은 구독 실패 내역이 있습니다.');
    }

    const purchaseData = await subscriptionCreationService.createSubscription(
      userId,
      productId,
      receipt
    );

    ctx.status = 200;
    ctx.body = purchaseData;
  } catch (error) {
    const errorMeta = formatError(error);

    try {
      const alreadyLogged = await PurchaseFailure.findOne({ receipt });

      if (!alreadyLogged) {
        await PurchaseFailure.create({
          userId,
          receipt,
          productId,
          errorMessage: errorMeta.message,
          errorStack: errorMeta.stack,
          meta: errorMeta,
        });
      }

      void log.error(
        '결제 처리 중 에러 발생:',
        'PURCHASE',
        'HIGH',
        {
          error: errorMeta,
          endPoint: '/purchase',
          method: 'POST',
          userId: ctx.state.user._id,
          productId,
        },
        process.env.SLACK_SERVICE_NOTIFICATION_CHANNEL_ID
      );
    } catch (error2) {
      void log.error(
        '결제 실패 기록 저장 실패:',
        'PURCHASE',
        'HIGH',
        {
          error: formatError(error2),
          endPoint: '/purchase',
          method: 'POST',
          userId: ctx.state.user._id,
          productId,
          receipt,
        },
        process.env.SLACK_SERVICE_NOTIFICATION_CHANNEL_ID
      );
    }

    ctx.status = 400;
    ctx.body =
      error instanceof Error
        ? error.message
        : '결제 처리 중 오류가 발생했습니다. 고객센터에 문의해주세요.';
  }
});

// 구독 상품 목록 조회
router.get('/products/:platform', async (ctx) => {
  const { platform } = ctx.params;

  if (!platform) {
    ctx.status = 400;
    ctx.body = '플랫폼 정보가 없습니다.';
    return;
  }

  const products = await subscriptionQueryService.getSubscriptionProductsByPlatform(platform);

  ctx.body = products;
  ctx.status = 200;
});

// 유저 구독 목록 조회
router.get('/subscriptions', requireAuth, async (ctx) => {
  const subscriptions = await subscriptionQueryService.getUserSubscriptions(ctx.state.user._id);
  ctx.body = subscriptions;
  ctx.status = 200;
});

// 구독 상태 조회
router.get('/subscription/status', requireAuth, async (ctx) => {
  try {
    const status = await subscriptionQueryService.getSubscriptionStatus(ctx.state.user._id);
    ctx.body = status;
    ctx.status = 200;
  } catch (error) {
    void log.error('구독 상태 조회 중 에러:', 'PURCHASE', 'HIGH', {
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'UnknownError',
        stack: error instanceof Error ? error.stack : 'UnknownError',
      },
      endPoint: '/purchase/subscription/status',
      method: 'GET',
      userId: ctx.state.user._id,
    });
    ctx.body = {
      subscription: null,
      activate: false,
      leftDays: 0,
      expiresAt: null,
      msg: '[SERVER ERROR] : 구독 상태 조회 중 오류가 발생했습니다.',
    };
    ctx.status = 500;
  }
});

// 환불대상 조회
router.get('/refund', requireAuth, async (ctx) => {
  try {
    const result = await subscriptionManagementService.checkRefundEligibility(ctx.state.user._id);
    ctx.body = result;
    ctx.status = 200;
  } catch (error) {
    void log.error('환불대상 조회 중 에러 발생:', 'PURCHASE', 'HIGH', {
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'UnknownError',
        stack: error instanceof Error ? error.stack : 'UnknownError',
      },
      endPoint: '/purchase/refund',
      method: 'GET',
      userId: ctx.state.user._id,
    });
    ctx.body = {
      isRefundable: false,
      msg: '[SERVER ERROR] : FS02',
    };
    ctx.status = 500;
  }
});

// 환불 처리
router.post('/refund', requireAuth, async (ctx) => {
  const {
    body: { subscriptionId },
  } = <any>ctx.request;

  try {
    const result = await subscriptionManagementService.processRefund(
      ctx.state.user._id,
      subscriptionId
    );
    ctx.body = result;
    ctx.status = 200;
  } catch (error) {
    void log.error('환불 처리 중 에러 발생:', 'PURCHASE', 'HIGH', {
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'UnknownError',
        stack: error instanceof Error ? error.stack : 'UnknownError',
      },
      endPoint: '/purchase/refund',
      method: 'POST',
      userId: ctx.state.user._id,
    });
    ctx.body = {
      msg: error instanceof Error ? error.message : '[SERVER ERROR] : RF01',
      refundSuccess: false,
    };
    ctx.status = error instanceof Error ? 400 : 500;
  }
});

// GET /purchase/failures
router.get('/failures', requireAuth, async (ctx) => {
  const { userId, productId, platform, startDate, endDate, limit = 20, skip = 0 } = ctx.query;

  const query: Record<string, any> = {};

  if (userId) query.userId = userId;
  if (productId) query.productId = productId;
  if (platform) query.platform = platform;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate as string);
    if (endDate) query.createdAt.$lte = new Date(endDate as string);
  }

  try {
    const [results, total] = await Promise.all([
      PurchaseFailure.find(query)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      PurchaseFailure.countDocuments(query),
    ]);

    ctx.body = {
      total,
      results,
    };
    ctx.status = 200;
  } catch (error) {
    void log.error('결제 실패 이력 조회 중 에러:', 'PURCHASE', 'HIGH', {
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'UnknownError',
        stack: error instanceof Error ? error.stack : 'UnknownError',
      },
      endPoint: '/purchase/failures',
      method: 'GET',
    });

    ctx.status = 500;
    ctx.body = {
      msg: '결제 실패 이력 조회 중 서버 오류가 발생했습니다.',
    };
  }
});

// 결제 가능 여부 조회
router.get('/my-failures', requireAuth, async (ctx) => {
  try {
    const userId = ctx.state.user._id;

    const { hasFailedPurchase } = await purchaseFailureService.checkPurchaseFailure(userId);

    ctx.body = {
      canPurchase: !hasFailedPurchase, // 실패 내역이 없으면 true
    };
    ctx.status = 200;
  } catch (error) {
    void log.error('사용자 결제 가능 여부 조회 중 에러:', 'PURCHASE', 'HIGH', {
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'UnknownError',
        stack: error instanceof Error ? error.stack : 'UnknownError',
      },
      endPoint: '/purchase/my-failures',
      method: 'GET',
      userId: ctx.state.user._id,
    });

    ctx.status = 500;
    ctx.body = {
      msg: '결제 가능 여부 확인 중 서버 오류가 발생했습니다.',
    };
  }
});

// 결제 실패 재시도
router.post('/retry', requireAuth, async (ctx) => {
  const { userId, _id: productId, receipt } = <any>ctx.request.body;

  if (!userId || !productId || !receipt) {
    ctx.status = 400;
    ctx.body = { error: '필수 항목이 누락되었습니다.' };
    return;
  }

  try {
    const result = await subscriptionCreationService.createSubscription(userId, productId, receipt);

    await subscriptionCreationService.sendNotificationForManualSubscription(userId);

    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    const errorMeta = formatError(error);

    void log.error('결제 재시도 처리 중 에러 발생', 'PURCHASE', 'HIGH', {
      error: errorMeta,
      userId,
      productId,
      endPoint: '/purchase/retry',
      method: 'POST',
    });

    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : '결제 재시도 중 오류가 발생했습니다.',
    };
  }
});

// 구매 검증과정 없이 직접 구독 생성 (영수증 검증 없음)
// 현재 안드로이드에서 구매 검증을 제대로 하지 못하고 있어서 어드민에서 멤버쉽을 바로 추가하는 기능을 구현했습니다.
router.post('/admin/retry', requireAuth, async (ctx) => {
  const { userId, _id: productId, receipt } = <any>ctx.request.body;

  if (!userId || !productId) {
    ctx.status = 400;
    ctx.body = { error: '필수 항목이 누락되었습니다.' };
    return;
  }

  try {
    const result = await subscriptionCreationService.createSubscriptionWithoutValidation(
      userId,
      productId,
      receipt
    );

    await subscriptionCreationService.sendNotificationForManualSubscription(userId);

    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    const errorMeta = formatError(error);

    void log.error('어드민 구독 생성 중 에러 발생', 'PURCHASE', 'HIGH', {
      error: errorMeta,
      userId,
      productId,
      endPoint: '/purchase/admin/create',
      method: 'POST',
    });

    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : '구독 생성 중 오류가 발생했습니다.',
    };
  }
});

export default router;
