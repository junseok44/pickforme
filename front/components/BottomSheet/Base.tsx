import { StyleSheet } from 'react-native';
import { ColorScheme } from '../../hooks/useColorScheme';
import { Colors } from '../../constants';

export interface Props {}

// 다크모드 지원 스타일 함수 생성
export const createStyles = (colorScheme: ColorScheme) => {
    const theme = Colors[colorScheme];
    return StyleSheet.create({
        base: {
            justifyContent: 'flex-end',
            marginBottom: 10
        },
        title: {
            fontSize: 20,
            lineHeight: 24,
            fontWeight: '700',
            marginBottom: 20,
            textAlign: 'center'
        },
        subtitle: {
            fontSize: 18,
            lineHeight: 22,
            fontWeight: '500',
            marginBottom: 20,
            textAlign: 'center'
        },
        desc: {
            fontWeight: '400',
            fontSize: 16,
            lineHeight: 20,
            marginBottom: 20,
            textAlign: 'center'
        },
        buttonRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            alignContent: 'stretch',
            gap: 19
        },
        buttonWrap: {
            flex: 1
        },
        bottomSheet: {
            borderTopLeftRadius: 4, // ASIS 20
            borderTopRightRadius: 4, // ASIS 20
            paddingTop: 20, // ASIS 20
            paddingBottom: 20,
            paddingHorizontal: 22, // ASIS 27
            backgroundColor: theme.background.primary
        },
        button: {
            flex: 1
        }
    });
};

// 기본 스타일로 라이트 모드 사용 (호환성을 위해)
export const styles = createStyles('light');
