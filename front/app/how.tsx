import { View, StyleSheet } from 'react-native';

import { BackHeader } from '@components';
import How from '../components/BottomSheet/How';
import useColorScheme from '../hooks/useColorScheme';
import Colors from '../constants/Colors';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function HowScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    const router = useRouter();

    const [isVisible, setIsVisible] = useState(true);

    return (
        <View
            style={{ flex: 1, backgroundColor: theme.background.primary }}
            onAccessibilityEscape={() => router.back()}
        >
            <BackHeader />
            <How isHomeButton={false} visible={isVisible} onClose={() => setIsVisible(false)} />
        </View>
    );
}
