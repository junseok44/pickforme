import { forwardRef } from 'react';
import { Text as RNText } from 'react-native';

import { useThemeColor } from '../../hooks/useThemeColor';

import type { TTextProps } from './type';

import { FontSizes } from '../../constants/FontSizes';
import { useAtomValue } from 'jotai';
import { settingAtom } from '../../stores/auth/atoms';

export default forwardRef<RNText, TTextProps>((props, ref) => {
    const { style, lightColor, darkColor, color, ...otherProps } = props;

    const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text', color);

    const defaultProps = {
        style: [{ color: textColor }, style],
        lineBreakStrategyIOS: 'hangul-word' as const
    };

    const setting = useAtomValue(settingAtom);
    const currentFontSize = FontSizes[setting.fontSize ?? 'medium'];

    return <RNText {...defaultProps} style={[{ fontSize: currentFontSize }, style]} {...otherProps} ref={ref} />;
});
