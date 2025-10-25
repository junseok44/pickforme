// 설치: npm install @google/genai
import { GoogleGenAI, Content, Part, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { ContentPart } from '../ai.provider';

const DEFAULT_MODEL = 'gemini-2.0-flash';

export interface GeminiMessage {
  role: 'user' | 'model'; // Gemini는 user/model 역할만 지원
  content: string | ContentPart[];
}

export class GeminiProvider {
  private ai: GoogleGenAI;

  constructor() {
    const googleApiKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleApiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is required');
    }
    // Helicone API 키 확인 추가
    const heliconeApiKey = process.env.HELICONE_API_KEY;
    if (!heliconeApiKey) {
      throw new Error('HELICONE_API_KEY environment variable is required');
    }

    // GoogleGenAI 클라이언트 초기화 시 Helicone 프록시 설정 추가
    this.ai = new GoogleGenAI({
      apiKey: googleApiKey,
      httpOptions: {
        baseUrl: 'https://gateway.helicone.ai',
        headers: {
          'Helicone-Auth': `Bearer ${heliconeApiKey}`,
          'Helicone-Target-URL': 'https://generativelanguage.googleapis.com',
        },
      },
    });
  }

  /**
   * 텍스트와 이미지를 모두 처리할 수 있는 통합 Gemini 응답 생성 메서드
   */
  async generate(params: {
    messages: GeminiMessage[];
    modelName?: string;
    systemInstruction?: string;
  }): Promise<string> {
    const { messages, modelName = DEFAULT_MODEL, systemInstruction } = params;

    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty.');
    }

    // 메시지를 Gemini Content 형식으로 변환
    const contents: Content[] = messages.map((msg) => {
      if (typeof msg.content === 'string') {
        // 단순 텍스트 메시지
        return {
          role: msg.role,
          parts: [{ text: msg.content }],
        };
      } else {
        // 복합 콘텐츠 (텍스트 + 이미지)
        const parts: Part[] = msg.content.map((part) => {
          if (part.type === 'text') {
            return { text: part.text || '' };
          } else if (part.type === 'image') {
            return {
              inlineData: {
                mimeType: 'image/jpeg',
                data: part.image || '',
              },
            };
          }
          throw new Error(`Unsupported content part type: ${part.type}`);
        });

        return {
          role: msg.role,
          parts,
        };
      }
    });

    try {
      const response = await this.ai.models.generateContent({
        model: modelName,
        contents,
        // 👇 시스템 안내는 이곳 config 객체 내에 별도로 지정합니다.
        config: {
          ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
          thinkingConfig: {
            thinkingBudget: 0,
          },
          temperature: 0.7,
          maxOutputTokens: 2048,
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
          ],
        },
      });

      return response.text?.trim() || '';
    } catch (error) {
      const errorMsg = `Gemini API call failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * 스트리밍 응답 예시 (필요시 사용)
   */
  async *getGeminiStream(prompt: string, modelName: string = 'gemini-1.5-flash-latest') {
    const request = {
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };

    const stream = await this.ai.models.generateContentStream(request);

    for await (const chunk of stream) {
      yield chunk.text;
    }
  }
}
