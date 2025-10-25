import React from 'react';
import { StyleSheet } from 'react-native';
import BottomSheet from 'react-native-modal';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';

import { View, Text, Button_old as Button } from '@components';
import { Props, styles } from './Base';
import { isShowUpdateAlartModalAtom, settingAtom } from '@stores';
import { Colors } from '@constants';
import useColorScheme from '../../hooks/useColorScheme';

import type { ColorScheme } from '@hooks';

const UpdateAlartBottomSheet: React.FC<Props> = () => {
    const [visible, setVisible] = useAtom(isShowUpdateAlartModalAtom);
    const onClose = () => setVisible(false);
    const colorScheme = useColorScheme();
    const router = useRouter();
    const [setting] = useAtom(settingAtom);

    const localStyles = useLocalStyles(colorScheme);

    const handleClickYes = () => {
        router.push('/');
        onClose();
    };
    const handleClickNo = () => {
        onClose();
    };

    return (
        <BottomSheet style={styles.base} isVisible={visible} onBackButtonPress={onClose} onBackdropPress={onClose}>
            <View style={[styles.bottomSheet, localStyles.root]}>
                <Text style={[styles.title, localStyles.title]}>
                    {'11월 1일(금) 22시 이후\n서비스 점검이 진행됩니다.'}
                </Text>
                <Text style={[styles.desc, localStyles.desc]}>
                    {
                        '보다 나은 픽포미를 위해 11월 1일 금요일\n22시부터 서비스 점검이 진행됩니다.\n이 시간동안은 픽포미 이용이 불가하니 유의 부탁드려요.'
                    }
                </Text>
                <View style={[styles.buttonRow, localStyles.buttonWrap]}>
                    <View style={[styles.buttonWrap, localStyles.buttonOuter]}>
                        <Button
                            title="지금 시작하기"
                            onPress={handleClickYes}
                            style={[localStyles.button1]}
                            size="small"
                        />
                    </View>
                    <View style={[styles.buttonWrap, localStyles.buttonOuter]}>
                        <Button
                            color="tertiary"
                            title="나중에 할래요"
                            onPress={handleClickNo}
                            style={[localStyles.button2]}
                            size="small"
                        />
                    </View>
                </View>
            </View>
        </BottomSheet>
    );
};

const useLocalStyles = (colorScheme: ColorScheme) =>
    StyleSheet.create({
        root: {
            paddingBottom: 22
        },
        title: {
            fontSize: 18,
            lineHeight: 20,
            fontWeight: '600',
            marginBottom: 20,
            color: '#1e1e1e'
        },
        desc: {
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 39
        },
        buttonWrap: {},
        buttonOuter: {
            flex: 1
        },
        button1: {
            minHeight: 50
        },
        button2: {
            minHeight: 50,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: Colors[colorScheme].button.primary.background
        }
    });

export default UpdateAlartBottomSheet;
