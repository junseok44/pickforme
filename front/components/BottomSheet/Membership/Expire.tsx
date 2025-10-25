import React, { useRef, useEffect } from 'react';
import { StyleSheet, findNodeHandle, AccessibilityInfo, InteractionManager } from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet from 'react-native-modal';
import { useAtom } from 'jotai';

import { isShowExpireModalAtom, settingAtom } from '@stores';
import { View, Text, Button_old as Button } from '@components';
import { Props, styles } from '../Base';
import { Colors } from '@constants';
import useColorScheme from '../../../hooks/useColorScheme';

import type { ColorScheme } from '@hooks';

// Membership
const ExpireBottomSheet: React.FC<Props> = () => {
    const router = useRouter();
    const headerTitleRef = useRef(null);

    const [visible, setVisible] = useAtom(isShowExpireModalAtom);
    const [setting] = useAtom(settingAtom);

    const colorScheme = useColorScheme();
    const localStyles = useLocalStyles(colorScheme);

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
                    오늘은 픽포미 멤버십 이용 종료일이에요.
                </Text>
                <Text style={[styles.desc, localStyles.desc]}>
                    {
                        '멤버십을 연장하지 않으면 앞으로 모든\n질문하기 기능이 제한되어요.\n멤버십을 연장하고 픽포미의 모든 기능을 이용해보세요.'
                    }
                </Text>
                <View style={[styles.buttonRow, localStyles.buttonWrap]}>
                    <View style={[styles.buttonWrap, localStyles.buttonOuter]}>
                        <Button
                            title="멤버십 유지하기"
                            onPress={handleClickYes}
                            style={[localStyles.button1]}
                            size="small"
                        />
                    </View>
                    <View style={[styles.buttonWrap, localStyles.buttonOuter]}>
                        <Button
                            color="tertiary"
                            title="확인"
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
            minHeight: 50
        },
        button2: {
            minHeight: 50,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: Colors[colorScheme].button.primary.background
        }
    });

export default ExpireBottomSheet;
