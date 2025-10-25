import { StyleSheet } from 'react-native';
import useColorScheme from '../../hooks/useColorScheme';
import Colors from '../../constants/Colors';

export default function useStyle() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    return StyleSheet.create({
        MoreButton: {
            width: '100%',
            padding: 6,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: theme.border.third,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.background.moreButton
        },
        MoreButtonText: {
            color: theme.text.primary,
            fontSize: 12,
            lineHeight: 20
        }
    });
}
