import client, { handleApiError } from '../../utils/axios';

import {
    Product,
    Purchase,
    GetProductsParams,
    PurchaseProductParams,
    PurchaseSubCheck,
    GetSubscriptionResponse
} from './types';

export const PurchaseProductAPI = (params: PurchaseProductParams) =>
    client
        .post<Purchase | string>('/purchase', params, {
            timeout: 10000
        })
        .catch(error => handleApiError(error, 'PurchaseProduct'));

export const GetProductsAPI = (params: GetProductsParams) =>
    client.get<Product[]>(`/purchase/products/${params.platform}`).catch(error => handleApiError(error, 'GetProducts'));

export const GetSubscriptionAPI = () =>
    client
        .get<GetSubscriptionResponse>(`/purchase/subscription/status`)
        .catch(error => handleApiError(error, 'GetSubscription'));

export const GetSubscriptionListAPI = () =>
    client.get<Purchase[]>(`/purchase/subscriptions`).catch(error => handleApiError(error, 'GetSubscriptionList'));

export const GetPurchaseListAPI = () =>
    client.get<Purchase[]>(`/purchase/purchases`).catch(error => handleApiError(error, 'GetPurchaseList'));

export const GetPurchaseCheckAPI = () =>
    client.get<Purchase[]>(`/purchase/check`).catch(error => handleApiError(error, 'GetPurchaseCheck'));

export const GetPurchaseSubCheckAPI = () =>
    client.get<PurchaseSubCheck>(`/purchase/subCheck`).catch(error => handleApiError(error, 'GetPurchaseSubCheck'));

export const CheckPurchaseFailureAPI = () =>
    client
        .get<{ canPurchase: boolean }>('/purchase/my-failures')
        .catch(error => handleApiError(error, 'CheckPurchaseFailure'));
