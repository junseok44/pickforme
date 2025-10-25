import React, { useRef, useEffect } from 'react';
import { StyleSheet, TextStyle, ViewStyle, Pressable } from 'react-native';
import useColorScheme from '../../../hooks/useColorScheme';
import Colors from '../../../constants/Colors';
import type { ColorScheme } from '../../../hooks/useColorScheme';
import Modal from 'react-native-modal';
import { focusOnRef } from '../../../utils/accessibility';
import { PopupService } from '../../../services/popup';

import View from '../../View';
import Text from '../../Text';
import { Button_old as Button } from '../../index';
import CloseIcon from '../../../assets/icons/CloseIcon';

interface UpdateNoticeProps {
    visible: boolean;
    onClose: () => void;
    onShoppingClick: () => void;
}

function UpdateNotice({ visible, onClose, onShoppingClick }: UpdateNoticeProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    const dynamicStyles = useStyle(colorScheme);
    const headerTitleRef = useRef(null);

    useEffect(() => {
        if (visible && headerTitleRef.current) {
            focusOnRef(headerTitleRef, 1000);
        }
    }, [visible, headerTitleRef.current]);

    const handleClose = async () => {
        onClose();
        try {
            await PopupService.setDontShowUpdateNotice();
        } catch (error) {
            console.error('업데이트 안내 팝업 설정 실패:', error);
        }
    };

    return (
        <Modal
            style={dynamicStyles.base}
            isVisible={visible}
            onBackButtonPress={handleClose}
            onBackdropPress={handleClose}
            animationIn="slideInUp"
            animationInTiming={300}
            onAccessibilityEscape={handleClose}
        >
            <View style={[dynamicStyles.bottomSheet, { backgroundColor: theme.background.primary }]}>
                {/* 헤더: 제목 + X 버튼 */}
                <View style={dynamicStyles.header}>
                    <View style={dynamicStyles.headerLeft} />
                    <Text
                        style={[dynamicStyles.title, { color: theme.text.primary }]}
                        ref={headerTitleRef}
                        accessible={true}
                        accessibilityLabel="팝업: 업데이트 및 멤버십 출시 안내"
                    >
                        [업데이트 및 멤버십 출시 안내]
                    </Text>
                    <Pressable
                        onPress={handleClose}
                        style={dynamicStyles.closeButton}
                        accessible
                        accessibilityLabel="닫기"
                        accessibilityRole="button"
                    >
                        <CloseIcon size={24} color={theme.text.primary} />
                    </Pressable>
                </View>

                {/* 본문 - 3부분으로 나누어 스크린리더 접근성 향상 */}

                {/* 첫 번째 부분: 인사말 */}
                <Text
                    style={[dynamicStyles.content, { color: theme.text.primary }]}
                    accessible
                    accessibilityRole="text"
                >
                    안녕하세요, 픽포미입니다.{'\n\n'}이번에 진행된 업데이트를 통해 더 빨라진 속도, 더 높아진 정확도, 더
                    편리해진 접근성을 경험하실 수 있어요.
                </Text>

                {/* 두 번째 부분: 세 가지 개선사항 */}
                <Text
                    style={[dynamicStyles.content, { color: theme.text.primary }]}
                    accessible
                    accessibilityRole="text"
                >
                    <Text style={[dynamicStyles.bold, { color: theme.text.primary }]}>
                        첫째, 성능을 전면 개선했습니다.
                    </Text>{' '}
                    검색과 요약 속도가 한층 빨라졌고, 상품 정보도 더 정확하게 확인하실 수 있어요.{'\n\n'}
                    <Text style={[dynamicStyles.bold, { color: theme.text.primary }]}>
                        둘째, 새로운 '픽포미 플러스' 멤버십이 출시되었습니다.
                    </Text>{' '}
                    구독을 통해 무제한 AI 질문과 매니저 질의 30회를 이용하실 수 있고, 상품 탐색 과정에서 궁금한 점을
                    보다 쉽고 편리하게 해결하실 수 있어요. 픽포미 플러스는 마이페이지에서 바로 구독하실 수 있습니다.
                    {'\n\n'}
                    <Text style={[dynamicStyles.bold, { color: theme.text.primary }]}>
                        셋째, 스크린리더 친화적 설계를 강화했습니다.
                    </Text>{' '}
                    버튼과 탭의 읽기 순서를 정리하고 레이블을 보완하여 필요한 정보에 더 쉽게 접근하실 수 있고, 다크 모드
                    지원으로 눈의 피로도 줄이실 수 있어요.
                </Text>

                {/* 세 번째 부분: 마무리 메시지 */}
                <Text
                    style={[dynamicStyles.content, { color: theme.text.primary }]}
                    accessible
                    accessibilityRole="text"
                >
                    픽포미는 더 안정적이고 똑똑해진 쇼핑 경험을 약속드립니다. 지금, 더 매끄러운 탐색과 명확한 정보로
                    한결 편리한 쇼핑을 경험해 보세요.
                </Text>

                {/* 버튼 */}
                <View style={dynamicStyles.buttonContainer}>
                    <Button
                        title="지금 바로 쇼핑하러 가기"
                        onPress={async () => {
                            await handleClose();
                            onShoppingClick();
                        }}
                        size="small"
                        style={dynamicStyles.button}
                        textStyle={dynamicStyles.buttonText}
                        accessibilityLabel="지금 바로 쇼핑하러 가기"
                        accessibilityRole="button"
                    />
                </View>
            </View>
        </Modal>
    );
}

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
        title: {
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center',
            height: 24,
            lineHeight: 24
        },
        content: {
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 20
        },
        bold: {
            fontWeight: '700'
        },
        buttonContainer: {
            paddingTop: 15,
            paddingBottom: 15
        },
        button: {
            borderRadius: 4,
            height: 50,
            width: 227,
            marginHorizontal: 'auto',
            backgroundColor: theme.button.primary.background
        },
        buttonText: {
            color: theme.text.secondary,
            fontSize: 14,
            fontWeight: '700'
        }
    });
}

export default UpdateNotice;
