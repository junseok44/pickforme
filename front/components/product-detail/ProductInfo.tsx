import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';
import { productDetailAtom } from '../../stores/product/atoms';
import { Text, View } from '@components';
import { Product } from '../../stores/product/types';
import useColorScheme from '../../hooks/useColorScheme';
import { Colors } from '@constants';
import { numComma } from '../../utils/common';

interface ProductInfoProps {
    product: Product;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ product }) => {
    const colorScheme = useColorScheme();
    const styles = useStyles(colorScheme);
    const productDetail = useAtomValue(productDetailAtom);

    return (
        <View style={styles.inner}>
            <Text style={styles.name}>{product.name ?? productDetail?.product?.name ?? ''}</Text>

            <View style={styles.priceWrap} accessible accessibilityRole="text">
                {productDetail?.product?.name ? (
                    <>
                        {(productDetail?.product?.discount_rate ?? 0) !== 0 && (
                            <Text
                                style={styles.discount_rate}
                                accessibilityLabel={`할인률 ${productDetail?.product?.discount_rate ?? 0}%`}
                            >
                                {productDetail?.product?.discount_rate ?? 0}%
                            </Text>
                        )}
                        <Text
                            style={styles.price}
                            accessibilityLabel={`현재 가격 ${numComma(productDetail?.product?.price ?? 0)}원`}
                        >
                            {numComma(productDetail?.product?.price ?? 0)}원
                        </Text>
                        {(productDetail?.product?.origin_price ?? 0) !== 0 &&
                            productDetail?.product?.price !== productDetail?.product?.origin_price && (
                                <Text
                                    style={styles.origin_price}
                                    accessibilityLabel={`할인 전 가격 ${numComma(
                                        productDetail?.product?.origin_price ?? 0
                                    )}원`}
                                >
                                    {numComma(productDetail?.product?.origin_price ?? 0)}
                                </Text>
                            )}
                    </>
                ) : (
                    <ActivityIndicator accessibilityLabel="가격 정보 로딩 중" />
                )}
            </View>

            <View style={styles.table}>
                <View style={styles.tableList}>
                    <View style={styles.tableRow} accessible>
                        <Text style={styles.tableHeader}>리뷰</Text>
                        <Text style={styles.tableItem}>{productDetail?.product?.reviews ?? 0} 개</Text>
                    </View>
                    <View style={styles.tableRow} accessible>
                        <Text style={styles.tableHeader}>평점</Text>
                        <Text style={styles.tableItem}>
                            {(productDetail?.product?.ratings ?? 0).toFixed(1).replace('.0', '')} 점
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const useStyles = (colorScheme: 'light' | 'dark') =>
    StyleSheet.create({
        inner: {
            paddingHorizontal: 20,
            paddingBottom: 40
        },
        name: {
            fontSize: 18,
            fontWeight: '600',
            lineHeight: 20,
            marginBottom: 11,
            color: Colors[colorScheme].text.primary
        },
        priceWrap: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        price: {
            fontSize: 18,
            fontWeight: '700',
            lineHeight: 22,
            marginRight: 6,
            color: Colors[colorScheme].text.primary
        },
        discount_rate: {
            fontSize: 18,
            fontWeight: '700',
            lineHeight: 22,
            color: '#4A5CA0',
            marginRight: 6
        },
        origin_price: {
            fontSize: 13,
            fontWeight: '500',
            textDecorationLine: 'line-through',
            color: Colors[colorScheme].text.secondary
        },
        table: {
            marginTop: 31,
            flexDirection: 'column'
        },
        tableList: {
            gap: 8,
            flexDirection: 'column'
        },
        tableRow: {
            gap: 43,
            flexDirection: 'row'
        },
        tableHeader: {
            width: 65,
            fontSize: 14,
            fontWeight: '600',
            lineHeight: 20,
            color: Colors[colorScheme].text.primary
        },
        tableItem: {
            fontSize: 14,
            fontWeight: '500',
            lineHeight: 20,
            flexGrow: 1,
            color: Colors[colorScheme].text.primary
        }
    });

export default ProductInfo;
