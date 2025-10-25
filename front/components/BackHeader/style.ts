import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import useColorScheme from '../../hooks/useColorScheme';

export default function useStyle() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();

    return StyleSheet.create({
        BackHeader: {
            height: 56 + insets.top,
            paddingTop: insets.top,
            backgroundColor: Colors[colorScheme].background.primary
        },
        BackHeaderButton: {
            width: 56,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center'
        },
        BackHeaderImage: {
            width: 28,
            height: 28
        }
    });
}
