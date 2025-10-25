/**
 * 쿠팡 관련 유틸리티 함수들
 */

/**
 * 텍스트에서 쿠팡 URL을 추출합니다.
 * @param text - URL이 포함된 텍스트
 * @returns 추출된 쿠팡 URL 또는 null
 */
export function extractCoupangUrl(text: string): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // 쿠팡 URL 패턴들 (우선순위 순)
  const urlPatterns = [
    // 데스크톱 상품 URL (www.coupang.com/vp/products/)
    /https?:\/\/(?:www\.)?coupang\.com\/vp\/products\/[^\s]+/gi,
    // 모바일 상품 URL (m.coupang.com/vm/products/)
    /https?:\/\/m\.coupang\.com\/vm\/products\/[^\s]+/gi,
    // 링크 변환 URL (link.coupang.com)
    /https?:\/\/link\.coupang\.com\/[^\s]+/gi,
    // 기타 쿠팡 도메인
    /https?:\/\/[^\/\s]+\.coupang\.com\/[^\s]+/gi,
  ];

  for (const pattern of urlPatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      return match[0];
    }
  }

  return null;
}

/**
 * 쿠팡 URL이 유효한 상품 페이지인지 검증합니다.
 * @param url - 검증할 URL
 * @returns 유효한 상품 URL인지 여부
 */
export function isValidCoupangProductUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // 쿠팡 도메인 확인
  if (!url.includes('coupang.com')) {
    return false;
  }

  // 상품 페이지 패턴 확인 (데스크톱 및 모바일)
  // 링크 변환 URL도 유효한 것으로 처리
  return (
    url.includes('/vp/products/') ||
    url.includes('/vm/products/') ||
    url.includes('link.coupang.com')
  );
}

/**
 * 쿠팡 상품 ID를 URL에서 추출합니다.
 * @param url - 쿠팡 상품 URL
 * @returns 상품 ID 또는 null
 */
export function extractProductId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // 데스크톱 및 모바일 URL에서 상품 ID 추출
  const match = url.match(/\/(vp|vm)\/products\/(\d+)/);
  return match ? match[2] : null;
}

/**
 * 쿠팡 URL을 정규화합니다 (모든 URL을 원본 그대로 유지).
 * @param url - 정규화할 URL
 * @returns 원본 URL
 */
export function normalizeCoupangUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // 모든 URL을 원본 그대로 반환
  return url;
}

/**
 * 텍스트에서 쿠팡 URL을 추출하고 검증합니다.
 * @param text - URL이 포함된 텍스트
 * @returns 추출 및 검증된 URL 정보
 */
export function extractAndValidateCoupangUrl(text: string): {
  success: boolean;
  url?: string;
  productId?: string;
  message?: string;
  originalUrl?: string;
} {
  // URL 추출
  const extractedUrl = extractCoupangUrl(text);

  if (!extractedUrl) {
    return {
      success: false,
      message: '입력된 텍스트에서 쿠팡 URL을 찾을 수 없습니다.',
    };
  }

  // 상품 URL 검증
  if (!isValidCoupangProductUrl(extractedUrl)) {
    return {
      success: false,
      url: extractedUrl,
      message: '유효한 쿠팡 상품 URL이 아닙니다.',
    };
  }

  // URL 정규화
  const normalizedUrl = normalizeCoupangUrl(extractedUrl);

  // 상품 ID 추출
  const productId = extractProductId(normalizedUrl);

  return {
    success: true,
    url: normalizedUrl,
    productId: productId || undefined,
    originalUrl: extractedUrl,
  };
}
