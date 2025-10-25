import cron from 'node-cron';
import db from 'models';
import { log } from 'utils/logger/logger';

const SCHEDULER_NAME = 'membership';

/**
 * 매일 0시에 만료되지 않은 멤버쉽 구독 정보를 조회하고,
 * 만료일이 지났으면 만료 처리를 수행합니다.
 * 만료 처리는 Purchase의 isExpired 필드를 true로 변경하고,
 * 해당 유저의 멤버십 포인트를 0으로 초기화합니다.
 */

const checkMembershipExpirations = async () => {
  const expiredUsers = await db.User.find({
    MembershipAt: { $ne: null },
    MembershipExpiresAt: { $lt: new Date() },
  });
  try {
    for (const user of expiredUsers) {
      await user.processExpiredMembership();
      await log.info('멤버십 만료 처리 완료', 'SCHEDULER', 'LOW', {
        scheduler: SCHEDULER_NAME,
        userId: user._id,
      });
    }
  } catch (error) {
    if (error instanceof Error)
      await log.error('멤버십 만료 처리 중 오류 발생', 'SCHEDULER', 'HIGH', {
        scheduler: SCHEDULER_NAME,
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
  }
};

const checkMembershipRenewals = async () => {
  const renewedUsers = await db.User.find({
    MembershipAt: { $ne: null },
    MembershipExpiresAt: { $gt: new Date() },
  });

  try {
    for (const user of renewedUsers) {
      const product = await db.Product.findOne({ productId: user.currentMembershipProductId });

      if (!product) {
        await log.error('멤버십 갱신 처리 중 상품이 존재하지 않습니다.', 'SCHEDULER', 'HIGH', {
          scheduler: SCHEDULER_NAME,
          userId: user._id,
          productId: user.currentMembershipProductId,
        });
        continue;
      }

      if (!product.getMembershipRewards()) {
        await log.error('멤버십 갱신 처리 중 상품 정보가 존재하지 않습니다.', 'SCHEDULER', 'HIGH', {
          scheduler: SCHEDULER_NAME,
          userId: user._id,
          productId: user.currentMembershipProductId,
        });
        continue;
      }

      if (!user.shouldRenewMembership(product)) {
        await log.info('멤버십 갱신 처리 중 갱신 필요 없음', 'SCHEDULER', 'LOW', {
          scheduler: SCHEDULER_NAME,
          userId: user._id,
          productId: user.currentMembershipProductId,
        });
        continue;
      }

      await user.applyMembershipRenewalRewards(product.getMembershipRewards());

      await log.info('멤버십 갱신 처리 완료', 'SCHEDULER', 'LOW', {
        scheduler: SCHEDULER_NAME,
        userId: user._id,
      });
    }
  } catch (error) {
    if (error instanceof Error)
      await log.error('멤버십 갱신 처리 중 오류 발생', 'SCHEDULER', 'HIGH', {
        scheduler: SCHEDULER_NAME,
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
  }
};

export const handleMembershipScheduler = async () => {
  log.info('멤버십 만료 스케줄러 실행됨', 'SCHEDULER', 'LOW', {
    scheduler: SCHEDULER_NAME,
  });
  await checkMembershipExpirations();
  await checkMembershipRenewals();
};

export function registerMembershipScheduler() {
  cron.schedule('0 0 * * *', handleMembershipScheduler, {
    timezone: 'Asia/Seoul',
  });
}

export default registerMembershipScheduler;
