import { useRef, useEffect } from 'react';
import { findNodeHandle, AccessibilityInfo, InteractionManager } from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet from 'react-native-modal';
import { useAtom } from 'jotai';

import { isShowLackPointModalAtom } from '@stores';
import { View, Text, Button_old as Button } from '@components';
import { Props, styles } from './Base';

const LackPointBottomSheet: React.FC<Props> = () => {
    const router = useRouter();
    const headerTitleRef = useRef(null);

    const [visible, setVisible] = useAtom(isShowLackPointModalAtom);

    const onClose = () => setVisible(false);

    const handleClickYes = () => {
        router.push('/purchase');
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
            <View style={styles.bottomSheet}>
                <Text style={styles.title} ref={headerTitleRef}>
                    앗, 무료 이용권이 부족해요.
                </Text>
                <Text style={styles.desc}>
                    {'픽포미 이용권을 채워주면, 매니저 질문하기 기능을 계속 사용할 수 있어요.'}
                </Text>
                <View style={styles.buttonRow}>
                    <View style={styles.buttonWrap}>
                        <Button color="secondary" title="지금 채우기" onPress={handleClickYes} style={styles.button} />
                    </View>
                    <View style={styles.buttonWrap}>
                        <Button color="tertiary" title="나중에 할래요" onPress={handleClickNo} style={styles.button} />
                    </View>
                </View>
            </View>
        </BottomSheet>
    );
};
export default LackPointBottomSheet;
