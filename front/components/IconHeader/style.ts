import { Colors } from '@/constants';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useColorScheme from '@/hooks/useColorScheme';

export default function useStyle() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();

    return StyleSheet.create({
        IconHeaderContainer: {
            height: 56 + insets.top,
            paddingTop: insets.top,
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingHorizontal: 20,
            gap: 10
        },
        IconHeaderTitle: {
            fontWeight: '600',
            fontSize: 22,
            lineHeight: 56,
            color: Colors[colorScheme].text.primary
        }
    });
}
