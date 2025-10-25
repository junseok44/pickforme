import mongoose from 'mongoose';
import {
  EventMembershipProductReward,
  IProduct,
  MembershipProductReward,
  Platform,
  ProductModel,
  ProductReward,
  ProductType,
} from './types';

const ProductSchema = new mongoose.Schema(
  {
    type: {
      type: Number,
      required: [true, "can't be blank"],
    },
    displayName: {
      type: String,
      required: [true, "can't be blank"],
    },
    productId: {
      type: String,
      required: [true, "can't be blank"],
      unique: true,
    },
    platform: {
      type: String,
      enum: Object.values(Platform),
    },
    point: {
      type: Number,
      required: [true, "can't be blank"],
    },
    aiPoint: {
      type: Number,
      required: [true, "can't be blank"],
    },
    eventId: {
      type: Number,
      default: null, // 일반 상품은 null, 이벤트 상품은 이벤트 번호
    },
    periodDate: {
      type: Number,
      default: 30,
      description: '멤버쉽 기간 (일)',
    },
    renewalPeriodDate: {
      type: Number,
      default: 30,
      description: '갱신 기간 (일)',
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.methods.getRewards = function (): ProductReward {
  return {
    point: this.point,
    aiPoint: this.aiPoint,
  };
};

ProductSchema.methods.getMembershipRewards = function (): MembershipProductReward {
  if (this.type !== ProductType.SUBSCRIPTION) {
    throw new Error('상품 타입이 올바르지 않습니다.');
  }

  if (!this.periodDate || !this.renewalPeriodDate) {
    throw new Error('멤버십 기간 정보가 존재하지 않습니다.');
  }

  return {
    productId: this.productId,
    point: this.point,
    aiPoint: this.aiPoint,
    periodDate: this.periodDate,
    renewalPeriodDate: this.renewalPeriodDate,
  };
};

ProductSchema.methods.getEventRewards = function (): EventMembershipProductReward {
  const rewards = this.getMembershipRewards();

  if (!this.eventId) {
    throw new Error('이벤트 번호가 존재하지 않습니다.');
  }

  return {
    ...rewards,
    event: this.eventId,
  };
};

const model =
  (mongoose.models.Products as ProductModel) ||
  mongoose.model<IProduct, ProductModel>('Products', ProductSchema);

export * from './types';

export default model;
