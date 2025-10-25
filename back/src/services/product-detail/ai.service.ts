import {
  aiProvider,
  ModelConfig,
  MODELS,
  AIProviderMessage,
  ContentPart,
} from '../llm/ai.provider';
import { log } from 'utils/logger';
import * as Prompts from './prompts';
import { convertUrlsToBase64 } from 'utils/images';

interface Product {
  name: string;
  thumbnail: string;
  detail_images: string[];
}

interface ProductReviewRequest {
  product: Product;
  reviews: string[];
}

interface ProductReviewResponse {
  pros: string[];
  cons: string[];
  bests: string[];
}

interface ProductAIAnswerRequest {
  product: Product;
  reviews: string[];
}

/**
 * 상품 썸네일 이미지로 짧은 광고 캡션을 생성합니다.
 */
export const getProductCaption = async (
  product: Pick<Product, 'name' | 'thumbnail'>,
  modelConfig: ModelConfig = MODELS.GEMINI_2_0_FLASH
): Promise<string | null> => {
  if (!product.thumbnail) {
    void log.warn('Product thumbnail is missing, cannot generate caption.', 'API', 'LOW', {
      product,
    });
    return null;
  }
  try {
    const prompt = Prompts.createProductCaptionPrompt(product.name);
    const thumbnailBase64 = await convertUrlsToBase64([product.thumbnail]);

    const messages: AIProviderMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image', image: thumbnailBase64[0] },
        ],
      },
    ];

    const caption = await aiProvider.generate({
      messages,
      modelConfig,
    });
    return caption;
  } catch (error) {
    void log.error('Failed to generate AI product caption.', 'API', 'MEDIUM', {
      error,
      product,
    });
    return null;
  }
};

/**
 * 상품 이미지들을 기반으로 상세 리포트를 생성합니다.
 */
export const getProductReport = async (
  product: Product,
  modelConfig: ModelConfig = MODELS.GEMINI_2_5_FLASH_LITE
): Promise<string | null> => {
  try {
    const prompt = Prompts.createAIReportPrompt(product.name);
    const detailImagesBase64 = await convertUrlsToBase64(product.detail_images);

    const contentParts: ContentPart[] = [
      { type: 'text', text: prompt },
      ...detailImagesBase64.map((img): ContentPart => ({ type: 'image', image: img })),
    ];

    const messages: AIProviderMessage[] = [
      {
        role: 'user',
        content: contentParts,
      },
    ];

    const report = await aiProvider.generate({
      messages,
      modelConfig,
    });

    return report;
  } catch (error) {
    void log.error('Failed to generate AI product report.', 'API', 'MEDIUM', {
      error,
      product,
    });
    return null;
  }
};

/**
 * 상품 리뷰들을 요약하여 장점, 단점, 베스트 리뷰를 추출합니다.
 */
export const getReviewSummary = async (
  request: ProductReviewRequest,
  modelConfig: ModelConfig = MODELS.GEMINI_2_5_FLASH_LITE
): Promise<ProductReviewResponse | null> => {
  try {
    const reviewsText = request.reviews.map((review, i) => `리뷰 ${i + 1}: ${review}`).join('\n');
    const prompt = Prompts.createReviewSummaryPrompt(request.product.name, reviewsText);
    const messages = [{ role: 'user' as const, content: prompt }];

    const rawSummaryString = await aiProvider.generate({ messages, modelConfig });

    try {
      // 2. 정규식을 사용해 순수 JSON 문자열 추출
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = rawSummaryString.match(jsonRegex);

      if (!match || !match[1]) {
        // 정규식으로 JSON을 찾지 못했을 경우의 예외 처리
        throw new Error('AI 응답에서 유효한 JSON을 추출하지 못했습니다.');
      }

      // 3. 정리된 순수 JSON 문자열을 파싱
      return JSON.parse(match[1]);
    } catch (error) {
      void log.error('Failed to parse AI review summary.', 'API', 'MEDIUM', {
        error,
        request,
        rawSummaryString,
      });
      return null;
    }
  } catch (error) {
    void log.error('Failed to generate AI review summary.', 'API', 'MEDIUM', {
      error,
      request,
    });
    return null;
  }
};

/**
 * 상품 정보와 리뷰를 기반으로 고객 질문에 답변합니다.
 */
export const getAIAnswer = async (
  request: ProductAIAnswerRequest,
  question: string,
  modelConfig: ModelConfig = MODELS.GEMINI_2_5_FLASH_LITE
): Promise<string | null> => {
  try {
    const reviewsText =
      request.reviews.length > 0 ? request.reviews.join('\n- ').slice(0, 3000) : '';

    // 3부분으로 나뉜 프롬프트 생성
    const prompt1 = Prompts.createAIAnswerPrompt1(reviewsText, request.product);
    const prompt2 = Prompts.createAIAnswerPrompt2();
    const prompt3 = Prompts.createAIAnswerPrompt3(question);

    // 이미지들을 base64로 변환
    const thumbnailBase64 = await convertUrlsToBase64([request.product.thumbnail]);
    const detailImagesBase64 = await convertUrlsToBase64(request.product.detail_images);

    // Python 서버와 동일한 순서로 content 구성
    // PROMPT1 -> 썸네일 이미지 -> PROMPT2 -> 상세 이미지들 -> PROMPT3
    const contentParts: ContentPart[] = [
      { type: 'text', text: prompt1 },
      { type: 'image', image: thumbnailBase64[0] }, // 썸네일 이미지
      { type: 'text', text: prompt2 },
      ...detailImagesBase64.map((img): ContentPart => ({ type: 'image', image: img })), // 상세 이미지들
      { type: 'text', text: prompt3 },
    ];

    const messages: AIProviderMessage[] = [
      {
        role: 'user',
        content: contentParts,
      },
    ];

    const answer = await aiProvider.generate({
      messages,
      modelConfig,
    });
    return answer;
  } catch (error) {
    void log.error('Failed to generate AI answer for question.', 'API', 'MEDIUM', {
      error,
      request,
    });
    return null;
  }
};
