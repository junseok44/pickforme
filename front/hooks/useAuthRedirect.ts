// hooks/useAuthRedirect.ts
import { useAtomValue } from 'jotai';
import { userAtom } from '@/stores';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export const useAuthRedirect = (requireAuth: boolean) => {
    const user = useAtomValue(userAtom);
    const router = useRouter();
    const isAuthenticated = user && user.token && user.token.length > 0;

    useEffect(() => {
        // 인증이 필요한 라우트인데 로그인하지 않은 경우
        if (requireAuth && !isAuthenticated) {
            router.replace('/(onboarding)');
        }

        // 인증이 필요없는 라우트인데 로그인한 경우
        if (!requireAuth && isAuthenticated) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, requireAuth]);
};
