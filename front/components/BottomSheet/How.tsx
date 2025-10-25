import { useRef, useEffect, useMemo } from 'react';
import { findNodeHandle, AccessibilityInfo, StyleSheet, TextStyle, ViewStyle, InteractionManager } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAtom } from 'jotai';
import useColorScheme from '../../hooks/useColorScheme';
import Colors from '../../constants/Colors';
import type { ColorScheme } from '../../hooks/useColorScheme';

import { isShowOnboardingModalAtom } from '@stores';
import View from '../View';
import Text from '../Text';
import { styles as baseStyles } from './Base';

interface HowProps {
    isHomeButton?: boolean;
    visible: boolean;
    onClose: () => void;
}

function How({ isHomeButton = true, visible, onClose }: HowProps) {
    const router = useRouter();
    const headerTitleRef = useRef(null);
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];

    const dynamicStyles = useMemo(() => createStyles(colorScheme), [colorScheme]);

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
        <View style={baseStyles.base}>
            <View style={[baseStyles.bottomSheet, { backgroundColor: theme.background.primary }]}>
                <View style={dynamicStyles.section} ref={headerTitleRef}>
                    <Text style={dynamicStyles.title} accessible={true} accessibilityRole="header">
                        픽포미, 이렇게 사용해 보세요!
                    </Text>
                </View>
                <View style={dynamicStyles.section}>
                    <Text style={dynamicStyles.subtitle}>1. 상품 검색하기</Text>
                    <Text style={dynamicStyles.desc}>
                        앱 최상단 검색창을 눌러 원하는 상품을 검색하거나 궁금한 상품의 링크를 붙여넣어보세요. 상품
                        링크를 붙여 넣을 경우, 픽포미가 해당 상세페이지의 내용을 불러와 자동으로 상품의 이미지 설명,
                        상세페이지 설명과 리뷰를 요약해 줄거예요. 현재 쿠팡, 11번가, 카카오쇼핑, 무신사 상품 링크를
                        검색할 수 있어요.
                    </Text>
                </View>
                <View style={dynamicStyles.section}>
                    <Text style={dynamicStyles.subtitle}>2. AI에게 질문하기</Text>
                    <Text style={dynamicStyles.desc}>
                        상품에 대해 더 알고 싶은 점이 생기면 상품 상세페이지의 질문하기 탭을 눌러서 AI 포미에게 질문해
                        보세요. AI 포미가 빠르고 자세하게 설명해줄 거에요!{' '}
                    </Text>
                </View>
                <View style={dynamicStyles.section}>
                    <Text style={dynamicStyles.subtitle}>3. 매니저에게 질문하기</Text>
                    <Text style={dynamicStyles.desc}>
                        상품에 대해 구체적인 질문을 하고 싶다면 매니저 질문하기 버튼을 눌러 궁금한 점을 물어보세요.
                        픽포미 매니저가 한 시간 이내로 답변해 줄거에요. 질문한 상품은 위시리스트 탭의 매니저에게 문의한
                        상품 탭에 저장돼요. 해당 상품 상세페이지의 질문하기 탭에서 매니저 답변 내용을 확인할 수 있어요!
                    </Text>
                </View>
                <View style={dynamicStyles.section}>
                    <Text style={dynamicStyles.desc}>그럼 이제 픽포미를 즐기러 가볼까요?</Text>
                </View>
                {isHomeButton && (
                    <View style={dynamicStyles.section}>
                        <Link
                            href="/(tabs)"
                            accessibilityRole="button"
                            onPress={() => {
                                onClose();
                                router.replace('/(tabs)');
                            }}
                        >
                            <Text style={[dynamicStyles.desc, dynamicStyles.link]}>홈으로 이동하기</Text>
                        </Link>
                    </View>
                )}
            </View>
        </View>
    );
}

type HowStyles = {
    container: ViewStyle;
    content: ViewStyle;
    title: TextStyle;
    subtitle: TextStyle;
    desc: TextStyle;
    section: ViewStyle;
    page: TextStyle;
    link: TextStyle;
    buttonWrap: ViewStyle;
    buttonLeft: ViewStyle;
    buttonRight: ViewStyle;
    full: ViewStyle;
    half: ViewStyle;
};

const createStyles = (colorScheme: ColorScheme) => {
    const theme = Colors[colorScheme];

    return StyleSheet.create<HowStyles>({
        container: {
            flex: 1,
            paddingTop: 34
        },
        content: {
            paddingHorizontal: 27
        },
        title: {
            fontWeight: '700',
            fontSize: 18,
            lineHeight: 22,
            color: theme.text.primary
        },
        subtitle: {
            fontWeight: '700',
            fontSize: 14,
            lineHeight: 17,
            marginBottom: 8,
            color: theme.text.primary
        },
        desc: {
            fontSize: 14,
            lineHeight: 17,
            color: theme.text.primary
        },
        section: {
            marginBottom: 34
        },
        page: {
            fontSize: 14,
            fontWeight: '600',
            lineHeight: 17,
            color: theme.text.primary
        },
        link: {
            textDecorationLine: 'underline',
            color: theme.text.primary
        },
        buttonWrap: {
            flexDirection: 'row',
            width: '100%',
            gap: 12
        },
        buttonLeft: {
            justifyContent: 'flex-start'
        },
        buttonRight: {
            justifyContent: 'flex-end'
        },
        full: {
            flex: 1
        },
        half: {
            flex: 0.5
        }
    });
};

export default How;
