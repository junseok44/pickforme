import React from 'react';
import { Image, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { HeaderBackButtonProps } from '@react-navigation/native-stack/src/types';

import { View, Text } from '@components';
import useColorScheme from '../hooks/useColorScheme';

const Icon = {
    light: require('../assets/images/icon.png'),
    dark: require('../assets/images/icon_dark.png')
};

const HeaderLeft: React.FC<HeaderBackButtonProps> = props => {
    const colorScheme = useColorScheme();
    const router = useRouter();
    if (props.canGoBack) {
        return (
            <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="뒤로가기"
                accessible
            >
                <Image style={styles.backButton} source={require('../assets/images/icBack.png')} />
            </Pressable>
        );
    }
    return (
        <View style={styles.logoWrap}>
            <Image style={styles.logoImage} source={Icon[colorScheme]} />
            <Text style={styles.logoText}>픽포미</Text>
        </View>
    );
};

export default HeaderLeft;

const styles = StyleSheet.create({
    backWrap: {},
    backButton: {
        width: 24,
        height: 24,
        marginRight: 5,
        flexShrink: 0
    },
    logoWrap: {
        flexDirection: 'row',
        marginLeft: 27
    },
    logoImage: {
        width: 29.32,
        height: 28
    },
    logoText: {
        marginLeft: 6,
        fontWeight: '700',
        fontSize: 24,
        lineHeight: 29
    }
});
