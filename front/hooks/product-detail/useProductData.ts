import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { searchResultAtom, wishProductsAtom, mainProductsAtom } from '../../stores/product/atoms';
import { requestsAtom } from '../../stores/request/atoms';
import { Product } from '../../stores/product/types';

interface UseProductDataProps {
    productUrl: string;
}

export const useProductData = ({ productUrl }: UseProductDataProps) => {
    const searchResult = useAtomValue(searchResultAtom);
    const mainProducts = useAtomValue(mainProductsAtom);
    const wishlist = useAtomValue(wishProductsAtom);
    const requests = useAtomValue(requestsAtom);

    // URL 비교 헬퍼 함수
    const isSameProductUrl = (url: string) => decodeURIComponent(url) === productUrl;

    // 현재 상품에 대한 모든 request를 필터링하고 최신순으로 정렬
    const productRequests = useMemo(() => {
        return requests
            .filter(req => req.product && decodeURIComponent(req.product.url) === productUrl)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [requests, productUrl]);

    // 첫 번째 request (기존 호환성을 위해)
    const request = productRequests.length > 0 ? productRequests[0] : undefined;

    // 위시리스트에 있는지 확인
    const wishlistItem = useMemo(() => {
        return wishlist.find(wishProduct => decodeURIComponent(wishProduct.url) === productUrl);
    }, [wishlist, productUrl]);

    // 로컬 상품인지 확인
    const isLocal = useMemo(() => {
        return (
            mainProducts.local
                .map(section => section.products)
                .flat()
                .find(({ url }) => decodeURIComponent(url) === productUrl) !== undefined
        );
    }, [mainProducts, productUrl]);

    // 상품 객체 찾기
    const product = useMemo(() => {
        // 1. 요청에서 제품 확인
        if (request?.product) return request.product;

        // 2. 검색 결과에서 제품 확인
        if (searchResult?.products) {
            const foundProduct = searchResult.products.find(item => isSameProductUrl(item.url));
            if (foundProduct) return foundProduct;
        }

        // 3. 메인 제품 목록에서 제품 확인
        const allProducts = [
            ...mainProducts.local.map(section => section.products).flat(),
            ...mainProducts.special,
            ...mainProducts.random
        ];

        const mainProduct = allProducts.find(({ url }) => isSameProductUrl(url));
        if (mainProduct) return mainProduct;

        // 4. 위시리스트에서 제품 확인
        if (wishlistItem) return wishlistItem;

        // 5. 기본값 반환
        return { url: productUrl } as Product;
    }, [productUrl, request, searchResult, mainProducts, wishlistItem]);

    return {
        product,
        productRequests,
        request,
        wishlistItem,
        isLocal
    };
};
