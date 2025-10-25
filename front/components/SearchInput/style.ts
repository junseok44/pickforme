import { StyleSheet } from 'react-native';
import useColorScheme from '../../hooks/useColorScheme';
import { Colors } from '../../constants';

export default function useStyle() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    return StyleSheet.create({
        SearchInputContainer: {
            position: 'relative'
        },
        SearchInput: {
            borderColor: theme.borderColor.primary,
            borderWidth: 1,
            height: 47,
            borderRadius: 8,
            paddingLeft: 12,
            paddingRight: 78,
            fontSize: 14,
            color: theme.text.primary,
            backgroundColor: theme.background.primary
        },
        SearchInputCloseButton: {
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
            right: 42,
            top: 0,
            width: 36,
            height: 47
        },
        SearchInputCloseImage: {
            width: 24,
            height: 24
        },
        SearchInputSendButton: {
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
            right: 0,
            top: 0,
            width: 42,
            height: 47
        },
        SearchInputSendImage: {
            width: 20,
            height: 20
        }
    });
}
