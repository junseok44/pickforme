import OpenAI from 'openai';
import { ContentPart } from '../ai.provider';

const DEFAULT_MODEL = 'gpt-4o-mini';

export interface GPTMessage {
  role: 'user'; // system 역할 포함
  content: string | ContentPart[];
}

// OpenAI API가 요구하는 복합 콘텐츠 타입 정의
type MessageContent =
  | string
  | (
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } }
    )[];

export class GPTProvider {
  private openai: OpenAI;

  constructor() {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    // Helicone API 키 확인 추가
    const heliconeApiKey = process.env.HELICONE_API_KEY;
    if (!heliconeApiKey) {
      throw new Error('HELICONE_API_KEY environment variable is required');
    }

    // OpenAI 클라이언트 초기화 시 Helicone 프록시 설정 추가
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
      baseURL: 'https://oai.helicone.ai/v1', // OpenAI용 Helicone 프록시 URL
      defaultHeaders: {
        'Helicone-Auth': `Bearer ${heliconeApiKey}`,
      },
    });
  }

  /**
   * 텍스트와 이미지를 모두 처리할 수 있는 통합 GPT 응답 생성 메서드
   * @param params.messages - 필수. 대화 내역 배열.
   * @param params.model - 사용할 모델 이름.
   * @param params.config - 온도, 최대 토큰 등 기타 설정.
   * @returns AI가 생성한 텍스트 응답.
   */
  async generate(params: {
    messages: GPTMessage[];
    model?: string;
    config?: {
      temperature?: number;
      maxTokens?: number;
      responseFormat?: 'text' | 'json_object';
      imageDetail?: 'auto' | 'low' | 'high';
    };
  }): Promise<string> {
    const { messages, model = DEFAULT_MODEL, config = {} } = params;

    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty.');
    }

    // 메시지를 OpenAI API 형식으로 변환
    const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = messages.map(
      (msg) => {
        if (typeof msg.content === 'string') {
          // 단순 텍스트 메시지
          return {
            role: msg.role,
            content: msg.content,
          };
        } else {
          // 복합 콘텐츠 (텍스트 + 이미지)
          const contentParts: MessageContent = msg.content.map((part) => {
            if (part.type === 'text') {
              return { type: 'text', text: part.text || '' };
            } else if (part.type === 'image') {
              const imageUrl = part.image?.startsWith('http')
                ? part.image
                : `data:image/jpeg;base64,${part.image}`;
              return {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: config.imageDetail || 'auto',
                },
              };
            }
            throw new Error(`Unsupported content part type: ${part.type}`);
          }) as (
            | { type: 'text'; text: string }
            | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } }
          )[];

          return {
            role: msg.role,
            content: contentParts,
          };
        }
      }
    );

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: apiMessages,
        temperature: config.temperature || 0.1,
        max_tokens: config.maxTokens || 2048,
        response_format: { type: config.responseFormat || 'text' },
      });

      return response.choices[0].message.content?.trim() || '';
    } catch (error) {
      const errorMsg = `GPT API call failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }
}
