import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { router, useLocalSearchParams } from 'expo-router';
import Modal from 'react-native-modal';

import useColorScheme from '../../hooks/useColorScheme';
import { Colors } from '@constants';
import {
    productDetailAtom,
    initProductDetailAtom,
    getProductDetailAtom,
    setProductAtom,
    setProductReviewAtom,
    productReviewAtom,
    loadingStatusAtom,
    setProductLoadingStatusAtom,
    LoadingStatus
} from '../../stores/product/atoms';
import { isShowRequestModalAtom } from '../../stores/auth/atoms';

import { Text, View } from '@components';
import BackHeader from '../BackHeader';
import Request from '../BottomSheet/Request';

// 리팩토링된 컴포넌트들
import ProductInfo from './ProductInfo';
import TabNavigation from './TabNavigation';
import ActionButtons from './ActionButtons';
import TabContent from './TabContent';

// 커스텀 훅들
import { useProductData } from '../../hooks/product-detail/useProductData';
import { useProductActions } from '../../hooks/product-detail/useProductActions';
import { useProductTabs } from '../../hooks/product-detail/useProductTabs';
import { useTabData, checkRequiredData } from '@/hooks/product-detail/useTabData';

// 웹뷰 관련
import { useWebViewReviews } from '../webview-reviews';
import { useWebViewDetail } from '../Webview/detail/webview-detail';
import { TABS } from '@/utils/common';
import { v4 as uuidv4 } from 'uuid';
import { logCrawlProcessResult } from '@/utils/crawlLog';
import { logEvent, logViewItemDetail } from '@/services/firebase';

