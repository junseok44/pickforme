import { router, useRouter } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import React, { useEffect } from 'react';
import { AccessibilityInfo, findNodeHandle, InteractionManager, ScrollView, StyleSheet } from 'react-native';

import { Button_old as Button, Text, View } from '@components';
import { Colors } from '@constants';
import type { ColorScheme } from '@hooks';
import { isShowSubscriptionModalAtom, isShowUnsubscribeModalAtom } from '@stores';
import {
    Product as IAPProductB,
    Subscription as IAPSubscriptionB,
    RequestSubscriptionAndroid,
    SubscriptionAndroid,
    requestSubscription
} from 'react-native-iap';
import { BackHeader } from '../components';
import PurchaseWrapper from '../components/Purchase/PurchaseWrapper';
import useColorScheme from '../hooks/useColorScheme';
import { getSubscriptionAtom, subscriptionAtom } from '../stores/purchase/atoms';
import { Product, ProductType } from '../stores/purchase/types';
import { formatMonthDay } from '../utils/common';

type IAPProduct = Omit<IAPProductB, 'type'>;
type IAPSubscription = Omit<IAPSubscriptionB, 'type' | 'platform'>;

const ANDROID_UPDATE_URL = 'https://play.google.com/store/apps/details?id=com.sigonggan.pickforme';
const IOS_UPDATE_URL = 'https://apps.apple.com/kr/app/%ED%94%BD%ED%8F%AC%EB%AF%B8/id6450741514';

const SubscriptionHistoryScreen = () => {
    return (
        <PurchaseWrapper>
            {({ products, purchaseItems, subscriptionItems, handleSubscription, subscriptionLoading }) => (
                <PointHistoryScreen
                    products={products}
                    purchaseItems={purchaseItems}
                    subscriptionItems={subscriptionItems}
                    handleSubscription={handleSubscription}
                    subscriptionLoading={subscriptionLoading}
                />
            )}
        </PurchaseWrapper>
    );
};

