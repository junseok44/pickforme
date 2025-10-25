import { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import useColorScheme from '../hooks/useColorScheme';
import Colors from '../constants/Colors';

import { LoginForm, BackHeader } from '@components';
import { userAtom } from '@stores';
import BackIcon from '@/assets/icons/BackIcon';
import { logEvent } from '@/services/firebase';

export default function LoginScreen() {
    const colorScheme = useColorScheme();
    const style = useStyle(colorScheme);
    const router = useRouter();

    const user = useAtomValue(userAtom);

    // 방금 로그인 하고 나서 밑에 있는 router.back() 을 호출하지 않기 위해 사용.
    const hasUserJustLoggedIn = useRef(false);

    useEffect(
        function () {
            if (user?._id && router.canGoBack()) {
                // 방금 로그인 했을때는 router.back하지 않도록.
                if (hasUserJustLoggedIn.current) {
                    hasUserJustLoggedIn.current = false;
                } else {
                    router.back();
                }
            }
        },
        [user?._id, router]
    );

    const onLoginSuccess = ({ isRegister }: { isRegister: boolean }) => {
        hasUserJustLoggedIn.current = true;
        router.replace('/(tabs)');
    };

    return (
        <View style={style.LoginScreenContainer} onAccessibilityEscape={() => router.back()}>
            <Pressable
                onPress={() => router.back()}
                accessible
                accessibilityRole="button"
                accessibilityLabel="뒤로가기"
                style={{ marginTop: 100, marginLeft: 20 }}
                onAccessibilityEscape={() => router.back()}
            >
                <BackIcon size={48} color={Colors[colorScheme].text.primary} />
            </Pressable>
            <View style={style.LoginScreenContent}>
                <LoginForm onLoginSuccess={onLoginSuccess} />
            </View>
        </View>
    );
}

function useStyle(colorScheme: ReturnType<typeof useColorScheme>) {
    const theme = Colors[colorScheme];
    return StyleSheet.create({
        LoginScreenContainer: {
            flex: 1,
            backgroundColor: theme.background.primary
        },
        LoginScreenContent: {
            flex: 1,
            paddingHorizontal: 20,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 80,
            backgroundColor: theme.background.primary
        }
    });
}