interface ProductDetailScreenProps {}

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = () => {
    const {
        productUrl: productUrlBase,
        url: urlBase,
        tab: tabBase,
        requestId: requestIdBase,
        source
    } = useLocalSearchParams();
    const productUrl = decodeURIComponent((productUrlBase || urlBase)?.toString() ?? '');
    const initialTab = (tabBase?.toString() as TABS) ?? TABS.CAPTION;

    const requestId = useRef(requestIdBase?.toString() ?? uuidv4());
    const startDate = useRef(new Date());

    const isFromLink = source?.toString() === 'link';

    const colorScheme = useColorScheme();
    const styles = useStyles(colorScheme);

    const linkSearchCompletedRef = useRef(false);
    const linkSearchDetailOkRef = useRef(false);
    const linkSearchReviewOkRef = useRef(false);

    // 쿠팡 링크가 아닌 경우 처리
    if (!productUrl.includes('coupang')) {
        Alert.alert('알림', '쿠팡 상품만 확인할 수 있습니다.');
        router.back();
        return null;
    }

    // Atoms
    const productDetail = useAtomValue(productDetailAtom);
    const productReview = useAtomValue(productReviewAtom);
    const loadingStatus = useAtomValue(loadingStatusAtom);
    const isShowRequestModal = useAtomValue(isShowRequestModalAtom);
    const setIsShowRequestModal = useSetAtom(isShowRequestModalAtom);

    const getProductDetail = useSetAtom(getProductDetailAtom);
    const initProductDetail = useSetAtom(initProductDetailAtom);
    const setProduct = useSetAtom(setProductAtom);
    const setProductReview = useSetAtom(setProductReviewAtom);
    const setProductLoadingStatus = useSetAtom(setProductLoadingStatusAtom);

    // 질문 상태 (먼저 선언)
    const [question, setQuestion] = useState('');

    // 탭별 시작 시간 추적
    const tabStartTimes = useRef<{ [key in TABS]: number }>({
        [TABS.CAPTION]: 0,
        [TABS.REPORT]: 0,
        [TABS.REVIEW]: 0,
        [TABS.QUESTION]: 0
    });

    // 커스텀 훅들
    const { product, productRequests, request, wishlistItem, isLocal } = useProductData({ productUrl });
    const { tab, isTabPressed, handlePressTab, handleRegenerate } = useProductTabs(initialTab);
    const { handleClickBuy, handleClickWish, handleClickSend, handleClickRequest, handleClickContact } =
        useProductActions({ product, productUrl, wishlistItem, question, requestId: requestId.current, setQuestion });

    // 웹뷰 관련
    const DetailWebView = useWebViewDetail({
        productUrl,
        onError: () => {
            setProductLoadingStatus({
                caption: LoadingStatus.CRAWLING_FAILED,
                report: LoadingStatus.CRAWLING_FAILED
            });
        },
        onMessage: data => {
            setProduct(data);

            // ✅ 이미지 충족 판정: 썸네일 or 상세이미지 배열
            const hasDetail =
                !!data?.thumbnail || (Array.isArray(data?.detail_images) && data.detail_images.length > 0);
            linkSearchDetailOkRef.current = hasDetail;

            // 각 탭별 데이터 충족 여부 체크 및 NO_DATA 상태 업데이트
            const updates: {
                caption?: LoadingStatus;
                review?: LoadingStatus;
                report?: LoadingStatus;
            } = {};

            // caption 탭에 필요한 데이터가 없으면 NO_DATA로 설정
            if (!checkRequiredData(TABS.CAPTION, data, [])) {
                updates.caption = LoadingStatus.NO_DATA;
            }

            // report 탭에 필요한 데이터가 없으면 NO_DATA로 설정
            if (!checkRequiredData(TABS.REPORT, data, [])) {
                updates.report = LoadingStatus.NO_DATA;
            }

            // 업데이트가 있으면 상태 변경
            if (Object.keys(updates).length > 0) {
                setProductLoadingStatus(updates);
            }

            // 리뷰가 이미 OK였다면 여기서 완료
            if (linkSearchReviewOkRef.current) {
                tryFinalizeLinkSearchComplete('webview');
            }
        },
        onAttemptLog: ({ attemptLabel, success, durationMs, fields }) => {
            // 각 attempt별로 로그 기록
            logCrawlProcessResult({
                requestId: requestId.current,
                productUrl,
                processType: 'webview-detail',
                success,
                durationMs,
                fields,
                attemptLabel
            });
        }
    });

    const { component: reviewsComponent, scrollDown } = useWebViewReviews({
        productUrl: product?.url || '',
        onMessage: data => {
            // 웹뷰에서 onMessage가 호출되었다는 것은 리뷰 평점 노드가 있다는 의미
            if (data && Array.isArray(data)) {
                // 있다면 상품 리뷰 데이터 설정. 이후 useTabData에서 LoadingStatus.LOADING으로 변경됨.
                setProductReview(data);
                // 빈 배열이면 NO_DATA로 설정.
                if (data.length == 0) {
                    setProductLoadingStatus({
                        review: LoadingStatus.NO_DATA
                    });
                }
            }

            const durationMs = new Date().getTime() - startDate.current.getTime();

            linkSearchReviewOkRef.current = Array.isArray(data) && data.length > 0;

            logCrawlProcessResult({
                requestId: requestId.current,
                productUrl,
                processType: 'webview-review',
                success: true,
                durationMs,
                fields: {
                    reviews: Array.isArray(data) && data.length > 0
                }
            });

            // 이미지가 이미 OK였다면 여기서 완료
            if (linkSearchDetailOkRef.current) {
                tryFinalizeLinkSearchComplete('webview');
            }
        },
        onError: () => {
            const durationMs = new Date().getTime() - startDate.current.getTime();

            logCrawlProcessResult({
                requestId: requestId.current,
                productUrl,
                processType: 'webview-review',
                success: false,
                durationMs,
                fields: {
                    reviews: false
                }
            });

            setProductLoadingStatus({
                review: LoadingStatus.CRAWLING_FAILED
            });
        }
    });

    const handleLoadMore = () => {
        scrollDown();
    };

    // 링크검색 완료 로깅 헬퍼
    function tryFinalizeLinkSearchComplete(tag: 'webview' | 'server') {
        if (!isFromLink) return; // 링크 유입이 아닐 때는 링크 지표 찍지 않음
        if (linkSearchCompletedRef.current) return; // 중복 방지

        const success = linkSearchDetailOkRef.current && linkSearchReviewOkRef.current;
        const durationMs = Date.now() - startDate.current.getTime();

        logEvent('link_search_complete', {
            request_id: requestId.current,
            url: productUrl,
            domain: 'coupang',
            success,
            duration_ms: durationMs,
            source: tag, // 최종 판정 경로
            has_thumbnail_or_detail: linkSearchDetailOkRef.current,
            has_reviews: linkSearchReviewOkRef.current
        });

        linkSearchCompletedRef.current = true;
    }

    // 탭 데이터 관리
    useTabData({
        tab,
        productDetail,
        productUrl,
        productReview: productReview.reviews,
        loadingStatus
    });

    // 초기화
    useEffect(() => {
        initProductDetail();
        return () => {
            initProductDetail();
        };
    }, [initProductDetail]);

    useEffect(() => {
        // URL이 바뀌면 타이머/플래그 초기화
        startDate.current = new Date();
        linkSearchCompletedRef.current = false;
        linkSearchDetailOkRef.current = false;
        linkSearchReviewOkRef.current = false;

        // 탭 시작 시간도 초기화
        tabStartTimes.current = {
            [TABS.CAPTION]: 0,
            [TABS.REPORT]: 0,
            [TABS.REVIEW]: 0,
            [TABS.QUESTION]: 0
        };
    }, [productUrl]);

    useEffect(() => {
        if (product) {
            getProductDetail(product);
        }
    }, [productUrl, getProductDetail]);

    // 상품 데이터 처리 시작 시 모든 탭의 시작 시간 기록
    useEffect(() => {
        if (product && tabStartTimes.current[TABS.CAPTION] === 0) {
            const now = Date.now();
            tabStartTimes.current = {
                [TABS.CAPTION]: now,
                [TABS.REPORT]: now,
                [TABS.REVIEW]: now,
                [TABS.QUESTION]: 0 // Question은 별도 처리
            };
        }
    }, [product]);

    useEffect(() => {
        if (isFromLink) {
            logEvent('link_search_page_view', {
                request_id: requestId.current,
                url: productUrl,
                domain: 'coupang'
            });
        }
    }, [isFromLink, productUrl]);

    useEffect(() => {
        if (!product) return;

        logViewItemDetail({
            item_id: productUrl,
            item_name: product?.name,
            category: 'product_detail',
            price: product?.price
        });
    }, [productUrl]);

    // 모달 관리
    const toggleRequestModal = () => {
        setIsShowRequestModal(!isShowRequestModal);
    };

    // 질문 전송 핸들러 (상태 초기화 포함)
    const handleSendQuestion = async (questionText: string) => {
        await handleClickSend(questionText);
        setQuestion(''); // 질문 전송 후 입력창 초기화
    };

    return (
        <View style={styles.container} onAccessibilityEscape={() => router.back()}>
            <BackHeader />

            <View accessible={false}>
                {!isLocal && DetailWebView}
                {!isLocal && reviewsComponent}
            </View>

            <Modal
                isVisible={isShowRequestModal}
                onBackButtonPress={toggleRequestModal}
                onBackdropPress={toggleRequestModal}
                animationIn="slideInUp"
                animationInTiming={300}
                style={styles.modalStyle}
                avoidKeyboard={true}
            >
                <Request />
            </Modal>

            <ScrollView style={styles.scrollView}>
                {product ? (
                    <View>
                        <ProductInfo product={product} />

                        <TabNavigation tab={tab} handlePressTab={handlePressTab} isLocal={isLocal} />

                        <TabContent
                            tab={tab}
                            question={question}
                            setQuestion={setQuestion}
                            handleClickSend={handleSendQuestion}
                            request={request}
                            productRequests={productRequests}
                            loadingStatus={loadingStatus}
                            handleRegenerate={handleRegenerate}
                            handleLoadMore={handleLoadMore}
                            isTabPressed={isTabPressed}
                            requestId={requestId.current}
                            productUrl={productUrl}
                            tabStartTimes={tabStartTimes.current}
                        />
                    </View>
                ) : (
                    <View style={styles.inner}>
                        <Text>상품 정보를 불러오는 데 실패했습니다.</Text>
                    </View>
                )}
            </ScrollView>

            <ActionButtons
                product={product}
                handleClickBuy={handleClickBuy}
                handleClickContact={handleClickContact}
                handleClickRequest={handleClickRequest}
                handleClickWish={handleClickWish}
                isWish={!!wishlistItem}
                isRequest={!!request}
            />
        </View>
    );
};

const useStyles = (colorScheme: 'light' | 'dark') =>
    StyleSheet.create({
        container: {
            width: '100%',
            flex: 1,
            paddingTop: 20,
            backgroundColor: Colors[colorScheme].background.primary
        },
        scrollView: {
            flex: 1
        },
        inner: {
            paddingHorizontal: 20,
            paddingBottom: 40
        },
        modalStyle: {
            justifyContent: 'flex-end',
            margin: 0
        }
    });

export default ProductDetailScreen;
