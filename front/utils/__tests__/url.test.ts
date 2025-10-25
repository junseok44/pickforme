import { convertToCoupangReviewUrl } from '../url';

// fetch 모킹
global.fetch = jest.fn();

describe('convertToCoupangReviewUrl', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('쿠팡 앱 링크를 리뷰 URL로 변환', async () => {
        const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
        mockFetch.mockResolvedValueOnce({
            url: 'https://www.coupang.com/vp/products/12345?itemId=67890'
        } as Response);

        const result = await convertToCoupangReviewUrl('https://link.coupang.com/a/cuBzJN');
        expect(result).toBe('https://m.coupang.com/vm/products/12345/brand-sdp/reviews/detail');
    });

    it('쿠팡 모바일 URL을 리뷰 URL로 변환', async () => {
        const result = await convertToCoupangReviewUrl(
            'https://m.coupang.com/vm/products/10294558?itemId=17601366094&vendorItemId=90766204239'
        );
        expect(result).toBe('https://m.coupang.com/vm/products/10294558/brand-sdp/reviews/detail');
    });

    it('쿠팡 데스크톱 URL을 리뷰 URL로 변환', async () => {
        const result = await convertToCoupangReviewUrl(
            'https://www.coupang.com/vp/products/181699807?itemId=520561494&vendorItemId=85694345825&src=1191000&spec=10999999&addtag=400&ctag=181699807&lptag=CFM27924792&itime=20250507142525&pageType=PRODUCT&pageValue=181699807&wPcid=15878015568245168209143&wRef=&wTime=20250507142525&redirect=landing&mcid=f91811085ef04e0c92b9f33ddfcfa3c9&sharesource=sharebutton&style=&isshortened=Y&settlement=N'
        );
        expect(result).toBe('https://m.coupang.com/vm/products/181699807/brand-sdp/reviews/detail');
    });

    it('쿠팡 모바일 URL (쿼리스트링 없음)을 리뷰 URL로 변환', async () => {
        const result = await convertToCoupangReviewUrl('https://m.coupang.com/vm/products/7225189423?');
        expect(result).toBe('https://m.coupang.com/vm/products/7225189423/brand-sdp/reviews/detail');
    });

    it('productId 쿼리 파라미터가 있는 URL을 리뷰 URL로 변환', async () => {
        const result = await convertToCoupangReviewUrl(
            'https://www.coupang.com/vp/products/123?productId=456&other=param'
        );
        expect(result).toBe('https://m.coupang.com/vm/products/456/brand-sdp/reviews/detail');
    });

    it('다른 쿠팡 앱 링크들도 정상 변환', async () => {
        const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

        // 첫 번째 앱 링크
        mockFetch.mockResolvedValueOnce({
            url: 'https://www.coupang.com/vp/products/67890?itemId=12345'
        } as Response);
        const result1 = await convertToCoupangReviewUrl('https://link.coupang.com/a/cxAcbH');
        expect(result1).toBe('https://m.coupang.com/vm/products/67890/brand-sdp/reviews/detail');

        // 두 번째 앱 링크
        mockFetch.mockResolvedValueOnce({
            url: 'https://m.coupang.com/vm/products/11111?itemId=22222'
        } as Response);
        const result2 = await convertToCoupangReviewUrl('https://link.coupang.com/a/cxAfeD');
        expect(result2).toBe('https://m.coupang.com/vm/products/11111/brand-sdp/reviews/detail');
    });

    it('제품 ID를 찾을 수 없는 경우 에러 발생', async () => {
        await expect(convertToCoupangReviewUrl('https://www.coupang.com/invalid/url')).rejects.toThrow(
            '쿠팡 제품 ID를 찾을 수 없습니다.'
        );
    });

    it('fetch 실패 시 에러 처리', async () => {
        const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(convertToCoupangReviewUrl('https://link.coupang.com/a/invalid')).rejects.toThrow(
            '쿠팡 제품 ID를 찾을 수 없습니다.'
        );
    });
});
