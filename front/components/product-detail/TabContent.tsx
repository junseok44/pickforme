import React, { useRef, useEffect } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    AccessibilityInfo,
    findNodeHandle,
    View,
    Platform
} from 'react-native';
import type { View as RNView } from 'react-native';
import { useAtomValue } from 'jotai';
import { productDetailAtom, LoadingStatus } from '../../stores/product/atoms';
import { TABS, loadingMessages } from '../../utils/common';
import { Text } from '@components';
import { Request } from '../../stores/request/types';
import useColorScheme from '../../hooks/useColorScheme';
import { Colors } from '@constants';
import { logTabContentProcess } from '../../services/firebase';

import CaptionTab from './tabs/CaptionTab';
import ReportTab from './tabs/ReportTab';
import ReviewTab from './tabs/ReviewTab';
import QuestionTab from './tabs/QuestionTab';
import { focusOnRef } from '@/utils/accessibility';

interface TabContentProps {
    tab: TABS;
    question: string;
    setQuestion: React.Dispatch<React.SetStateAction<string>>;
    handleClickSend: (params: any) => void;
    request: Request | undefined;
    productRequests: Request[];
    loadingStatus: { [key in TABS]: LoadingStatus };
    handleRegenerate: () => void;
    handleLoadMore: () => void;
    isTabPressed: boolean;
    requestId: string;
    productUrl: string;
    tabStartTimes: { [key in TABS]: number };
}

const CRAWLING_FAILED_MESSAGE = {
    [TABS.CAPTION]: '이미지를 불러오는데 실패했습니다.',
    [TABS.REPORT]: '상세페이지 정보를 불러오는데 실패했습니다.',
    [TABS.REVIEW]: '리뷰 정보를 불러오는데 실패했습니다.'
};

const NO_DATA_MESSAGE = {
    [TABS.CAPTION]: '등록된 썸네일이 없습니다.',
    [TABS.REPORT]: '등록된 상세이미지가 없습니다.',
    [TABS.REVIEW]: '등록된 리뷰가 없습니다.'
};

const ERROR_MESSAGE = {
    [TABS.CAPTION]: '이미지 설명을 생성하는데 실패했습니다.',
    [TABS.REPORT]: '상세페이지 설명을 생성하는데 실패했습니다.',
    [TABS.REVIEW]: '리뷰 요약을 생성하는데 실패했습니다.'
};

