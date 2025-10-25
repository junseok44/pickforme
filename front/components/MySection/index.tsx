import { View, Text, TouchableOpacity, AccessibilityRole } from 'react-native';
import useStyle from './style';
import type { IMySectionProps } from './type';

export default function MySection({ title, items, role }: IMySectionProps) {
    const style = useStyle();

    let sectionRole: AccessibilityRole = 'button';
    if (role !== undefined && role !== 'button') sectionRole = role as AccessibilityRole;

    return (
        <View style={style.MySectionContainer}>
            <Text style={style.MySectionTitle} accessibilityRole="header" accessible accessibilityLabel={title}>
                {title}
            </Text>
            <View style={style.MySectionMenuContent}>
                {items.map(function (item, index) {
                    return (
                        (sectionRole === 'none' && (
                            <Text
                                key={`section-${title}-${index}`}
                                onPress={item.onPress || (() => {})}
                                disabled={false}
                                accessibilityRole={sectionRole}
                                style={style.MySectionMenu}
                            >
                                {item.name}
                            </Text>
                        )) || (
                            <TouchableOpacity
                                key={`section-${title}-${index}`}
                                onPress={item.onPress || (() => {})}
                                disabled={false}
                                accessibilityRole={sectionRole}
                            >
                                <Text
                                    style={style.MySectionMenu}
                                    accessibilityLabel={item.name === '1:1 문의' ? '일대일 문의하기' : item.name}
                                    accessible={false}
                                >
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        )
                    );
                })}
            </View>
        </View>
    );
}
