import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import { userAtom, modalAtom } from '@stores';
import client from '../utils/axios';
import { changeToken } from '../utils/axios';
import { setAnalyticsUserId } from './firebase';

import type { IAppleAuthPayload, ILogin, IServiceProps, IBaseAuthPayload } from '@types';

export function useServiceLogin({ onSuccess }: Partial<IServiceProps> = {}) {
    const onUser = useSetAtom(userAtom);
    const onModal = useSetAtom(modalAtom);

    // Google Sign-In 설정
    useEffect(() => {
        GoogleSignin.configure({
            iosClientId: '951645615132-o03i09hk60vq00vl25ri2vu8uoohdq7l.apps.googleusercontent.com',
            webClientId: '951645615132-joo66ec1glh5gbetk7d386fjt6e1e307.apps.googleusercontent.com',
            offlineAccess: false,
            forceCodeForRefreshToken: false
        });
    }, []);

    // 계정 선택 화면을 표시하는 Google 로그인 함수
    const signInWithGoogleFresh = async () => {
        try {
            await GoogleSignin.signOut();
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            return userInfo;
        } catch (error) {
            console.error('Google 로그인 오류:', error);
            throw error;
        }
    };

    const onLogin = useCallback(
        async function (data: ILogin) {
            const userData = data.user;
            await onUser(userData || {});
            if (!!userData) {
                changeToken(userData?.token);
                // Firebase Analytics에 사용자 ID 설정
                if (userData._id) {
                    await setAnalyticsUserId(userData._id);
                }
            }
            onModal(function (prev) {
                return {
                    ...prev,
                    loginModal: false,
                    greetingModal: data?.isNewLoginInEvent || false
                };
            });
        },
        [onUser, onModal]
    );

    const { mutateAsync: mutateKakaoLogin, isPending: isPendingKakaoLogin } = useMutation({
        mutationKey: ['mutateKakaoLogin'],
        mutationFn: function (payload: IBaseAuthPayload) {
            return client.post<ILogin>('/auth/kakao', payload);
        },
        onSuccess: async function (response) {
            if (response.status === 200) {
                onSuccess?.({ isRegister: response.data.isRegister });
                await onLogin(response.data);
            }
        },
        onError: function (error) {
            console.error('서버 API 에러:', error);
        }
    });

    const { mutateAsync: mutateAppleLogin, isPending: isPendingAppleLogin } = useMutation({
        mutationKey: ['mutateAppleLogin'],
        mutationFn: function (payload: IAppleAuthPayload) {
            return client.post<ILogin>('/auth/apple', payload);
        },
        onSuccess: async function (response) {
            if (response.status === 200) {
                onSuccess?.({ isRegister: response.data.isRegister });
                await onLogin(response.data);
            }
        },
        onError: function (error) {
            console.log('error', error);
        }
    });

    const { mutateAsync: mutateGoogleLogin, isPending: isPendingGoogleLogin } = useMutation({
        mutationKey: ['mutateGoogleLogin'],
        mutationFn: function (payload: IBaseAuthPayload) {
            return client.post<ILogin>('/auth/google', payload);
        },
        onSuccess: async function (response) {
            if (response.status === 200) {
                onSuccess?.({ isRegister: response.data.isRegister });
                await onLogin(response.data);
            }
        },
        onError: function (error) {
            console.error('Google 로그인 에러:', error);
        }
    });

    // Google 로그인 함수
    const handleGoogleLogin = async () => {
        try {
            const userInfo = await signInWithGoogleFresh();
            const tokens = await GoogleSignin.getTokens();

            if (tokens.accessToken) {
                await mutateGoogleLogin({ accessToken: tokens.accessToken });
            }
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.error('Google 로그인이 취소되었습니다.');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                console.error('Google 로그인이 진행 중입니다.');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                console.error('Play Services를 사용할 수 없습니다.');
            } else {
                console.error('Google 로그인 중 알 수 없는 오류가 발생했습니다.', error);
            }
        }
    };

    return {
        mutateKakaoLogin,
        mutateAppleLogin,
        mutateGoogleLogin: handleGoogleLogin,
        isPending: isPendingAppleLogin || isPendingKakaoLogin || isPendingGoogleLogin
    };
}

// 회원탈퇴 hook
export function useWithdraw() {
    const onUser = useSetAtom(userAtom);

    const { mutateAsync: mutateWithdraw, isPending: isPendingWithdraw } = useMutation({
        mutationKey: ['mutateWithdraw'],
        mutationFn: function () {
            return client.post('/auth/quit');
        },
        onSuccess: async function (response) {
            if (response.status === 200) {
                // 회원탈퇴 성공 시 사용자 상태 초기화
                await onUser({});
                changeToken(undefined);
                // Firebase Analytics에서 사용자 ID 제거
                await setAnalyticsUserId(null);
            }
        },
        onError: function (error) {
            console.error('회원탈퇴 에러:', error);
        }
    });

    return {
        mutateWithdraw,
        isPending: isPendingWithdraw
    };
}
