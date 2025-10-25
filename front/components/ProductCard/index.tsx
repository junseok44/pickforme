import { forwardRef, useCallback, useMemo } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { getNumberComma } from '@utils';
import useStyle from './style';
import type { ForwardedRef } from 'react';
import type { IProductCardProps } from './type';
import { logEvent, maybeLogFirstAction } from '@/services/firebase';

export default forwardRef(function ProductCard(
    { data, type = '', category }: IProductCardProps,
    ref: ForwardedRef<View>
) {
    const router = useRouter();
    const styles = useStyle();

    const isBase = useMemo(
        function () {
            return (
                !['liked', 'request', 'search'].includes(type || '') &&
                data.ratings !== null &&
                data.ratings !== undefined
            );
        },
        [type, data]
    );

    const label = useMemo(
        function () {
            // 상품명 → 가격 → 할인율 → 리뷰개수 → 평점 순서로 접근성 레이블 구성
            let mainLabel = `${data.name ?? ''} ${getNumberComma(data.price ?? 0)}원`;

            if (isBase) {
                // 할인율 정보 추가
                if (data.discount_rate !== null && data.discount_rate !== undefined && data.discount_rate !== 0) {
                    mainLabel += ` 할인률 ${data.discount_rate}%`;
                }

                // 리뷰 개수와 평점 추가
                if (data.reviews !== null && data.reviews > 0 && data.ratings !== null && data.ratings > 0) {
                    mainLabel += ` 리뷰 ${data.reviews}개 평점 ${Math.floor((data.ratings / 20) * 10) / 10}점`;
                }
            }

            return mainLabel;
        },
        [isBase, data]
    );

    const onPress = useCallback(
        function () {
            maybeLogFirstAction('product_card_click');

            if (type === 'search') {
                logEvent('search_item_click', {
                    item_id: data.url,
                    item_name: data.name
                });
            } else {
                logEvent('home_item_click', {
                    item_id: data.url,
                    item_name: data.name,
                    category: category || '기타'
                });
            }
            router.push(`/product-detail?url=${encodeURIComponent(data.url)}`);
        },
        [category]
    );

    return (
        <Pressable
            ref={ref}
            accessible
            accessibilityRole="button"
            accessibilityLabel={label}
            style={styles.ProductCard}
            onPress={onPress}
        >
            <View style={[styles.ProductCardContent, isBase && styles.ProductCardContentColumn]}>
                {isBase ? (
                    <View style={styles.ProductCardContentColumn}>
                        {/* 상품명 1행 */}
                        <Text
                            numberOfLines={1}
                            style={styles.ProductCardName}
                            ellipsizeMode="tail"
                            accessible
                            accessibilityLabel={`상품: ${data.name}, 가격: ${getNumberComma(data.price ?? 0)}원`}
                        >
                            {data.name}
                        </Text>

                        {/* 리뷰개수, 평점, 할인율, 가격 정보 2행 */}
                        <View style={styles.ProductCardContentRow}>
                            <View style={styles.ProductCardTitleColumn}>
                                <Text style={[styles.ProductCardReviews, { fontWeight: '400' }]} accessible>
                                    리뷰 {data.reviews || 0}개 평점 {data.ratings || 0}점
                                </Text>
                            </View>
                            <View
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'flex-end',
                                    justifyContent: 'flex-end'
                                }}
                            >
                                {data.discount_rate !== null && data.discount_rate > 0 && (
                                    <Text style={styles.ProductCardDiscount} accessible>
                                        {data.discount_rate}%
                                    </Text>
                                )}
                                <View style={{ marginLeft: 5 }}>
                                    <Text style={styles.ProductCardPrice} accessible>
                                        {getNumberComma(data.price ?? 0)}원
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.ProductCardContentColumn}>
                        {/* 상품명 1행 */}
                        <Text
                            numberOfLines={1}
                            style={styles.ProductCardName}
                            ellipsizeMode="tail"
                            accessible
                            accessibilityLabel={`상품: ${data.name}, 가격: ${getNumberComma(data.price ?? 0)}원`}
                        >
                            {data.name}
                        </Text>

                        {/* 나머지 정보 2행 */}
                        <View style={styles.ProductCardContentRow}>
                            <View style={styles.ProductCardTitleColumn}>
                                {type !== 'search' &&
                                    data.reviews !== null &&
                                    data.reviews > -1 &&
                                    data.ratings !== null &&
                                    data.ratings > -1 && (
                                        <Text style={styles.ProductCardReviews} accessible>
                                            리뷰 {data.reviews}개 평점 {Math.floor((data.ratings / 20) * 10) / 10}점
                                        </Text>
                                    )}
                            </View>
                            <Text style={styles.ProductCardPrice} accessible>
                                {getNumberComma(data.price ?? 0)}원
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </Pressable>
    );
});
