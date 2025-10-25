import { atom } from 'jotai';
import { Alert } from 'react-native';

import { atomWithStorage } from '../utils';
import { setClientToken } from '../../utils/axios';
import {
    UserData,
    LoginResponse,
    Setting,
    GoogleLoginParams,
    AppleLoginParams,
    KakaoLoginParams,
    SetPushTokenParams,
    SetPushSettingParams
} from './types';
import { QuitAPI, GoogleLoginAPI, AppleLoginAPI, KakaoLoginAPI, SetPushTokenAPI, SetPushSettingAPI } from './apis';

import { AxiosError } from 'axios';
import { userAtom } from '../user';

export const isOnboardingFinishedAtom = atomWithStorage<'true' | 'false'>('isOnboardingFinished', 'false');
export const isLoadedAtom = atomWithStorage<'true' | 'false'>('isLoaded', 'false');

export const settingAtom = atomWithStorage<Setting>('setting', {
    isReady: false
});
// export const userDataAtom = atomWithStorage<UserData | void>('userData', undefined);
export const setPointAtom = atom(null, async (get, set, data: number) => {
    const userData = await get(userAtom);
    if (!userData) {
        return;
    }
    set(userAtom, { ...userData, point: data });
});

export const quitAtom = atom(null, async (get, set) => {
    await QuitAPI();
    set(userAtom, undefined);
    Alert.alert('탈퇴가 완료되었습니다.');
});

export const logoutAtom = atom(null, async (get, set) => {
    set(userAtom, undefined);
    Alert.alert('로그아웃 되었습니다.');
});

export const setClientTokenAtom = atom(null, async (get, set) => {
    const userData = await get(userAtom);
    if (!userData) {
        return;
    }
    setClientToken(userData.token);
});

export const handleLoginResultAtom = atom(null, async (get, set, data: LoginResponse) => {
    await set(userAtom, data.user);
    set(isShowLoginModalAtom, false);
    if (data.isNewLoginInEvent) {
        set(isShowGreetingModalAtom, true);
    }
    set(setClientTokenAtom);
});

export const loginGoogleAtom = atom(null, async (get, set, params: GoogleLoginParams) => {
    const { data } = await GoogleLoginAPI(params);
    set(handleLoginResultAtom, data);
});

export const loginAppleAtom = atom(null, async (get, set, params: AppleLoginParams) => {
    const { data } = await AppleLoginAPI(params);
    set(handleLoginResultAtom, data);
});

export const loginKakaoAtom = atom(null, async (get, set, params: KakaoLoginParams) => {
    try {
        console.log('loginKakaoAtom params', params);
        const response = await KakaoLoginAPI(params);

        if (response && response.data) {
            set(handleLoginResultAtom, response.data);
        } else {
            console.log('Kakao API로부터 데이터를 받지 못했습니다');
        }
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(`Kakao 로그인 요청 실패: ${error.message}`);
        } else {
            console.error('예상치 못한 오류가 발생했습니다:', error);
        }
        // 추가적인 에러 처리 (예: 사용자에게 에러 메시지 표시)
    }
});

export const setPushTokenAtom = atom(null, async (get, set, params: SetPushTokenParams) => {
    await SetPushTokenAPI(params);
});

export const setPushSettingAtom = atom(null, async (get, set, params: SetPushSettingParams) => {
    const userData = await get(userAtom);
    if (userData) {
        const { data } = await SetPushSettingAPI(params);
        set(userAtom, { ...userData, push: data });
    }
});

export const isShowLoginModalAtom = atom(false);
export const isShowOnboardingModalAtom = atom(false);
export const isShowLackPointModalAtom = atom(false);
export const isShowGreetingModalAtom = atom(false);

// 2024
export const isShowVersionUpdateAlarmModalAtom = atom(false);
export const isShowIntroduceAlertModalAtom = atom(false);
export const isShowSubscriptionModalAtom = atom(false);
export const isShowNonSubscriberManagerModalAtom = atom(false);
export const isShowExpireModalAtom = atom(false);
export const isShowUnsubscribeModalAtom = atom(false);
export const isShowUpdateAlartModalAtom = atom(false);
export const membershipModalTypeAtom = atom<'AI' | 'MANAGER'>('MANAGER');
export const isShowRequestModalAtom = atom(false);
