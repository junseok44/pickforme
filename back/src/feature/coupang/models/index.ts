import mongoose from 'mongoose';

export type UrlType = 'affiliate' | 'product' | 'mobile' | 'unknown';

export interface UrlTransformLogDocument extends mongoose.Document {
  requestId: string; // 요청 세션 ID
  originalInputUrl: string; // 사용자가 입력한 원본 URL
  normalizedUrl: string; // 정규화된 URL
  productId: string; // 추출된 상품 ID
  urlType: UrlType; // URL 타입
  transformSuccess: boolean; // 변환 성공 여부
  errorMsg?: string; // 변환 실패 시 에러 메시지
  deeplinkSuccess: boolean; // 딥링크 생성 성공 여부
  deeplinkErrorMsg?: string; // 딥링크 생성 실패 시 에러 메시지
  originalUrl?: string; // 딥링크 서비스에서 반환된 originalUrl
  shortenUrl?: string; // 딥링크 서비스에서 반환된 shortenUrl
  landingUrl?: string; // 딥링크 서비스에서 반환된 landingUrl
  durationMs: number; // 전체 처리 시간 (ms)
  createdAt: Date;
}

const UrlTransformLogSchema = new mongoose.Schema<UrlTransformLogDocument>(
  {
    requestId: { type: String, required: true, index: true },
    originalInputUrl: { type: String, required: true },
    normalizedUrl: { type: String, required: true },
    productId: { type: String, required: true },
    urlType: {
      type: String,
      enum: ['affiliate', 'product', 'mobile', 'unknown'],
      required: true,
    },
    transformSuccess: { type: Boolean, required: true },
    errorMsg: { type: String },
    deeplinkSuccess: { type: Boolean, required: true },
    deeplinkErrorMsg: { type: String },
    originalUrl: { type: String },
    shortenUrl: { type: String },
    landingUrl: { type: String },
    durationMs: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// 인덱스 설정
UrlTransformLogSchema.index({ requestId: 1 });
UrlTransformLogSchema.index({ urlType: 1 });
UrlTransformLogSchema.index({ transformSuccess: 1 });
UrlTransformLogSchema.index({ deeplinkSuccess: 1 });
UrlTransformLogSchema.index({ createdAt: -1 });

const model =
  mongoose.models.UrlTransformLog ||
  mongoose.model<UrlTransformLogDocument>('UrlTransformLog', UrlTransformLogSchema);

export default model;
