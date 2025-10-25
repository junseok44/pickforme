import { TouchableOpacity, Text } from 'react-native';

import useStyle from './style';

import type { IButtonProps } from './type';

export default function Button({ title, label, onPress }: IButtonProps) {
    const style = useStyle();

    return (
        <TouchableOpacity
            accessibilityLabel={label}
            accessibilityRole="button"
            style={style.ButtonContainer}
            onPress={onPress}
        >
            <Text style={style.ButtonText}>{title}</Text>
        </TouchableOpacity>
    );
}
