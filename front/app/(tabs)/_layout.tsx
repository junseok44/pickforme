import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, Linking, TouchableOpacity, View, Text } from 'react-native';
import { HomeIcon, MyIcon, WishListIcon } from '@assets';
import { Colors } from '@constants';
import useColorScheme from '../../hooks/useColorScheme';
import MainPagePopups from '@/components/(tabs)/MainPagePopups';
import { useAtom, useSetAtom } from 'jotai';
import { searchTextAtom, searchQueryAtom, currentCategoryAtom, scrollResetTriggerAtom } from '../../stores/search';
import { getMainProductsAtom } from '../../stores/product/atoms';
import { categoryName, CATEGORIES } from '@/constants/Categories';
import { maybeLogFirstAction } from '@/services/firebase';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const [searchText, setSearchText] = useAtom(searchTextAtom);
    const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
    const [currentCategory, setCurrentCategory] = useAtom(currentCategoryAtom);
    const [scrollResetTrigger, setScrollResetTrigger] = useAtom(scrollResetTriggerAtom);
    const getMainProducts = useSetAtom(getMainProductsAtom);

    return (
        <>
            <MainPagePopups />
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: Colors?.[colorScheme]?.button.primary.text,
                    headerShown: false,
                    tabBarItemStyle: {
                        paddingTop: 12
                    },
                    tabBarStyle: Platform.select({
                        ios: {
                            // position: 'absolute',
                            backgroundColor: Colors?.[colorScheme]?.button.primary.background,
                            borderTopWidth: 0,
                            elevation: 0,
                            shadowOpacity: 0,
                            height: 90,
                            paddingBottom: 20
                        },
                        default: {
                            height: 100,
                            backgroundColor: Colors?.[colorScheme]?.button.primary.background,
                            borderTopWidth: 0,
                            elevation: 0
                        }
                    })
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarLabel: '홈',
                        tabBarAccessibilityLabel: '홈 탭',
                        tabBarButton: props => {
                            const safeProps = Object.fromEntries(
                                Object.entries(props).map(([key, value]) => [key, value === null ? undefined : value])
                            );

                            const isSelected = props['aria-selected'] ?? false;

                            return (
                                <TouchableOpacity
                                    {...safeProps}
                                    onPress={e => {
                                        props.onPress?.(e);

                                        // 홈탭을 눌렀을 때 검색 정보들을 초기화
                                        if (searchText.length > 0 || searchQuery.length > 0) {
                                            setSearchText('');
                                            setSearchQuery('');
                                        } else {
                                            const randomCategoryId =
                                                CATEGORIES[Math.floor(CATEGORIES.length * Math.random())];
                                            setCurrentCategory(
                                                categoryName[randomCategoryId as keyof typeof categoryName]
                                            );
                                            // 홈화면 데이터 새로고침
                                            getMainProducts(randomCategoryId);

                                            // 스크롤 초기화 트리거 호출
                                            setScrollResetTrigger(prev => prev + 1);
                                        }
                                    }}
                                >
                                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                                        <HomeIcon
                                            size={28}
                                            color={Colors?.[colorScheme]?.button.primary.text}
                                            opacity={isSelected ? 1 : 0.5}
                                        />
                                        <Text
                                            style={{
                                                color: Colors?.[colorScheme]?.button.primary.text,
                                                fontSize: 11,
                                                opacity: isSelected ? 1 : 0.5
                                            }}
                                        >
                                            홈
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        }
                    }}
                />

                <Tabs.Screen
                    name="wishlist"
                    options={{
                        title: 'WishList',
                        tabBarLabel: '위시리스트',
                        tabBarAccessibilityLabel: '위시리스트 탭',
                        tabBarButton: props => {
                            const safeProps = Object.fromEntries(
                                Object.entries(props).map(([k, v]) => [k, v === null ? undefined : v])
                            );
                            const isSelected = props['aria-selected'] ?? false;

                            return (
                                <TouchableOpacity
                                    {...safeProps}
                                    onPress={e => {
                                        maybeLogFirstAction('tab_wishlist_press');
                                        props.onPress?.(e);
                                    }}
                                >
                                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                                        <WishListIcon
                                            size={28}
                                            color={Colors?.[colorScheme]?.button.primary.text ?? 'white'}
                                            opacity={isSelected ? 1 : 0.5}
                                        />
                                        <Text
                                            style={{
                                                color: Colors?.[colorScheme]?.button.primary.text ?? 'white',
                                                fontSize: 11,
                                                opacity: isSelected ? 1 : 0.5
                                            }}
                                        >
                                            위시리스트
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        }
                    }}
                />

                {/* 마이페이지 탭 */}
                <Tabs.Screen
                    name="mypage"
                    options={{
                        title: 'My',
                        tabBarLabel: '마이페이지',
                        tabBarAccessibilityLabel: '마이페이지 탭',
                        tabBarButton: props => {
                            const safeProps = Object.fromEntries(
                                Object.entries(props).map(([k, v]) => [k, v === null ? undefined : v])
                            );
                            const isSelected = props['aria-selected'] ?? false;

                            return (
                                <TouchableOpacity
                                    {...safeProps}
                                    onPress={e => {
                                        maybeLogFirstAction('tab_mypage_press');
                                        props.onPress?.(e);
                                    }}
                                >
                                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                                        <MyIcon
                                            size={28}
                                            color={Colors?.[colorScheme]?.button.primary.text ?? 'white'}
                                            opacity={isSelected ? 1 : 0.5}
                                        />
                                        <Text
                                            style={{
                                                color: Colors?.[colorScheme]?.button.primary.text ?? 'white',
                                                fontSize: 11,
                                                opacity: isSelected ? 1 : 0.5
                                            }}
                                        >
                                            마이페이지
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        }
                    }}
                />
            </Tabs>
        </>
    );
}
