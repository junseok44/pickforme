import React, { useRef, useEffect } from 'react';
import { StyleSheet, TextStyle, ViewStyle, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import useColorScheme from '../../../hooks/useColorScheme';
import Colors from '../../../constants/Colors';
import type { ColorScheme } from '../../../hooks/useColorScheme';
import Modal from 'react-native-modal';
import { focusOnRef } from '../../../utils/accessibility';
import { PopupService } from '../../../services/popup';

import View from '../../View';
import Text from '../../Text';
import CloseIcon from '../../../assets/icons/CloseIcon';

interface TestGroupRecruitmentProps {
    visible: boolean;
    onClose: () => void;
    onGoogleFormClick: () => void;
    onInquiryClick: () => void;
}

function TestGroupRecruitment({ visible, onClose, onGoogleFormClick, onInquiryClick }: TestGroupRecruitmentProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    const dynamicStyles = useStyle(colorScheme);
    const headerTitleRef = useRef(null);

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                if (headerTitleRef.current) {
                    focusOnRef(headerTitleRef, 100);
                }
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleClose = async () => {
        onClose();
    };

    const handleDontShowAgain = async () => {
        try {
            await PopupService.setDontShowTestGroupRecruitment();
            onClose();
        } catch (error) {
            console.error('체험단 모집 팝업 설정 실패:', error);
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
                        accessibilityLabel="팝업: 픽포미 체험단 1기 모집"
                    >
                        픽포미 체험단 1기 모집
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

                {/* 본문 - 스크롤 가능한 영역 */}
                <ScrollView
                    style={dynamicStyles.contentScrollView}
                    showsVerticalScrollIndicator={true}
                    accessibilityLabel="체험단 모집 안내 내용"
                >
                    {/* 첫 번째 부분: 인사말 */}
                    <Text
                        style={[dynamicStyles.content, { color: theme.text.primary }]}
                        accessible
                        accessibilityRole="text"
                    >
                        안녕하세요, 픽포미입니다. 현재 픽포미를 더 나은 방향으로 발전시키기 위해 소수 정예 체험단 1기를
                        모집하고자 합니다.
                    </Text>

                    {/* 두 번째 부분: 활동 기간 및 모집 일정 */}
                    <Text
                        style={[dynamicStyles.content, { color: theme.text.primary }]}
                        accessible
                        accessibilityRole="text"
                    >
                        <Text style={[{ color: theme.text.primary }]}>[활동 기간 및 모집 일정]</Text>
                        {'\n'}
                        체험단 모집 마감은 2025년 10월 1일 (일) 자정 까지이며, 활동 기간은 2025년 10월 2일 (목)부터 10월
                        26일 (일) 자정 까지 입니다.
                    </Text>

                    {/* 세 번째 부분: 활동 개요 */}
                    <Text
                        style={[dynamicStyles.content, { color: theme.text.primary }]}
                        accessible
                        accessibilityRole="text"
                    >
                        <Text style={[{ color: theme.text.primary }]}>[활동 개요]</Text>
                        {'\n'}
                        픽포미 체험단은 앱을 직접 사용해 쇼핑을 경험하고, 체험 후기를 작성하고 공유하는 활동으로
                        진행됩니다. 모집 대상은 온라인 쇼핑에 불편을 겪어본 시각장애인 당사자, 픽포미를 처음 접하거나
                        정보 접근성 기술에 관심 있는 분, 그리고 실제 사용 경험을 바탕으로 솔직한 의견으로 서비스 개선에
                        함께 하고 싶은 분들입니다. 체험단 참여자에게는 최대 1만 원 상품 구매 페이백과 픽포미 멤버십
                        3개월 사용권이 제공되며, 우수 후기자에게는 기프티콘 1만 원이 추가로 증정됩니다.{'\n'}※ 활동과
                        관련한 자세한 내용은 체험단에 선정된 분들을 대상으로 개별 안내될 예정입니다.
                    </Text>

                    {/* 네 번째 부분: 신청 방법 */}
                    <Text
                        style={[dynamicStyles.content, { color: theme.text.primary }]}
                        accessible
                        accessibilityRole="text"
                    >
                        <Text style={[{ color: theme.text.primary }]}>[신청 방법]</Text>
                        {'\n'}
                        체험단 참여를 원하시면 좌측 하단의 '구글폼 작성하기' 버튼을 눌러 신청해주시고, 궁금한 점은 우측
                        하단의 '문의하기' 버튼을 이용해주세요. 신청하신 분들께 선정 결과 및 활동 안내를 개별 연락
                        드립니다.
                    </Text>

                    {/* 다섯 번째 부분: 마무리 메시지 */}
                    <Text
                        style={[dynamicStyles.content, { color: theme.text.primary }]}
                        accessible
                        accessibilityRole="text"
                    >
                        픽포미는 아직 성장 중인 서비스입니다. 여러분의 사용 경험과 피드백이, 더 많은 사람들의 정보
                        접근성을 바꾸는 중요한 시작점이 됩니다. 많은 관심과 참여 부탁드립니다.
                    </Text>
                </ScrollView>

                {/* 버튼들 */}
                <View style={dynamicStyles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            dynamicStyles.button,
                            dynamicStyles.submitButton,
                            {
                                backgroundColor: Colors[colorScheme].button.primary.background
                            }
                        ]}
                        onPress={async () => {
                            await handleClose();
                            onGoogleFormClick();
                        }}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="구글폼 작성하기"
                    >
                        <Text
                            style={[
                                dynamicStyles.submitButtonText,
                                {
                                    color:
                                        colorScheme === 'dark'
                                            ? Colors.dark.text.secondary
                                            : Colors.light.text.secondary
                                }
                            ]}
                        >
                            구글폼 작성하기
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            dynamicStyles.button,
                            dynamicStyles.inquiryButton,
                            {
                                borderColor: Colors[colorScheme].button.primary.background
                            }
                        ]}
                        onPress={async () => {
                            await handleClose();
                            onInquiryClick();
                        }}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="문의하기"
                    >
                        <Text
                            style={[
                                dynamicStyles.inquiryButtonText,
                                {
                                    color: Colors[colorScheme].text.primary
                                }
                            ]}
                        >
                            문의하기
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 앞으로 보지 않기 버튼 */}
                <Pressable
                    onPress={handleDontShowAgain}
                    style={dynamicStyles.dontShowButton}
                    accessible
                    accessibilityLabel="앞으로 보지 않기"
                    accessibilityRole="button"
                >
                    <Text style={[dynamicStyles.dontShowText, { color: theme.text.primary }]}>앞으로 보지 않기</Text>
                </Pressable>
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
        contentScrollView: {
            maxHeight: 400,
            marginBottom: 20
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
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 10,
            marginBottom: 10
        },
        button: {
            flex: 1,
            borderRadius: 4,
            padding: 0,
            alignItems: 'center',
            justifyContent: 'center',
            height: 50
        },
        submitButton: {
            textAlign: 'center',
            width: 50,
            marginRight: 16
        },
        submitButtonText: {
            fontSize: 16,
            fontWeight: '600'
        },
        inquiryButton: {
            backgroundColor: 'transparent',
            borderWidth: 1
        },
        inquiryButtonText: {
            fontSize: 16,
            fontWeight: '600'
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

export default TestGroupRecruitment;
