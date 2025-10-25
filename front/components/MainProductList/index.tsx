/**
 * 홈 화면 메인 상품 노출
 * - 기본적으로 랜덤 카테고리 상품 노출
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';

import MoreButton from '../MoreButton';
import ProductCard from '../ProductCard';
import useStyle from './style';

// GetMainProductsResponse 타입 유지를 위한 import
import { MainProductsState } from '../../stores/product/types';

// props 타입 정의
interface MainProductListProps {
    data: MainProductsState;
    category: string;
}

// ref를 통해 외부에서 접근할 수 있는 메서드 정의
export interface MainProductListRef {
    scrollToTop: () => void;
}

const MainProductList = forwardRef<MainProductListRef, MainProductListProps>(({ data, category }, ref) => {
    const [randomCount, setRandomCount] = useState<number>(5);
    const [specialCount, setSpecialCount] = useState<number>(5);

    const style = useStyle();

    const onMore = useCallback(
        function (type: 'special' | 'random') {
            let newCount = 0;
            switch (type) {
                case 'special':
                    setSpecialCount(function (prev) {
                        newCount = Math.min(prev + 5, data.special.length);
                        return newCount;
                    });

                    break;
                case 'random':
                    setRandomCount(function (prev) {
                        newCount = Math.min(prev + 5, data.random.length);
                        return newCount;
                    });

                    break;
            }
        },
        [data, randomCount, specialCount]
    );

    // 스크롤뷰 ref 추가
    const scrollViewRef = useRef<ScrollView>(null);

    // ref를 통해 외부에서 접근할 수 있는 메서드 노출
    useImperativeHandle(ref, () => ({
        scrollToTop: () => {
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
            }
        }
    }));

    useEffect(() => {
        setRandomCount(5);
        setSpecialCount(5);
    }, [category, data.random.length, data.special.length]);

    return (
        <>
            <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
                {data.local
                    .filter(function ({ order }) {
                        return order < 0;
                    })
                    .sort(function (a, b) {
                        return a.order - b.order;
                    })
                    .map(function (item) {
                        return (
                            <View
                                style={style.MainProductSection}
                                key={`discover-main-section-${item.name}-${item.order}`}
                            >
                                <Text style={[style.MainProductSectionTitle]} accessible accessibilityRole="header">
                                    {item.name}
                                </Text>
                            </View>
                        );
                    })}

                {data.random.length > 0 && (
                    <View style={style.MainProductSection}>
                        <Text style={[style.MainProductSectionTitle]} accessible accessibilityRole="header">
                            {category}
                        </Text>

                        <FlatList
                            accessibilityViewIsModal={false}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false}
                            contentContainerStyle={[style.MainProductSectionListContent]}
                            data={data.random.slice(0, randomCount)}
                            keyExtractor={function (item) {
                                return `random-${item.url}`;
                            }}
                            ItemSeparatorComponent={() => (
                                <View style={style.MainProductSectionSeparator} accessible={false} />
                            )}
                            renderItem={function ({ item }) {
                                return <ProductCard data={item} category={category} />;
                            }}
                        />
                        {data.random.length >= randomCount + 5 && (
                            <View style={style.MainProductSectionListFooter}>
                                <MoreButton
                                    onPress={function () {
                                        onMore('random');
                                    }}
                                />
                            </View>
                        )}
                    </View>
                )}

                {data.special.length > 0 && (
                    <View style={style.MainProductSection}>
                        <Text style={[style.MainProductSectionTitle]} accessible accessibilityRole="header">
                            오늘의 특가 상품
                        </Text>

                        <FlatList
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false}
                            contentContainerStyle={[style.MainProductSectionListContent]}
                            data={data.special.slice(0, specialCount)}
                            keyExtractor={function (item) {
                                return `special-${item.url}`;
                            }}
                            ItemSeparatorComponent={() => (
                                <View style={style.MainProductSectionSeparator} accessible={false} />
                            )}
                            renderItem={function ({ item }) {
                                return <ProductCard data={item} category="오늘의 특가 상품" />;
                            }}
                        />
                        {data.special.length >= specialCount + 5 && (
                            <View style={style.MainProductSectionListFooter}>
                                <MoreButton
                                    onPress={function () {
                                        onMore('special');
                                    }}
                                />
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </>
    );
});

export default MainProductList;
