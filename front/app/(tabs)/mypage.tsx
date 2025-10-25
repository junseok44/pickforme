import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Alert,
    findNodeHandle,
    InteractionManager,
    AccessibilityInfo
} from 'react-native';
import { useAtom } from 'jotai';
import * as WebBrowser from 'expo-web-browser';
import useColorScheme from '../../hooks/useColorScheme';
import type { ColorScheme } from '../../hooks/useColorScheme';
import Colors from '../../constants/Colors';

import { IconHeader, MySection } from '@components';
import { userAtom } from '@stores';
import { changeToken } from '../../utils/axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/core';
import { useWithdraw } from '@/services';
import { setAnalyticsUserId } from '@/services/firebase';

export default function MyScreen() {
    const colorScheme = useColorScheme();
    const style = useStyle(colorScheme);
    const router = useRouter();
    const headerTitleRef = useRef<View>(null);

    const [user, onUser] = useAtom(userAtom);
    const { mutateWithdraw, isPending: isWithdrawPending } = useWithdraw();

    useFocusEffect(
        useCallback(() => {
            const f = () => {
                if (headerTitleRef.current) {
                    const nodeHandle = findNodeHandle(headerTitleRef.current);
                    if (nodeHandle) {
                        InteractionManager.runAfterInteractions(() => {
                            setTimeout(() => {
                                AccessibilityInfo.setAccessibilityFocus(nodeHandle);
                            }, 500);
                        });
                    }
                }
            };
            setTimeout(f, 500);
        }, [])
    );
    const goToInfo = useCallback(
        function () {
            // @ts-ignore - Expo Router 4 type issues
            router.push('/info');
        },
        [router]
    );

    const goToLogin = useCallback(
        function () {
            // @ts-ignore - Expo Router 4 type issues
            router.push('/login');
        },
        [router]
    );

    const goToPush = useCallback(
        function () {
            // @ts-ignore - Expo Router 4 type issues
            router.push('/(settings)/notification');
        },
        [router]
    );

    const goToTheme = useCallback(
        function () {
            // @ts-ignore - Expo Router 4 type issues
            router.push('/(settings)/theme');
        },
        [router]
    );

    const goToHow = useCallback(
        function () {
            // @ts-ignore - Expo Router 4 type issues
            router.push('/how');
        },
        [router]
    );

    const goToFontSize = useCallback(
        function () {
            // @ts-ignore - Expo Router 4 type issues
            router.push('/(settings)/setFontSize');
        },
        [router]
    );

    const goToFAQ = useCallback(
        function () {
            // @ts-ignore - Expo Router 4 type issues
            router.push('/faq');
        },
        [router]
    );

    const goToSubscription = useCallback(
        function () {
            // @ts-ignore - Expo Router 4 type issues
            router.push('/subscription');
        },
        [router]
    );

    const goToSubscriptionHistory = useCallback(
        function () {
            // @ts-ignore - Expo Router 4 type issues
            router.push('/subscription-history');
        },
        [router]
    );

    const onLogout = useCallback(
        function () {
            Alert.alert('로그아웃', '로그아웃하시겠습니까?', [
                {
                    text: '아니요',
                    style: 'cancel'
                },
                {
                    text: '예',
                    onPress: async () => {
                        onUser({});
                        changeToken(undefined);
                        // Firebase Analytics에서 사용자 ID 제거
                        await setAnalyticsUserId(null);
                        Alert.alert('로그아웃 되었습니다.');
                    }
                }
            ]);
        },
        [onUser]
    );

    const onWithdraw = useCallback(
        function () {
            Alert.alert(
                '정말 회원탈퇴 하시겠어요?',
                '회원탈퇴 시 계정과 이용 기록이 모두 삭제되며, 복구가 불가능합니다. 또한 보유 중인 이용권과 멤버십 혜택은 즉시 소멸됩니다.',
                [
                    {
                        text: '아니요',
                        style: 'cancel'
                    },
                    {
                        text: '네, 탈퇴합니다',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await mutateWithdraw();
                                Alert.alert('회원탈퇴가 완료되었습니다.', '', [
                                    {
                                        text: '확인',
                                        onPress: () => {
                                            router.replace('/login');
                                        }
                                    }
                                ]);
                            } catch (error) {
                                Alert.alert('오류', '회원탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.');
                                console.error('회원탈퇴 오류:', error);
                            }
                        }
                    }
                ]
            );
        },
        [mutateWithdraw, router]
    );

    const myInfoMenu = useMemo(
        function () {
            // const defaultMenu = [{ name: '내 정보 수정하기', onPress: goToInfo }];
            if (!user?._id) {
                return [{ name: '로그인', onPress: goToLogin }];
            }
            return [
                // ...defaultMenu,
                { name: '멤버십 이용하기', onPress: goToSubscription },
                { name: '멤버십 구매내역', onPress: goToSubscriptionHistory }
            ];
        },
        [user?._id, goToInfo, goToLogin, goToSubscription, goToSubscriptionHistory]
    );

    const appSettingMenu = useMemo(
        function () {
            const defaultMenu = [
                { name: '화면 모드 변경하기', onPress: goToTheme },
                // { name: '글자 크기 변경하기', onPress: goToFontSize },
                {
                    name: '알림 설정하기',
                    onPress: goToPush
                }
            ];
            return defaultMenu;
        },
        [user?._id, goToPush]
    );

    return (
        <View style={style.MyContainer}>
            <View accessible={true} accessibilityRole="header" accessibilityLabel="마이페이지" ref={headerTitleRef}>
                <IconHeader title="마이페이지" />
            </View>
            <View style={style.MyContent}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={style.MyScrollView}>
                    {!!user?._id && (
                        <MySection
                            title="잔여 이용권"
                            items={[
                                { name: `매니저 질문권 ${user.point ?? 0}회` },
                                { name: `AI 질문권 ${user.aiPoint ?? 0}회` }
                            ]}
                            role="none"
                        />
                    )}

                    <MySection title="내 정보" items={myInfoMenu} role="button" />

                    <MySection title="앱 설정" items={appSettingMenu} role="button" />

                    <MySection
                        title="고객 지원"
                        role="button"
                        items={[
                            {
                                name: '1:1 문의',
                                onPress: function () {
                                    WebBrowser.openBrowserAsync('http://pf.kakao.com/_csbDxj');
                                }
                            },
                            { name: '사용 설명서', onPress: goToHow },
                            { name: '자주 묻는 질문', onPress: goToFAQ },
                            {
                                name: '개인정보처리방침',
                                onPress: function () {
                                    WebBrowser.openBrowserAsync(
                                        'https://sites.google.com/view/sigongan-useterm/개인정보처리방침?authuser=0'
                                    );
                                }
                            },
                            {
                                name: '서비스 이용약관',
                                onPress: function () {
                                    WebBrowser.openBrowserAsync(
                                        'https://sites.google.com/view/sigongan-useterm/홈?authuser=0'
                                    );
                                }
                            }
                        ]}
                    />

                    {!!user?._id && (
                        <MySection
                            title="계정"
                            items={[
                                { name: '로그아웃', onPress: onLogout },
                                { name: '회원탈퇴', onPress: onWithdraw }
                            ]}
                            role="button"
                        />
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

function useStyle(colorScheme: ColorScheme) {
    const insets = useSafeAreaInsets();
    const theme = Colors[colorScheme];
    return StyleSheet.create({
        MyContainer: {
            flex: 1,
            backgroundColor: theme.background.primary
        },
        MyContent: {
            flex: 1,
            backgroundColor: theme.background.primary
        },
        MyScrollView: {
            paddingTop: 20,
            paddingBottom: 20,
            paddingHorizontal: 20,
            backgroundColor: theme.background.primary
        }
    });
}
