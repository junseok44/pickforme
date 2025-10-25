import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useAtomValue, useSetAtom } from 'jotai';
import { userAtom, settingAtom } from '@stores';
import { setClientToken } from '../utils/axios';
import { UserPointAPI } from '@/stores/user/apis';
import { AxiosResponse } from 'axios';
import { UserPoint } from '@/stores/user/types';
import { checkAndFetchUpdates } from '@/utils/updates';

export const useInitialization = (fontLoaded: boolean) => {
    const user = useAtomValue(userAtom);
    const setUser = useSetAtom(userAtom);
    const setting = useAtomValue(settingAtom);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [isSettingLoading, setIsSettingLoading] = useState(true);
    const [isUpdateLoading, setIsUpdateLoading] = useState(true);
    const isInitialized = useRef(false);
    const startTimeRef = useRef<number>(0);
    const router = useRouter();
    const isTotalLoading = isUserLoading || isSettingLoading || isUpdateLoading || !fontLoaded;

    const isUserLoggedIn = user?.token && user?._id;
    const isSettingReady = setting?.isReady;

    // 앱 시작 시간 기록
    useEffect(() => {
        if (startTimeRef.current === 0) {
            startTimeRef.current = Date.now();
        }
    }, []);

    // 유저 데이터 로딩
    useEffect(() => {
        const checkUser = async () => {
            try {
                await AsyncStorage.getItem('user');
            } finally {
                setIsUserLoading(false);
            }
        };
        checkUser();
    }, []);

    useEffect(() => {
        if (user?.token && user?._id) {
            setClientToken(user.token);

            // 유저 정보 전체 업데이트
            UserPointAPI({})
                .then((response: AxiosResponse<UserPoint>) => {
                    if (response && response.status === 200) {
                        const userData = response.data;
                        if (typeof userData === 'object' && user) {
                            setUser({ ...user, ...userData });
                        }
                    }
                })
                .catch((error: Error) => {
                    console.error('유저 정보 업데이트 실패:', error);
                });
        }
    }, [user?.token, user?._id]);

    // 설정 데이터 로딩
    useEffect(() => {
        const checkSetting = async () => {
            try {
                await AsyncStorage.getItem('setting');
            } finally {
                setIsSettingLoading(false);
            }
        };
        checkSetting();
    }, []);

    useEffect(() => {
        if (isUserLoading) return;

        if (!user?.token || !user?._id) {
            return;
        }

        setClientToken(user.token);
    }, [user, isUserLoading]);

    // 업데이트 확인
    useEffect(() => {
        const handleUpdates = async () => {
            try {
                await checkAndFetchUpdates();
            } catch (error) {
                console.error('업데이트 확인 실패:', error);
            } finally {
                setIsUpdateLoading(false);
            }
        };

        handleUpdates();
    }, []);

    // 초기화 및 라우팅 처리
    useEffect(() => {
        if (!isTotalLoading && !isInitialized.current) {
            isInitialized.current = true;

            const finalizeLoad = async () => {
                const end = Date.now();
                const MINIMUM_LOAD_TIME = 700;
                const remainingTime = MINIMUM_LOAD_TIME - (end - startTimeRef.current);

                if (remainingTime > 0) {
                    await new Promise(resolve => setTimeout(resolve, remainingTime));
                }

                await SplashScreen.hideAsync();
            };

            finalizeLoad();
        }
    }, [isTotalLoading, user, setting]);

    return {
        isTotalLoading,
        isUserLoggedIn,
        isSettingReady
    };
};
