import { useCallback } from 'react';
import { TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { View } from '../Settings/Themed'; // Themed View 사용
import BackIcon from '@/assets/icons/BackIcon';
import useStyle from './style';
import useColorScheme from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';

interface BackHeaderProps {
    onPressBack?: () => void;
}

export default function BackHeader({ onPressBack }: BackHeaderProps) {
    const router = useRouter();
    const style = useStyle();
    const colorScheme = useColorScheme();

    const onPress = useCallback(
        function () {
            if (onPressBack) {
                onPressBack();
            } else if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(tabs)');
            }
        },
        [router, onPressBack]
    );

    return (
        <View style={style.BackHeader}>
            <TouchableOpacity
                style={style.BackHeaderButton}
                onPress={onPress}
                accessible
                accessibilityRole="button"
                accessibilityLabel="뒤로가기"
            >
                <BackIcon size={48} color={Colors[colorScheme].text.primary} />
            </TouchableOpacity>
        </View>
    );
}
