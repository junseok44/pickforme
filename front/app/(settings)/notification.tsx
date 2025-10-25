import { useRouter, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useAtomValue, useSetAtom } from 'jotai';
import { RadioButton } from 'react-native-paper';

import Button from '../../components/Button';
import Colors from '../../constants/Colors';
import { Text, View } from '../../components/Settings/Themed';
import { PushService, SetPushSettingParams } from '../../stores/auth/types';
import useColorScheme, { ColorScheme } from '../../hooks/useColorScheme';

import { setPushSettingAtom } from '../../stores/auth/atoms';
import { BackHeader } from '@components';
import { userAtom } from '@stores';
import { findNodeHandle, AccessibilityInfo } from 'react-native';

const translationMap: {
    service: {
        [key in PushService]: string;
    };
} = {
    service: {
        [PushService.off]: 'OFF',
        [PushService.on]: 'ON'
    }
};

export default function NotificationScreen() {
    const router = useRouter();
    const userData = useAtomValue(userAtom);
    const [setting, setSetting] = React.useState<SetPushSettingParams>(userData?.push ?? { service: PushService.off });
    const setPushSetting = useSetAtom(setPushSettingAtom);
    const colorScheme = useColorScheme();
    const styles = useStyles(colorScheme);

    React.useEffect(() => {
        if (!userData) {
            router.replace('/login');
        }
    }, [userData, router]);

    const handleSubmit = () => {
        if (userData) {
            setPushSetting(setting);
            router.back();
        }
    };

    if (!userData) {
        return null;
    }

    const contentRef = React.useRef(null);
    useEffect(() => {
        const node = findNodeHandle(contentRef.current);
        if (node) {
            setTimeout(() => {
                AccessibilityInfo.setAccessibilityFocus(node);
            }, 1000);
        }
    }, [contentRef.current]);

    return (
        <View style={styles.container} onAccessibilityEscape={router.back}>
            <BackHeader />
            <ScrollView style={styles.container}>
                <View style={styles.scrollContainer}>
                    <Text style={styles.title} ref={contentRef}>
                        서비스 알림
                    </Text>
                    {Object.entries(translationMap.service).map(([key, label], i) => {
                        return (
                            <React.Fragment key={`Notification-service-${key}`}>
                                {i !== 0 && <View style={styles.seperator} />}
                                <View style={styles.row}>
                                    <Text style={styles.label} accessible={false}>
                                        {label}
                                    </Text>
                                    <RadioButton.Android
                                        color={Colors[colorScheme].text.primary}
                                        value={key}
                                        accessibilityRole="button"
                                        accessibilityLabel={
                                            (key === setting.service ? '선택됨,' : '') +
                                            (key === PushService.on ? '알림 켜기' : '알림 끄기')
                                        }
                                        status={key === setting.service ? 'checked' : 'unchecked'}
                                        onPress={() => setSetting(prev => ({ ...prev, service: key as PushService }))}
                                    />
                                </View>
                            </React.Fragment>
                        );
                    })}
                </View>
            </ScrollView>
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
            backgroundColor: theme.background.primary
        },
        title: {
            fontWeight: '600',
            fontSize: 20,
            lineHeight: 24,
            marginBottom: 30,
            color: theme.text.primary
        },
        seperator: {
            height: 1,
            backgroundColor: theme.borderColor.secondary
        },
        buttonWrap: {
            width: '100%',
            padding: 20,
            backgroundColor: theme.background.primary
        },
        row: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 18
        },
        label: {
            flex: 1,
            fontWeight: '400',
            fontSize: 14,
            lineHeight: 17,
            color: theme.text.primary
        },
        scrollContainer: {
            paddingVertical: 32,
            paddingHorizontal: 33,
            backgroundColor: theme.background.primary
        }
    });
};
