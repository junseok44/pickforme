import mongoose from 'mongoose';

export type FieldStats = {
  total: number;
  title: number;
  thumbnail: number;
  price: number;
  originPrice: number;
  discountRate: number;
  ratings: number;
  reviews: number;
  url: number;
};

export type SearchSource = 'webview' | 'server' | 'coupang_api'; // 검색 수행 주체
export interface SearchLogDocument extends mongoose.Document {
  requestId: string; // 검색 세션 단위 (키워드당 1개 생성 권장)
  keyword: string;
  source: SearchSource; // 'webview' | 'server'
  success: boolean;
  durationMs: number;
  resultCount: number;
  errorMsg?: string;
  fieldStats?: FieldStats;
  createdAt: Date;
}

const SearchLogSchema = new mongoose.Schema<SearchLogDocument>(
  {
    requestId: { type: String, required: true },
    keyword: { type: String, required: true },
    source: { type: String, enum: ['webview', 'server', 'coupang_api'], required: true },
    success: { type: Boolean, required: true },
    durationMs: { type: Number, required: true },
    resultCount: { type: Number, required: true, default: 0 },
    errorMsg: { type: String },
    fieldStats: { type: Object },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const model =
  mongoose.models.SearchLog || mongoose.model<SearchLogDocument>('SearchLog', SearchLogSchema);

export default model;
