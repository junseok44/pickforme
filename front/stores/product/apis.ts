import client, { handleApiError } from '../../utils/axios';

import {
    GetProductResponse,
    GetProductDetailRequest,
    GetProductDetailResponse,
    GetMainProductsResponse,
    SearchProductsRequest,
    SearchProductsResponse,
    ParseProductUrlAPIRequest,
    ParseProductUrlAPIResponse,
    CoupangCrawlResponse
} from './types';

export const GetMainProductsAPI = (id: string) =>
    client
        .get<GetMainProductsResponse>(`/discover/products/${id}`)
        .catch(error => handleApiError(error, 'GetMainProducts'));
export const GetProductAPI = (url: string) =>
    client
        .post<GetProductResponse>(`/discover/product`, { url })
        .catch(error => handleApiError(error, 'GetProductAPI'));

export const GetProductReviewAPI = (params: GetProductDetailRequest) => {
    const product = params.product;
    const reviews = params.reviews;
    return client
        .post<GetProductDetailResponse>(`/discover/product/detail/review`, { product, reviews })
        .catch(error => handleApiError(error, 'GetProductReviewAPI'));
};

export const GetProductReportAPI = (params: GetProductDetailRequest) =>
    client
        .post<GetProductDetailResponse>(`/discover/product/detail/report`, params)
        .catch(error => handleApiError(error, 'GetProductReportAPI'));

export const GetProductCaptionAPI = (params: GetProductDetailRequest) =>
    client
        .post<GetProductDetailResponse>(`/discover/product/detail/caption`, params)
        .catch(error => handleApiError(error, 'GetProductCaptionAPI'));

export const GetProductAIAnswerAPI = (params: GetProductDetailRequest) =>
    client
        .post<GetProductDetailResponse>(`/discover/product/detail/ai-answer`, params)
        .catch(error => handleApiError(error, 'GetProductAIAnswerAPI'));

export const SearchProductsAPI = (params: SearchProductsRequest) =>
    client
        .post<SearchProductsResponse>('/discover/search', params)
        .catch(error => handleApiError(error, 'SearchProductsAPI'));

export const ParseProductUrlAPI = (params: ParseProductUrlAPIRequest) =>
    client
        .post<ParseProductUrlAPIResponse>('/discover/platform', params)
        .catch(error => handleApiError(error, 'ParseProductUrlAPI'));

export const UpdateProductAPI = (params: GetProductDetailRequest) =>
    client
        .put<GetProductResponse>('/discover/product', params)
        .catch(error => handleApiError(error, 'UpdateProductAPI'));

export const CoupangCrawlAPI = (url: string) =>
    client
        .post<CoupangCrawlResponse>('/coupang/crawl', { url })
        .catch(error => handleApiError(error, 'CoupangCrawlAPI'));

// [기존] 서버쪽 크롤러를 통해 상품을 검색합니다.

export const SearchCoupangAPI = (searchText: string) =>
    client
        .post(
            '/coupang/search',
            { searchText },
            {
                timeout: 20000
            }
        )
        .catch(error => handleApiError(error, 'SearchCoupangAPI'));

/**
 * [신규] 서버의 Coupang Partners API를 통해 상품을 검색합니다.
 */
export const SearchCoupangByApiAPI = (keyword: string, limit: number = 10) => {
    return client.post<{
        success: boolean;
        data: {
            id: number;
            name: string;
            price: number;
            thumbnail: string;
            url: string;
            platform: string;
        }[];
    }>('/coupang/api/search', { keyword, limit });
};
