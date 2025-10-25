import { useState, useRef, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/core';
import { useSetAtom, useAtomValue, useAtom } from 'jotai';
import {
    View,
    StyleSheet,
    TextInput,
    Image,
    Pressable,
    Text as DefaultText,
    FlatList,
    ScrollView,
    AccessibilityInfo,
    findNodeHandle,
    InteractionManager,
    Keyboard
} from 'react-native';
import SearchIcon from '../../assets/icons/SearchIcon';
import BackIcon from '../../assets/icons/BackIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useColorScheme from '../../hooks/useColorScheme';
import type { ColorScheme } from '../../hooks/useColorScheme';
import Colors from '../../constants/Colors';
import { searchTextAtom, searchQueryAtom, currentCategoryAtom, scrollResetTriggerAtom } from '../../stores/search';
import { useProductSearch } from '../../hooks/useProductSearch';
import { searchResultAtom, getMainProductsAtom, mainProductsAtom } from '../../stores/product/atoms';

import { CATEGORIES, categoryName } from '../../constants/Categories';
import { MainProductList, MainProductListRef } from '@components';
import { WebViewSearch } from '../../components/webview-search';
import ProductCard from '../../components/ProductCard';

const SORTERS = ['scoreDesc'];
const SORTER_NAME = ['추천순', '낮은가격순', '높은가격순', '판매량순', '최신순'];

export default function HomeScreen() {
    const colorScheme = useColorScheme();
    const style = useStyle(colorScheme);
    const insets = useSafeAreaInsets();

    // 상태 관리
    const initialRef = useRef(null);
    const searchLoadingRef = useRef(null);
    const searchResultRef = useRef(null);

    // Jotai atoms
    const getMainProducts = useSetAtom(getMainProductsAtom);
    const searchResult = useAtomValue(searchResultAtom);
    const [mainProducts, setMainProducts] = useAtom(mainProductsAtom);
    const [currentCategory, setCurrentCategory] = useAtom(currentCategoryAtom);

    // 검색 관련 레퍼런스
    const mainListRef = useRef<MainProductListRef>(null);

    // 스크롤 초기화 트리거
    const [scrollResetTrigger] = useAtom(scrollResetTriggerAtom);
    // 검색 훅 사용
    const {
        searchText,
        isSearching,
        searchSorter,
        isSearchMode,
        handleSearchTextChange,
        handleSearchResults,
        handleSortChange,
        handleSearchButtonClick,
        handleBackButtonClick,
        hasError,
        startWebviewSearch
    } = useProductSearch();

    useFocusEffect(
        useCallback(() => {
            const f = () => {
                if (initialRef.current) {
                    const nodeHandle = findNodeHandle(initialRef.current);
                    if (nodeHandle) {
                        InteractionManager.runAfterInteractions(() => {
                            setTimeout(() => {
                                AccessibilityInfo.setAccessibilityFocus(nodeHandle);
                            }, 500);
                        });
                    }
                }
            };
            setTimeout(f, 500);
        }, [])
    );

    // 스크롤 초기화 트리거가 변경되면 스크롤을 맨 위로 초기화
    useEffect(() => {
        if (mainListRef.current) {
            // FlatList를 포함한 MainProductList 컴포넌트에 스크롤 초기화 메서드 호출
            if (mainListRef.current.scrollToTop) {
                mainListRef.current.scrollToTop();
            }
        }
    }, [scrollResetTrigger]);

    useEffect(() => {
        if (hasError) return;
        let timer = setTimeout(() => {
            const ref = isSearching ? searchLoadingRef : searchResultRef;
            if (ref.current) {
                const nodeHandle = findNodeHandle(ref.current);
                if (nodeHandle) {
                    InteractionManager.runAfterInteractions(() => {
                        setTimeout(() => {
                            AccessibilityInfo.setAccessibilityFocus(nodeHandle);
                        }, 500);
                    });
                }
            }
        }, 500);
        return () => {
            clearTimeout(timer);
        };
    }, [isSearching, hasError]);

    useEffect(() => {
        const randomCategoryId = CATEGORIES[Math.floor(CATEGORIES.length * Math.random())];
        setCurrentCategory(categoryName[randomCategoryId as keyof typeof categoryName]);
        getMainProducts(randomCategoryId);
    }, [getMainProducts]);

    return (
        <View style={style.Container}>
            <View style={style.Header}>
                <View style={style.searchContainer}>
                    {isSearchMode && (
                        <Pressable
                            onPress={handleBackButtonClick}
                            accessibilityRole="button"
                            accessibilityLabel="뒤로가기"
                            accessible
                        >
                            <BackIcon size={24} color={Colors[colorScheme].text.primary} opacity={1} />
                        </Pressable>
                    )}
                    <View style={style.inputWrap}>
                        <TextInput
                            ref={initialRef}
                            style={style.textArea}
                            underlineColorAndroid="transparent"
                            value={searchText}
                            returnKeyType="search"
                            onSubmitEditing={handleSearchButtonClick}
                            accessible
                            accessibilityLabel="검색어 입력창"
                            onChangeText={handleSearchTextChange}
                            placeholder="찾고 싶은 상품 키워드 또는 쿠팡 링크를 입력해 보세요"
                            placeholderTextColor={Colors[colorScheme].text.placeholder}
                        />
                        {!!searchText.length && (
                            <Pressable
                                onPress={() => {
                                    console.log('keyboard dismiss');
                                    Keyboard.dismiss();
                                    handleSearchTextChange('');
                                }}
                                accessible
                                accessibilityLabel="삭제"
                                accessibilityRole="button"
                                onAccessibilityTap={() => {
                                    Keyboard.dismiss();
                                    handleSearchTextChange('');
                                }}
                            >
                                <Image
                                    style={style.resetIcon}
                                    source={require('../../assets/images/discover/icReset.png')}
                                />
                                {/* reset 버튼 */}
                            </Pressable>
                        )}
                        <Pressable
                            onPress={() => {
                                Keyboard.dismiss();
                                handleSearchButtonClick();
                            }}
                            accessible
                            accessibilityLabel="검색하기"
                            accessibilityRole="button"
                            onAccessibilityTap={() => {
                                console.log('keyboard dismiss onAccessibilityTap');
                                Keyboard.dismiss();
                                handleSearchButtonClick();
                            }}
                        >
                            <SearchIcon size={24} color={Colors[colorScheme].text.primary} opacity={1} />
                        </Pressable>
                    </View>
                </View>
            </View>

            <View importantForAccessibility="no-hide-descendants">
                <WebViewSearch
                    keyword={searchText}
                    startWebviewSearch={startWebviewSearch}
                    onMessage={handleSearchResults}
                />
            </View>

            {/* 검색 결과 또는 메인 상품 목록 */}
            {isSearching ? (
                <DefaultText style={style.loading} ref={searchLoadingRef}>
                    검색하신 상품을 로딩중이에요.
                </DefaultText>
            ) : isSearchMode ? (
                <>
                    <View style={style.searchStatus}>
                        <View
                            ref={searchResultRef}
                            accessible
                            accessibilityLabel={`총 ${searchResult?.products?.length || 0}건 검색됨`}
                        >
                            <DefaultText style={style.productCount}>
                                총 {searchResult?.products?.length || 0}건
                            </DefaultText>
                        </View>
                        <View style={style.sorterSelector}>
                            {SORTERS.map((sort, idx) => (
                                <Pressable
                                    key={`sort-${sort}`}
                                    accessible
                                    accessibilityLabel={
                                        sort === searchSorter ? `${SORTER_NAME[idx]}` : SORTER_NAME[idx]
                                    }
                                >
                                    <DefaultText style={sort === searchSorter ? style.selectedSorter : style.sorter}>
                                        {SORTER_NAME[idx]}
                                    </DefaultText>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={{ flex: 1, marginBottom: insets.bottom + 60 }}>
                        <FlatList
                            style={[style.scrollView]}
                            contentContainerStyle={{
                                ...style.searchList
                            }}
                            data={searchResult?.products || []}
                            keyExtractor={(product, index) => `search-${product.url}-${index}`}
                            renderItem={({ item: product }) => <ProductCard data={product} type="search" />}
                            ItemSeparatorComponent={() => <View style={style.seperator} accessible={false} />}
                            ListEmptyComponent={() => (
                                <DefaultText style={style.loading}>검색결과가 없습니다.</DefaultText>
                            )}
                        />
                    </View>
                </>
            ) : (
                // 메인 상품 목록
                <View style={{ flex: 1, marginBottom: insets.bottom }}>
                    <MainProductList ref={mainListRef} data={mainProducts} category={currentCategory} />
                </View>
            )}
        </View>
    );
}

function useStyle(colorScheme: ColorScheme) {
    const insets = useSafeAreaInsets();
    const theme = Colors[colorScheme];

    return StyleSheet.create({
        Container: {
            flex: 1,
            backgroundColor: theme.background.primary,
            paddingHorizontal: 20
        },
        Header: {
            paddingTop: insets.top + 18,
            paddingBottom: 32
        },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 15
        },
        inputWrap: {
            flex: 1,
            marginHorizontal: 0,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            height: 47,
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.background.secondary,
            borderColor: theme.border.primary,
            borderWidth: 1,
            flexDirection: 'row'
        },
        textArea: {
            fontSize: 14,
            flex: 1,
            width: '100%',
            color: theme.text.primary
        },
        resetIcon: {
            flexShrink: 0,
            marginLeft: 14,
            width: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center'
        },
        sendIcon: {
            flexShrink: 0,
            marginLeft: 3,
            width: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center'
        },
        backButton: {
            width: 24,
            height: 24,
            marginRight: 5,
            flexShrink: 0
        },
        searchStatus: {
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.border.primary,
            flexDirection: 'row',
            justifyContent: 'space-between'
        },
        productCount: {
            fontWeight: '700',
            color: theme.text.primary
        },
        sorterSelector: {
            marginHorizontal: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 8
        },
        sorter: {
            fontSize: 13,
            color: theme.text.primary
        },
        selectedSorter: {
            fontWeight: '700',
            fontSize: 13,
            color: theme.text.primary
        },
        scrollView: {
            paddingVertical: 20
        },
        searchList: {
            // paddingHorizontal: 20
        },
        seperator: {
            height: 12,
            width: 1,
            backgroundColor: 'transparent'
        },
        loading: {
            paddingHorizontal: 20,
            textAlign: 'center',
            flex: 1,
            color: theme.text.primary
        }
    });
}
