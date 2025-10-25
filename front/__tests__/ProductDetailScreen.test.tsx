import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { Provider } from 'jotai';
import ProductDetailScreen from '../components/product-detail/ProductDetailScreen';
import { TABS } from '../utils/common';
import type { Product } from '../stores/product/types';
// Import the mocked functions to configure them in beforeEach
import { useWebViewDetail } from '../components/Webview/detail/webview-detail';
import { useWebViewReviews } from '../components/webview-reviews';
import { useProductData } from '../hooks/product-detail/useProductData';
import { useProductActions } from '../hooks/product-detail/useProductActions';
import {
    GetProductCaptionAPI,
    GetProductReportAPI,
    GetProductReviewAPI,
    CoupangCrawlAPI
} from '../stores/product/apis';
import { attempt } from '../utils/axios';
import { useHydrateAtoms } from 'jotai/utils';
import { productDetailAtom, loadingStatusAtom, LoadingStatus, productReviewAtom } from '../stores/product/atoms';

// Mock basic hooks that we don't need to test
jest.mock('../hooks/product-detail/useProductData', () => ({
    useProductData: jest.fn()
}));

jest.mock('../hooks/product-detail/useProductActions', () => ({
    useProductActions: jest.fn()
}));

// Mock AI APIs - these will be tested through mocking
jest.mock('../stores/product/apis', () => ({
    GetProductCaptionAPI: jest.fn(),
    GetProductReportAPI: jest.fn(),
    GetProductReviewAPI: jest.fn(),
    GetProductAPI: jest.fn(),
    CoupangCrawlAPI: jest.fn(),
    UpdateProductAPI: jest.fn()
}));

// Mock request APIs used by QuestionTab
jest.mock('../stores/request/apis', () => ({
    PostRequestAPI: jest.fn(),
    GetRequestsAPI: jest.fn(),
    GetRequestAPI: jest.fn()
}));

// Mock attempt function to avoid retry delays in tests
jest.mock('../utils/axios', () => ({
    ...jest.requireActual('../utils/axios'),
    attempt: jest.fn()
}));

// Test data
const mockProduct: Product = {
    name: '테스트 상품',
    price: 10000,
    origin_price: 12000,
    discount_rate: 17,
    reviews: 100,
    ratings: 4.5,
    url: 'https://www.coupang.com/vp/products/123456',
    thumbnail: 'https://example.com/thumbnail.jpg',
    platform: 'coupang',
    detail_images: ['https://example.com/detail1.jpg', 'https://example.com/detail2.jpg']
};

const mockReviews = ['리뷰 1', '리뷰 2', '리뷰 3'];

// Mock webview hooks specifically for ProductDetailScreen tests
jest.mock('../components/Webview/detail/webview-detail', () => ({
    useWebViewDetail: jest.fn()
}));

jest.mock('../components/webview-reviews', () => ({
    useWebViewReviews: jest.fn()
}));

const mockUseWebViewDetail = useWebViewDetail as jest.MockedFunction<typeof useWebViewDetail>;
const mockUseWebViewReviews = useWebViewReviews as jest.MockedFunction<typeof useWebViewReviews>;

const mockUseProductData = useProductData as jest.MockedFunction<typeof useProductData>;
const mockUseProductActions = useProductActions as jest.MockedFunction<typeof useProductActions>;

const mockGetProductCaptionAPI = GetProductCaptionAPI as jest.MockedFunction<typeof GetProductCaptionAPI>;
const mockGetProductReportAPI = GetProductReportAPI as jest.MockedFunction<typeof GetProductReportAPI>;
const mockGetProductReviewAPI = GetProductReviewAPI as jest.MockedFunction<typeof GetProductReviewAPI>;
const mockCoupangCrawlAPI = CoupangCrawlAPI as jest.MockedFunction<typeof CoupangCrawlAPI>;

const mockAttempt = attempt as jest.MockedFunction<typeof attempt>;

// 추가해야 할 테스트
// 1. 접근성 관련 테스트
// 2. 질문탭에서 정보 로드, 만약 포인트 없을때 어떻게 되는지 등.

