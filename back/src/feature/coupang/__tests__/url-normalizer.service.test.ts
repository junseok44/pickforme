import { CoupangUrlNormalizerService } from '../url-normalizer.service';

describe('CoupangUrlNormalizerService', () => {
  describe('normalizeUrl', () => {
    it('어필리에이트 링크를 정규화해야 한다', () => {
      const affiliateUrl =
        'https://link.coupang.com/re/AFFSDP?lptag=AF1661964&subid=AF1661964&pageKey=9108853792&itemId=26782542983&vendorItemId=93753147377&traceid=V0-153-e77a38ac4fae25f9&requestid=20251020112455159147411199&token=31850C%7CGM&landing_exp=APP_LANDING_A';

      const result = CoupangUrlNormalizerService.normalizeUrl(affiliateUrl);

      expect(result.originalUrl).toBe(affiliateUrl);
      expect(result.normalizedUrl).toBe('https://www.coupang.com/vp/products/9108853792');
      expect(result.productId).toBe('9108853792');
      expect(result.urlType).toBe('affiliate');
    });

    it('일반 상품 링크를 정규화해야 한다', () => {
      const productUrl =
        'https://www.coupang.com/vp/products/1568884328?vendorItemId=84993763548&sourceType=HOME_FBI&searchId=feed-7ba83f6d6e8b453fabd97b6f4337f299-3.33.24%3Afbi';

      const result = CoupangUrlNormalizerService.normalizeUrl(productUrl);

      expect(result.originalUrl).toBe(productUrl);
      expect(result.normalizedUrl).toBe('https://www.coupang.com/vp/products/1568884328');
      expect(result.productId).toBe('1568884328');
      expect(result.urlType).toBe('product');
    });

    it('모바일 링크를 정규화해야 한다', () => {
      const mobileUrl =
        'https://m.coupang.com/vm/products/10294558?itemId=17601366094&vendorItemId=90766204239';

      const result = CoupangUrlNormalizerService.normalizeUrl(mobileUrl);

      expect(result.originalUrl).toBe(mobileUrl);
      expect(result.normalizedUrl).toBe('https://www.coupang.com/vp/products/10294558');
      expect(result.productId).toBe('10294558');
      expect(result.urlType).toBe('mobile');
    });

    it('pageKey가 없는 어필리에이트 링크는 원본을 반환해야 한다', () => {
      const affiliateUrlWithoutPageKey =
        'https://link.coupang.com/re/AFFSDP?lptag=AF1661964&subid=AF1661964';

      const result = CoupangUrlNormalizerService.normalizeUrl(affiliateUrlWithoutPageKey);

      expect(result.originalUrl).toBe(affiliateUrlWithoutPageKey);
      expect(result.normalizedUrl).toBe(affiliateUrlWithoutPageKey);
      expect(result.productId).toBe('');
      expect(result.urlType).toBe('affiliate');
    });

    it('상품 ID가 없는 일반 링크는 원본을 반환해야 한다', () => {
      const invalidProductUrl = 'https://www.coupang.com/categories/123';

      const result = CoupangUrlNormalizerService.normalizeUrl(invalidProductUrl);

      expect(result.originalUrl).toBe(invalidProductUrl);
      expect(result.normalizedUrl).toBe(invalidProductUrl);
      expect(result.productId).toBe('');
      expect(result.urlType).toBe('product');
    });

    it('알 수 없는 도메인은 unknown 타입으로 처리해야 한다', () => {
      const unknownUrl = 'https://example.com/products/123';

      const result = CoupangUrlNormalizerService.normalizeUrl(unknownUrl);

      expect(result.originalUrl).toBe(unknownUrl);
      expect(result.normalizedUrl).toBe(unknownUrl);
      expect(result.productId).toBe('');
      expect(result.urlType).toBe('unknown');
    });

    it('잘못된 URL 형식은 에러를 처리해야 한다', () => {
      const invalidUrl = 'not-a-valid-url';

      const result = CoupangUrlNormalizerService.normalizeUrl(invalidUrl);

      expect(result.originalUrl).toBe(invalidUrl);
      expect(result.normalizedUrl).toBe(invalidUrl);
      expect(result.productId).toBe('');
      expect(result.urlType).toBe('unknown');
    });
  });

  describe('normalizeUrls', () => {
    it('여러 URL을 일괄 정규화해야 한다', () => {
      const urls = [
        'https://link.coupang.com/re/AFFSDP?pageKey=1234567890',
        'https://www.coupang.com/vp/products/9876543210',
        'https://m.coupang.com/vm/products/5555555555',
      ];

      const results = CoupangUrlNormalizerService.normalizeUrls(urls);

      expect(results).toHaveLength(3);
      expect(results[0].urlType).toBe('affiliate');
      expect(results[0].productId).toBe('1234567890');
      expect(results[1].urlType).toBe('product');
      expect(results[1].productId).toBe('9876543210');
      expect(results[2].urlType).toBe('mobile');
      expect(results[2].productId).toBe('5555555555');
    });
  });
});
