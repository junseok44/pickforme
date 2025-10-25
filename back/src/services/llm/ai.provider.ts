import { GeminiProvider, GeminiMessage } from './provider/gemini';
import { GPTProvider, GPTMessage } from './provider/gpt';

// AIProvider가 사용할 공통 Content 타입 정의
export interface ContentPart {
  type: 'text' | 'image';
  text?: string;
  image?: string; // base64 string
}

export interface AIProviderMessage {
  role: 'user' | 'system';
  content: string | ContentPart[]; // 단순 문자열 또는 복합 콘텐츠
}

export interface ModelConfig {
  provider: 'gemini' | 'openai';
  model: string;
}

// 사전 정의된 모델 설정들
export const MODELS = {
  // Gemini models
  GEMINI_2_0_FLASH: { provider: 'gemini' as const, model: 'gemini-2.0-flash' },
  GEMINI_2_5_FLASH_LITE: { provider: 'gemini' as const, model: 'gemini-2.5-flash-lite' },
  // OpenAI models
  GPT_4O: { provider: 'openai' as const, model: 'gpt-4o' },
  GPT_4O_MINI: { provider: 'openai' as const, model: 'gpt-4o-mini' },
} as const;

export type AIModelType = 'gemini' | 'openai';

class AIProvider {
  private gemini: GeminiProvider;

  private gpt: GPTProvider;

  constructor() {
    this.gemini = new GeminiProvider();
    this.gpt = new GPTProvider();
  }

  /**
   * 텍스트와 이미지를 모두 처리할 수 있는 통합 AI 응답 생성 메서드
   * @param params.messages - 필수. 대화 내역.
   * @param params.modelConfig - 필수. 사용할 AI 모델 설정.
   * @param params.systemInstruction - 선택. Gemini를 위한 시스템 안내.
   */
  async generate(params: {
    messages: AIProviderMessage[];
    modelConfig: ModelConfig;
    systemInstruction?: string;
  }): Promise<string> {
    const { messages, modelConfig, systemInstruction } = params;

    switch (modelConfig.provider) {
      case 'gemini': {
        const geminiMessages = messages.filter((m) => m.role === 'user') as GeminiMessage[];
        const systemMsgContent = messages.find((m) => m.role === 'system')?.content;
        const systemMsg =
          typeof systemMsgContent === 'string' ? systemMsgContent : systemInstruction;

        // GeminiProvider의 통합 generate 메서드 호출
        return this.gemini.generate({
          messages: geminiMessages,
          modelName: modelConfig.model,
          systemInstruction: systemMsg,
        });
      }

      case 'openai': {
        const gptMessages = messages as GPTMessage[];

        // GPTProvider의 통합 generate 메서드 호출
        return this.gpt.generate({
          messages: gptMessages,
          model: modelConfig.model,
        });
      }
    }
  }
}

export const aiProvider = new AIProvider();
