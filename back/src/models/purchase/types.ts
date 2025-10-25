import { IProduct, Platform } from 'models/product/types';
import { ClientSession, Document, Model, Types } from 'mongoose';

export interface AndroidReceipt {
  subscription: boolean;
  orderId: string;
  packageName: string;
  productId: string;
  purchaseTime: number;
  purchaseState: number;
  purchaseToken: string;
  quantity: number;
  autoRenewing: boolean;
  acknowledged: boolean;
}

// ios의 경우 문자열로 들어옴. base64 encoded receipt string
export type IosReceipt = string;

export interface IUnifiedPurchaseData {
  platform: 'ios' | 'android' | 'admin';

  productId: string;
  transactionId: string;
  originalTransactionId?: string;

  purchaseDate: number;
  expirationDate: number | null;

  isTrial: boolean;
  isExpired: boolean;
  isVerified: boolean;
  verifiedBy: 'iap' | 'google-api' | 'admin';
  createdByAdmin: boolean;
  verificationNote?: string;

  raw?: Record<string, any>;
}

export interface IPurchase extends Document, IPurchaseMethods {
  _id: Types.ObjectId;
  receipt: IosReceipt | AndroidReceipt;
  product: IProduct;
  userId: Types.ObjectId;
  purchase: IUnifiedPurchaseData;
  isExpired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseMethods {
  updateExpiration: (options?: { session?: ClientSession }) => Promise<void>;
}

export type PurchaseModel = Model<IPurchase, {}, IPurchaseMethods>;

// export interface IReceiptData {
//   quantity: number;
//   productId: string;
//   transactionId: string;
//   originalTransactionId: string;
//   purchaseDate: string;
//   purchaseDateMs: number;
//   purchaseDatePst: string;
//   originalPurchaseDate: string;
//   originalPurchaseDateMs: number;
//   originalPurchaseDatePst: string;
//   isTrialPeriod?: string;
//   inAppOwnershipType?: string;
//   isTrial?: boolean;
//   bundleId?: string;
//   expirationDate?: number;
//   isExpired?: boolean;
// }

export type PurchaseFailureStatus = 'FAILED' | 'RESOLVED';

export interface IPurchaseFailure extends Document {
  _id: Types.ObjectId;
  receipt: string;
  productId: string;
  platform: Platform;
  userId: Types.ObjectId;
  errorMessage: string;
  errorStack?: string;
  status: PurchaseFailureStatus;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type PurchaseFailureModel = Model<IPurchaseFailure>;
