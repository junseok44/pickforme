import mongoose from 'mongoose';

export enum ProductType {
  PURCHASE = 0,
  SUBSCRIPTION = 1,
}

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
}

export interface ProductReward {
  point: number;
  aiPoint: number;
}

export interface MembershipProductReward extends ProductReward {
  productId: string;
  periodDate: number;
  renewalPeriodDate: number;
}

export interface EventMembershipProductReward extends MembershipProductReward {
  event: number;
}

export interface IProduct {
  type: ProductType;
  displayName: string;
  productId: string;
  platform: Platform;
  point: number;
  aiPoint: number;
  periodDate?: number;
  renewalPeriodDate?: number;
  eventId: number | null;
}

export interface ProductDocument extends IProduct, mongoose.Document {
  getRewards(): ProductReward;
  getMembershipRewards(): MembershipProductReward;
  getEventRewards(): EventMembershipProductReward;
}

export interface ProductModel extends mongoose.Model<ProductDocument> {}
