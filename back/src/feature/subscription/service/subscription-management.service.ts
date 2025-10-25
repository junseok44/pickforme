import db from 'models';
import { IPurchase, IPurchaseMethods } from 'models/purchase/types';
import mongoose from 'mongoose';
import constants from '../../../constants';
import { ProductType } from 'models/product';

const { POINTS } = constants;

export class SubscriptionManagementService {
  private static instance: SubscriptionManagementService;

  private constructor() {}

  public static getInstance(): SubscriptionManagementService {
    if (!SubscriptionManagementService.instance) {
      SubscriptionManagementService.instance = new SubscriptionManagementService();
    }
    return SubscriptionManagementService.instance;
  }

  public async checkRefundEligibility(userId: string) {
    const user = await db.User.findById(userId);
    if (!user) {
      return {
        isRefundable: false,
        msg: '유저 정보가 없습니다.',
      };
    }

    const subscription = await db.Purchase.findOne({
      userId,
      isExpired: false,
      'product.type': ProductType.SUBSCRIPTION,
    }).sort({
      createdAt: -1,
    });

    if (!subscription) {
      return {
        isRefundable: false,
        msg: '환불 가능한 구독 정보가 없습니다.',
      };
    }

    const membershipProduct = subscription.product;
    const { DEFAULT_AI_POINT, DEFAULT_POINT } = POINTS;

    if (
      user.aiPoint < membershipProduct.aiPoint - DEFAULT_AI_POINT ||
      user.point < membershipProduct.point - DEFAULT_POINT
    ) {
      return {
        isRefundable: false,
        msg: '구독 후 서비스 이용 고객으로 구독 환불 불가 대상입니다.',
      };
    }

    return {
      isRefundable: true,
      msg: '환불이 가능한 구독입니다.',
    };
  }

  public async processRefund(userId: string, subscriptionId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 환불 가능 여부 재확인
      const refundableStatus = await this.checkRefundEligibility(userId);
      if (!refundableStatus.isRefundable) {
        throw new Error(refundableStatus.msg);
      }

      // 구독 정보 조회
      const subscription = await db.Purchase.findOne({ _id: subscriptionId }, null, { session });

      if (!subscription) {
        throw new Error('구독 정보를 찾을 수 없습니다.');
      }

      // 구독 만료 처리 (포인트 초기화 포함)
      await this.expireSubscription(subscription, session);

      await session.commitTransaction();

      return {
        msg: '구독 환불을 완료하였습니다.',
        refundSuccess: true,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      void session.endSession();
    }
  }

  public async expireSubscription(
    subscription: mongoose.Document<unknown, {}, IPurchase> &
      Omit<
        IPurchase & {
          _id: mongoose.Types.ObjectId;
        },
        'updateExpiration'
      > &
      IPurchaseMethods,
    session?: mongoose.ClientSession
  ) {
    const options = session ? { session } : {};

    await subscription.updateExpiration(options);

    const user = await db.User.findById(subscription.userId);
    if (user) {
      await user.processExpiredMembership(options);
    }

    return subscription;
  }
}

export const subscriptionManagementService = SubscriptionManagementService.getInstance();
