import {
    initConnection,
    purchaseErrorListener,
    purchaseUpdatedListener,
    ProductPurchase,
    PurchaseError,
    flushFailedPurchasesCachedAsPendingAndroid,
    SubscriptionPurchase,
    getSubscriptions as IAPGetSubscriptions,
    Product as IAPProductB,
    Subscription as IAPSubscriptionB,
    finishTransaction
} from 'react-native-iap';
import { Product, ProductType, PurchaseProductParams } from '../stores/purchase/types';
import { Platform } from 'react-native';

type IAPSubscription = Omit<IAPSubscriptionB, 'type' | 'platform'>;

export const initializeIAP = async (
    products: Product[],
    purchaseUpdateSubscription: any,
    purchaseErrorSubscription: any,
    purchaseProduct: (params: PurchaseProductParams) => Promise<void>
) => {
    await initConnection();

    const storeSItems = await IAPGetSubscriptions({
        skus: products.filter(p => p.type === ProductType.SUBSCRIPTION).map(p => p.productId)
    });

    const addListeners = () => {
        purchaseUpdateSubscription = purchaseUpdatedListener(
            async (purchase: SubscriptionPurchase | ProductPurchase) => {
                const receipt = purchase.transactionReceipt;

                const product = products.find(({ productId }) => productId === purchase.productId);
                if (!product) {
                    return;
                }
                const isSubscription = product.type === ProductType.SUBSCRIPTION;
                if (!receipt) {
                    return;
                }
                await purchaseProduct({
                    _id: product._id,
                    receipt: receipt
                } as PurchaseProductParams);
                await finishTransaction({
                    purchase,
                    isConsumable: !isSubscription
                });
            }
        );

        purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
            console.error('purchaseErrorListener', error);
        });
    };

    if (Platform.OS === 'android') {
        await flushFailedPurchasesCachedAsPendingAndroid();
    }

    addListeners();

    return storeSItems;
};
