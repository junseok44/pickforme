import React, { useRef, useEffect } from 'react';
import { findNodeHandle, AccessibilityInfo, InteractionManager, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet from 'react-native-modal';
import { useAtom } from 'jotai';

import { isShowNonSubscriberManagerModalAtom, settingAtom, membershipModalTypeAtom } from '@stores';
import { View, Text, Button_old as Button } from '@components';
import { Props, createStyles } from '../Base';
import { Colors } from '@constants';
import useColorScheme from '../../../hooks/useColorScheme';

import type { ColorScheme } from '@hooks';

// Membership
const NonSubscriberManagerBottomSheet: React.FC<Props> = () => {
    const router = useRouter();
    const headerTitleRef = useRef(null);

    const [visible, setVisible] = useAtom(isShowNonSubscriberManagerModalAtom);
    const [setting] = useAtom(settingAtom);
    const [modalType] = useAtom(membershipModalTypeAtom);

    const colorScheme = useColorScheme();
    const localStyles = useLocalStyles(colorScheme);
    const styles = createStyles(colorScheme);

    const onClose = () => setVisible(false);

    const handleClickYes = () => {
        router.push('/subscription');
        onClose();
    };
    const handleClickNo = () => {
        onClose();
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
        <BottomSheet style={styles.base} isVisible={visible} onBackButtonPress={onClose} onBackdropPress={onClose}>
            <View style={[styles.bottomSheet, localStyles.root]}>
                <Text style={[styles.title, localStyles.title]} ref={headerTitleRef}>
                    픽포미 플러스 멤버십 기능이에요.
                </Text>
                <Text style={[styles.desc, localStyles.desc]}>
                    {modalType === 'AI'
                        ? '픽포미 멤버십을 구매하면,\n한 달 간 AI에게 무제한 질문이 가능해요.\n지금 멤버십을 시작하시겠어요?'
                        : '픽포미플러스 멤버십을 구독하면,\n매니저에게 한 달 간 30회까지 질문이 가능해요.\n지금 멤버십을 시작하시겠어요?'}
                </Text>
                <View style={[styles.buttonRow, localStyles.buttonWrap]}>
                    <View style={[styles.buttonWrap, localStyles.buttonOuter]}>
                        <Button
                            title="지금 시작하기"
                            onPress={handleClickYes}
                            style={[localStyles.button1]}
                            size="small"
                            textStyle={localStyles.buttonText}
                        />
                    </View>
                    <View style={[styles.buttonWrap, localStyles.buttonOuter]}>
                        <Button
                            color="tertiary"
                            title="나중에 할래요"
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
            color: Colors[colorScheme].text.primary
        },
        desc: {
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 39,
            color: Colors[colorScheme].text.primary
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
        },
        buttonText: {
            color: Colors[colorScheme].text.secondary
        }
    });

export default NonSubscriberManagerBottomSheet;
