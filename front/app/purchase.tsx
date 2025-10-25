import React from 'react';
import { ScrollView, StyleSheet, Platform } from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import * as WebBrowser from 'expo-web-browser';
import {
    initConnection,
    purchaseErrorListener,
    purchaseUpdatedListener,
    ProductPurchase,
    PurchaseError,
    flushFailedPurchasesCachedAsPendingAndroid,
    SubscriptionPurchase,
    requestPurchase,
    getProducts as IAPGetProducts,
    getSubscriptions as IAPGetSubscriptions,
    Product as IAPProductB,
    Subscription as IAPSubscriptionB,
    finishTransaction,
    withIAPContext
} from 'react-native-iap';

import { getProductsAtom, purchaseProductAtom, productsAtom, getSubscriptionAtom } from '../stores/purchase/atoms';
import { Product, ProductType } from '../stores/purchase/types';
import useColorScheme from '../hooks/useColorScheme';
import { Colors } from '@constants';
import { Text, View, Button_old as Button } from '@components';

import type { ColorScheme } from '@hooks';

type IAPProduct = Omit<IAPProductB, 'type'>;
type IAPSubscription = Omit<IAPSubscriptionB, 'type' | 'platform'>;

const TERM = `
- 이용방법: 픽은 상품의 '매니저 질문하기' 기능에 대한 유료 이용권입니다. 1픽 당 1개의 질문을 의뢰할 수 있습니다.
- 이용기간: 구매한 픽은 유효기간 제한 없이 이용 가능합니다.
- 환불 및 해지: 서비스 환불 및 해지는 고객센터로 문의 부탁드립니다.
`;

const PurchaseWrapper: React.FC = () => {
    const purchaseProduct = useSetAtom(purchaseProductAtom);
    const [purchaseItems, setPurchaseItems] = useState<IAPProduct[]>([]);
    const [subscriptionItems, setSubscriptionItems] = useState<IAPSubscription[]>([]);
    const getProducts = useSetAtom(getProductsAtom);
    const getSubscription = useSetAtom(getSubscriptionAtom);
    const products = useAtomValue(productsAtom);
    const processedTransactions = useRef(new Set<string>());

    const handlePurchaseUpdate = useCallback(
        async (purchase: SubscriptionPurchase | ProductPurchase) => {
            try {
                const receipt = purchase.transactionReceipt;
                const product = products.find(({ productId }) => productId === purchase.productId);

                if (product && receipt && !processedTransactions.current.has(purchase.transactionId!)) {
                    processedTransactions.current.add(purchase.transactionId!);
                    const isSubscription = product.type === ProductType.SUBSCRIPTION;
                    if (Platform.OS === 'android') {
                        const purchaseReceipt = {
                            subscription: isSubscription,
                            ...JSON.parse(receipt as string)
                        };
                        await purchaseProduct({
                            _id: product._id,
                            receipt: purchaseReceipt
                        });
                    } else {
                        await purchaseProduct({ _id: product._id, receipt: receipt as string });
                    }
                    await finishTransaction({ purchase, isConsumable: !isSubscription });
                }
            } catch (error) {
                console.error('handlePurchaseUpdate error:', error);
            }
        },
        [products, purchaseProduct]
    );

    const handlePurchaseError = useCallback((error: PurchaseError) => {
        console.error('Purchase Error:', error);
        // Add additional logging or error handling here if needed
    }, []);

    useEffect(() => {
        getProducts({ platform: Platform.OS });
        getSubscription();
    }, [getProducts, getSubscription]);

    useEffect(() => {
        let purchaseUpdateSubscription: { remove: () => void } | null = null;
        let purchaseErrorSubscription: { remove: () => void } | null = null;

        const setupListeners = async () => {
            if (products.length === 0) {
                return;
            }

            await initConnection();

            if (Platform.OS === 'android') {
                await flushFailedPurchasesCachedAsPendingAndroid();
            }

            purchaseUpdateSubscription = purchaseUpdatedListener(handlePurchaseUpdate);
            purchaseErrorSubscription = purchaseErrorListener(handlePurchaseError);
        };

        setupListeners();

        return () => {
            if (purchaseUpdateSubscription) {
                purchaseUpdateSubscription.remove();
            }
            if (purchaseErrorSubscription) {
                purchaseErrorSubscription.remove();
            }
        };
    }, [handlePurchaseUpdate, handlePurchaseError]);

    useEffect(() => {
        const fetchProducts = async () => {
            if (products.length > 0) {
                const storeItems = await IAPGetProducts({
                    skus: products.filter(p => p.type === ProductType.PURCHASE).map(p => p.productId)
                });
                const storeSItems = await IAPGetSubscriptions({
                    skus: products.filter(p => p.type === ProductType.SUBSCRIPTION).map(p => p.productId)
                });

                setPurchaseItems(storeItems);
                setSubscriptionItems(storeSItems);
            }
        };

        fetchProducts();
    }, [products]);

    return <PointScreen products={products} purchaseItems={purchaseItems} subscriptionItems={subscriptionItems} />;
};

