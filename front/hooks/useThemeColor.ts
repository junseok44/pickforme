import Colors from '../constants/Colors';
import useColorScheme from './useColorScheme';

export function useThemeColor<T extends keyof typeof Colors.light>(
    props: { light?: string; dark?: string },
    colorName: T,
    color: 'primary' | 'secondary' | 'third'
) {
    const theme = useColorScheme() ?? 'light';
    const colorFromProps = props[theme];

    if (colorFromProps) {
        return colorFromProps;
    } else {
        const themeColors = Colors[theme][colorName];
        if (typeof themeColors === 'object' && themeColors !== null) {
            return themeColors[color];
        }
        return themeColors;
    }
}

export type ThemeProps = {
    lightColor?: string;
    darkColor?: string;
};
