import client, { handleApiError } from '../../utils/axios';

import {
    LoginResponse,
    AppleLoginParams,
    KakaoLoginParams,
    GoogleLoginParams,
    SetPushTokenParams,
    SetPushSettingParams,
    SetPushSettingResponse,
    phoneCheckParams,
    SetPopupParams,
    Popup
} from './types';

export const AppleLoginAPI = (params: AppleLoginParams) =>
    client.post<LoginResponse>('/auth/apple', params).catch(error => handleApiError(error, 'AppleLogin'));

export const KakaoLoginAPI = (params: KakaoLoginParams) =>
    client.post<LoginResponse>('/auth/kakao', params).catch(error => handleApiError(error, 'KakaoLogin'));

export const GoogleLoginAPI = (params: GoogleLoginParams) =>
    client.post<LoginResponse>('/auth/google', params).catch(error => handleApiError(error, 'GoogleLogin'));

export const SetPushTokenAPI = (params: SetPushTokenParams) =>
    client.post('/auth/pushtoken', params).catch(error => handleApiError(error, 'SetPushToken'));

export const SetPushSettingAPI = (params: SetPushSettingParams) =>
    client
        .put<SetPushSettingResponse>('/auth/pushsetting', params)
        .catch(error => handleApiError(error, 'SetPushSetting'));

export const QuitAPI = () => client.post('/auth/quit').catch(error => handleApiError(error, 'Quit'));

export const PhoneCheckAPI = async ({ id, phone }: phoneCheckParams) => {
    try {
        const response = await client.post('/user/duplicationphone', { phone });
        return response;
    } catch (error) {
        return handleApiError(error, 'PhoneCheck');
    }
};

export const SetPopupAPI = (params: SetPopupParams) =>
    client.post('/user/setpopup', params).catch(error => handleApiError(error, 'SetPopup'));

export const GetPopupAPI = () => client.get<Popup[]>('/popup/active').catch(error => handleApiError(error, 'GetPopup'));

export const PhoneSubmitAPI = async ({ id, phone }: phoneCheckParams) => {
    try {
        const response = await client.post('/user/phone', { id, phone });
        return response;
    } catch (error) {
        return handleApiError(error, 'PhoneSubmit');
    }
};
