// hooks/useScreenTracking.ts
import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { logScreenView } from '../services/firebase';
import { AnalyticsScreenName } from '@/types/firebase';

// 화면 이름 매핑 객체
const screenNameMapping: { [key: string]: AnalyticsScreenName } = {
    '/': 'HomeScreen',
    '/product-detail': 'ProductDetailScreen',
    '/wishlist': 'WishlistScreen',
    '/mypage': 'MyPageScreen',
    '/subscription': 'SubscriptionScreen',
    '/subscription-history': 'SubscriptionHistoryScreen',
    '/login': 'LoginScreen'
};

export const useScreenTracking = () => {
    const pathname = usePathname();

    useEffect(() => {
        const screenName = screenNameMapping[pathname] || 'UnknownScreen';
        logScreenView(screenName, screenName);
    }, [pathname]);
};
