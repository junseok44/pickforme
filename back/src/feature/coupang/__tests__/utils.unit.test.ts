import {
  extractCoupangUrl,
  isValidCoupangProductUrl,
  extractProductId,
  normalizeCoupangUrl,
  extractAndValidateCoupangUrl,
} from '../utils';

describe('쿠팡 URL 유틸리티 테스트', () => {
  describe('extractCoupangUrl', () => {
    const testCases = [
      {
        name: '링크 변환 URL (link.coupang.com)',
        input: `쿠팡을 추천합니다!
샌디스크 울트라 듀얼 드라이브 럭스 USB Type C SDDDC4
https://link.coupang.com/a/cuBzJN`,
        expected: 'https://link.coupang.com/a/cuBzJN',
      },
      {
        name: '모바일 URL (m.coupang.com)',
        input:
          'https://m.coupang.com/vm/products/10294558?itemId=17601366094&vendorItemId=90766204239',
        expected:
          'https://m.coupang.com/vm/products/10294558?itemId=17601366094&vendorItemId=90766204239',
      },
      {
        name: '복잡한 데스크톱 URL',
        input:
          'https://www.coupang.com/vp/products/181699807?itemId=520561494&vendorItemId=85694345825&src=1191000&spec=10999999&addtag=400&ctag=181699807&lptag=CFM27924792&itime=20250507142525&pageType=PRODUCT&pageValue=181699807&wPcid=15878015568245168209143&wRef=&wTime=20250507142525&redirect=landing&mcid=f91811085ef04e0c92b9f33ddfcfa3c9&sharesource=sharebutton&style=&isshortened=Y&settlement=N',
        expected:
          'https://www.coupang.com/vp/products/181699807?itemId=520561494&vendorItemId=85694345825&src=1191000&spec=10999999&addtag=400&ctag=181699807&lptag=CFM27924792&itime=20250507142525&pageType=PRODUCT&pageValue=181699807&wPcid=15878015568245168209143&wRef=&wTime=20250507142525&redirect=landing&mcid=f91811085ef04e0c92b9f33ddfcfa3c9&sharesource=sharebutton&style=&isshortened=Y&settlement=N',
      },
      {
        name: '불완전한 모바일 URL',
        input: 'https://m.coupang.com/vm/products/7225189423?',
        expected: 'https://m.coupang.com/vm/products/7225189423?',
      },
      {
        name: '마스크 상품 링크',
        input: `쿠팡을 추천합니다!
OBeU 숨쉬기 편한 새부리형 골프 자외선차단 마스크
https://link.coupang.com/a/cxAcbH`,
        expected: 'https://link.coupang.com/a/cxAcbH',
      },
      {
        name: '펩시 콜라 링크',
        input: `쿠팡을 추천합니다!
펩시 콜라 제로슈거 라임향
https://link.coupang.com/a/cxAfeD`,
        expected: 'https://link.coupang.com/a/cxAfeD',
      },
      {
        name: '일반 데스크톱 URL',
        input: 'https://www.coupang.com/vp/products/123456789',
        expected: 'https://www.coupang.com/vp/products/123456789',
      },
      {
        name: 'www 없는 데스크톱 URL',
        input: 'https://coupang.com/vp/products/987654321',
        expected: 'https://coupang.com/vp/products/987654321',
      },
      {
        name: 'HTTP URL',
        input: 'http://www.coupang.com/vp/products/555666777',
        expected: 'http://www.coupang.com/vp/products/555666777',
      },
      {
        name: '쿠팡이 아닌 URL',
        input: 'https://www.amazon.com/dp/B08N5WRWNW',
        expected: null,
      },
      {
        name: '빈 문자열',
        input: '',
        expected: null,
      },
      {
        name: 'null 입력',
        input: null as any,
        expected: null,
      },
      {
        name: 'URL이 없는 텍스트',
        input: '쿠팡을 추천합니다! 좋은 상품이에요.',
        expected: null,
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      test(name, () => {
        const result = extractCoupangUrl(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('isValidCoupangProductUrl', () => {
    const testCases = [
      {
        name: '유효한 데스크톱 URL',
        input: 'https://www.coupang.com/vp/products/123456789',
        expected: true,
      },
      {
        name: '유효한 모바일 URL',
        input: 'https://m.coupang.com/vm/products/123456789',
        expected: true,
      },
      {
        name: '링크 변환 URL',
        input: 'https://link.coupang.com/a/cuBzJN',
        expected: true, // 링크 변환 URL도 유효한 것으로 처리
      },
      {
        name: '쿠팡 메인 페이지',
        input: 'https://www.coupang.com',
        expected: false,
      },
      {
        name: '다른 사이트 URL',
        input: 'https://www.amazon.com/dp/B08N5WRWNW',
        expected: false,
      },
      {
        name: '빈 문자열',
        input: '',
        expected: false,
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      test(name, () => {
        const result = isValidCoupangProductUrl(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('extractProductId', () => {
    const testCases = [
      {
        name: '데스크톱 URL에서 상품 ID 추출',
        input: 'https://www.coupang.com/vp/products/123456789',
        expected: '123456789',
      },
      {
        name: '모바일 URL에서 상품 ID 추출',
        input: 'https://m.coupang.com/vm/products/987654321',
        expected: '987654321',
      },
      {
        name: '파라미터가 있는 URL에서 상품 ID 추출',
        input:
          'https://www.coupang.com/vp/products/181699807?itemId=520561494&vendorItemId=85694345825',
        expected: '181699807',
      },
      {
        name: '링크 변환 URL',
        input: 'https://link.coupang.com/a/cuBzJN',
        expected: null,
      },
      {
        name: '상품 ID가 없는 URL',
        input: 'https://www.coupang.com/vp/products/',
        expected: null,
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      test(name, () => {
        const result = extractProductId(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('normalizeCoupangUrl', () => {
    const testCases = [
      {
        name: '링크 변환 URL 정규화',
        input: 'https://link.coupang.com/a/cuBzJN',
        expected: 'https://link.coupang.com/a/cuBzJN', // 모든 URL을 원본 그대로 유지
      },
      {
        name: '모바일 URL 정규화',
        input:
          'https://m.coupang.com/vm/products/10294558?itemId=17601366094&vendorItemId=90766204239',
        expected:
          'https://m.coupang.com/vm/products/10294558?itemId=17601366094&vendorItemId=90766204239', // 원본 그대로 유지
      },
      {
        name: '복잡한 데스크톱 URL 정규화',
        input:
          'https://www.coupang.com/vp/products/181699807?itemId=520561494&vendorItemId=85694345825&src=1191000&spec=10999999&addtag=400&ctag=181699807&lptag=CFM27924792&itime=20250507142525&pageType=PRODUCT&pageValue=181699807&wPcid=15878015568245168209143&wRef=&wTime=20250507142525&redirect=landing&mcid=f91811085ef04e0c92b9f33ddfcfa3c9&sharesource=sharebutton&style=&isshortened=Y&settlement=N',
        expected:
          'https://www.coupang.com/vp/products/181699807?itemId=520561494&vendorItemId=85694345825&src=1191000&spec=10999999&addtag=400&ctag=181699807&lptag=CFM27924792&itime=20250507142525&pageType=PRODUCT&pageValue=181699807&wPcid=15878015568245168209143&wRef=&wTime=20250507142525&redirect=landing&mcid=f91811085ef04e0c92b9f33ddfcfa3c9&sharesource=sharebutton&style=&isshortened=Y&settlement=N', // 원본 그대로 유지
      },
      {
        name: '이미 정규화된 URL',
        input: 'https://www.coupang.com/vp/products/123456789',
        expected: 'https://www.coupang.com/vp/products/123456789',
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      test(name, () => {
        const result = normalizeCoupangUrl(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('extractAndValidateCoupangUrl', () => {
    const testCases = [
      {
        name: '유효한 링크 변환 URL',
        input: `쿠팡을 추천합니다!
샌디스크 울트라 듀얼 드라이브 럭스 USB Type C SDDDC4
https://link.coupang.com/a/cuBzJN`,
        expected: {
          success: true,
          hasUrl: true,
          hasProductId: false, // 링크 변환 URL은 상품 ID를 추출할 수 없음
        },
      },
      {
        name: '유효한 모바일 URL',
        input:
          'https://m.coupang.com/vm/products/10294558?itemId=17601366094&vendorItemId=90766204239',
        expected: {
          success: true,
          hasUrl: true,
          hasProductId: true,
          normalizedUrl:
            'https://m.coupang.com/vm/products/10294558?itemId=17601366094&vendorItemId=90766204239', // 원본 그대로 유지
        },
      },
      {
        name: '유효한 데스크톱 URL',
        input:
          'https://www.coupang.com/vp/products/181699807?itemId=520561494&vendorItemId=85694345825',
        expected: {
          success: true,
          hasUrl: true,
          hasProductId: true,
          normalizedUrl:
            'https://www.coupang.com/vp/products/181699807?itemId=520561494&vendorItemId=85694345825', // 원본 그대로 유지
        },
      },
      {
        name: '쿠팡이 아닌 URL',
        input: 'https://www.amazon.com/dp/B08N5WRWNW',
        expected: {
          success: false,
          hasMessage: true,
        },
      },
      {
        name: '빈 문자열',
        input: '',
        expected: {
          success: false,
          hasMessage: true,
        },
      },
      {
        name: 'URL이 없는 텍스트',
        input: '쿠팡을 추천합니다! 좋은 상품이에요.',
        expected: {
          success: false,
          hasMessage: true,
        },
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      test(name, () => {
        const result = extractAndValidateCoupangUrl(input);

        expect(result.success).toBe(expected.success);

        if (expected.success) {
          expect(result.url).toBeDefined();
          expect(result.originalUrl).toBeDefined();

          if (expected.hasProductId) {
            expect(result.productId).toBeDefined();
          }

          if (expected.normalizedUrl) {
            expect(result.url).toBe(expected.normalizedUrl);
          }
        } else {
          expect(result.message).toBeDefined();
        }
      });
    });
  });

  describe('통합 테스트 - 실제 사용 시나리오', () => {
    test('복잡한 텍스트에서 URL 추출 및 정규화', () => {
      const complexText = `안녕하세요! 
      
      오늘 추천 상품입니다:
      
      1. 샌디스크 울트라 듀얼 드라이브 럭스 USB Type C SDDDC4
      https://link.coupang.com/a/cuBzJN
      
      2. 모바일에서 본 상품
      https://m.coupang.com/vm/products/10294558?itemId=17601366094&vendorItemId=90766204239
      
      3. 복잡한 URL
      https://www.coupang.com/vp/products/181699807?itemId=520561494&vendorItemId=85694345825&src=1191000&spec=10999999&addtag=400&ctag=181699807&lptag=CFM27924792&itime=20250507142525&pageType=PRODUCT&pageValue=181699807&wPcid=15878015568245168209143&wRef=&wTime=20250507142525&redirect=landing&mcid=f91811085ef04e0c92b9f33ddfcfa3c9&sharesource=sharebutton&style=&isshortened=Y&settlement=N
      
      감사합니다!`;

      const result = extractAndValidateCoupangUrl(complexText);

      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
      expect(result.originalUrl).toBeDefined();
      expect(result.productId).toBeDefined();
    });

    test('여러 URL이 있는 경우 첫 번째 URL 추출', () => {
      const multipleUrls = `첫 번째: https://www.coupang.com/vp/products/123456789
      두 번째: https://m.coupang.com/vm/products/987654321`;

      const result = extractAndValidateCoupangUrl(multipleUrls);

      expect(result.success).toBe(true);
      expect(result.originalUrl).toBe('https://www.coupang.com/vp/products/123456789');
    });
  });
});
