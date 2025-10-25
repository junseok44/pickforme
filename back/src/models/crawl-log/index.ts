// models/CrawlLog.ts
import mongoose from 'mongoose';

export type CrawlProcessType = 'webview-detail' | 'webview-review' | 'server';
export type ProductField = 'name' | 'reviews' | 'thumbnail' | 'detail_images';

export interface CrawlLogDocument extends mongoose.Document {
  requestId: string;
  productUrl: string;
  processType: CrawlProcessType;
  success: boolean;
  durationMs: number;
  fields: Partial<Record<ProductField, boolean>>;
  attemptLabel?: string; // 웹뷰 attempt 단계 (desktop-1, mobile-vm, mobile-mlp 등)
  createdAt: Date;
}

const CrawlLogSchema = new mongoose.Schema<CrawlLogDocument>(
  {
    requestId: { type: String, required: true },
    productUrl: { type: String, required: true },
    processType: {
      type: String,
      enum: ['webview-detail', 'webview-review', 'server'],
      required: true,
    },
    success: { type: Boolean, required: true },
    durationMs: { type: Number, required: true },
    fields: { type: mongoose.Schema.Types.Mixed, default: {} },
    attemptLabel: { type: String, required: false }, // optional
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const model =
  mongoose.models.CrawlLog || mongoose.model<CrawlLogDocument>('CrawlLog', CrawlLogSchema);

export default model;
