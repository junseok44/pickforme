import { StyleSheet, View, Pressable, Text, Image } from 'react-native';
import BottomSheet from 'react-native-modal';
import { useAtom } from 'jotai';

import { isShowLoginModalAtom } from '@stores';
import { Props, styles } from './Base';
import LoginForm from '../LoginForm';
import useColorScheme from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import BackIcon from '@/assets/icons/BackIcon';

const LoginBottomSheet: React.FC<Props> = () => {
    const colorScheme = useColorScheme();

    const [visible, setVisible] = useAtom(isShowLoginModalAtom);

    const localStyles = StyleSheet.create({
        bottomSheet: {
            flex: 0,
            paddingHorizontal: 20,
            backgroundColor: Colors[colorScheme].background.primary
        },
        backButton: {
            padding: 10,
            marginBottom: 10,
            alignSelf: 'flex-start'
        },
        backButtonImage: {
            width: 24,
            height: 24,
            resizeMode: 'contain'
        }
    });

    const onLoginSuccess = () => {
        setVisible(false);
    };

    const onClose = () => setVisible(false);

    return (
        <BottomSheet
            style={styles.base}
            isVisible={visible}
            onBackButtonPress={onClose}
            onBackdropPress={onClose}
            onAccessibilityEscape={onClose}
        >
            <View style={[styles.bottomSheet, localStyles.bottomSheet]}>
                <Pressable
                    style={localStyles.backButton}
                    onPress={onClose}
                    accessible={true}
                    accessibilityLabel="뒤로가기"
                    accessibilityHint="로그인 화면을 닫습니다"
                    accessibilityRole="button"
                    onAccessibilityEscape={onClose}
                >
                    {/* <Image style={localStyles.backButtonImage} source={BackImage} /> */}
                    <BackIcon size={32} color={Colors[colorScheme].text.primary} opacity={1} />
                </Pressable>
                <LoginForm onLoginSuccess={onLoginSuccess} />
            </View>
        </BottomSheet>
    );
};
export default LoginBottomSheet;
