import { PurchaseResult } from 'react-native-iap';
import { Platform } from 'react-native';

export enum ProductType {
    PURCHASE = 0, // 일회성 구매 상품
    SUBSCRIPTION = 1 // 정기 구독 상품
}

export interface Product {
    _id: string;
    productId: string;
    point: number;
    aiPoint: number;
    platform: typeof Platform.OS;
    displayName: string;
    type: ProductType;
}

export interface PurchaseProductParams extends Pick<Product, '_id'> {
    receipt: PurchaseResult | string;
}

export interface GetProductsParams extends Pick<Product, 'platform'> {}

export interface Purchase {
    product: Product;
    userId: string;
    purchase: {
        service: string;
        status: number;
        packageName: string;
        productId: string;
        purchaseToken: string;
        startTimeMillis: number;
        expiryTimeMillis: number;
        autoRenewing: boolean;
        priceCurrencyCode: string;
        priceAmountMicros: number;
        countryCode: string;
        paymentState: number;
        orderId: string;
        purchaseType: number;
        acknowledgementState: number;
        kind: string;
        transactionId: string;
        quantity: number;
        expirationDate: string;
        isTrial: boolean;
    };
    isExpired: boolean;
    createdAt: string;
}

export interface GetSubscriptionResponse {
    activate: boolean;
    leftDays: number;
    msg: string;
    expiresAt: string | null;
    createdAt: string | null;
}

export interface PurchaseSubCheck {
    sub?: Purchase; // (조회된 DB의 purchase);
    activate: boolean; // (활성화된 구독여부 - true 있음 / false 없음)
    leftDays: number; // (남은구독일 / 활성화된게 없을때도 0 출력)
    msg: string; // (결과 메세지 or 에러코드)
}
