import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    AccessibilityInfo,
    findNodeHandle,
    InteractionManager
} from 'react-native';
import useColorScheme, { ColorScheme } from '@/hooks/useColorScheme';
import Modal from 'react-native-modal';
import { Button_old as Button } from '@components';
import CloseIcon from '@/assets/icons/CloseIcon';
import { Colors } from '@/constants';

interface SurveyProps {
    visible: boolean;
    onClose: () => void;
    onDontShowToday: () => void;
    onSurveyClick: () => void;
    onHelpClick: () => void;
}

const Survey: React.FC<SurveyProps> = ({ visible, onClose, onDontShowToday, onSurveyClick, onHelpClick }) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    const styles = useStyle(colorScheme);
    const headerTitleRef = useRef<Text>(null);

    useEffect(() => {
        if (!visible) return;

        if (headerTitleRef.current) {
            const node = findNodeHandle(headerTitleRef.current);
            if (node) {
                InteractionManager.runAfterInteractions(() => {
                    setTimeout(() => {
                        AccessibilityInfo.setAccessibilityFocus(node);
                    }, 500);
                });
            }
        }
    }, [visible, headerTitleRef.current]);

    return (
        <Modal
            style={styles.base}
            isVisible={visible}
            onBackButtonPress={onClose}
            onBackdropPress={onClose}
            animationIn="slideInUp"
            animationInTiming={300}
            onAccessibilityEscape={onClose}
        >
            <View style={[styles.bottomSheet, { backgroundColor: theme.background.primary }]}>
                <View style={styles.header}>
                    <View style={styles.headerLeft} />
                    <Text style={[styles.title, { color: theme.text.primary }]} ref={headerTitleRef}>
                        픽포미 사용 설문조사
                    </Text>
                    <Pressable
                        onPress={onClose}
                        style={styles.closeButton}
                        accessible
                        accessibilityLabel="닫기"
                        accessibilityRole="button"
                    >
                        <CloseIcon size={24} color={theme.text.primary} />
                    </Pressable>
                </View>

                <Text
                    style={[styles.content, { color: theme.text.primary }]}
                    accessible
                    accessibilityLabel="안녕하세요. 항상 픽포미 서비스를 애용해 주셔서 진심으로 감사드립니다. 현재 저희는 픽포미 유저분들의 소중한 경험과 의견을 듣고자 설문조사를 진행하고 있어요. 설문조사는 약 5분에서 10분 정도 소요되며, 참여해주신 모든 분께 커피 기프티콘을 보내드리고 있습니다. 자세한 내용은 아래 구글폼 링크를 통해 확인하실 수 있어요. 설문 참여가 어려우신 경우, 일대일 문의하기 채널을 통해 도움을 요청하실 수 있습니다. 시공간 운영진이 전화 연결을 통해 직접 설문 참여를 도와드립니다. 소중한 의견 전해주시면 감사하겠습니다. 픽포미 운영진 드림."
                    accessibilityRole="text"
                >
                    안녕하세요!{'\n\n'}
                    항상 픽포미 서비스를 애용해 주셔서 진심으로 감사드립니다.{'\n\n'}
                    현재 저희는 픽포미 유저분들의 소중한 경험과 의견을 듣고자 설문조사를 진행하고 있어요. 설문조사는 약
                    5분에서 10분 정도 소요되며, 참여해주신 모든 분께 커피 기프티콘을 보내드리고 있습니다. 자세한 내용은
                    아래 구글폼 링크를 통해 확인하실 수 있어요.{'\n\n'}
                    설문 참여가 어려우신 경우, 1:1 문의하기 채널을 통해 도움을 요청하실 수 있습니다. 시공간 운영진이
                    전화 연결을 통해 직접 설문 참여를 도와드립니다.{'\n\n'}
                    소중한 의견 전해주시면 감사하겠습니다.{'\n\n'}
                    픽포미 운영진 드림.
                </Text>

                <View style={styles.buttonWrap}>
                    <View style={styles.buttonOuter}>
                        <Button
                            title="설문조사 바로가기"
                            onPress={onSurveyClick}
                            style={styles.button}
                            size="small"
                            textStyle={styles.buttonText}
                            accessibilityLabel="설문조사 바로가기"
                            accessibilityRole="button"
                        />
                    </View>
                    <View style={styles.buttonOuter}>
                        <Button
                            title="1:1 문의 바로가기"
                            onPress={onHelpClick}
                            style={[styles.button, styles.button2]}
                            color="tertiary"
                            size="small"
                            textStyle={styles.button2Text}
                            accessibilityLabel="1:1 무늬 바로가기"
                            accessibilityRole="button"
                        />
                    </View>
                </View>
                <Pressable
                    onPress={onDontShowToday}
                    style={styles.dontShowButton}
                    accessible
                    accessibilityLabel="앞으로 보지 않기"
                    accessibilityRole="button"
                >
                    <Text style={[styles.dontShowText, { color: theme.text.primary }]}>앞으로 보지 않기</Text>
                </Pressable>
            </View>
        </Modal>
    );
};

function useStyle(colorScheme: ColorScheme) {
    const theme = Colors[colorScheme];
    return StyleSheet.create({
        base: {
            justifyContent: 'flex-end',
            margin: 0
        },
        bottomSheet: {
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            padding: 20,
            paddingTop: 20,
            paddingBottom: 40
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            marginTop: 10
        },
        headerLeft: {
            width: 24,
            height: 24
        },
        closeButton: {
            width: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center'
        },
        closeIcon: {
            width: 24,
            height: 24
        },
        title: {
            fontSize: 20,
            fontWeight: '700',
            textAlign: 'center',
            height: 24,
            lineHeight: 24
        },
        content: {
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 20
        },
        buttonWrap: {
            gap: 16,
            paddingTop: 15,
            paddingBottom: 15,
            alignContent: 'stretch',
            alignItems: 'center',
            flexDirection: 'row',
            backgroundColor: theme.background.primary
        },
        buttonOuter: {
            flex: 1
        },
        button: {
            borderRadius: 4,
            height: 50,
            backgroundColor: theme.button.primary.background
        },
        buttonText: {
            color: theme.text.secondary,
            fontSize: 14,
            fontWeight: '700'
        },
        button2: {
            backgroundColor: theme.background.primary,
            borderWidth: 1,
            borderColor: theme.button.primary.background
        },
        button2Text: {
            color: theme.text.primary,
            fontSize: 14,
            fontWeight: '700'
        },
        dontShowButton: {
            alignItems: 'center',
            padding: 10
        },
        dontShowText: {
            fontSize: 14,
            textDecorationLine: 'underline'
        }
    });
}

export default Survey;