describe('ProductDetailScreen 탭별 테스트', () => {
    // Store callbacks for testing
    let webViewDetailCallbacks: any = {};
    let webViewReviewsCallbacks: any = {};
    let webViewFallbackCallbacks: any = {};

    // Set timeout for all tests in this describe block
    jest.setTimeout(10000);

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset callbacks
        webViewDetailCallbacks = {};
        webViewReviewsCallbacks = {};
        webViewFallbackCallbacks = {};

        // Reset all API mocks to their default state
        mockGetProductCaptionAPI.mockReset();
        mockGetProductReportAPI.mockReset();
        mockGetProductReviewAPI.mockReset();
        mockCoupangCrawlAPI.mockReset();

        // Mock attempt function to avoid retry delays - immediately return success or failure
        mockAttempt.mockImplementation(async operation => {
            try {
                const value = await operation();
                return { ok: true, value };
            } catch (error) {
                return { ok: false, error };
            }
        });

        // Mock webview hooks with callback capture
        mockUseWebViewDetail.mockImplementation(({ onMessage, onError, onAttemptLog }) => {
            webViewDetailCallbacks = { onMessage, onError, onAttemptLog };
            return <div data-testid="webview-detail" />;
        });

        mockUseWebViewReviews.mockImplementation(({ onMessage, onError }) => {
            webViewReviewsCallbacks = { onMessage, onError };
            return {
                component: <div data-testid="webview-reviews" />,
                scrollDown: jest.fn(),
                runJavaScript: jest.fn()
            };
        });

        // Default mock implementations
        mockUseProductData.mockReturnValue({
            product: mockProduct,
            productRequests: [],
            request: undefined,
            wishlistItem: undefined,
            isLocal: false
        });

        mockUseProductActions.mockReturnValue({
            handleClickBuy: jest.fn(),
            handleClickWish: jest.fn(),
            handleClickSend: jest.fn(),
            handleClickRequest: jest.fn(),
            handleClickContact: jest.fn()
        });
    });

    const renderComponent = () => {
        return render(
            <Provider>
                <ProductDetailScreen />
            </Provider>
        );
    };

    describe('이미지 설명 탭 (CAPTION) 테스트', () => {
        it('웹뷰에서 상품 정보를 성공적으로 받아오고 AI 서버에서 이미지 설명 생성에 성공한다', async () => {
            // Mock AI API success response
            mockGetProductCaptionAPI.mockResolvedValue({
                data: {
                    caption: 'AI가 생성한 이미지 설명입니다.'
                }
            } as any);

            const { getByText } = renderComponent();

            // Wait for component to mount
            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Simulate webview success - getting product data
            act(() => {
                if (webViewDetailCallbacks.onMessage) {
                    webViewDetailCallbacks.onMessage(mockProduct);
                }
            });

            // Check initial loading state for caption tab
            await waitFor(() => {
                expect(getByText('상품의 이미지 설명을 생성중이에요.')).toBeTruthy();
            });

            // Wait for AI API call to complete and data to be displayed
            await waitFor(
                () => {
                    expect(getByText('AI가 생성한 이미지 설명입니다.')).toBeTruthy();
                },
                { timeout: 3000 }
            );
        });

        it('웹뷰에서 상품 정보는 받았지만 AI 서버에서 이미지 설명 생성에 실패한다', async () => {
            // Mock AI API failure
            mockGetProductCaptionAPI.mockRejectedValue(new Error('AI API Error'));

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Simulate webview success
            act(() => {
                if (webViewDetailCallbacks.onMessage) {
                    webViewDetailCallbacks.onMessage(mockProduct);
                }
            });

            // Wait for error state
            await waitFor(
                () => {
                    expect(getByText('이미지 설명을 생성하는데 실패했습니다.')).toBeTruthy();
                    expect(getByText('다시 생성하기')).toBeTruthy();
                },
                { timeout: 3000 }
            );
        });

        it('웹뷰 실패 후 서버 크롤링으로 데이터를 받아와서 이미지 설명이 성공적으로 생성된다', async () => {
            // Mock server crawling success response
            mockCoupangCrawlAPI.mockResolvedValue({
                data: {
                    success: true,
                    data: {
                        ...mockProduct,
                        name: '서버 크롤링으로 받은 상품',
                        thumbnail: 'https://server-thumbnail.jpg'
                    }
                }
            } as any);

            // Mock AI API success after server crawling
            mockGetProductCaptionAPI.mockResolvedValue({
                data: {
                    caption: '서버 크롤링 후 생성된 이미지 설명입니다.'
                }
            } as any);

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Simulate webview failure
            act(() => {
                if (webViewDetailCallbacks.onError) {
                    webViewDetailCallbacks.onError();
                }
            });

            // Wait for server crawling to complete and AI generation to succeed
            await waitFor(
                () => {
                    expect(getByText('서버 크롤링 후 생성된 이미지 설명입니다.')).toBeTruthy();
                },
                { timeout: 3000 }
            );
        });

        it('웹뷰와 서버 크롤링 모두 실패했을 때 NO_DATA 메시지가 표시된다', async () => {
            // Mock server crawling failure
            mockCoupangCrawlAPI.mockRejectedValue(new Error('Server crawling failed'));

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Simulate webview failure
            act(() => {
                if (webViewDetailCallbacks.onError) {
                    webViewDetailCallbacks.onError();
                }
            });

            await waitFor(() => {
                expect(getByText('이미지를 불러오는데 실패했습니다.')).toBeTruthy();
            });
        });

        it('이미지 설명 탭에서 AI 서버에서 설명 생성에 실패했을 때 재생성 버튼을 클릭하면 재생성이 실행된다', async () => {
            // Mock initial failure then success
            mockGetProductCaptionAPI.mockRejectedValue(new Error('First attempt failed'));

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Get product data first
            act(() => {
                if (webViewDetailCallbacks.onMessage) {
                    webViewDetailCallbacks.onMessage(mockProduct);
                }
            });

            // Check initial loading state for caption tab (기본 탭)
            await waitFor(() => {
                expect(getByText('상품의 이미지 설명을 생성중이에요.')).toBeTruthy();
            });

            // Wait for error state
            await waitFor(() => {
                expect(getByText('이미지 설명을 생성하는데 실패했습니다.')).toBeTruthy();
                expect(getByText('다시 생성하기')).toBeTruthy();
            });

            // Mock success for retry
            mockGetProductCaptionAPI.mockResolvedValue({
                data: { caption: '재생성된 이미지 설명입니다.' }
            } as any);

            // Click retry button
            const retryButton = getByText('다시 생성하기');
            fireEvent.press(retryButton);

            // Wait for regenerated content
            await waitFor(
                () => {
                    expect(getByText('재생성된 이미지 설명입니다.')).toBeTruthy();
                },
                { timeout: 3000 }
            );
        });
    });

    describe('리뷰 요약 탭 (REVIEW) 테스트', () => {
        it('리뷰 요약 탭을 클릭했을 때 웹뷰에서 리뷰 데이터를 받아와서 AI 서버에서 성공적으로 요약한다', async () => {
            // Mock AI API success response for review
            mockGetProductReviewAPI.mockResolvedValue({
                data: {
                    review: {
                        pros: ['좋은 점 1', '좋은 점 2'],
                        cons: ['아쉬운 점 1'],
                        bests: ['베스트 리뷰 1']
                    }
                }
            } as any);

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Simulate getting product data first
            act(() => {
                if (webViewDetailCallbacks.onMessage) {
                    webViewDetailCallbacks.onMessage(mockProduct);
                }
            });

            // Click on review tab
            const reviewTab = getByText('리뷰 요약');
            fireEvent.press(reviewTab);

            // Simulate webview reviews success
            act(() => {
                if (webViewReviewsCallbacks.onMessage) {
                    webViewReviewsCallbacks.onMessage(mockReviews);
                }
            });

            // Check loading state first
            await waitFor(() => {
                expect(getByText('상품의 리뷰를 AI가 요약중이에요.')).toBeTruthy();
            });

            // Wait for review summary to be displayed
            await waitFor(
                () => {
                    expect(getByText(/좋은 점 1/)).toBeTruthy();
                    expect(getByText(/좋은 점 2/)).toBeTruthy();
                    expect(getByText(/아쉬운 점 1/)).toBeTruthy();
                    expect(getByText(/베스트 리뷰 1/)).toBeTruthy();
                },
                { timeout: 3000 }
            );
        });

        it('리뷰 요약 탭에서 웹뷰는 성공했지만 AI 서버에서 요약 생성에 실패한다', async () => {
            // Mock AI API failure
            mockGetProductReviewAPI.mockRejectedValue(new Error('Review AI API Error'));

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Get product data first
            act(() => {
                if (webViewDetailCallbacks.onMessage) {
                    webViewDetailCallbacks.onMessage(mockProduct);
                }
            });

            // Click on review tab
            const reviewTab = getByText('리뷰 요약');
            fireEvent.press(reviewTab);

            // Simulate webview reviews success
            act(() => {
                if (webViewReviewsCallbacks.onMessage) {
                    webViewReviewsCallbacks.onMessage(mockReviews);
                }
            });

            // Wait for error message
            await waitFor(
                () => {
                    expect(getByText('리뷰 요약을 생성하는데 실패했습니다.')).toBeTruthy();
                    expect(getByText('다시 생성하기')).toBeTruthy();
                },
                { timeout: 3000 }
            );
        });

        it('리뷰 요약 탭에서 웹뷰 실패 후 서버 크롤링으로 데이터를 받아와서 리뷰 요약이 성공적으로 생성된다', async () => {
            // Mock server crawling success response with reviews
            mockCoupangCrawlAPI.mockResolvedValue({
                data: {
                    success: true,
                    data: {
                        ...mockProduct,
                        name: '서버 크롤링으로 받은 상품',
                        thumbnail: 'https://server-thumbnail.jpg',
                        reviews: ['서버 크롤링 리뷰 1', '서버 크롤링 리뷰 2', '서버 크롤링 리뷰 3'] // 리뷰 데이터 추가
                    }
                }
            } as any);

            // Mock AI API success after server crawling
            mockGetProductReviewAPI.mockResolvedValue({
                data: {
                    review: {
                        pros: ['서버 크롤링 후 좋은 점'],
                        cons: ['서버 크롤링 후 아쉬운 점'],
                        bests: ['서버 크롤링 후 베스트 리뷰']
                    }
                }
            } as any);

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Get product data first
            act(() => {
                if (webViewDetailCallbacks.onMessage) {
                    webViewDetailCallbacks.onMessage(mockProduct);
                }
            });

            // Click on review tab
            const reviewTab = getByText('리뷰 요약');
            fireEvent.press(reviewTab);

            // Simulate webview reviews failure
            act(() => {
                if (webViewReviewsCallbacks.onError) {
                    webViewReviewsCallbacks.onError();
                }
            });

            // Wait for server crawling to complete and AI generation to succeed
            await waitFor(
                () => {
                    expect(getByText(/서버 크롤링 후 좋은 점/)).toBeTruthy();
                    expect(getByText(/서버 크롤링 후 아쉬운 점/)).toBeTruthy();
                    expect(getByText(/서버 크롤링 후 베스트 리뷰/)).toBeTruthy();
                },
                { timeout: 3000 }
            );
        });

        it('리뷰 요약 탭에서 웹뷰, 서버 크롤링 모두 실패했을 때 NO_DATA 메시지가 표시된다', async () => {
            // Mock server crawling failure BEFORE rendering component
            mockCoupangCrawlAPI.mockRejectedValue(new Error('Server crawling failed'));

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Get product data first
            act(() => {
                if (webViewDetailCallbacks.onMessage) {
                    webViewDetailCallbacks.onMessage(mockProduct);
                }
            });

            // Click on review tab
            const reviewTab = getByText('리뷰 요약');
            fireEvent.press(reviewTab);

            // Simulate webview reviews failure
            act(() => {
                if (webViewReviewsCallbacks.onError) {
                    webViewReviewsCallbacks.onError();
                }
            });

            await waitFor(() => {
                expect(getByText('리뷰 정보를 불러오는데 실패했습니다.')).toBeTruthy();
            });
        });

        it('리뷰 요약 탭에서 AI 서버에서 요약 생성에 실패했을 때 재생성 버튼을 클릭하면 재생성이 실행된다', async () => {
            // Mock initial failure then success
            mockGetProductReviewAPI.mockRejectedValue(new Error('First attempt failed'));

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Get product data first
            act(() => {
                if (webViewDetailCallbacks.onMessage) {
                    webViewDetailCallbacks.onMessage(mockProduct);
                }
            });

            // 리뷰 요약 탭을 클릭
            const reviewTab = getByText('리뷰 요약');
            fireEvent.press(reviewTab);

            // Simulate webview reviews success to trigger AI generation
            act(() => {
                if (webViewReviewsCallbacks.onMessage) {
                    webViewReviewsCallbacks.onMessage(mockReviews);
                }
            });

            // Check loading state first
            await waitFor(() => {
                expect(getByText('상품의 리뷰를 AI가 요약중이에요.')).toBeTruthy();
            });

            // Wait for error state
            await waitFor(() => {
                expect(getByText('리뷰 요약을 생성하는데 실패했습니다.')).toBeTruthy();
                expect(getByText('다시 생성하기')).toBeTruthy();
            });

            // Mock success for retry
            mockGetProductReviewAPI.mockResolvedValue({
                data: {
                    review: {
                        pros: ['재생성된 좋은 점'],
                        cons: ['재생성된 아쉬운 점'],
                        bests: ['재생성된 베스트 리뷰']
                    }
                }
            } as any);

            // Click retry button
            const retryButton = getByText('다시 생성하기');
            fireEvent.press(retryButton);

            // Wait for regenerated content
            await waitFor(
                () => {
                    expect(getByText(/재생성된 좋은 점/)).toBeTruthy();
                    expect(getByText(/재생성된 아쉬운 점/)).toBeTruthy();
                    expect(getByText(/재생성된 베스트 리뷰/)).toBeTruthy();
                },
                { timeout: 3000 }
            );
        });
    });

    describe('상세페이지 설명 탭 (REPORT) 테스트', () => {
        it('상세페이지 설명 탭을 클릭했을 때 웹뷰에서 상세 이미지를 받아와서 AI 서버에서 성공적으로 설명을 생성한다', async () => {
            // Mock AI API success response for report
            mockGetProductReportAPI.mockResolvedValue({
                data: {
                    report: 'AI가 생성한 상세페이지 설명입니다.'
                }
            } as any);

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Simulate getting product data with detail images
            act(() => {
                if (webViewDetailCallbacks.onMessage) {
                    webViewDetailCallbacks.onMessage({
                        ...mockProduct
                    });
                }
            });

            // Click on report tab
            const reportTab = getByText('상세페이지 설명');
            fireEvent.press(reportTab);

            // Check loading state
            await waitFor(() => {
                expect(getByText('상품의 자세한 설명을 생성중이에요.')).toBeTruthy();
            });

            // Wait for report to be displayed
            await waitFor(
                () => {
                    expect(getByText('AI가 생성한 상세페이지 설명입니다.')).toBeTruthy();
                },
                { timeout: 3000 }
            );
        });

        it('상세페이지 설명 탭에서 웹뷰는 성공했지만 AI 서버에서 설명 생성에 실패한다', async () => {
            // Mock AI API failure
            mockGetProductReportAPI.mockRejectedValue(new Error('Report AI API Error'));

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Get product data with detail images
            act(() => {
                if (webViewDetailCallbacks.onMessage) {
                    webViewDetailCallbacks.onMessage({
                        ...mockProduct,
                        detail_images: ['detail1.jpg', 'detail2.jpg']
                    });
                }
            });

            // Click on report tab
            const reportTab = getByText('상세페이지 설명');
            fireEvent.press(reportTab);

            // Wait for error message
            await waitFor(
                () => {
                    expect(getByText('상세페이지 설명을 생성하는데 실패했습니다.')).toBeTruthy();
                    expect(getByText('다시 생성하기')).toBeTruthy();
                },
                { timeout: 3000 }
            );
        });

        it('상세페이지 설명 탭에서 웹뷰 실패 후 서버 크롤링으로 데이터를 받아와서 상세페이지 설명이 성공적으로 생성된다', async () => {
            // Mock server crawling success response
            mockCoupangCrawlAPI.mockResolvedValue({
                data: {
                    success: true,
                    data: {
                        ...mockProduct,
                        name: '서버 크롤링으로 받은 상품',
                        thumbnail: 'https://server-thumbnail.jpg',
                        detail_images: ['https://server-detail1.jpg', 'https://server-detail2.jpg']
                    }
                }
            } as any);

            // Mock AI API success after server crawling
            mockGetProductReportAPI.mockResolvedValue({
                data: {
                    report: '서버 크롤링 후 생성된 상세페이지 설명입니다.'
                }
            } as any);

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Get product data first
            act(() => {
                if (webViewDetailCallbacks.onMessage) {
                    webViewDetailCallbacks.onMessage(mockProduct);
                }
            });

            // Click on report tab
            const reportTab = getByText('상세페이지 설명');
            fireEvent.press(reportTab);

            // Simulate webview failure
            act(() => {
                if (webViewDetailCallbacks.onError) {
                    webViewDetailCallbacks.onError();
                }
            });

            // Wait for server crawling to complete and AI generation to succeed
            await waitFor(
                () => {
                    expect(getByText('서버 크롤링 후 생성된 상세페이지 설명입니다.')).toBeTruthy();
                },
                { timeout: 3000 }
            );
        });

        it('상세페이지 설명 탭에서 웹뷰, 서버 크롤링 모두 실패했을 때 NO_DATA 메시지가 표시된다', async () => {
            mockCoupangCrawlAPI.mockRejectedValue(new Error('Server crawling failed'));

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Get product data without detail images and server crawling failure
            act(() => {
                if (webViewDetailCallbacks.onError) {
                    webViewDetailCallbacks.onError();
                }
            });

            // Click on report tab and server crawling failure
            const reportTab = getByText('상세페이지 설명');
            fireEvent.press(reportTab);

            await waitFor(() => {
                expect(getByText('상세페이지 정보를 불러오는데 실패했습니다.')).toBeTruthy();
            });
        });

        it('상세페이지 설명 탭에서 AI 서버에서 설명 생성에 실패했을 때 재생성 버튼을 클릭하면 재생성이 실행된다', async () => {
            // Mock initial failure then success
            mockGetProductReportAPI.mockRejectedValue(new Error('First attempt failed'));

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Get product data first (with detail_images for report generation)
            act(() => {
                if (webViewDetailCallbacks.onMessage) {
                    webViewDetailCallbacks.onMessage({
                        ...mockProduct,
                        detail_images: ['detail1.jpg', 'detail2.jpg']
                    });
                }
            });

            // 상세페이지 설명 탭을 클릭
            const reportTab = getByText('상세페이지 설명');
            fireEvent.press(reportTab);

            await waitFor(() => {
                expect(getByText('상품의 자세한 설명을 생성중이에요.')).toBeTruthy();
            });

            // Wait for error state
            await waitFor(() => {
                expect(getByText('상세페이지 설명을 생성하는데 실패했습니다.')).toBeTruthy();
                expect(getByText('다시 생성하기')).toBeTruthy();
            });

            // Mock success for retry
            mockGetProductReportAPI.mockResolvedValue({
                data: { report: '재생성된 상세페이지 설명입니다.' }
            } as any);

            // Click retry button
            const retryButton = getByText('다시 생성하기');
            fireEvent.press(retryButton);

            // Wait for regenerated content
            await waitFor(
                () => {
                    expect(getByText('재생성된 상세페이지 설명입니다.')).toBeTruthy();
                },
                { timeout: 3000 }
            );
        });
    });

    describe('질문하기 탭 (QUESTION) 테스트', () => {
        it('질문하기 탭을 클릭했을 때 질문 입력 인터페이스가 표시된다', async () => {
            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText('테스트 상품')).toBeTruthy();
            });

            // Click on question tab
            const questionTab = getByText('질문하기');
            fireEvent.press(questionTab);

            // Question tab content should be displayed
            await waitFor(() => {
                expect(getByText('질문하기')).toBeTruthy();
                // Question input interface should be visible
            });
        });
    });
});
