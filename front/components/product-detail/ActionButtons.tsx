import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Button_old as Button, View } from '@components';
import { Product } from '../../stores/product/types';
import useColorScheme from '../../hooks/useColorScheme';
import { Colors } from '@constants';
import useCheckLogin from '../../hooks/useCheckLogin';
import HeartFilledIcon from '@/assets/icons/HeartFilledIcon';
import HeartOutlineIcon from '@/assets/icons/HeartOutlineIcon';

interface ActionButtonsProps {
    product: Product;
    handleClickBuy: () => void;
    handleClickContact: () => void;
    handleClickRequest: (e?: any) => void;
    handleClickWish: () => void;
    isWish: boolean;
    isRequest: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    product,
    handleClickBuy,
    handleClickContact,
    handleClickRequest,
    handleClickWish,
    isWish,
    isRequest
}) => {
    const colorScheme = useColorScheme();
    const styles = useStyles(colorScheme);
    const handleRequestWithLoading = useCheckLogin(handleClickRequest);

    return (
        <View style={styles.buttonWrap}>
            <View style={styles.buttonOuter}>
                <Button
                    title="구매하러 가기"
                    onPress={handleClickBuy}
                    style={styles.button}
                    size="small"
                    disabled={!product}
                    textStyle={styles.buttonText}
                />
            </View>
            {product?.platform === 'thezam' ? (
                <View style={styles.buttonOuter}>
                    <Button
                        title="대리구매 요청하기"
                        onPress={handleClickContact}
                        style={[styles.button, styles.button2]}
                        color="tertiary"
                        size="small"
                        disabled={!product}
                        textStyle={styles.button2Text}
                    />
                </View>
            ) : (
                <View style={styles.buttonOuter}>
                    <Button
                        title="매니저에게 질문하기"
                        onPress={handleRequestWithLoading}
                        style={[styles.button, styles.button2]}
                        color="tertiary"
                        size="small"
                        disabled={!product}
                        textStyle={styles.button2Text}
                    />
                </View>
            )}
            {isWish ? (
                <Pressable
                    onPress={handleClickWish}
                    accessible
                    accessibilityLabel="위시리스트 제거"
                    accessibilityRole="button"
                    disabled={!product}
                >
                    <HeartFilledIcon size={24} color={Colors[colorScheme].text.primary} opacity={1} />
                </Pressable>
            ) : (
                <Pressable
                    onPress={handleClickWish}
                    accessible
                    accessibilityLabel="위시리스트 추가"
                    accessibilityRole="button"
                    disabled={!product}
                >
                    <HeartOutlineIcon size={24} color={Colors[colorScheme].text.primary} opacity={1} />
                </Pressable>
            )}
        </View>
    );
};

const useStyles = (colorScheme: 'light' | 'dark') =>
    StyleSheet.create({
        buttonWrap: {
            gap: 16,
            paddingTop: 15,
            paddingBottom: 30,
            paddingHorizontal: 20,
            borderTopWidth: 1,
            borderTopColor: Colors[colorScheme].border.third,
            alignContent: 'stretch',
            alignItems: 'center',
            flexDirection: 'row',
            backgroundColor: Colors[colorScheme].background.primary
        },
        button: {
            borderRadius: 4,
            height: 50,
            backgroundColor: Colors[colorScheme].button.primary.background
        },
        buttonText: {
            color: Colors[colorScheme].text.secondary
        },
        button2: {
            backgroundColor: Colors[colorScheme].background.primary,
            borderWidth: 1,
            borderColor: Colors[colorScheme].button.primary.background
        },
        button2Text: {
            color: Colors[colorScheme].text.primary
        },
        buttonOuter: {
            flex: 1
        }
    });

export default ActionButtons;
