import axios from 'axios';
import { log } from 'utils/logger';

/**
 * 단일 이미지 소스(URL 또는 Base64)를 Raw Base64 문자열로 변환/보장합니다.
 * @param source 변환할 이미지의 HTTPS URL 또는 이미 Base64로 인코딩된 문자열
 */
const ensureBase64 = async (source: string): Promise<string> => {
  // 👇 핵심 로직: http 또는 https로 시작하는 경우에만 다운로드 수행
  if (source.startsWith('http')) {
    try {
      const response = await axios.get(source, { responseType: 'arraybuffer' });
      return Buffer.from(response.data).toString('base64');
    } catch (error) {
      void log.error(`Failed to convert URL to Base64: ${source}`, 'UTIL', 'MEDIUM', { error });
      return ''; // 에러 발생 시 빈 문자열 반환
    }
  }

  // URL이 아니라면, 이미 Base64 문자열이라고 가정하고 그대로 반환
  // (만약 data:image/...;base64, 형태라면 순수 base64 부분만 추출)
  return source.split(',').pop() || source;
};

/**
 * 여러 이미지 소스(URL 또는 Base64)를 병렬로 처리하여 Raw Base64 문자열 배열로 변환합니다.
 */
export const convertUrlsToBase64 = async (sources: string[]): Promise<string[]> => {
  const base64Strings = await Promise.all(sources.map((source) => ensureBase64(source)));
  return base64Strings.filter((s) => s.length > 0);
};
