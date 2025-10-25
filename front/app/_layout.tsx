import { Suspense, useEffect, useRef } from 'react';
// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import 'react-native-get-random-values';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Provider as JotaiProvider } from 'jotai';
import { useInitialization } from '../hooks/useInitialization';
import NonSubscriberManagerBottomSheet from '../components/BottomSheet/Membership/NonSubscriberManager';
import LoginBottomSheet from '../components/BottomSheet/Login';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import SubscriptionBottomSheet from '@/components/BottomSheet/Membership/Subscription';
import UnsubscribeBottomSheet from '@/components/BottomSheet/Membership/Unsubscribe';
import usePushToken from '@/hooks/usePushToken';
import { ensureInstallTime, startNewSession } from '@/services/firebase';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
    const [fontLoaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf')
    });

    const isInitialRoutingRef = useRef(false);
    const { initialPushRouteRef } = usePushToken();
    const router = useRouter();
    const pathname = usePathname();

    useScreenTracking();

    const { isTotalLoading, isUserLoggedIn, isSettingReady } = useInitialization(fontLoaded);

    useEffect(() => {
        if (isTotalLoading) {
            return;
        }

        // 앱을 키고 최초의 라우팅인 경우.
        if (!isInitialRoutingRef.current) {
            isInitialRoutingRef.current = true;

            if (initialPushRouteRef.current) {
                router.replace(initialPushRouteRef.current as any);
                initialPushRouteRef.current = null;
            } else {
                if (isUserLoggedIn) {
                    router.replace('/(tabs)');
                } else if (isSettingReady) {
                    // 로그인 되지는 않았지만 설정은 완료된 경우.
                    router.replace('/(tabs)');
                } else {
                    router.replace('/(onboarding)');
                }
            }
            return;
        }

        // 초기화 이후에 루트 경로로 라우팅되는 경우.
        if (pathname === '/') {
            if (isUserLoggedIn) {
                router.replace('/(tabs)');
            } else if (isSettingReady) {
                // 로그인 되지는 않았지만 설정은 완료된 경우.
                router.replace('/(tabs)');
            } else {
                router.replace('/(onboarding)');
            }
        }
    }, [isTotalLoading, isUserLoggedIn, isSettingReady, initialPushRouteRef, pathname]);

    useEffect(() => {
        ensureInstallTime();
        startNewSession();
    }, []);

    // 로딩 중이면 아무것도 렌더링 하지 않음
    if (isTotalLoading) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <QueryClientProvider client={queryClient}>
                <JotaiProvider>
                    <Stack
                        screenOptions={{
                            headerShown: false
                        }}
                    >
                        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="(hansiryun)" options={{ headerShown: false }} />
                        <Stack.Screen name="product-detail" options={{ headerShown: false }} />
                        <Stack.Screen name="info" options={{ headerShown: false }} />
                        <Stack.Screen name="login" options={{ headerShown: false }} />
                        <Stack.Screen name="push" options={{ headerShown: false }} />
                        <Stack.Screen name="mode" options={{ headerShown: false }} />
                        <Stack.Screen name="faq" options={{ headerShown: false }} />
                        <Stack.Screen name="how" options={{ headerShown: false }} />
                    </Stack>
                    <StatusBar style="auto" />
                    <NonSubscriberManagerBottomSheet />
                    <LoginBottomSheet />
                    <SubscriptionBottomSheet />
                    <UnsubscribeBottomSheet />
                </JotaiProvider>
            </QueryClientProvider>
        </Suspense>
    );
}
