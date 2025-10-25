import { StyleSheet, TextProps, Pressable, PressableProps } from 'react-native';

import { useThemeColor } from '@hooks';
import View from '../View';
import Text from '../Text';

import type { ThemeProps } from '@hooks';

interface ButtonTextProps
    extends ThemeProps,
        Pick<TextProps, 'children' | 'numberOfLines' | 'ellipsizeMode' | 'accessibilityLabel'> {
    textStyle?: TextProps['style'];
}
interface ButtonProps extends Omit<PressableProps, 'children'>, ButtonTextProps {
    title?: string;
    variant?: 'contain' | 'text';
    color?: 'primary' | 'secondary' | 'tertiary';
    size?: 'large' | 'medium' | 'small';
    renderChildrenPosition?: 'front' | 'back';
    readOnly?: boolean;
    selected?: boolean;
}

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    large: {
        minHeight: 50,
        paddingVertical: 16,
        borderRadius: 4
    },
    medium: {
        minHeight: 36,
        borderRadius: 4
    },
    small: {
        minHeight: 31,
        borderRadius: 4
    },
    pressed: {},
    contain: {},
    text: {
        minHeight: 0,
        padding: 0,
        margin: 0,
        backgroundColor: 'transparent'
    },
    readOnly: {
        borderRadius: 15
    }
});

const textStyles = StyleSheet.create({
    base: {
        fontWeight: '600'
    },
    large: {
        fontSize: 18,
        lineHeight: 22
    },
    medium: {
        fontSize: 16,
        lineHeight: 19
    },
    small: {
        fontSize: 14,
        lineHeight: 17
    }
});

export const ButtonText = ({
    color = 'primary',
    textStyle,
    lightColor,
    darkColor,
    children,
    ...props
}: ButtonTextProps) => {
    const buttonTextColor = useThemeColor({ light: lightColor, dark: darkColor }, 'buttonText', color);
    return (
        <Text style={[{ color: buttonTextColor }, textStyle]} {...props}>
            {children}
        </Text>
    );
};

const Button = ({
    variant = 'contain',
    style,
    size = 'large',
    onPress,
    numberOfLines,
    children,
    lightColor,
    darkColor,
    color = 'primary',
    readOnly,
    textStyle,
    renderChildrenPosition = 'front',
    ...props
}: ButtonProps) => {
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'buttonBackground', color);
    const disabledBackgroundColor = useThemeColor(
        { light: lightColor, dark: darkColor },
        'disabledButtonBackground',
        color
    );
    const buttonTextColor = useThemeColor({ light: lightColor, dark: darkColor }, 'buttonText', color);
    const handlePress: PressableProps['onPress'] = e => {
        if (props.disabled) {
            return;
        }
        if (onPress) {
            onPress(e);
        }
    };
    const Content = ({ pressed }: { pressed: boolean }) => (
        <View
            style={[
                styles.button,
                styles[size],
                {
                    backgroundColor: props.disabled ? disabledBackgroundColor : backgroundColor
                },
                pressed && styles.pressed,
                styles[variant],
                readOnly && styles.readOnly,
                style
            ]}
        >
            {renderChildrenPosition === 'front' && children}
            {props.title && (
                <ButtonText
                    numberOfLines={numberOfLines}
                    textStyle={[textStyles.base, textStyles[size], textStyle]}
                    lightColor={lightColor}
                    darkColor={darkColor}
                    color={color}
                >
                    {props.title}
                </ButtonText>
            )}
            {renderChildrenPosition === 'back' && children}
        </View>
    );

    if (readOnly) {
        return <Content pressed={false} />;
    }
    const accessibleState = props.selected ? { selected: true } : {};
    return (
        <Pressable
            onPress={handlePress}
            accessibilityLabel={props.accessibilityLabel}
            {...props}
            accessibilityRole="button"
            accessibilityState={{ selected: props.selected }}
        >
            {pressableProps => <Content {...pressableProps} />}
        </Pressable>
    );
};
export default Button;