const TabContent: React.FC<TabContentProps> = ({
    tab,
    question,
    setQuestion,
    handleClickSend,
    request,
    productRequests,
    loadingStatus,
    handleRegenerate,
    handleLoadMore,
    isTabPressed,
    requestId,
    productUrl,
    tabStartTimes
}) => {
    const colorScheme = useColorScheme();
    const styles = useStyles(colorScheme);
    const productDetail = useAtomValue(productDetailAtom);

    // NO_DATA 메시지 ref
    const noDataRef = useRef<RNView>(null);
    // 로딩 상태 ref
    const loadingRef = useRef<RNView>(null);
    // 로깅 완료 여부 추적 (중복 방지)
    const loggedRef = useRef<Set<string>>(new Set());
    // 크롤링 실패 ref
    const crawlingFailedRef = useRef<RNView>(null);

    // 탭이 바뀌거나, loading 상태가 바뀌었을때 포커스 이동
    useEffect(() => {
        if (isTabPressed) {
            const delay = Platform.OS === 'android' ? 800 : 500;

            if (loadingStatus[tab] === LoadingStatus.NO_DATA && noDataRef.current) {
                focusOnRef(noDataRef, delay);
            } else if (
                (loadingStatus[tab] === LoadingStatus.INIT || loadingStatus[tab] === LoadingStatus.LOADING) &&
                loadingRef.current
            ) {
                focusOnRef(loadingRef, delay);
            } else if (loadingStatus[tab] === LoadingStatus.CRAWLING_FAILED && crawlingFailedRef.current) {
                focusOnRef(crawlingFailedRef, delay);
            }
        }
    }, [loadingStatus[tab], tab, isTabPressed]);

    // 모든 탭의 상태 변화 감지하여 로깅
    useEffect(() => {
        // 모든 탭(Question 제외)을 체크
        Object.values(TABS).forEach(currentTab => {
            if (currentTab === TABS.QUESTION) return;

            // 성공: productDetail에 해당 탭 데이터가 있음
            if (productDetail?.[currentTab]) {
                const successKey = `${currentTab}-success`;
                if (!loggedRef.current.has(successKey)) {
                    const startTime = tabStartTimes[currentTab];

                    if (startTime) {
                        const duration = Date.now() - startTime;
                        logTabContentProcess({
                            request_id: requestId,
                            tab: currentTab.toLowerCase() as 'caption' | 'report' | 'review',
                            status: 'success',
                            duration_ms: duration,
                            product_url: productUrl
                        });
                        loggedRef.current.add(successKey);
                    }
                }
            }
            // 실패: NO_DATA 상태
            else if (loadingStatus[currentTab] === LoadingStatus.NO_DATA) {
                const failKey = `${currentTab}-failed-no_data`;
                if (!loggedRef.current.has(failKey)) {
                    const startTime = tabStartTimes[currentTab];
                    if (startTime) {
                        const duration = Date.now() - startTime;
                        logTabContentProcess({
                            request_id: requestId,
                            tab: currentTab.toLowerCase() as 'caption' | 'report' | 'review',
                            status: 'failed',
                            duration_ms: duration,
                            failure_reason: 'no_data',
                            product_url: productUrl
                        });
                        loggedRef.current.add(failKey);
                    }
                }
            } else if (loadingStatus[currentTab] === LoadingStatus.CRAWLING_FAILED) {
                const failKey = `${currentTab}-failed-crawling_failed`;
                if (!loggedRef.current.has(failKey)) {
                    const startTime = tabStartTimes[currentTab];
                    if (startTime) {
                        const duration = Date.now() - startTime;
                        logTabContentProcess({
                            request_id: requestId,
                            tab: currentTab.toLowerCase() as 'caption' | 'report' | 'review',
                            status: 'failed',
                            duration_ms: duration,
                            failure_reason: 'crawling_failed',
                            product_url: productUrl
                        });
                        loggedRef.current.add(failKey);
                    }
                }
            }
            // 실패: ERROR 상태
            else if (loadingStatus[currentTab] === LoadingStatus.AI_GENERATION_FAILED) {
                const errorKey = `${currentTab}-failed-error`;
                if (!loggedRef.current.has(errorKey)) {
                    const startTime = tabStartTimes[currentTab];
                    if (startTime) {
                        const duration = Date.now() - startTime;
                        logTabContentProcess({
                            request_id: requestId,
                            tab: currentTab.toLowerCase() as 'caption' | 'report' | 'review',
                            status: 'failed',
                            duration_ms: duration,
                            failure_reason: 'ai_generation_failed',
                            product_url: productUrl
                        });
                        loggedRef.current.add(errorKey);
                    }
                }
            }
        });
    }, [productDetail, loadingStatus]);

    // URL이 바뀔 때 로깅 상태 초기화 (ProductDetailScreen에서 productUrl이 바뀔 때)
    useEffect(() => {
        loggedRef.current.clear();
    }, [productUrl]);

    // 1. Question 탭 처리
    if (tab === TABS.QUESTION) {
        return (
            <QuestionTab
                question={question}
                setQuestion={setQuestion}
                handleClickSend={handleClickSend}
                productRequests={productRequests}
                loadingMessages={loadingMessages}
                loadingStatus={loadingStatus}
                tab={tab}
                productDetail={productDetail}
                isTabPressed={isTabPressed}
                request={request}
            />
        );
    }

    // 2. 로딩 상태 처리
    if (loadingStatus[tab] === LoadingStatus.INIT || loadingStatus[tab] === LoadingStatus.LOADING) {
        return (
            <View style={styles.detailWrap}>
                <View
                    style={styles.indicatorWrap}
                    ref={loadingRef}
                    accessible
                    accessibilityLabel={loadingMessages[tab]}
                >
                    <ActivityIndicator />
                    <Text style={styles.loadingMessageText}>{loadingMessages[tab]}</Text>
                </View>
            </View>
        );
    }

    // 3. 상품 상세 정보가 있는 경우
    if (productDetail?.[tab]) {
        switch (tab) {
            case TABS.REVIEW:
                return (
                    <ReviewTab
                        productDetail={productDetail}
                        isTabPressed={isTabPressed}
                        handleLoadMore={handleLoadMore}
                    />
                );
            case TABS.REPORT:
                return <ReportTab productDetail={productDetail} isTabPressed={isTabPressed} />;
            case TABS.CAPTION:
            default:
                return <CaptionTab productDetail={productDetail} isTabPressed={isTabPressed} />;
        }
    }

    // 해당 탭에 필요한 데이터가 없는 경우.
    if (loadingStatus[tab] === LoadingStatus.NO_DATA) {
        return (
            <View style={styles.detailWrap} ref={noDataRef} accessible accessibilityLabel={NO_DATA_MESSAGE[tab]}>
                <Text style={styles.errorText}>{NO_DATA_MESSAGE[tab]}</Text>
            </View>
        );
    }

    if (loadingStatus[tab] === LoadingStatus.CRAWLING_FAILED) {
        return (
            <View
                style={styles.detailWrap}
                ref={crawlingFailedRef}
                accessible
                accessibilityLabel={CRAWLING_FAILED_MESSAGE[tab]}
            >
                <Text style={styles.errorText}>{CRAWLING_FAILED_MESSAGE[tab]}</Text>
            </View>
        );
    }

    // 4. 실패 상태
    return (
        <View style={styles.detailWrap}>
            <Text style={styles.errorText}>{ERROR_MESSAGE[tab]}</Text>
            <Pressable
                onPress={handleRegenerate}
                accessible
                accessibilityRole="button"
                accessibilityLabel="다시 생성하기"
                style={styles.retryButton}
            >
                <Text style={styles.retryText}>다시 생성하기</Text>
            </Pressable>
        </View>
    );
};

const useStyles = (colorScheme: 'light' | 'dark') =>
    StyleSheet.create({
        detailWrap: {
            padding: 28
        },
        indicatorWrap: {
            flexDirection: 'row',
            gap: 10,
            alignItems: 'center'
        },
        loadingMessageText: {
            fontSize: 14,
            color: Colors[colorScheme].text.primary
        },
        errorText: {
            fontSize: 14,
            color: Colors[colorScheme].text.primary,
            marginBottom: 16
        },
        retryButton: {
            padding: 12,
            backgroundColor: Colors[colorScheme].background.secondary,
            borderRadius: 8,
            alignItems: 'center'
        },
        retryText: {
            fontSize: 14,
            fontWeight: '600',
            color: Colors[colorScheme].text.primary
        }
    });

export default TabContent;
