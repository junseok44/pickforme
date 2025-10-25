import { View, Text } from 'react-native';

import { MyIcon } from '@assets';
import useStyle from './style';
import useColorScheme from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import type { IconHeaderProps } from './type';

export default function IconHeader({ title }: IconHeaderProps) {
    const colorScheme = useColorScheme();
    const style = useStyle();

    return (
        <View style={style.IconHeaderContainer}>
            <MyIcon size={30} color={Colors[colorScheme].text.primary} />
            <Text style={style.IconHeaderTitle} accessibilityRole="header">
                {title}
            </Text>
        </View>
    );
}
