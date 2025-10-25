import { useAtomValue, useSetAtom } from 'jotai';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Platform,
    ActivityIndicator,
    View,
    StyleSheet,
    AccessibilityInfo,
    EmitterSubscription
} from 'react-native';
import {
    getSubscriptions as IAPGetSubscriptions,
    Product as IAPProductB,
    Subscription as IAPSubscriptionB,
    PurchaseError,
    finishTransaction,
    flushFailedPurchasesCachedAsPendingAndroid,
    initConnection,
    purchaseErrorListener,
    purchaseUpdatedListener,
    withIAPContext,
    RequestSubscriptionAndroid,
    SubscriptionAndroid,
    requestSubscription
} from 'react-native-iap';

import { getProductsAtom, getSubscriptionAtom, productsAtom, purchaseProductAtom } from '@/stores/purchase/atoms';
import { GetSubscriptionAPI, CheckPurchaseFailureAPI } from '@/stores/purchase/apis';
import { Product, ProductType } from '@/stores/purchase/types';
import { isShowSubscriptionModalAtom } from '@/stores/auth';
import { Colors } from '@constants';
import useColorScheme from '@/hooks/useColorScheme';
import { logEvent } from '@/services/firebase';

// 타입 정의 개선
type IAPProduct = Omit<IAPProductB, 'type'>;
type IAPSubscription = Omit<IAPSubscriptionB, 'type' | 'platform'>;

// 에러 타입 정의
enum PurchaseErrorType {
    ALREADY_SUBSCRIBED = 'ALREADY_SUBSCRIBED',
    PURCHASE_BLOCKED = 'PURCHASE_BLOCKED',
    HANDLER_NOT_READY = 'HANDLER_NOT_READY',
    PURCHASE_PROCESSING = 'PURCHASE_PROCESSING',
    UNKNOWN = 'UNKNOWN'
}

// 상수 분리
const PURCHASE_MESSAGES = {
    ALREADY_SUBSCRIBED: '이미 픽포미 플러스를 구독중이에요!',
    PURCHASE_BLOCKED: '이전 구독 처리 중 오류가 발생해 현재 처리중입니다. \n 고객센터에 문의해주세요.',
    HANDLER_NOT_READY: '구독 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    PURCHASE_PROCESSING: '구독 처리가 진행 중입니다. 잠시만 기다려주세요.',
    PURCHASE_ERROR: '구독 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    PURCHASE_SUCCESS_ERROR: '멤버십 지급 과정에서 잠시 오류가 발생했습니다.',
    PURCHASE_SUCCESS_ERROR_DETAIL:
        '결제 내역을 확인한 후, 약 1시간 이내로 매니저가 수동으로 멤버십을 지급해드릴 예정입니다. \n 불편을 드려 진심으로 죄송합니다.',
    LOADING_ANNOUNCEMENT: '구독 처리가 진행 중입니다. 잠시만 기다려주세요.'
} as const;

interface PurchaseWrapperProps {
    children: (props: {
        products: Product[];
        purchaseItems: IAPProduct[];
        subscriptionItems: IAPSubscription[];
        handleSubscription: (sku: string, offerToken?: string | null) => Promise<boolean>;
        subscriptionLoading: boolean;
    }) => React.ReactNode;
}

