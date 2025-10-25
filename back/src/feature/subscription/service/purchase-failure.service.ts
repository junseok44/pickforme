import { Receipt } from 'in-app-purchase';
import db from 'models';
import mongoose from 'mongoose';

export class PurchaseFailureService {
  private static instance: PurchaseFailureService;

  private constructor() {}

  public static getInstance(): PurchaseFailureService {
    if (!PurchaseFailureService.instance) {
      PurchaseFailureService.instance = new PurchaseFailureService();
    }
    return PurchaseFailureService.instance;
  }

  public async checkPurchaseFailure(userId: string) {
    try {
      const hasFailedPurchase = await db.PurchaseFailure.exists({
        userId,
        status: 'FAILED',
      });

      return {
        hasFailedPurchase: !!hasFailedPurchase,
      };
    } catch (error) {
      throw error;
    }
  }

  public async resolvePurchaseFailures(
    userId: string,
    receipt?: string | Receipt,
    session?: mongoose.ClientSession
  ) {
    const options = session ? { session } : {};

    if (receipt) {
      // 해당 영수증과 관련된 모든 실패 내역 해결
      await db.PurchaseFailure.updateMany(
        { receipt, status: 'FAILED' },
        { status: 'RESOLVED' },
        options
      );
    } else {
      // 해당 사용자의 모든 미해결 실패 내역 해결
      await db.PurchaseFailure.updateMany(
        { userId, status: 'FAILED' },
        { status: 'RESOLVED' },
        options
      );
    }
  }
}

export const purchaseFailureService = PurchaseFailureService.getInstance();
