import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { InteractionManager, StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import Button from '../Button';
import { RadioButton } from 'react-native-paper';
import useColorScheme from '../../hooks/useColorScheme';

import Colors from '../../constants/Colors';
import { Text, View } from './Themed';
import { settingAtom } from '../../stores/auth/atoms';
import { ColorScheme } from '../../hooks';
import { findNodeHandle, AccessibilityInfo } from 'react-native';

const translationMap = {
    default: '휴대폰 설정과 동일하게',
    light: '밝은 모드',
    dark: '어두운 모드'
};

export default function ThemeScreen() {
    const { segment = '' } = useLocalSearchParams();
    const [setting, setSetting] = useAtom(settingAtom);
    const colorScheme = useColorScheme();
    const styles = useStyles(colorScheme);
    const router = useRouter();
    const isSetting = segment.includes('settings');
    const [theme, setTheme] = React.useState<string>(setting.theme ?? 'default');
    const handleSubmit = () => {
        setSetting({
            ...setting,
            theme: theme as (typeof setting)['theme']
        });
        if (isSetting) {
            router.back();
        } else {
            router.push('/(tabs)');
        }
    };

    const contentRef = React.useRef(null);
    useEffect(() => {
        const node = findNodeHandle(contentRef.current);
        if (node) {
            InteractionManager.runAfterInteractions(() => {
                setTimeout(() => {
                    AccessibilityInfo.setAccessibilityFocus(node);
                }, 1000);
            });
        }
    }, [contentRef.current]);

    return (
        <View style={styles.container} onAccessibilityEscape={router.back}>
            <View style={styles.content}>
                <Text style={styles.title} ref={contentRef}>
                    화면 모드를 선택해주세요.
                </Text>
                {Object.entries(translationMap).map(([key, label]) => {
                    return (
                        <View style={styles.row} key={`Onboard-theme-${key}`}>
                            <Text style={styles.label} accessible={false}>
                                {label}
                            </Text>
                            <RadioButton.Android
                                color={Colors[colorScheme].text.primary}
                                value={key}
                                accessibilityRole="button"
                                accessibilityLabel={(key === theme ? '선택됨,' : '') + label}
                                status={key === theme ? 'checked' : 'unchecked'}
                                onPress={() => setTheme(key)}
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

const useStyles = (colorScheme: ColorScheme) => {
    const theme = Colors[colorScheme];
    return StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.background.primary
        },
        title: {
            fontWeight: '600',
            fontSize: 22,
            lineHeight: 27,
            marginBottom: 30,
            color: theme.text.primary
        },
        content: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent'
        },
        buttonWrap: {
            width: '100%',
            padding: 20,
            backgroundColor: 'transparent'
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 70,
            paddingRight: 67,
            paddingTop: 62,
            backgroundColor: 'transparent'
        },
        label: {
            flex: 1,
            fontWeight: '700',
            fontSize: 18,
            lineHeight: 22,
            color: theme.text.primary
        }
    });
};
