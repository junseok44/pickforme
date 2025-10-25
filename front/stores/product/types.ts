export interface Product {
    name: string;
    price: number;
    origin_price: number; // 할인 전 가격
    discount_rate: number | null; // 할인율
    reviews: number | null; // 리뷰 수
    ratings: number | null; // 평점
    url: string; // 상품 링크 주소
    thumbnail: string; // 상품 썸네일 이미지 주소
    platform: string;
    detail_images?: string[]; // 상품 상세 이미지 주소 리스트
}

export interface GetProductResponse {
    product: Product;
}

export interface ScrapedProductDetail {
    images?: string[]; // 웹뷰에서 스크래핑한 상품 상세이미지 주소 리스트
    reviews?: string[]; // 웹뷰에서 스크래핑한 상품 리뷰 리스트
}

// export interface GetProductDetailRequest extends ScrapedProductDetail {
//     product: Product;
//     question?: string;
// }

export interface GetProductDetailRequest {
    product: Product;
    reviews?: string[]; // 웹뷰에서 스크래핑한 상품 리뷰 리스트
    question?: string; // AI 포미 질문
}

export interface GetProductDetailResponse {
    product?: Product;
    caption?: string; // 이미지 설명
    report?: string; // 상세페이지 설명
    review?: {
        // 리뷰 요약
        pros: string[]; // 긍정 리뷰
        cons: string[]; // 부정 리뷰
        bests: string[]; // 베스트 리뷰
    };
    answer?: string; // AI 포미 답변
}

export interface ProductDetailState extends GetProductDetailResponse {
    url: string;
    question?: string; // TABS.QUESTION에 대응하는 속성
    review?: {
        // TABS.REVIEW에 대응하는 속성
        pros: string[];
        cons: string[];
        bests: string[];
    };
}

interface LocalProductSection {
    name: string; // 협업 상품 섹션 명
    order: number; // 섹션 배치 순서 (작을 수록 먼저 배치)
    products: Product[]; // 협업 상품 리스트
}

export interface GetMainProductsResponse {
    // 홈 탭 상품 리스트
    special: Product[]; // 오늘의 특가
    random: Product[]; // 카테고리별 추천
    local: LocalProductSection[]; // 협업 상품
}

export interface MainProductsState extends GetMainProductsResponse {}

export interface SearchProductsResponse {
    products: Product[]; // 검색 결과 상품 리스트
    page: number; // 현재 페이지
    count: number; // 검색 결과 총 개수
    keyword?: string; // 검색어
}

export interface SearchProductsRequest {
    page: number;
    query: string;
    sort: string; // 정렬 기준
    onLink?: (a: string) => void;
    onQuery?: () => void;
}

export interface ParseProductUrlAPIRequest {
    url: string;
}

export interface ParseProductUrlAPIResponse {
    platform: string;
    url: string;
}

export interface CoupangCrawlResponse {
    success: boolean;
    data: {
        name: string;
        brand: string;
        price: number;
        origin_price: number;
        discount_rate: number | null;
        ratings: number;
        reviews_count: number;
        thumbnail: string;
        detail_images: string[];
        url: string;
        reviews: string[];
    };
    extractedUrl: string;
    productId: string;
}

export interface ProductReview {
    reviews: string[]; // 웹뷰에서 스크래핑한 상품 리뷰 리스트
}
