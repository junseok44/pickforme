import { URL } from 'url';

export interface CoupangUrlInfo {
  originalUrl: string;
  normalizedUrl: string;
  productId: string;
  urlType: 'affiliate' | 'product' | 'mobile' | 'unknown';
}

export class CoupangUrlNormalizerService {
  /**
   * 쿠팡 URL을 정규화합니다.
   * @param url 원본 URL
   * @returns 정규화된 URL 정보
   */
  static normalizeUrl(url: string): CoupangUrlInfo {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();

      // 1. 쿠팡 어필리에이트 링크 처리 (link.coupang.com)
      if (hostname === 'link.coupang.com') {
        return this.handleAffiliateUrl(url, parsedUrl);
      }

      // 2. 모바일 쿠팡 링크 처리 (m.coupang.com)
      if (hostname === 'm.coupang.com') {
        return this.handleMobileUrl(url, parsedUrl);
      }

      // 3. 일반 쿠팡 상품 링크 처리 (www.coupang.com)
      if (hostname === 'www.coupang.com') {
        return this.handleProductUrl(url, parsedUrl);
      }

      // 4. 알 수 없는 URL 타입
      return {
        originalUrl: url,
        normalizedUrl: url,
        productId: '',
        urlType: 'unknown',
      };
    } catch (error) {
      console.error('URL 파싱 오류:', error);
      return {
        originalUrl: url,
        normalizedUrl: url,
        productId: '',
        urlType: 'unknown',
      };
    }
  }

  /**
   * 어필리에이트 링크 처리
   * @param originalUrl 원본 URL
   * @param parsedUrl 파싱된 URL 객체
   */
  private static handleAffiliateUrl(originalUrl: string, parsedUrl: URL): CoupangUrlInfo {
    const pageKey = parsedUrl.searchParams.get('pageKey');

    if (!pageKey) {
      return {
        originalUrl,
        normalizedUrl: originalUrl,
        productId: '',
        urlType: 'affiliate',
      };
    }

    const normalizedUrl = `https://www.coupang.com/vp/products/${pageKey}`;

    return {
      originalUrl,
      normalizedUrl,
      productId: pageKey,
      urlType: 'affiliate',
    };
  }

  /**
   * 모바일 쿠팡 링크 처리
   * @param originalUrl 원본 URL
   * @param parsedUrl 파싱된 URL 객체
   */
  private static handleMobileUrl(originalUrl: string, parsedUrl: URL): CoupangUrlInfo {
    // /vm/products/{productId} 패턴에서 productId 추출
    const pathMatch = parsedUrl.pathname.match(/\/vm\/products\/(\d+)/);

    if (!pathMatch) {
      return {
        originalUrl,
        normalizedUrl: originalUrl,
        productId: '',
        urlType: 'mobile',
      };
    }

    const productId = pathMatch[1];
    const normalizedUrl = `https://www.coupang.com/vp/products/${productId}`;

    return {
      originalUrl,
      normalizedUrl,
      productId,
      urlType: 'mobile',
    };
  }

  /**
   * 일반 상품 링크 처리
   * @param originalUrl 원본 URL
   * @param parsedUrl 파싱된 URL 객체
   */
  private static handleProductUrl(originalUrl: string, parsedUrl: URL): CoupangUrlInfo {
    // /vp/products/{productId} 패턴에서 productId 추출
    const pathMatch = parsedUrl.pathname.match(/\/vp\/products\/(\d+)/);

    if (!pathMatch) {
      return {
        originalUrl,
        normalizedUrl: originalUrl,
        productId: '',
        urlType: 'product',
      };
    }

    const productId = pathMatch[1];
    // 쿼리 파라미터 제거하고 정규화
    const normalizedUrl = `https://www.coupang.com/vp/products/${productId}`;

    return {
      originalUrl,
      normalizedUrl,
      productId,
      urlType: 'product',
    };
  }

  /**
   * 여러 URL을 일괄 정규화합니다.
   * @param urls URL 배열
   * @returns 정규화된 URL 정보 배열
   */
  static normalizeUrls(urls: string[]): CoupangUrlInfo[] {
    return urls.map((url) => this.normalizeUrl(url));
  }
}
