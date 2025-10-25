import db from 'models';
import { ProductType } from 'models/product';

export class SubscriptionQueryService {
  private static instance: SubscriptionQueryService;

  private constructor() {}

  public static getInstance(): SubscriptionQueryService {
    if (!SubscriptionQueryService.instance) {
      SubscriptionQueryService.instance = new SubscriptionQueryService();
    }
    return SubscriptionQueryService.instance;
  }

  public async getSubscriptionProductsByPlatform(platform: string) {
    const products = await db.Product.find({
      platform,
      type: ProductType.SUBSCRIPTION,
    });
    return products;
  }

  public async getUserSubscriptions(userId: string) {
    const subscriptions = await db.Purchase.find({
      userId,
      'product.type': ProductType.SUBSCRIPTION,
    }).sort({
      createdAt: -1,
    });
    return subscriptions;
  }

  public async getSubscriptionStatus(userId: string) {
    const user = await db.User.findById(userId);

    if (!user) {
      return {
        activate: false,
        leftDays: 0,
        expiresAt: null,
        createdAt: null,
        msg: '유저정보가 없습니다.',
      };
    }

    // 멤버십 상태 확인
    const membershipStatus = user.getMembershipStatus();

    if (membershipStatus.isActive) {
      return {
        activate: true,
        leftDays: membershipStatus.leftDays,
        expiresAt: membershipStatus.expiresAt?.toISOString() || null,
        createdAt: membershipStatus.membershipAt?.toISOString() || null,
        msg: membershipStatus.msg,
      };
    }

    return {
      activate: false,
      leftDays: 0,
      expiresAt: null,
      createdAt: null,
      msg: '활성화중인 멤버십이 없습니다.',
    };
  }

  public async getUserMembershipProduct(userId: string) {
    const user = await db.User.findById(userId);
    if (!user) {
      return null;
    }
  }
}

export const subscriptionQueryService = SubscriptionQueryService.getInstance();