export const PointHistoryScreen: React.FC<Props> = ({
    products,
    purchaseItems,
    subscriptionItems,
    handleSubscription,
    subscriptionLoading
}) => {
    const colorScheme = useColorScheme();
    const currentSubscription = useAtomValue(subscriptionAtom);
    const styles = useStyles(colorScheme);
    const setIsShowUnsubscribeModal = useSetAtom(isShowUnsubscribeModalAtom);
    const getCurrentSubscription = useSetAtom(getSubscriptionAtom);
    const setIsShowSubscriptionModalAtomModal = useSetAtom(isShowSubscriptionModalAtom);

    const onSubClick = async (sku: string, offerToken?: string) => {
        await handleSubscription(sku, offerToken);
    };

    const handleClickUnsubscribe = () => {
        setIsShowUnsubscribeModal(true);
    };

    const filteredProducts = products.reduce(
        (obj, product) => {
            // console.log('Product:', product);
            // console.log('SubscriptionItems:', subscriptionItems);
            if (product.type === ProductType.PURCHASE) {
                // 단건 로직
                const item = purchaseItems.find(({ productId }) => product.productId === productId);
                if (item) {
                    obj.purchasableProducts.push({ ...item, ...product });
                }
            } else {
                const item = subscriptionItems.find(({ productId }) => product.productId === productId);
                // console.log('Found subscription item:', item);
                if (item) {
                    obj.subscriptionProducts.push({ ...item, ...product });
                }
            }
            return obj;
        },
        {
            subscriptionProducts: [] as (IAPSubscription & Product)[],
            purchasableProducts: [] as (IAPProduct & Product)[]
        }
    );

    useEffect(() => {
        getCurrentSubscription();
    }, [getCurrentSubscription]);

    const contentRef = React.useRef(null);
    useEffect(() => {
        const node = findNodeHandle(contentRef.current);
        console.log('node', node);
        if (node) {
            InteractionManager.runAfterInteractions(() => {
                setTimeout(() => {
                    AccessibilityInfo.setAccessibilityFocus(node);
                }, 500);
            });
        }
    }, [contentRef.current]);

    return (
        <View style={styles.container} onAccessibilityEscape={router.back}>
            <BackHeader />
            <ScrollView style={{ backgroundColor: Colors[colorScheme].background.primary }}>
                <View style={styles.content}>
                    <Text style={styles.title} ref={contentRef}>
                        멤버십 구매 내역
                    </Text>
                    {currentSubscription?.activate ? (
                        <>
                            {/* <Text style={styles.subtitle}>전체</Text> */}
                            <View style={styles.purchaseStatus}>
                                <View style={styles.row}>
                                    <Text style={{ color: Colors[colorScheme].text.primary }}>
                                        {formatMonthDay(currentSubscription?.createdAt || '')} 결제 완료
                                    </Text>
                                    <Text style={{ color: Colors[colorScheme].text.primary }}>
                                        {formatMonthDay(currentSubscription?.expiresAt || '')} 해지 예정
                                    </Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.purchaseTitle}>픽포미 플러스 월간 이용권</Text>
                                    <Text style={styles.purchasePrice}>4,900원</Text>
                                </View>
                            </View>

                            <Button
                                style={styles.unSubscribeButton}
                                title="멤버십 해지하기"
                                size="small"
                                textStyle={styles.unSubscribeButtonText}
                                onPress={handleClickUnsubscribe}
                            />
                        </>
                    ) : (
                        <>
                            <Text style={styles.subtitle}>구매 내역이 없습니다.</Text>
                            <Text style={{ color: Colors[colorScheme].text.primary }}>
                                {
                                    '픽포미 멤버십을 구독하고, 자유롭게 질문해 보세요.\n멤버십은 결제일로부터 한 달이 지나면 자동해지됩니다.'
                                }
                            </Text>
                            {filteredProducts.subscriptionProducts.map(product => {
                                const color: 'primary' | 'tertiary' = 'tertiary';
                                const buttonTextProps = { color };
                                if (product.platform === 'android') {
                                    const subscriptionOffer = (
                                        product as unknown as SubscriptionAndroid
                                    ).subscriptionOfferDetails.find(
                                        subscriptionOfferDetail =>
                                            subscriptionOfferDetail.basePlanId.replace('-', '_') === product.productId
                                    );
                                    if (!subscriptionOffer) {
                                        return null;
                                    }
                                    return (
                                        <View key={`Point-Product-${product.productId}`} style={styles.productWrap}>
                                            <Text style={styles.productPrice}>
                                                월{' '}
                                                {subscriptionOffer.pricingPhases.pricingPhaseList[0].formattedPrice.replace(
                                                    /₩(.*)/,
                                                    '$1원'
                                                )}
                                            </Text>
                                            <Button
                                                style={styles.productButton}
                                                title="멤버십 시작하기"
                                                size="small"
                                                onPress={() =>
                                                    onSubClick(product.productId, subscriptionOffer.offerToken)
                                                }
                                            />
                                        </View>
                                    );
                                }
                                return (
                                    <View key={`Point-Product-${product.productId}`} style={styles.productWrap}>
                                        <Text style={styles.productPrice}>
                                            월 {(product as any).localizedPrice.replace(/₩(.*)/, '$1원')}
                                        </Text>
                                        <Button
                                            style={styles.productButton}
                                            title="멤버십 시작하기"
                                            size="small"
                                            textStyle={{ color: Colors[colorScheme].text.secondary }}
                                            onPress={() => onSubClick(product.productId)}
                                        />
                                    </View>
                                );
                            })}
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

interface Props {
    products: Product[];
    purchaseItems: IAPProduct[];
    subscriptionItems: IAPSubscription[];
    handleSubscription: (sku: string, offerToken?: string) => Promise<boolean>;
    subscriptionLoading: boolean;
}

const useStyles = (colorScheme: ColorScheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            paddingTop: 30,
            backgroundColor: Colors[colorScheme].background.primary
        },
        content: {
            flex: 1,
            padding: 31
        },
        row: {
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        title: {
            fontWeight: '600',
            fontSize: 20,
            lineHeight: 24,
            marginBottom: 18,
            color: Colors[colorScheme].text.primary
        },
        subtitle: {
            fontWeight: '600',
            fontSize: 14,
            lineHeight: 17,
            marginTop: 32,
            marginBottom: 14,
            color: Colors[colorScheme].text.primary
        },
        seperator: {
            width: '100%',
            height: 0.5,
            backgroundColor: Colors[colorScheme].borderColor.primary,
            marginVertical: 20
        },
        purchaseStatus: {
            width: '100%',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 10,
            padding: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: Colors[colorScheme].borderColor.secondary,
            marginBottom: 12,
            backgroundColor: Colors[colorScheme].background.secondary
        },
        purchaseWrap: {
            width: '100%',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: 14,
            paddingBottom: 20,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: Colors[colorScheme].borderColor.secondary,
            marginVertical: 8,
            backgroundColor: Colors[colorScheme].background.secondary
        },
        purchaseTitle: {
            fontSize: 16,
            lineHeight: 19,
            color: Colors[colorScheme].text.primary
        },
        purchasePrice: {
            fontWeight: '600',
            fontSize: 16,
            lineHeight: 19,
            color: Colors[colorScheme].text.primary
        },
        purchaseDate: {
            fontWeight: '400',
            fontSize: 14,
            lineHeight: 17,
            marginBottom: 8,
            color: Colors[colorScheme].text.primary
        },
        terms: {
            marginTop: 12,
            fontWeight: '400',
            fontSize: 12,
            lineHeight: 15,
            color: Colors[colorScheme].text.primary
        },
        buttonText: {
            fontWeight: '600',
            fontSize: 14,
            lineHeight: 17,
            color: 'white'
        },
        purchaseButton: {
            width: 120,
            padding: 10,
            marginLeft: 'auto',
            backgroundColor: Colors[colorScheme].button.primary.background
        },
        unSubscribeButton: {
            marginLeft: 'auto',
            paddingRight: 10
        },
        unSubscribeButtonText: {
            fontSize: 13,
            fontWeight: '600',
            color: Colors[colorScheme].button.primary.background
        },
        productWrap: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            padding: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: Colors[colorScheme].borderColor.secondary,
            marginVertical: 24
        },
        productButton: {
            width: 120,
            padding: 10,
            backgroundColor: Colors[colorScheme].button.primary.background
        },
        productPrice: {
            fontWeight: '600',
            fontSize: 18,
            lineHeight: 22,
            color: Colors[colorScheme].text.primary
        }
    });

export default SubscriptionHistoryScreen;
