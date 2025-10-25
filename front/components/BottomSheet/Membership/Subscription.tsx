/**
 * 멤버십 구독 완료 바텀 시트 컴포넌트
 */
import BottomSheet from 'react-native-modal';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useAtom } from 'jotai';

import { Props, styles } from '../../BottomSheet/Base';
import { isShowSubscriptionModalAtom } from '@stores';
import { Button, View, Text } from '@components';
import useColorScheme from '../../../hooks/useColorScheme';
import { Colors } from '@constants';

import type { ColorScheme } from '@hooks';

const SubscriptionBottomSheet: React.FC<Props> = () => {
    const [visible, setVisible] = useAtom(isShowSubscriptionModalAtom);
    const router = useRouter();

    const onClose = () => setVisible(false);

    const colorScheme = useColorScheme();
    const localStyles = useLocalStyles(colorScheme);

    const handlePress = () => {
        onClose();

        router.replace('/');
    };

    return (
        <BottomSheet style={styles.base} isVisible={visible} onBackButtonPress={onClose} onBackdropPress={onClose}>
            <View style={[styles.bottomSheet, localStyles.root]}>
                <Text style={[styles.title, localStyles.title]}>픽포미 멤버십 구독이 완료됐어요!</Text>
                <Text style={[styles.desc, localStyles.desc1]}>
                    {
                        '픽포미 멤버가 되신 것을 환영해요.\n이제부터 한 달 무제한 질문 혜택을 누려보세요.\n지금 바로 픽포미와 쇼핑하러 갈까요?'
                    }
                </Text>
                <Button title="쇼핑하러 가기" onPress={handlePress} />
            </View>
        </BottomSheet>
    );
};

const useLocalStyles = (colorScheme: ColorScheme) =>
    StyleSheet.create({
        root: {
            paddingBottom: 72
        },
        title: {
            fontSize: 18,
            lineHeight: 20,
            fontWeight: '600',
            marginBottom: 27,
            color: '#1e1e1e'
        },
        desc1: {
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 38.99
        },
        buttonText: {
            color: Colors[colorScheme].text.primary
        },
        button: {
            minHeight: 50
        }
    });

export default SubscriptionBottomSheet;
