import React, { useCallback, useState } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { FlatList, InteractionManager, StyleSheet } from 'react-native';
import { Product } from '../../stores/product/types';

import { getRequestsAtom, requestsAtom } from '../../stores/request/atoms';
import { Request } from '../../stores/request/types';

import useCheckLogin from '../../hooks/useCheckLogin';
import { wishProductsAtom } from '../../stores/product/atoms';
import Colors from '../../constants/Colors';
import { Text, View, Button_old as Button } from '@components';
import useColorScheme, { ColorScheme } from '../../hooks/useColorScheme';
import ProductCard from '../../components/ProductCard';

import DiscoverIcon from '../../assets/images/tabbar/requests.svg';

import { useFocusEffect } from '@react-navigation/core';
import { useRef } from 'react';
import { Text as TextBase, AccessibilityInfo, findNodeHandle } from 'react-native';

import { useWebViewDetail } from '../../components/Webview/detail/webview-detail';
// import { mainProductsAtom } from '../../stores/product/atoms';

enum TABS {
    PRODUCT = 'PRODUCT',
    REQUEST = 'REQUEST'
}

const tabName = {
    [TABS.PRODUCT]: '찜한 상품',
    [TABS.REQUEST]: '매니저에게 문의한 상품'
};

export default function WishListScreen() {
    const colorScheme = useColorScheme();
    const styles = useStyles(colorScheme);
    const wishProducts = useAtomValue(wishProductsAtom);
    // const mainProducts = useAtomValue(mainProductsAtom);
    const setWishProducts = useSetAtom(wishProductsAtom);
    const headerTitleRef = useRef<TextBase>(null);
    const [tab, setTab] = React.useState<TABS>(TABS.PRODUCT);

    const getRequests = useSetAtom(getRequestsAtom);
    const requests = useAtomValue(requestsAtom);
    const setRequests = useSetAtom(requestsAtom);

    // 위시리스트 및 문의 상품의 평점/리뷰/할인율이 없는 경우 처리
    const [currentProductUrl, setCurrentProductUrl] = useState<string>('');
    const [currentTab, setCurrentTab] = useState<TABS | null>(null);
    const [requestsWithUniqueProduct, setRequestsWithUniqueProduct] = useState<Request[]>([]);

    React.useEffect(() => {
        if (tab === TABS.REQUEST) {
            getRequests();
        }
    }, [getRequests, tab]);

    useFocusEffect(
        useCallback(() => {
            const f = () => {
                if (headerTitleRef.current) {
                    const nodeHandle = findNodeHandle(headerTitleRef.current);
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

    // 필터링 함수 - 평점/리뷰가 없는 상품 찾기
    const filterProductsNeedingUpdate = useCallback((product: Product) => {
        return (
            typeof product.ratings !== 'number' ||
            product.ratings <= 0 ||
            typeof product.reviews !== 'number' ||
            product.reviews <= 0
        );
    }, []);

    // 다음 업데이트 필요한 상품 처리
    const processNextProduct = useCallback(() => {
        console.log('현재 탭:', tab);
        // 현재 탭에 따라 다른 로직 적용
        if (tab === TABS.PRODUCT) {
            // 위시리스트에서 업데이트가 필요한 다음 상품 찾기
            const filteredProducts = wishProducts.filter(filterProductsNeedingUpdate);
            console.log('업데이트 필요한 상품 수:', filteredProducts.length);
            if (filteredProducts.length > 0) {
                setCurrentProductUrl(filteredProducts[0].url);
                setCurrentTab(TABS.PRODUCT);
                console.log('위시리스트 상품 업데이트 시작:', filteredProducts[0].url);
            } else {
                setCurrentProductUrl('');
                setCurrentTab(null);
                console.log('모든 위시리스트 상품 업데이트 완료');
            }
        } else if (tab === TABS.REQUEST) {
            // 문의 상품에서 업데이트가 필요한 다음 상품 찾기
            const requestsWithProduct = requests.filter(request => request.product);
            const filteredRequests = requestsWithProduct.filter(request =>
                filterProductsNeedingUpdate(request.product!)
            );
            console.log('REQUEST업데이트 필요한 문의 상품 수:', filteredRequests.length, requestsWithProduct);

            if (filteredRequests.length > 0) {
                const url = filteredRequests[0].product!.url;
                console.log('문의 상품 업데이트 시작:', url);
                setCurrentProductUrl(url);
                setCurrentTab(TABS.REQUEST);
            } else {
                setCurrentProductUrl('');
                setCurrentTab(null);
                console.log('모든 문의 상품 업데이트 완료');
            }
        }
    }, [wishProducts, requests, tab, filterProductsNeedingUpdate]);

    // REQUEST 탭 클릭 시 순서
    const handleRequestTabClick = useCallback(() => {
        console.log('REQUEST 탭 클릭');
        setTab(TABS.REQUEST);
        // 문의 상품 가져오기
        getRequests();
        // 데이터가 로드된 후에 useEffect에서 처리할 것이미로 여기서는 추가 작업 필요없음
    }, [getRequests]);

    // requests가 변경될 때마다 대응하는 useEffect 추가
    React.useEffect(() => {
        if (tab === TABS.REQUEST && requests.length > 0) {
            console.log('requests 데이터 변경 감지:', requests.length);

            // 필터링하여 업데이트가 필요한 문의 상품 찾기
            const requestsWithProduct = requests.filter(request => request.product);
            const filteredRequests = requestsWithProduct.filter(request =>
                filterProductsNeedingUpdate(request.product!)
            );
            console.log('requests 변경 후 업데이트 필요한 문의 상품 수:', filteredRequests.length, requestsWithProduct);

            if (filteredRequests.length > 0) {
                // 첫 번째 상품 업데이트 시작
                setCurrentTab(TABS.REQUEST);
                setCurrentProductUrl(filteredRequests[0].product!.url);
                console.log('React.useEffect 문의 상품 업데이트 시작:', filteredRequests[0].product!.url);
            }
        }
    }, [requests, tab, filterProductsNeedingUpdate]);

    // PRODUCT 탭 클릭 시 순서
    const handleProductTabClick = useCallback(() => {
        console.log('PRODUCT 탭 클릭');
        setTab(TABS.PRODUCT);

        // 탭 변경 후 순차적으로 처리
        setTimeout(() => {
            // 필터링하여 업데이트가 필요한 위시리스트 상품 찾기
            const filteredProducts = wishProducts.filter(filterProductsNeedingUpdate);
            console.log('업데이트 필요한 위시리스트 상품 수:', filteredProducts.length);

            if (filteredProducts.length > 0) {
                // 첫 번째 상품 업데이트 시작
                setCurrentTab(TABS.PRODUCT);
                setCurrentProductUrl(filteredProducts[0].url);
                console.log('위시리스트 상품 업데이트 시작:', filteredProducts[0].url);
            }
        }, 500);
    }, [filterProductsNeedingUpdate, wishProducts]);

    // 로그인 필요한 문의 탭 클릭 함수
    const handleClickRequest = useCheckLogin(() => handleRequestTabClick());

    // 위시리스트 상품 업데이트 필요 확인
    React.useEffect(() => {
        if (tab === TABS.PRODUCT && wishProducts.length > 0) {
            const filteredProducts = wishProducts.filter(filterProductsNeedingUpdate);
            if (filteredProducts.length > 0) {
                setCurrentProductUrl(filteredProducts[0].url);
                setCurrentTab(TABS.PRODUCT);
            }
        }
    }, [wishProducts, tab, filterProductsNeedingUpdate]);

    // 문의 상품 업데이트 필요 확인
    React.useEffect(() => {
        if (tab === TABS.REQUEST && requests.length > 0) {
            // product 값이 있는 요청만 가져와서 평점/리뷰가 없는 상품 필터링

            // URL 기준으로 고유한 요청만 필터링
            const urlSet = new Set();
            const uniqueRequests = requests.filter(request => {
                if (!request.product || !request.product.url) return false;

                // 이미 처리한 URL이면 건너뛰기
                if (urlSet.has(request.product.url)) return false;

                // 새로운 URL 추가
                urlSet.add(request.product.url);
                return true;
            });

            console.log('unique requests:', uniqueRequests.length);
            // 상태 변수에 고유한 요청 저장
            setRequestsWithUniqueProduct(uniqueRequests);

            const filteredRequests = uniqueRequests.filter(request => filterProductsNeedingUpdate(request.product!));

            if (filteredRequests.length > 0) {
                const url = filteredRequests[0].product!.url;
                console.log('문의 상품 업데이트 시작:', url);

                // mainproduct에서 찾아보기
                // const mainProduct = mainProducts.find(product => product.url === url);
                // if (mainProduct) {
                //     setCurrentProductUrl(url);
                //     setCurrentTab(TABS.PRODUCT);
                // }

                // product에 없으면 webview를 이용해서 호출
                setCurrentProductUrl(url);
                setCurrentTab(TABS.REQUEST);
            }
        }
    }, [requests, tab, filterProductsNeedingUpdate]);

    // 재시도 횟수를 관리하기 위한 참조
    const retryCountRef = React.useRef<{ [url: string]: number }>({});
    const MAX_RETRY = 3; // 최대 재시도 횟수

    const DetailWebView = useWebViewDetail({
        productUrl: currentProductUrl,
        onMessage: updatedProduct => {
            console.log('상품 정보 업데이트 받음:', updatedProduct);
            setCurrentProductUrl('');

            // 재시도 횟수 초기화
            if (currentProductUrl) {
                retryCountRef.current[currentProductUrl] = 0;
            }

            // 현재 탭에 따라 다른 처리
            if (currentTab === TABS.PRODUCT) {
                // 위시리스트 상품 업데이트
                const currentWishProducts = [...wishProducts];
                const productIndex = currentWishProducts.findIndex(item => item.url === updatedProduct.url);

                if (productIndex !== -1) {
                    // 기존 상품 업데이트
                    const originalName = JSON.parse(JSON.stringify(currentWishProducts[productIndex].name));
                    const updatedItem = {
                        ...currentWishProducts[productIndex],
                        // 새로 업데이트된 정보 반영
                        reviews: updatedProduct.reviews || currentWishProducts[productIndex].reviews || null,
                        ratings: updatedProduct.ratings || currentWishProducts[productIndex].ratings || null,
                        discount_rate:
                            updatedProduct.discount_rate || currentWishProducts[productIndex].discount_rate || null,
                        price: updatedProduct.price || currentWishProducts[productIndex].price || 0
                    };

                    updatedItem.name = originalName;

                    // 새 배열 만들기
                    const newWishProducts = [...currentWishProducts];
                    newWishProducts[productIndex] = updatedItem;

                    // 상품 정보 업데이트
                    setWishProducts(newWishProducts);

                    console.log('위시리스트 상품 정보 업데이트 완료:', updatedItem.name);
                } else {
                    console.log('업데이트할 위시리스트 상품을 찾을 수 없음:', updatedProduct.url);
                }
            } else if (currentTab === TABS.REQUEST) {
                // 문의 상품 업데이트
                const currentRequests = [...requests];
                const requestIndex = currentRequests.findIndex(
                    req => req.product && req.product.url === updatedProduct.url
                );

                if (requestIndex !== -1 && currentRequests[requestIndex].product) {
                    // 기존 상품 정보 복사
                    const request = currentRequests[requestIndex];
                    // JSON stringify/parse를 사용하여 까다롭게 복사 (중첩 객체 또는 참조 문제 예방)
                    const originalName =
                        request.product && request.product.name
                            ? JSON.parse(JSON.stringify(request.product.name))
                            : updatedProduct.name;

                    // 새로운 product 객체 생성
                    const updatedProductItem = {
                        ...request.product!,
                        // 기존 이름 유지
                        name: originalName || updatedProduct.name,
                        // 새로 업데이트된 정보 반영
                        reviews: updatedProduct.reviews || request.product!.reviews || null,
                        ratings: updatedProduct.ratings || request.product!.ratings || null,
                        discount_rate: updatedProduct.discount_rate || request.product!.discount_rate || null,
                        price: updatedProduct.price || request.product!.price || 0
                    };

                    // 새 요청 객체 생성
                    const updatedRequest = {
                        ...request,
                        product: updatedProductItem
                    };

                    // 새 배열 만들기
                    const newRequests = [...currentRequests];
                    newRequests[requestIndex] = updatedRequest;

                    // 요청 데이터 업데이트
                    setRequests(newRequests);

                    console.log('문의 상품 정보 업데이트 완료:', updatedProductItem.name);
                } else {
                    console.log('업데이트할 문의 상품을 찾을 수 없음:', updatedProduct.url);
                }
            }

            // 다음 상품 처리 확인
            processNextProduct();
        },
        onError: () => {
            console.log('상품 정보 업데이트 실패');

            // 현재 상품이 존재하는지 확인
            if (!currentProductUrl) return;

            // 현재 URL에 대한 재시도 횟수 가져오기
            const currentRetry = retryCountRef.current[currentProductUrl] || 0;

            if (currentRetry < MAX_RETRY) {
                // 재시도 횟수 증가
                retryCountRef.current[currentProductUrl] = currentRetry + 1;
                console.log(`상품 정보 업데이트 실패, 재시도 ${currentRetry + 1}/${MAX_RETRY}`);

                // 임시 저장할 URL 복사
                const urlToRetry = currentProductUrl;

                // URL을 재설정하여 웹뷰 리로드
                setCurrentProductUrl('');
                setTimeout(() => {
                    setCurrentProductUrl(urlToRetry);
                }, 1000);
            } else {
                // 최대 재시도 횟수 초과, 다음 상품으로 이동
                console.log(`상품 정보 업데이트 실패, 최대 재시도 횟수(${MAX_RETRY}) 초과, 다음 상품으로 이동`);
                setCurrentProductUrl('');
                // 다음 상품으로 이동
                processNextProduct();
            }
        }
    });

    return (
        <>
            {/* WebView를 화면 외부에 위치시켜 보이지 않게 합니다 */}
            <View style={{ height: 0, opacity: 0 }}>{currentProductUrl && DetailWebView}</View>
            <View style={styles.container}>
                <View style={styles.horizontalPadder}>
                    <View style={styles.header}>
                        <DiscoverIcon style={styles.icon} />
                        <Text style={styles.title} accessibilityRole="header" ref={headerTitleRef}>
                            위시리스트
                        </Text>
                    </View>
                </View>
                <View style={styles.tabWrap}>
                    {Object.values(TABS).map(TAB => (
                        <View style={styles.tab} key={`Wish-Tab-${TAB}`}>
                            <Button
                                style={[styles.tabButton, tab === TAB && styles.tabButtonActive]}
                                textStyle={[styles.tabButtonText, tab === TAB && styles.tabButtonTextActive]}
                                variant="text"
                                title={tabName[TAB]}
                                size="medium"
                                color={tab === TAB ? 'primary' : 'tertiary'}
                                onPress={TAB === TABS.REQUEST ? handleClickRequest : handleProductTabClick}
                                accessibilityLabel={`${tabName[TAB]} 탭`}
                                selected={tab === TAB}
                                accessibilityRole="button"
                            />
                        </View>
                    ))}
                </View>
                {tab === 'PRODUCT' && (
                    <>
                        {!wishProducts.length ? (
                            <Text style={styles.loading}>찜한 상품이 없습니다.</Text>
                        ) : (
                            <FlatList
                                contentContainerStyle={styles.searchList}
                                data={wishProducts
                                    .slice()
                                    .reverse()
                                    .filter(product => product.name)}
                                keyExtractor={product => `wishlist-wish-${product.url}`}
                                renderItem={({ item: product, index: i }) => (
                                    <ProductCard data={product} type={'liked'} category={'위시리스트'} />
                                )}
                                ItemSeparatorComponent={() => <View style={styles.seperatorRow} accessible={false} />}
                            />
                        )}
                    </>
                )}
                {tab === 'REQUEST' && (
                    <>
                        {!requestsWithUniqueProduct.length ? (
                            <Text style={styles.loading}>문의한 상품이 없습니다.</Text>
                        ) : (
                            <FlatList
                                contentContainerStyle={styles.searchList}
                                data={requestsWithUniqueProduct
                                    .filter(request => request.product && request.product.name)
                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
                                keyExtractor={(request, index) => `wishlist-request-${request.product!.url}-${index}`}
                                renderItem={({ item: request }) => (
                                    <ProductCard data={request.product!} type={'request'} category={'문의한 상품'} />
                                )}
                                ItemSeparatorComponent={() => <View style={styles.seperatorRow} accessible={false} />}
                            />
                        )}
                    </>
                )}
            </View>
        </>
    );
}

const useStyles = (colorScheme: ColorScheme) => {
    const theme = Colors[colorScheme];
    return StyleSheet.create({
        horizontalPadder: {
            paddingHorizontal: 20
        },
        list: {
            justifyContent: 'center',
            alignItems: 'center'
        },
        container: {
            width: '100%',
            flex: 1,
            paddingTop: 50,
            paddingBottom: 20,
            backgroundColor: theme.background.primary
        },
        title: {
            fontWeight: '600',
            fontSize: 22,
            lineHeight: 27,
            marginBottom: 13,
            color: theme.text.primary
        },
        scrollView: {
            paddingVertical: 20,
            flex: 1,
            backgroundColor: theme.background.primary
        },
        seperatorRow: {
            height: 12,
            width: 1,
            backgroundColor: 'transparent'
        },
        empty: {
            width: 140,
            backgroundColor: 'transparent'
        },
        seperator: {
            height: 1,
            width: 13,
            backgroundColor: 'transparent'
        },
        section: {
            marginBottom: 44
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '500',
            marginBottom: 23,
            color: theme.text.primary
        },
        more: {
            flex: 1,
            gap: 7,
            marginLeft: 30
        },
        moreButton: {
            width: 36,
            height: 36,
            backgroundColor: theme.background.secondary,
            borderRadius: 36,
            borderWidth: 1,
            borderColor: theme.text.primary,
            alignItems: 'center',
            justifyContent: 'center'
        },
        moreButtonImage: {
            width: 14,
            height: 14
        },
        moreText: {
            fontSize: 8,
            lineHeight: 11,
            color: theme.text.primary
        },
        inputWrap: {
            marginBottom: 10,
            paddingHorizontal: 22,
            paddingVertical: 15,
            borderRadius: 45,
            height: 47,
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.background.secondary,
            borderColor: theme.text.primary,
            borderWidth: 1,
            flexDirection: 'row'
        },
        textArea: {
            fontSize: 14,
            flex: 1,
            width: '100%',
            color: theme.text.primary
        },
        sendIcon: {
            flexShrink: 0,
            marginLeft: 14,
            width: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center'
        },
        backButton: {
            width: 89,
            marginBottom: 9
        },
        backText: {
            textDecorationLine: 'underline',
            color: theme.text.primary
        },
        searchList: {
            paddingHorizontal: 20,
            paddingTop: 13,
            alignItems: 'center'
        },
        searchItem: {},
        loading: {
            paddingVertical: 20,
            paddingHorizontal: 20,
            textAlign: 'center',
            flex: 1,
            color: theme.text.primary
        },
        header: {
            flexDirection: 'row'
        },
        icon: {
            color: theme.text.primary,
            marginRight: 9,
            marginTop: 2
        },
        tabWrap: {
            flexDirection: 'row',
            alignContent: 'stretch',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        tab: {
            flex: 1
        },
        tabButton: {
            padding: 16,
            flexDirection: 'row',
            borderRadius: 0,
            borderBottomWidth: 1,
            borderColor: theme.border.primary
        },
        tabButtonActive: {
            borderBottomColor: theme.text.primary,
            borderBottomWidth: 2
        },
        tabButtonText: {
            fontSize: 14,
            fontWeight: '400',
            lineHeight: 17,
            color: theme.text.primary
        },
        tabButtonTextActive: {
            color: theme.text.primary,
            fontWeight: '700'
        }
    });
};
