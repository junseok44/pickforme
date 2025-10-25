import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import useColorScheme from '@/hooks/useColorScheme';

export default function useStyle() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    return StyleSheet.create({
        LoginFormContainer: {
            backgroundColor: theme.background.primary
        },
        LoginFormTitle: {
            fontSize: 20,
            lineHeight: 28,
            fontWeight: 'bold',
            textAlign: 'center',
            color: theme.text.primary
        },
        LoginFormDescription: {
            textAlign: 'center',
            fontWeight: '600',
            fontSize: 16,
            lineHeight: 19,
            marginTop: 30,
            color: theme.text.primary
        },
        LoginFormButtonContainer: {
            gap: 23,
            marginTop: 46
        },
        LoginFormButton: {
            width: '100%',
            flexDirection: 'row',
            borderRadius: 15,
            height: 57,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10
        },
        LoginFormButtonText: {
            fontWeight: '700',
            fontSize: 20,
            lineHeight: 24
        },
        LoginFormButtonImage: {
            width: 20,
            height: 20
        },
        LoginFormButtonKakao: {
            backgroundColor: '#FEE500'
        },
        LoginFormButtonApple: {
            width: '100%',
            height: 57
        },
        LoginFormButtonGoogle: {
            backgroundColor: '#F2F2F2'
        },
        LoginFormButtonAppleText: {
            color: '#EFEFEF'
        },
        LoginFormButtonGoogleText: {
            color: '#6F6F6F'
        }
    });
}