interface Props {
    products: Product[];
    purchaseItems: IAPProduct[];
    subscriptionItems: IAPSubscription[];
}
const PointScreen: React.FC<Props> = ({ products, purchaseItems, subscriptionItems }) => {
    const colorScheme = useColorScheme();
    const styles = useStyles(colorScheme);

    const handleClick = async (sku: string) => {
        try {
            await requestPurchase(Platform.OS === 'ios' ? { sku } : { skus: [sku] });
        } catch (err: any) {
            console.error(err);
        }
    };

    const filteredProducts = products.reduce(
        (obj, product) => {
            if (product.type === ProductType.PURCHASE) {
                const item = purchaseItems.find(({ productId }) => product.productId === productId);
                if (item) {
                    obj.purchasableProducts.push({ ...item, ...product });
                }
            } else {
                const item = subscriptionItems.find(({ productId }) => product.productId === productId);
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

    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.content}>
                    <Text style={styles.title}>픽포미 이용권 구매</Text>
                    <Text style={styles.subtitle}>매니저 질문하기 이용가능</Text>
                    <Text style={styles.description}>
                        픽포미 이용권인 '픽'을 구매하여 매니저 질문하기 기능을 이용하실 수 있어요.
                    </Text>
                    <View style={styles.productsWrap}>
                        {filteredProducts.purchasableProducts.map(product => (
                            <View
                                style={styles.productWrap}
                                key={`Point-Product-${product.productId}`}
                            >
                                <Text style={styles.productPrice}>
                                    {product.displayName} - {product.localizedPrice.replace(/₩(.*)/, '$1원')}
                                </Text>
                                <Button
                                    style={styles.productButton}
                                    textStyle={styles.buttonTextStyle}
                                    title="구매하기"
                                    size="small"
                                    onPress={() => handleClick(product.productId)}
                                />
                            </View>
                        ))}
                    </View>
                </View>
                <View style={styles.content}>
                    <Button
                        style={styles.termButton}
                        title="픽 이용약관"
                        variant="text"
                        onPress={() => WebBrowser.openBrowserAsync('https://sites.google.com/view/sigongan-useterm/홈')}
                        color="tertiary"
                        size="small"
                        textStyle={styles.termButtonText}
                    />
                    <Text style={styles.terms}>{TERM}</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const useStyles = (colorScheme: ColorScheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: Colors[colorScheme].background.primary
        },
        content: {
            flex: 1,
            padding: 31
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
            marginBottom: 14,
            color: Colors[colorScheme].text.primary
        },
        description: {
            color: Colors[colorScheme].text.secondary
        },
        productsWrap: {
            marginTop: 20
        },
        productWrap: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            padding: 14,
            borderRadius: 10,
            borderWidth: 1,
            marginVertical: 8,
            backgroundColor: Colors[colorScheme].background.secondary,
            borderColor: Colors[colorScheme].border.secondary
        },
        productButton: {
            width: 100,
            padding: 10,
            backgroundColor: Colors[colorScheme].button.primary.background
        },
        buttonTextStyle: {
            color: Colors[colorScheme].text.secondary
        },
        productPrice: {
            fontWeight: '600',
            fontSize: 18,
            lineHeight: 22,
            color: Colors[colorScheme].text.primary
        },
        terms: {
            marginTop: 12,
            fontWeight: '400',
            fontSize: 12,
            lineHeight: 15,
            color: Colors[colorScheme].text.secondary
        },
        buttonText: {
            fontWeight: '600',
            fontSize: 14,
            lineHeight: 17
        },
        termButton: {
            marginTop: 100
        },
        termButtonText: {
            color: Colors[colorScheme].text.third
        }
    });
export default withIAPContext(PurchaseWrapper);
