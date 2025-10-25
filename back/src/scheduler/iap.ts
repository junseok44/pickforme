// back/src/scheduler/iap.ts
import cron from 'node-cron';
import db from 'models';
import { log } from 'utils/logger/logger';
import { receiptValidatorService } from 'services/receipt-validator.service';
import { subscriptionManagementService } from 'feature/subscription/service/subscription-management.service';

const SCHEDULER_NAME = 'iap';

/**
 * 매일 0시에 만료되지 않은 구독 정보를 조회하고,
 * 외부 결제사(구글/애플)에서 환불/만료 여부를 검증합니다.
 * 환불/만료된 구독은 isExpired를 true로 변경하고,
 * 해당 유저의 포인트/aiPoint를 0으로 초기화합니다.
 */
const checkSubscriptions = async () => {
  try {
    const purchases = await db.Purchase.find({
      isExpired: false,
    });

    for (const purchase of purchases) {
      try {
        // 어드민 권한으로 생성된 구독인 경우 일단 영수증을 검증하지 않고 넘어갑니다. (transactionId가 admin_으로 시작)
        if (purchase.purchase.createdByAdmin) {
          continue;
        }

        // 일반 구독의 경우 영수증 검증
        const validation = await receiptValidatorService.verifyReceipt(
          purchase.receipt,
          purchase.product
        );

        if (validation.status === 'expired') {
          try {
            await subscriptionManagementService.expireSubscription(purchase);
            void log.info(
              `개별 구독 환불/만료 처리 완료 - userId: ${purchase.userId}`,
              'SCHEDULER',
              'LOW',
              {
                scheduler: SCHEDULER_NAME,
                userId: purchase.userId,
              }
            );
          } catch (error) {
            void log.error('개별 구독 환불/만료 처리 중 오류 발생', 'SCHEDULER', 'HIGH', {
              scheduler: SCHEDULER_NAME,
              error,
              userId: purchase.userId,
            });
          }
        }
      } catch (error) {
        if (error instanceof Error)
          void log.error('구독 검증 중 오류 발생', 'SCHEDULER', 'HIGH', {
            scheduler: SCHEDULER_NAME,
            message: error.name,
            stack: error.stack,
            name: error.name,
            purchaseId: purchase._id,
          });
      }
    }
  } catch (error) {
    if (error instanceof Error)
      void log.error('구독 목록 조회 중 오류 발생', 'SCHEDULER', 'HIGH', {
        scheduler: SCHEDULER_NAME,
        message: error.name,
        stack: error.stack,
        name: error.name,
      });
  }
};

export const handleIAPScheduler = async () => {
  try {
    await checkSubscriptions();
    log.info('IAP 스케줄러 실행됨', 'SYSTEM', 'LOW', {
      scheduler: SCHEDULER_NAME,
    });
  } catch (error) {
    if (error instanceof Error)
      void log.error('IAP 스케줄러 실행 중 오류 발생', 'SCHEDULER', 'HIGH', {
        scheduler: SCHEDULER_NAME,
        message: error.name,
        stack: error.stack,
        name: error.name,
      });
  }
};

export function registerIAPScheduler() {
  cron.schedule('0 0 * * *', handleIAPScheduler, {
    timezone: 'Asia/Seoul',
  });
}

export default registerIAPScheduler;
