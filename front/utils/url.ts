export const resolveRedirectUrl = async (url: string): Promise<string> => {
    try {
        return new Promise(async resolve => {
            try {
                const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
                resolve(response.url);
            } catch (error) {
                resolve(url); // 오류 발생 시 원래 URL 반환
            }
        });
    } catch (error) {
        return url; // 실패 시 원래 URL 반환
    }
};

// URL에서 유효한 https URL만 추출하는 함수
export const sanitizeUrl = (inputUrl: string): string => {
    try {
        if (!inputUrl || typeof inputUrl !== 'string') return '';

        // https: 또는 http:가 포함된 첫 번째 유효한 URL 부분 추출
        const httpsIndex = inputUrl.indexOf('https:');
        const httpIndex = inputUrl.indexOf('http:');

        let startIndex = -1;
        if (httpsIndex >= 0) {
            startIndex = httpsIndex;
        } else if (httpIndex >= 0) {
            startIndex = httpIndex;
        }

        if (startIndex >= 0) {
            return inputUrl.substring(startIndex);
        }

        return inputUrl;
    } catch (error) {
        console.error('URL 정리 중 오류:', error);
        return inputUrl;
    }
};

// URL을 정규화하여 비교 가능한 형태로 변환 (임시 파라미터 제거)
export const normalizeUrl = (url: string): string => {
    try {
        if (!url) return '';

        const urlObj = new URL(url);

        // 쿠팡 URL인 경우 필수 파라미터만 유지
        if (urlObj.hostname.includes('coupang.com')) {
            // 필수 파라미터 목록
            const essentialParams = ['itemId', 'vendorItemId'];

            // 새로운 URLSearchParams 생성
            const params = new URLSearchParams();

            // 필수 파라미터만 추가
            essentialParams.forEach(param => {
                const value = urlObj.searchParams.get(param);
                if (value) {
                    params.append(param, value);
                }
            });

            // 정규화된 URL 생성
            return `${urlObj.origin}${urlObj.pathname}?${params.toString()}`;
        }

        return url;
    } catch (error) {
        console.error('URL 정규화 중 오류:', error);
        return url;
    }
};

// 쿠팡 URL을 리뷰 페이지 URL로 변환하는 함수
export const convertToCoupangReviewUrl = async (url: string): Promise<string> => {
    try {
        let processedUrl = url;
        let productId = null;

        // 쿠팡 앱 링크 처리 (link.coupang.com)
        if (url.includes('link.coupang.com')) {
            try {
                // 먼저 URL에서 직접 pageKey 추출 시도
                const urlObj = new URL(url);
                const pageKey = urlObj.searchParams.get('pageKey');
                const itemId = urlObj.searchParams.get('itemId');

                if (pageKey) {
                    // pageKey가 있으면 바로 사용
                    productId = pageKey;
                } else {
                    // pageKey가 없으면 리디렉트 시도
                    processedUrl = await resolveRedirectUrl(url);

                    // 리디렉트 결과가 여전히 link.coupang.com인 경우 무한루프 방지
                    if (processedUrl.includes('link.coupang.com')) {
                        throw new Error('link.coupang.com 리디렉트 결과가 동일하여 무한루프 방지');
                    }
                }
            } catch (error) {
                console.warn('link.coupang.com 처리 중 오류:', error);
                throw new Error('쿠팡 제품 ID를 찾을 수 없습니다.');
            }
        }

        // productId가 아직 없으면 processedUrl에서 추출
        if (!productId) {
            // 패턴 1: productId= 쿼리 파라미터
            if (processedUrl.includes('productId=')) {
                productId = processedUrl.split('productId=')[1]?.split('&')[0];
            }
            // 패턴 2: products/ 경로 사용 (모바일 및 데스크톱)
            else if (
                processedUrl.includes('coupang.com/vp/products/') ||
                processedUrl.includes('coupang.com/vm/products/')
            ) {
                let idPart = processedUrl.split('products/')[1] || '';
                productId = idPart.split(/[\?#]/)[0]; // 쿼리스트링이나 해시 태그 제거
            }
        }

        if (!productId) {
            throw new Error('쿠팡 제품 ID를 찾을 수 없습니다.');
        }

        // 리뷰 페이지 URL 구성
        return `https://m.coupang.com/vm/products/${productId}/brand-sdp/reviews/detail`;
    } catch (error) {
        console.error('쿠팡 리뷰 URL 변환 중 오류:', error);
        throw error;
    }
};

export const parseCoupangIdsFromUrl = (s?: string) => {
    if (!s) return {};
    try {
        const u = new URL(s);
        const productId = u.pathname.match(/\/products\/(\d+)/)?.[1];
        const itemId = u.searchParams.get('itemId') || undefined;
        const vendorItemId = u.searchParams.get('vendorItemId') || undefined;
        return { productId, itemId, vendorItemId };
    } catch {
        return {};
    }
};
