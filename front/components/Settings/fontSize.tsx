import { useRouter, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import Button from '../Button';
import { RadioButton } from 'react-native-paper';
import useColorScheme from '../../hooks/useColorScheme';

import Colors from '../../constants/Colors';
import { Text, View } from './Themed';
import { settingAtom } from '../../stores/auth/atoms';

const fontSizes = {
    medium: 14,
    large: 16,
    extraLarge: 20
};

const translationMap = {
    medium: '중간',
    large: '크게',
    extraLarge: '아주 크게'
};

export default function FontSizeScreen() {
    const { segment = '' } = useLocalSearchParams();
    const [setting, setSetting] = useAtom(settingAtom);
    const colorScheme = useColorScheme();
    const router = useRouter();
    const isSetting = segment.includes('settings');
    const [fontSize, setFontSize] = React.useState<string>(setting.fontSize ?? 'medium');
    const handleSubmit = () => {
        setSetting({
            ...setting,
            fontSize: fontSize as (typeof setting)['fontSize']
        });
        if (isSetting) {
            router.back();
        } else {
            router.push('/(tabs)');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>텍스트 크기를 선택해주세요.</Text>
                {Object.entries(translationMap).map(([key, label]) => {
                    return (
                        <View style={styles.row} key={`Onboard-theme-${key}`}>
                            <Text
                                style={[styles.label, { fontSize: fontSizes[key as keyof typeof fontSizes] }]}
                                accessible={false}
                            >
                                {label}
                            </Text>
                            <RadioButton.Android
                                color={Colors[colorScheme].text.primary}
                                value={key}
                                accessibilityRole="button"
                                accessibilityLabel={(key === fontSize ? '선택됨,' : '') + label}
                                status={key === fontSize ? 'checked' : 'unchecked'}
                                onPress={() => setFontSize(key)}
                            />
                        </View>
                    );
                })}
            </View>
            <View style={styles.buttonWrap}>
                <Button title="확인" onPress={handleSubmit} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        fontWeight: '600',
        fontSize: 22,
        lineHeight: 27,
        marginBottom: 30
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonWrap: {
        width: '100%',
        padding: 20
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 70,
        paddingRight: 67,
        paddingTop: 62
    },
    label: {
        flex: 1,
        fontWeight: '700',
        lineHeight: 22
    }
});
