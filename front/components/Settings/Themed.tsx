/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import { forwardRef } from 'react';
import {
    Text as DefaultText,
    ViewProps as DefaultViewProps,
    TextProps as DefaultTextProps,
    View as DefaultView
} from 'react-native';

import { useThemeColor, ThemeProps } from '../../hooks/useThemeColor';
import { FontSizes } from '../../constants/FontSizes';
import { useAtomValue } from 'jotai';
import { settingAtom } from '../../stores/auth/atoms';

export type TextProps = ThemeProps & DefaultTextProps;
export type ViewProps = ThemeProps & DefaultViewProps;

export const Text = forwardRef<DefaultText, TextProps>((props, ref) => {
    const { style, lightColor, darkColor, color, ...otherProps } = props;
    const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text', color);
    const defaultProps = {
        style: [{ color: textColor }, style],
        lineBreakStrategyIOS: 'hangul-word' as const
    };

    const setting = useAtomValue(settingAtom);
    const currentFontSize = FontSizes[setting.fontSize ?? 'medium'];

    return <DefaultText {...defaultProps} style={[{ fontSize: currentFontSize }, style]} {...otherProps} ref={ref} />;
});

export const View = forwardRef<DefaultView, ViewProps>((props, ref) => {
    const { style, lightColor, darkColor, color, ...otherProps } = props;
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background', color);

    return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} ref={ref} />;
});
