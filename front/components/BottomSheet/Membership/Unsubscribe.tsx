/**
 * 멤버십 결제 해지 모달 컴포넌트
 */
import React from 'react';
import { useRef, useEffect } from 'react';
import {
    findNodeHandle,
    AccessibilityInfo,
    InteractionManager,
    StyleSheet,
    Platform,
    Linking,
    Alert,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet from 'react-native-modal';
import { useAtom } from 'jotai';

import { isShowUnsubscribeModalAtom, settingAtom } from '@stores';
import { View, Text, Button_old as Button } from '@components';
import useColorScheme from '../../../hooks/useColorScheme';
import { Colors } from '@constants';
import { Props, styles } from '../Base';

import type { ColorScheme } from '@hooks';
import { logEvent } from '@/services/firebase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Membership
const UnsubscribeBottomSheet: React.FC<Props> = () => {
    const router = useRouter();
    const headerTitleRef = useRef(null);

    const [visible, setVisible] = useAtom(isShowUnsubscribeModalAtom);
    const [setting] = useAtom(settingAtom);

    const colorScheme = useColorScheme();
    const localStyles = useLocalStyles(colorScheme);

    const onClose = () => setVisible(false);

    const handleClickYes = () => {
        onClose();
    };

    const handleClickNo = async () => {
        onClose();
        logEvent('subscription_unsubscribe');
        try {
            if (Platform.OS === 'android') {
                // Android의 경우 구글 플레이 스토어로 이동
                await Linking.openURL('https://support.google.com/googleplay/workflow/9813244?hl=ko');
            } else {
                // iOS의 경우 앱스토어 설정으로 이동
                await Linking.openURL('https://reportaproblem.apple.com');
            }
        } catch (error) {
            console.error('구독 해지 처리 중 에러 발생:', error);
            Alert.alert('구독 해지 처리 중 오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        const focusOnHeader = () => {
            const node = findNodeHandle(headerTitleRef.current);
            if (visible && node) {
                InteractionManager.runAfterInteractions(() => {
                    setTimeout(() => {
                        AccessibilityInfo.setAccessibilityFocus(node);
                    }, 500);
                });
            }
        };
        setTimeout(focusOnHeader, 500);
    }, [visible]);

    return (
        <BottomSheet
            isVisible={visible}
            onBackButtonPress={onClose}
            onBackdropPress={onClose}
            backdropOpacity={0.5}
            useNativeDriver
            hideModalContentWhileAnimating
            deviceHeight={SCREEN_HEIGHT}
            style={{
                margin: 0,
                width: SCREEN_WIDTH,
                justifyContent: 'flex-end'
            }}
        >
            <View style={[styles.bottomSheet, localStyles.root]}>
                <Text style={[styles.title, localStyles.title]} ref={headerTitleRef}>
                    픽포미 멤버십 해지
                </Text>
                <Text style={[styles.desc, localStyles.desc]}>
                    {
                        '픽포미 멤버십을 해지하면,\n앞으로 AI 질문과 매니저에게 질문하기 기능이 제한됩니다.\n그래도 멤버십을 해지하시겠어요?'
                    }
                </Text>
                <View style={[styles.buttonRow, localStyles.buttonWrap]}>
                    <View style={[styles.buttonWrap, localStyles.buttonOuter]}>
                        <Button
                            title="멤버십 유지하기"
                            onPress={handleClickYes}
                            style={[localStyles.button1]}
                            textStyle={{ color: Colors[colorScheme].button.primary.text }}
                            size="small"
                        />
                    </View>
                    <View style={[styles.buttonWrap, localStyles.buttonOuter]}>
                        <Button
                            color="tertiary"
                            title="해지하기"
                            onPress={handleClickNo}
                            style={[localStyles.button2]}
                            size="small"
                        />
                    </View>
                </View>
            </View>
        </BottomSheet>
    );
};

const useLocalStyles = (colorScheme: ColorScheme) =>
    StyleSheet.create({
        root: {
            paddingBottom: 22
        },
        title: {
            fontSize: 18,
            lineHeight: 20,
            fontWeight: '600',
            marginBottom: 20,
            color: '#1e1e1e'
        },
        desc: {
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 39
        },
        buttonWrap: {},
        buttonOuter: {
            flex: 1
        },
        button1: {
            minHeight: 50,
            backgroundColor: Colors[colorScheme].button.primary.background
        },
        button2: {
            minHeight: 50,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: Colors[colorScheme].button.primary.background
        }
    });

export default UnsubscribeBottomSheet;
