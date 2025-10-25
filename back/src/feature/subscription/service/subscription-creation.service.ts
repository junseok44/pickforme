import { Receipt } from 'in-app-purchase';
import db from 'models';
import { IProduct, ProductType } from 'models/product';
import { IUnifiedPurchaseData } from 'models/purchase/types';
import mongoose from 'mongoose';
import { log } from 'utils/logger';
import { sendPushs } from 'utils/push';
import { receiptValidatorService } from '../../../services/receipt-validator.service';
import { purchaseFailureService } from './purchase-failure.service';

export type ReceiptValidationResult =
  | { status: 'valid'; data: IUnifiedPurchaseData }
  | { status: 'expired' }
  | { status: 'invalid'; reason: string; cause?: any };

export class SubscriptionCreationService {
  private static instance: SubscriptionCreationService;

  private constructor() {}

  public static getInstance(): SubscriptionCreationService {
    if (!SubscriptionCreationService.instance) {
      SubscriptionCreationService.instance = new SubscriptionCreationService();
    }
    return SubscriptionCreationService.instance;
  }

  private async _createSubscriptionCore(
    userId: string,
    productId: string,
    receipt: Receipt | undefined,
    resolvePurchase: (product: IProduct) => Promise<IUnifiedPurchaseData>
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await db.User.findById(userId);
      if (!user) throw new Error('유저정보가 없습니다.');

      const subscriptionStatus = await this.getSubscriptionStatus(userId);
      if (subscriptionStatus.activate) throw new Error('이미 구독중입니다.');

      const product = await db.Product.findById(productId);
      if (!product || product.type !== ProductType.SUBSCRIPTION) {
        throw new Error('존재하지 않는 구독 상품입니다.');
      }

      const purchase = await resolvePurchase(product);

      if ((!purchase.createdByAdmin && !receipt) || !purchase.isVerified || purchase.isExpired) {
        log.debug(`receipt:${Boolean(receipt)}`);
        log.debug(`isVerified:${purchase.isVerified}`);
        log.debug(`isExpired:${purchase.isExpired}`);
        log.debug(`createdByAdmin:${purchase.createdByAdmin}`);
        throw new Error('결제 정보가 올바르지 않습니다.');
      }

      const purchaseData = await db.Purchase.create(
        [
          {
            userId,
            product,
            purchase,
            receipt: receipt || null,
            isExpired: false,
          },
        ],
        { session }
      );

      await user.applyInitialMembershipRewards(product.getMembershipRewards(), session);
      await purchaseFailureService.resolvePurchaseFailures(userId, receipt, session);

      await session.commitTransaction();
      return purchaseData[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      void session.endSession();
    }
  }

  public async createSubscription(userId: string, productId: string, receipt: Receipt) {
    return this._createSubscriptionCore(userId, productId, receipt, async (product) => {
      const validation = await receiptValidatorService.verifyReceipt(receipt, product);

      if (validation.status === 'expired') {
        throw new Error('이미 만료되었거나 존재하지 않는 구독입니다.');
      }

      if (validation.status === 'invalid') {
        // 원본 에러 정보를 포함한 상세 에러 생성
        const errorDetails = {
          message: `유효하지 않은 영수증입니다. (${validation.reason})`,
          originalError: validation.cause,
          validationResult: validation,
        };

        const error = new Error(JSON.stringify(errorDetails));
        throw error;
      }

      return validation.data;
    });
  }

  public async createSubscriptionWithoutValidation(
    userId: string,
    productId: string,
    receipt?: Receipt
  ) {
    return this._createSubscriptionCore(userId, productId, receipt, async (product) => {
      const now = Date.now();
      const isIos = typeof receipt === 'string';
      return {
        platform: isIos ? 'ios' : 'android',
        transactionId: `admin_${now}`,
        originalTransactionId: undefined,
        productId: product.productId,
        purchaseDate: now,
        expirationDate: now + 30 * 24 * 60 * 60 * 1000,
        isTrial: false,
        isExpired: false,
        isVerified: true,
        verifiedBy: 'admin',
        createdByAdmin: true,
        verificationNote: '어드민에서 멤버쉽 지급',
        raw: undefined,
      };
    });
  }

  public async sendNotificationForManualSubscription(userId: string) {
    log.debug('sendNotificationForManualSubscription sending notification');
    const user = await db.User.findById(userId);
    if (user?.pushToken) {
      sendPushs([user.pushToken], {
        title: '픽포미 멤버십이 지급되었어요!',
        body: '불편을 드려 죄송합니다. 픽포미와 함께 즐거운 쇼핑 되세요',
      });
    }
  }

  // getSubscriptionStatus는 SubscriptionQueryService에서 가져옴
  private async getSubscriptionStatus(userId: string) {
    const { subscriptionQueryService } = await import('./subscription-query.service');
    return subscriptionQueryService.getSubscriptionStatus(userId);
  }
}

export const subscriptionCreationService = SubscriptionCreationService.getInstance();
