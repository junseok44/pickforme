import { StyleSheet, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import BottomSheet from 'react-native-modal';
import { useAtom } from 'jotai';

import { Props, styles } from './Base';
import { isShowVersionUpdateAlarmModalAtom } from '@stores';
import { View, Text, Button } from '@components';
import { Colors } from '@constants';
import useColorScheme from '../../hooks/useColorScheme';

import type { ColorScheme } from '@hooks';

const ANDROID_UPDATE_URL = 'https://play.google.com/store/apps/details?id=com.sigonggan.pickforme';
const IOS_UPDATE_URL = 'https://apps.apple.com/kr/app/%ED%94%BD%ED%8F%AC%EB%AF%B8/id6450741514';

const VersionUpdateAlarmBottomSheet: React.FC<Props> = () => {
    const [visible, setVisible] = useAtom(isShowVersionUpdateAlarmModalAtom);

    const onClose = () => setVisible(false);

    const colorScheme = useColorScheme();
    const localStyles = useLocalStyles(colorScheme);

    const handlePress = () => {
        const url = Platform.OS === 'android' ? ANDROID_UPDATE_URL : IOS_UPDATE_URL;
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    return (
        <BottomSheet
            style={styles.base}
            isVisible={visible}
            onBackButtonPress={onClose}
            // onBackdropPress={onClose}
        >
            <View style={[styles.bottomSheet, localStyles.root]}>
                <Text style={[styles.title, localStyles.title]}>픽포미가 한 층 더 새로워졌어요.</Text>
                <Text style={[styles.desc, localStyles.desc1]}>
                    {
                        '픽포미를 스토어에서 업데이트하면,\n이제 모든 상품 정보를 요약 받을 수 있어요.\n지금 바로 새로워진 픽포미를 만나러 가볼까요?'
                    }
                </Text>
                <Text style={[styles.desc, localStyles.desc2]}>{'*2.0은 운영하지 않습니다.'}</Text>
                <Button
                    style={[styles.button, localStyles.button]}
                    title="업데이트하러 가기"
                    onPress={handlePress}
                    size="small"
                />
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
            marginBottom: 20,
            color: '#1e1e1e'
        },
        desc1: {
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 10
        },
        desc2: {
            fontSize: 12,
            lineHeight: 20,
            marginBottom: 15
        },
        buttonText: {
            color: Colors[colorScheme].text.primary
        },
        button: {
            minHeight: 50
        }
    });

export default VersionUpdateAlarmBottomSheet;
