import { useRef, useEffect } from 'react';
import { findNodeHandle, AccessibilityInfo, StyleSheet, InteractionManager } from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet from 'react-native-modal';
import { useAtom } from 'jotai';

import { isShowGreetingModalAtom } from '@stores';
import { View, Text, Button_old as Button } from '@components';
import { Props, styles } from './Base';

const localStyles = StyleSheet.create({
    title: {
        lineHeight: 29
    }
});

const GreetingBottomSheet: React.FC<Props> = () => {
    const router = useRouter();
    const headerTitleRef = useRef(null);

    const [visible, setVisible] = useAtom(isShowGreetingModalAtom);

    const onClose = () => setVisible(false);

    const handleClickYes = () => {
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
            <View style={styles.bottomSheet}>
                <Text style={[styles.title, localStyles.title]} ref={headerTitleRef}>
                    {/* 픽포미 3.0 업데이트 감사 이벤트! */}
                    픽포미 리뉴얼 감사 이벤트!
                </Text>
                <Text style={[styles.desc, localStyles.title]}>
                    {/* 감사의 의미로 AI 질문하기 무료 이용권 10개를 지급해드렸어요.
          3.0 업데이트로 더욱 편리해진 픽포미를 이용해보세요! */}
                    픽포미 리뉴얼 기념으로 2주 동안 AI 질문하기 무료 이용권을 지급해 드렸어요! 새로워진 픽포미와 함께
                    쇼핑하러 가볼까요?
                </Text>
                <View style={styles.buttonRow}>
                    <View style={styles.buttonWrap}>
                        <Button color="secondary" title="확인" onPress={handleClickYes} style={styles.button} />
                    </View>
                </View>
            </View>
        </BottomSheet>
    );
};
export default GreetingBottomSheet;
