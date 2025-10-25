import mongoose from 'mongoose';
import { IPurchase, PurchaseModel } from './types';
import { Platform } from 'models/product';

const PurchaseSchema = new mongoose.Schema(
  {
    receipt: {
      type: mongoose.Schema.Types.Mixed,
    },
    product: {
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
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    purchase: {
      type: mongoose.Schema.Types.Mixed,
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// 도메인 메서드 정의
PurchaseSchema.methods.updateExpiration = async function updateExpiration(options?: {
  session?: mongoose.ClientSession;
}) {
  this.isExpired = true;
  await this.save(options);
};

const Purchase = mongoose.model<IPurchase, PurchaseModel>('Purchases', PurchaseSchema);

export default Purchase;
