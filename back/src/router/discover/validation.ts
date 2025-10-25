import { z } from 'zod';

// 공통 스키마
const BaseProductSchema = z.object({
  url: z.string().url({ message: '유효한 상품 URL이 필요합니다.' }),
  name: z.string().min(1, { message: '상품 이름은 필수입니다.' }),
});

// 1. 캡션 요청 스키마
export const ProductCaptionRequestSchema = z.object({
  product: BaseProductSchema.extend({
    thumbnail: z.string().url({ message: '유효한 썸네일 URL이 필요합니다.' }),
  }),
});

// 2. 리포트 요청 스키마
export const ProductReportRequestSchema = z.object({
  product: BaseProductSchema.extend({
    detail_images: z
      .array(z.string().url())
      .min(1, { message: '상세 이미지는 최소 1개 이상 필요합니다.' }),
  }),
});

// 3. 리뷰 요약 요청 스키마
export const ProductReviewRequestSchema = z.object({
  product: BaseProductSchema,
  reviews: z.array(z.string()).min(1, { message: '리뷰는 최소 1개 이상 필요합니다.' }),
});

// 4. AI 답변 요청 스키마
export const AIAnswerRequestSchema = z.object({
  product: BaseProductSchema.extend({
    thumbnail: z.string().url({ message: '유효한 썸네일 URL이 필요합니다.' }),
    detail_images: z.array(z.string().url()),
  }),
  reviews: z.array(z.string()),
  question: z.string().min(1, { message: '질문 내용은 필수입니다.' }),
});
