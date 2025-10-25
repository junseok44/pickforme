import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, ScrollView } from 'react-native';
import { useAtomValue, useSetAtom } from 'jotai';

import { Colors } from '@constants';
import useColorScheme from '../hooks/useColorScheme';
import { Text, View, Button_old as Button } from '@components';
import { userAtom } from '@stores';
import { purchaseListAtom, getPurchaseListAtom } from '../stores/purchase/atoms';
import { formatDate } from '../utils/common';

import type { ColorScheme } from '@hooks';

export default function PointHistoryScreen1() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const purchases = useAtomValue(purchaseListAtom);
    const userData = useAtomValue(userAtom);
    const styles = useStyles(colorScheme);

    const getPurchaseList = useSetAtom(getPurchaseListAtom);

    useEffect(() => {
        getPurchaseList();
    }, [getPurchaseList]);

    return (
        <View style={styles.container} onAccessibilityEscape={() => router.back()}>
            <ScrollView>
                <View style={styles.content}>
                    <Text style={styles.title}>
                        {userData?.point === 0
                            ? '현재 보유한 이용권이 없습니다.'
                            : `현재 보유한 이용권 ${userData?.point}개`}
                    </Text>
                    <Button
                        style={styles.purchaseButton}
                        textStyle={styles.buttonTextStyle}
                        title="이용권 구매하기"
                        size="small"
                        onPress={() => router.replace('/purchase')}
                    />
                    <View style={styles.seperator}></View>
                    <Text style={styles.title}>이용권 구매 내역</Text>
                    {purchases && purchases.length > 0 ? (
                        purchases?.map((purchase, index) => (
                            <View key={index} style={styles.purchaseWrap}>
                                <Text style={styles.purchaseDate}>{formatDate(purchase.createdAt)} 결제</Text>
                                <View style={styles.row}>
                                    <Text style={styles.purchaseTitle}>{purchase.product.displayName}</Text>
                                    <Text style={styles.purchasePrice}>
                                        {purchase.product.productId === 'pickforme_1pick' ? '550원' : '2,750원'}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>구매 내역이 없습니다.</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const useStyles = (colorScheme: ColorScheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: Colors[colorScheme].background.primary
        },
        content: {
            flex: 1,
            padding: 31
        },
        row: {
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        title: {
            fontWeight: '600',
            fontSize: 20,
            lineHeight: 24,
            marginBottom: 18,
            color: Colors[colorScheme].text.primary
        },
        subtitle: {
            fontWeight: '600',
            fontSize: 14,
            lineHeight: 17,
            marginBottom: 14,
            color: Colors[colorScheme].text.primary
        },
        seperator: {
            width: '100%',
            height: 0.5,
            marginVertical: 20,
            backgroundColor: Colors[colorScheme].border.primary
        },
        purchaseStatus: {
            width: '100%',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 10,
            padding: 14,
            borderRadius: 10,
            borderWidth: 1,
            marginBottom: 12,
            backgroundColor: Colors[colorScheme].background.secondary,
            borderColor: Colors[colorScheme].border.secondary
        },
        purchaseWrap: {
            width: '100%',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: 14,
            borderRadius: 10,
            borderWidth: 1,
            marginVertical: 8,
            backgroundColor: Colors[colorScheme].background.secondary,
            borderColor: Colors[colorScheme].border.secondary
        },
        purchaseTitle: {
            fontSize: 16,
            lineHeight: 19,
            color: Colors[colorScheme].text.primary
        },
        purchasePrice: {
            fontWeight: '600',
            fontSize: 16,
            lineHeight: 19,
            color: Colors[colorScheme].text.primary
        },
        purchaseDate: {
            fontWeight: '400',
            fontSize: 14,
            lineHeight: 17,
            marginBottom: 8,
            color: Colors[colorScheme].text.secondary
        },
        terms: {
            marginTop: 12,
            fontWeight: '400',
            fontSize: 12,
            lineHeight: 15,
            color: Colors[colorScheme].text.secondary
        },
        buttonText: {
            fontWeight: '600',
            fontSize: 14,
            lineHeight: 17
        },
        buttonTextStyle: {
            color: Colors[colorScheme].text.secondary
        },
        purchaseButton: {
            width: 120,
            padding: 10,
            marginLeft: 'auto',
            backgroundColor: Colors[colorScheme].button.primary.background
        },
        emptyText: {
            color: Colors[colorScheme].text.secondary
        }
    });
