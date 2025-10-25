import { useCallback } from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { Alert, AccessibilityInfo } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { wishProductsAtom, productDetailAtom, getProductAIAnswerAtom } from '../../stores/product/atoms';
import { getSubscriptionAtom, subscriptionAtom } from '../../stores/purchase/atoms';
import {
    isShowNonSubscriberManagerModalAtom,
    isShowRequestModalAtom,
    membershipModalTypeAtom
} from '../../stores/auth/atoms';
import { requestBottomSheetAtom } from '../../stores/request/atoms';
import { userAtom } from '@stores';
import useCheckLogin from '../useCheckLogin';
import { Product } from '../../stores/product/types';
import { checkIsExpired } from '../../utils/common';
import { logClickBuy, logEvent } from '@/services/firebase';
import { client } from '@/utils';

interface UseProductActionsProps {
    product: Product;
    productUrl: string;
    wishlistItem: Product | undefined;
    question: string;
    setQuestion: (question: string) => void;
    requestId: string;
}

export const useProductActions = ({
    product,
    productUrl,
    wishlistItem,
    question,
    requestId,
    setQuestion
}: UseProductActionsProps) => {
    const [wishlist, setWishlist] = useAtom(wishProductsAtom);
    const productDetail = useAtomValue(productDetailAtom);
    const userData = useAtomValue(userAtom);
    const subscription = useAtomValue(subscriptionAtom);

    const getProductAIAnswer = useSetAtom(getProductAIAnswerAtom);
    const getSubscription = useSetAtom(getSubscriptionAtom);
    const setRequestBottomSheet = useSetAtom(requestBottomSheetAtom);
    const setMembershipModalType = useSetAtom(membershipModalTypeAtom);
    const setIsShowNonSubscriberManagerModal = useSetAtom(isShowNonSubscriberManagerModalAtom);
    const setIsShowRequestModal = useSetAtom(isShowRequestModalAtom);

    // 구매하기
    const handleClickBuy = useCallback(async () => {
        logClickBuy({
            item_id: productUrl,
            item_name: productDetail?.product?.name,
            category: 'product_detail',
            price: productDetail?.product?.price
        });

        logEvent('product_detail_buy_click', {
            screen: 'ProductDetailScreen',
            url: productUrl,
            item_name: productDetail?.product?.name,
            item_price: productDetail?.product?.price,
            category: 'product_detail',
            request_id: requestId
        });

        try {
            const response: {
                data: {
                    success: boolean;
                    data: {
                        landingUrl: string;
                        originalUrl: string;
                        shortenUrl: string;
                    };
                };
                status: number;
            } = await client.post(
                '/coupang/deeplink',
                { urls: [product.url] },
                {
                    timeout: 5000
                }
            );

            const { landingUrl, originalUrl, shortenUrl } = response.data.data;

            if (!landingUrl || !originalUrl || !shortenUrl) {
                throw new Error('쿠팡 링크 변환 중 오류가 발생했습니다.');
            }

            await WebBrowser.openBrowserAsync(landingUrl);
        } catch (error) {
            await WebBrowser.openBrowserAsync(product.url);
        }
    }, [product.url, productDetail?.product?.name, productDetail?.product?.price, requestId]);

    // 위시리스트 토글
    const handleClickWish = useCallback(async () => {
        logEvent('product_detail_wishlist_toggle', {
            screen: 'ProductDetailScreen',
            item_id: productUrl,
            item_name: productDetail?.product?.name,
            category: 'product_detail',
            action: wishlistItem ? 'remove' : 'add'
        });

        if (wishlistItem) {
            setWishlist(wishlist.filter(wishProduct => wishProduct !== wishlistItem));
            setTimeout(() => {
                AccessibilityInfo.announceForAccessibility('위시리스트에서 제거되었습니다.');
            }, 300);
        } else {
            // product 객체에 productDetail의 reviews와 ratings 정보 추가
            const enrichedProduct = {
                ...product,
                reviews: productDetail?.product?.reviews ?? product.reviews ?? 0,
                ratings: productDetail?.product?.ratings ?? product.ratings ?? 0
            };

            setWishlist([...wishlist, enrichedProduct]);
            setTimeout(() => {
                AccessibilityInfo.announceForAccessibility('위시리스트에 추가되었습니다.');
            }, 300);
        }
    }, [wishlistItem, wishlist, product, productDetail, setWishlist]);

    // AI 질문하기
    // AI포미에게 질문하기
    const handleClickSend = useCheckLogin(async () => {
        if (!question) {
            Alert.alert('질문을 입력해주세요.');
            return;
        }

        if (!productDetail?.product?.detail_images || !productDetail?.product?.thumbnail) {
            Alert.alert('상품 정보를 불러오고 있어요.');
            return;
        }

        setMembershipModalType('AI');

        await getSubscription();
        if (userData && userData.aiPoint !== undefined && userData.aiPoint <= 0) {
            setIsShowNonSubscriberManagerModal(true);
            return;
        }

        logEvent('question_send', {
            screen: 'ProductDetailScreen',
            item_id: productUrl,
            type: 'ai_question',
            item_name: productDetail?.product?.name,
            question: question,
            category: 'product_detail'
        });

        try {
            await getProductAIAnswer(question);
            setQuestion(''); // 질문 전송 후 입력창 초기화
        } catch (error: any) {
            console.error('API 호출 실패:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                config: error.config
            });
        }
    });

    // 매니저에게 질문하기
    const handleClickRequest = useCheckLogin(async () => {
        await getSubscription();

        setMembershipModalType('MANAGER');

        logEvent('question_send', {
            screen: 'ProductDetailScreen',
            item_id: productUrl,
            type: 'manager_question',
            item_name: productDetail?.product?.name,
            question: question,
            category: 'product_detail'
        });

        if (userData && userData.point !== undefined && userData.point <= 0) {
            setIsShowNonSubscriberManagerModal(true);
        } else {
            setRequestBottomSheet(product);
            setIsShowRequestModal(true);
        }
    });

    // 대리구매 문의
    const handleClickContact = useCallback(async () => {
        await getSubscription();

        if (!subscription || checkIsExpired(subscription.expiresAt)) {
            setIsShowNonSubscriberManagerModal(true);
        } else {
            setRequestBottomSheet(product);
        }
    }, [subscription, product, getSubscription, setIsShowNonSubscriberManagerModal, setRequestBottomSheet]);

    return {
        handleClickBuy,
        handleClickWish,
        handleClickSend,
        handleClickRequest,
        handleClickContact
    };
};
