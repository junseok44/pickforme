import { useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Platform,
    findNodeHandle,
    AccessibilityInfo,
    Alert,
    InteractionManager
} from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '@react-native-seoul/kakao-login';
import {
    AppleAuthenticationButton,
    AppleAuthenticationButtonType,
    AppleAuthenticationButtonStyle,
    AppleAuthenticationScope,
    signInAsync as appleSignInAsync
} from 'expo-apple-authentication';

import { useServiceLogin } from '@services';
import useColorScheme from '../../hooks/useColorScheme';
import { KakaoImage, GoogleImage } from '@assets';
import useStyle from './style';
import { PopupService } from '@/services/popup';
import { isShowLoginModalAtom } from '@stores';
import { logEvent } from '@/services/firebase';

export default function LoginForm({
    onLoginSuccess
}: {
    onLoginSuccess?: ({ isRegister }: { isRegister: boolean }) => void;
}) {
    const style = useStyle();
    const colorScheme = useColorScheme();
    const contentRef = useRef<Text>(null);

    const { mutateKakaoLogin, mutateAppleLogin, mutateGoogleLogin, isPending } = useServiceLogin({
        onSuccess: async ({ isRegister }) => {
            onLoginSuccess?.({ isRegister });
            if (isRegister) {
                logEvent('register_success');
            } else {
                logEvent('login_success');
            }
            await PopupService.resetFirstLogin();
        }
    });

    useEffect(() => {
        if (contentRef.current) {
            const node = findNodeHandle(contentRef.current);
            if (node) {
                InteractionManager.runAfterInteractions(() => {
                    setTimeout(() => {
                        AccessibilityInfo.setAccessibilityFocus(node);
                    }, 800);
                });
            }
        }
    }, [contentRef]);

    const onLoginWithKakao = useCallback(
        async function () {
            try {
                logEvent('login_attempt', {
                    method: 'kakao'
                });
                const token = await login();
                mutateKakaoLogin({ accessToken: token.accessToken });
            } catch (error) {
                console.error('카카오 로그인 에러:', error);
            }
        },
        [mutateKakaoLogin]
    );

    const onLoginWithApple = useCallback(
        async function () {
            try {
                logEvent('login_attempt', {
                    method: 'apple'
                });
                const credential = await appleSignInAsync({
                    requestedScopes: [AppleAuthenticationScope.FULL_NAME, AppleAuthenticationScope.EMAIL]
                });
                const { identityToken } = credential;
                if (identityToken) {
                    mutateAppleLogin({ identityToken });
                }
            } catch {}
        },
        [appleSignInAsync, mutateAppleLogin]
    );

    const onLoginWithGoogle = useCallback(
        async function () {
            try {
                logEvent('login_attempt', {
                    method: 'google'
                });
                await mutateGoogleLogin();
            } catch (error) {
                console.error('구글 로그인 에러:', error);
                Alert.alert(
                    '구글 로그인 오류',
                    `오류 상세 정보: ${error instanceof Error ? error.message : JSON.stringify(error)}`
                );
            }
        },
        [mutateGoogleLogin]
    );

    return (
        <View style={style.LoginFormContainer}>
            <Text accessible style={style.LoginFormTitle} ref={contentRef}>
                로그인하면 픽포미의 모든{'\n'}서비스를 이용할 수 있어요!
            </Text>
            <View style={style.LoginFormButtonContainer}>
                <TouchableOpacity
                    onPress={onLoginWithKakao}
                    style={[style.LoginFormButton, style.LoginFormButtonKakao]}
                    accessibilityRole="button"
                    accessibilityLabel="카카오로 로그인"
                    accessible
                >
                    <Image source={KakaoImage} style={style.LoginFormButtonImage} />
                    <Text style={style.LoginFormButtonText}>카카오로 로그인</Text>
                </TouchableOpacity>

                <View style={[style.LoginFormButton, style.LoginFormButtonApple]}>
                    {Platform.OS === 'ios' && (
                        <AppleAuthenticationButton
                            buttonType={AppleAuthenticationButtonType.SIGN_IN}
                            buttonStyle={
                                colorScheme === 'light'
                                    ? AppleAuthenticationButtonStyle.BLACK
                                    : AppleAuthenticationButtonStyle.WHITE
                            }
                            cornerRadius={15}
                            style={style.LoginFormButtonApple}
                            onPress={onLoginWithApple}
                        />
                    )}
                </View>

                <TouchableOpacity
                    onPress={onLoginWithGoogle}
                    style={[style.LoginFormButton, style.LoginFormButtonGoogle]}
                    accessibilityRole="button"
                    accessibilityLabel="구글로 로그인"
                    accessible
                >
                    <Image source={GoogleImage} style={style.LoginFormButtonImage} />
                    <Text style={style.LoginFormButtonText}>구글로 로그인</Text>
                </TouchableOpacity>
            </View>

            <Text style={style.LoginFormDescription}>
                픽포미에 첫 회원가입하고{'\n'}AI 질문 이용권을 무료로 받아가세요!
            </Text>
        </View>
    );
}
