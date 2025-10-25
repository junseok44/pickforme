// receipt-validator.service.ts
import { Receipt } from 'in-app-purchase';
import { google } from 'googleapis';
import iapValidator from 'utils/iap';
import type { IProduct } from 'models/product';
import type { AndroidReceipt, IUnifiedPurchaseData } from 'models/purchase/types';

export type ReceiptValidationResult =
  | { status: 'valid'; data: IUnifiedPurchaseData }
  | { status: 'expired' }
  | { status: 'invalid'; reason: string; cause?: any };

class ReceiptValidatorService {
  public async verifyReceipt(
    receipt: Receipt,
    product: IProduct
  ): Promise<ReceiptValidationResult> {
    const isIos = typeof receipt === 'string';

    try {
      const purchase = isIos
        ? await this.validateIosPurchase(receipt, product)
        : await this.validateAndroidPurchase(receipt as any);

      if (!purchase) {
        return { status: 'expired' };
      }

      return { status: 'valid', data: purchase };
    } catch (err: any) {
      const reason = err?.message || 'Unknown receipt validation error';

      return {
        status: 'invalid',
        reason,
        cause: err,
      };
    }
  }

  private async validateIosPurchase(
    receipt: string,
    product: IProduct
  ): Promise<IUnifiedPurchaseData | null> {
    const purchase = await iapValidator.validate(receipt, product.productId);

    if (!purchase) {
      return null;
    }

    const purchaseDate =
      (purchase as any).purchaseDateMs ||
      (typeof purchase.purchaseDate === 'string'
        ? new Date(purchase.purchaseDate).getTime()
        : purchase.purchaseDate);

    const expirationDate =
      purchase.expirationDate && (purchase as any).expirationDate > 0
        ? Number(purchase.expirationDate)
        : null;

    return {
      platform: 'ios',
      productId: product.productId,
      transactionId: purchase.transactionId,
      originalTransactionId: purchase.originalTransactionId,
      purchaseDate,
      expirationDate,
      isTrial: purchase.isTrial === true,
      isExpired: false,
      isVerified: true,
      verifiedBy: 'iap',
      createdByAdmin: false,
      raw: purchase,
    };
  }

  // 현재는 비갱신구독상품 전용임. 갱신구독상품도 추가할 경우 lineItems에 필터링 추가 필요.
  private async validateAndroidPurchase(
    receipt: AndroidReceipt
  ): Promise<IUnifiedPurchaseData | null> {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    const authClient = (await auth.getClient()) as any;
    const publisher = google.androidpublisher({ version: 'v3', auth: authClient });

    const res = await publisher.purchases.subscriptionsv2.get({
      packageName: receipt.packageName,
      token: receipt.purchaseToken,
    });

    const data = res.data;
    const item = data.lineItems?.[0];
    if (!item) return null;

    const state = data.subscriptionState;
    const expiryMs = item.expiryTime ? Date.parse(item.expiryTime as string) : null;
    const now = Date.now();

    const isExpiredByTime = expiryMs !== null && !Number.isNaN(expiryMs) && now >= expiryMs;

    if (isExpiredByTime) return null;

    switch (state) {
      case 'SUBSCRIPTION_STATE_ACTIVE':
      // 정책: 유예기간엔 허용(대다수 서비스). 필요시 차단으로 변경 가능
      case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD':
        break;

      // 비갱신 구독상품의 경우에는 해당상태 조건이 없으나, 예외 케이스 처리를 위해 추가해둠.
      // https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2?hl=ko
      case 'SUBSCRIPTION_STATE_ON_HOLD':
      case 'SUBSCRIPTION_STATE_PAUSED':
      case 'SUBSCRIPTION_STATE_EXPIRED':
      case 'SUBSCRIPTION_STATE_PENDING':
      case 'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED':
      case 'SUBSCRIPTION_STATE_UNSPECIFIED':
      case 'SUBSCRIPTION_STATE_CANCELED':
        return null;
      default:
        break;
    }

    // 비갱신 구독상품의 경우에는 해당상태 조건이 없으나, 예외 케이스 처리를 위해 추가해둠.
    const canceledCtx: any = (data as any).canceledStateContext;
    if (canceledCtx?.subscriptionRevoked) {
      return null;
    }

    const purchaseDate = data.startTime ? new Date(data.startTime).getTime() : receipt.purchaseTime;
    const expirationDate = item.expiryTime ? new Date((item as any).expiryTime).getTime() : null;

    return {
      platform: 'android',
      productId: item.productId || '',
      transactionId: data.latestOrderId || '',
      originalTransactionId: undefined,
      purchaseDate,
      expirationDate,
      isTrial: false,
      isExpired: false,
      isVerified: true,
      verifiedBy: 'google-api',
      createdByAdmin: false,
      raw: data,
    };
  }
}

export const receiptValidatorService = new ReceiptValidatorService();
