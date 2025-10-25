import mongoose from 'mongoose';
import { Platform } from 'models/product';
import { IPurchaseFailure, PurchaseFailureModel } from './types';

const PurchaseFailureSchema = new mongoose.Schema(
  {
    receipt: {
      type: mongoose.Schema.Types.Mixed,
    },
    productId: {
      type: String,
    },
    platform: {
      type: String,
      enum: Object.values(Platform),
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    errorMessage: {
      type: String,
      required: true,
    },
    errorStack: {
      type: String,
    },
    status: {
      type: String,
      enum: ['FAILED', 'RESOLVED'],
      default: 'FAILED',
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

const PurchaseFailure = mongoose.model<IPurchaseFailure, PurchaseFailureModel>(
  'PurchaseFailures',
  PurchaseFailureSchema
);
export default PurchaseFailure;
