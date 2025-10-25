import { StyleSheet } from 'react-native';
import useColorScheme from '../../hooks/useColorScheme';
import Colors from '../../constants/Colors';

export default function useStyle() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    return StyleSheet.create({
        MainProductSection: {
            marginBottom: 60
        },
        MainProductSectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 18,
            color: theme.text.primary
        },
        MainProductSectionListContent: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: 12,
            color: theme.text.primary
        },
        MainProductSectionSeparator: {
            height: 12,
            width: 1,
            backgroundColor: 'transparent'
        },
        MainProductSectionListFooter: {
            width: '100%',
            marginTop: 0
        }
    });
}