const PurchaseWrapper: React.FC<PurchaseWrapperProps> = ({ children }) => {
    const purchaseProduct = useSetAtom(purchaseProductAtom);
    const setIsShowSubscriptionModal = useSetAtom(isShowSubscriptionModalAtom);
    const [purchaseItems] = useState<IAPProduct[]>([]);
    const [subscriptionItems, setSubscriptionItems] = useState<IAPSubscription[]>([]);
    const getProducts = useSetAtom(getProductsAtom);
    const getSubscription = useSetAtom(getSubscriptionAtom);
    const products = useAtomValue(productsAtom);
    const [subscriptionLoading, setSubscriptionLoading] = useState<boolean>(false);

    // 타입 안전성 개선
    const purchaseUpdateRef = useRef<EmitterSubscription | null>(null);
    const purchaseErrorRef = useRef<EmitterSubscription | null>(null);
    const isInitializingRef = useRef(false);
    const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const loadingViewRef = useRef<View>(null);

    // 중복 결제 방지를 위한 추가 상태
    const processedTransactionsRef = useRef<Set<string>>(new Set());
    const apiCallsRef = useRef<Map<string, Promise<any>>>(new Map());

    const colorScheme = useColorScheme();

    useEffect(() => {
        getProducts({ platform: Platform.OS });
    }, [getProducts]);

    useEffect(() => {
        getSubscription();
    }, [getSubscription]);

    // API 호출 중복 방지 헬퍼
    const memoizedApiCall = async <T extends unknown>(key: string, apiCall: () => Promise<T>): Promise<T> => {
        if (apiCallsRef.current.has(key)) {
            return apiCallsRef.current.get(key);
        }

        const promise = apiCall();
        apiCallsRef.current.set(key, promise);

        try {
            const result = await promise;
            return result;
        } finally {
            // API 호출 완료 후 캐시에서 제거 (다음 호출을 위해)
            setTimeout(() => {
                apiCallsRef.current.delete(key);
            }, 1000);
        }
    };

    // 구독 검증 함수들
    const validateSubscription = async (): Promise<void> => {
        const subCheck = await memoizedApiCall('getSubscription', GetSubscriptionAPI);
        const { activate } = subCheck.data;

        if (activate) {
            throw new Error(PurchaseErrorType.ALREADY_SUBSCRIBED);
        }
    };

    const validatePurchaseFailure = async (): Promise<void> => {
        const failureCheck = await memoizedApiCall('checkPurchaseFailure', CheckPurchaseFailureAPI);
        if (!failureCheck.data.canPurchase) {
            throw new Error(PurchaseErrorType.PURCHASE_BLOCKED);
        }
    };

    const validateHandlers = (): void => {
        if (!purchaseUpdateRef.current || !purchaseErrorRef.current) {
            throw new Error(PurchaseErrorType.HANDLER_NOT_READY);
        }
    };

    const performSubscriptionRequest = async (sku: string, offerToken?: string | null): Promise<void> => {
        console.log('구독 요청중..');

        if (offerToken) {
            const subscriptionRequest: RequestSubscriptionAndroid = {
                subscriptionOffers: [
                    {
                        sku,
                        offerToken
                    }
                ]
            };
            await requestSubscription(subscriptionRequest);
        } else {
            await requestSubscription({ sku });
        }
    };

    const handleSubscriptionError = (error: Error): boolean => {
        let message: string = PURCHASE_MESSAGES.PURCHASE_ERROR;
        let title = '';

        switch (error.message) {
            case PurchaseErrorType.ALREADY_SUBSCRIBED:
                message = PURCHASE_MESSAGES.ALREADY_SUBSCRIBED;
                break;
            case PurchaseErrorType.PURCHASE_BLOCKED:
                title = '구독 불가';
                message = PURCHASE_MESSAGES.PURCHASE_BLOCKED;
                break;
            case PurchaseErrorType.HANDLER_NOT_READY:
                message = PURCHASE_MESSAGES.HANDLER_NOT_READY;
                break;
            case PurchaseErrorType.PURCHASE_PROCESSING:
                message = PURCHASE_MESSAGES.PURCHASE_PROCESSING;
                break;
        }

        Alert.alert(title, message);

        logEvent('subscription_request_failure', {
            failure_reason: error.message || 'Unknown error on handleSubscription'
        });

        // 에러 발생 시 상태 초기화
        setSubscriptionLoading(false);
        return false;
    };

    const handleSubscription = async (sku: string, offerToken?: string | null): Promise<boolean> => {
        // Race Condition 방지
        if (subscriptionLoading) {
            console.log('이미 구독 처리가 진행 중입니다.');
            Alert.alert(PURCHASE_MESSAGES.PURCHASE_PROCESSING);
            return false;
        }

        logEvent('subscription_request', {
            sku,
            offerToken
        });

        try {
            // 구독 처리 상태로 변경
            setSubscriptionLoading(true);

            // 순차적 검증
            await validateSubscription();
            await validatePurchaseFailure();
            validateHandlers();

            // 구독 요청 실행
            await performSubscriptionRequest(sku, offerToken);

            return true;
        } catch (error) {
            return handleSubscriptionError(error as Error);
        }
    };

    useEffect(() => {
        if (!products.length || isInitializingRef.current) return;

        const initializeIAP = async () => {
            try {
                isInitializingRef.current = true;

                await initConnection();

                const subscriptionItemLists = products
                    .filter(p => p.type === ProductType.SUBSCRIPTION)
                    .map(p => p.productId);

                const storeSItems = await IAPGetSubscriptions({ skus: subscriptionItemLists });
                setSubscriptionItems(storeSItems);

                const addListeners = () => {
                    if (purchaseUpdateRef.current) {
                        purchaseUpdateRef.current.remove();
                    }
                    if (purchaseErrorRef.current) {
                        purchaseErrorRef.current.remove();
                    }

                    purchaseUpdateRef.current = purchaseUpdatedListener(async purchase => {
                        let isSubscription = false;
                        const transactionId =
                            purchase.transactionId || purchase.purchaseToken || `${purchase.productId}_${Date.now()}`;

                        // 중복 거래 처리 방지
                        if (processedTransactionsRef.current.has(transactionId)) {
                            console.log('이미 처리된 거래입니다:', transactionId);
                            return;
                        }

                        try {
                            // 거래 처리 시작 표시
                            processedTransactionsRef.current.add(transactionId);

                            const receipt = purchase.transactionReceipt;
                            const product = products.find(({ productId }) => productId === purchase.productId);
                            if (!product || !receipt) return;

                            isSubscription = product.type === ProductType.SUBSCRIPTION;

                            const parsedReceipt =
                                Platform.OS === 'android'
                                    ? { subscription: isSubscription, ...JSON.parse(receipt) }
                                    : receipt;

                            await purchaseProduct({ _id: product._id, receipt: parsedReceipt });
                            await getSubscription();

                            logEvent('subscription_request_success', {
                                sku: purchase.productId
                            });

                            setIsShowSubscriptionModal(true);
                        } catch (error) {
                            Alert.alert(
                                PURCHASE_MESSAGES.PURCHASE_SUCCESS_ERROR,
                                PURCHASE_MESSAGES.PURCHASE_SUCCESS_ERROR_DETAIL
                            );
                            logEvent('subscription_request_failure', {
                                failure_reason:
                                    error instanceof Error ? error.message : 'Unknown error on purchase success'
                            });
                            // 에러 발생 시 거래를 처리 완료 목록에서 제거
                            processedTransactionsRef.current.delete(transactionId);
                        } finally {
                            // 상태 초기화
                            setSubscriptionLoading(false);

                            // 결제가 실패하든 일단 결제 자체는 종료함.
                            await finishTransaction({ purchase, isConsumable: !isSubscription });
                        }
                    });

                    purchaseErrorRef.current = purchaseErrorListener((error: PurchaseError) => {
                        if (error.code !== 'E_USER_CANCELLED') {
                            Alert.alert(PURCHASE_MESSAGES.PURCHASE_ERROR);
                            logEvent('subscription_request_failure', {
                                failure_reason: error.code || 'Unknown error on purchase error'
                            });
                        } else if (error.code === 'E_USER_CANCELLED') {
                            logEvent('subscription_request_failure', {
                                failure_reason: 'user_cancelled'
                            });
                        }

                        // 에러 발생 시 상태 초기화
                        setSubscriptionLoading(false);
                    });
                };

                if (Platform.OS === 'android') {
                    await flushFailedPurchasesCachedAsPendingAndroid().catch(() => {});
                }

                addListeners();
            } catch (error) {
                console.error('initializeIAP error', error);
            }
        };

        initializeIAP();
    }, [products, purchaseProduct, setIsShowSubscriptionModal]);

    useEffect(() => {
        return () => {
            isInitializingRef.current = false;

            // 타이머 정리
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }

            // 상태 초기화
            processedTransactionsRef.current.clear();
            apiCallsRef.current.clear();

            // 리스너 정리
            if (purchaseUpdateRef.current) {
                purchaseUpdateRef.current.remove();
                purchaseUpdateRef.current = null;
            }

            if (purchaseErrorRef.current) {
                purchaseErrorRef.current.remove();
                purchaseErrorRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (subscriptionLoading) {
            loadingTimeoutRef.current = setTimeout(() => {
                loadingViewRef.current?.setNativeProps({
                    accessibilityViewIsModal: true
                });
                AccessibilityInfo.announceForAccessibility(PURCHASE_MESSAGES.LOADING_ANNOUNCEMENT);
            }, 100);
        } else {
            // 로딩이 끝나면 타이머 정리
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }
        }
    }, [subscriptionLoading]);

    return (
        <>
            {children({ products, purchaseItems, subscriptionItems, handleSubscription, subscriptionLoading })}
            {subscriptionLoading && (
                <View
                    ref={loadingViewRef}
                    style={[styles.loadingOverlay, { backgroundColor: `${Colors[colorScheme].background.primary}CC` }]}
                    accessible={true}
                    accessibilityLabel="구독 처리 중"
                    accessibilityHint="구독 처리가 진행 중입니다. 잠시만 기다려주세요."
                    accessibilityRole="alert"
                    importantForAccessibility="yes"
                >
                    <ActivityIndicator size="large" color={Colors[colorScheme].text.primary} />
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
    }
});

export default withIAPContext(PurchaseWrapper);
