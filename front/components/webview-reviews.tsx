// 목적: 상품 리뷰를 수집하기 위한 웹뷰입니다.
// 기능:
// 쿠팡 상품 URL로부터 리뷰 페이지 URL을 추출하고 해당 페이지를 숨겨진 웹뷰로 불러옵니다.
// 웹 페이지에서 리뷰 내용을 추출하여 문자열 배열로 변환합니다.
// 스크롤 다운 기능을 제공하여 더 많은 리뷰를 로드할 수 있게 합니다.
// 중복 리뷰는 제거하고 새로운 리뷰만 누적하여 전달합니다.
// 특징: 스크롤 다운 시 새로운 리뷰를 감지하여 기존 리뷰와 합쳐서 전달하는 메커니즘이 있습니다.

import React, { useRef, useState, useEffect, ReactElement, useCallback } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Alert, View } from 'react-native';
import { convertToCoupangReviewUrl } from '@/utils/url';

interface WebViewProps {
    productUrl: string;
    onMessage: (data: string[]) => void;
    onError?: () => void;
}

// 반환 타입 정의
interface WebViewReviewsResult {
    component: ReactElement;
    scrollDown: () => void;
    runJavaScript: () => void;
}

export const useWebViewReviews = ({ productUrl, onMessage, onError }: WebViewProps): WebViewReviewsResult => {
    const webViewRef = useRef<WebView>(null);
    const [reviewWebviewUrl, setReviewWebviewUrl] = useState<string>('');
    const [injectionCode, setInjectionCode] = useState<string>('');
    const [accumulatedReviews, setAccumulatedReviews] = useState<string[]>([]);
    const [hasErrorOccurred, setHasErrorOccurred] = useState<boolean>(false);
    const [retryCount, setRetryCount] = useState<number>(0);
    const [scrollDownCount, setScrollDownCount] = useState<number>(0);

    // ----- 추가: 워치독(무응답 시 reload) -----
    const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reloadAttempt = useRef(0);
    const WATCHDOG_MS = 2000; // onLoadEnd/onError가 X초간 없으면 reload
    const MAX_RELOADS = 2; // 무한 루프 방지

    // 최대 재시도 횟수
    const maxRetries = 3;

    const handleErrorOnce = () => {
        if (!hasErrorOccurred) {
            setHasErrorOccurred(true);
            onError?.();
        }
    };

    const clearWatchdog = useCallback(() => {
        if (watchdogTimerRef.current) {
            clearTimeout(watchdogTimerRef.current);
            watchdogTimerRef.current = null;
        }
    }, []);

    const armWatchdog = useCallback(() => {
        clearWatchdog();
        watchdogTimerRef.current = setTimeout(() => {
            // 제한 시간 경과: 이벤트가 아무것도 안 왔음 → reload 시도
            if (webViewRef.current && reloadAttempt.current < MAX_RELOADS) {
                reloadAttempt.current++;
                try {
                    console.log('========== watchdog reload ==========');

                    webViewRef.current.reload();
                } catch (e) {
                    // reload 자체가 실패하면 최종 에러 처리
                    setHasErrorOccurred(true);
                    onError?.();
                }
            } else {
                // 리로드 한도 초과 → 최종 에러 처리
                clearWatchdog();
                handleErrorOnce();
            }
        }, WATCHDOG_MS);
    }, [clearWatchdog, reloadAttempt, handleErrorOnce]);

    const parseUrl = async (url: string) => {
        try {
            if (url.includes('coupang')) {
                const reviewUrl = await convertToCoupangReviewUrl(url);
                setReviewWebviewUrl(reviewUrl);
                setInjectionCode(`(function() {
                  // 리뷰 평점 노드 확인
                  const ratingNode = document.querySelector('.reviews-rating');
                  const hasRating = ratingNode !== null;
                  
                  const divs = document.querySelectorAll('div[class*="review-content"]');
                  const divContents = [];
                  divs.forEach(div => {
                    divContents.push(div.innerText.trim());
                  });
                  const uniqueContents = Array.from(new Set(divContents));
                  
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ 
                      content: uniqueContents,
                      hasRating: hasRating
                    }));
                  }
                })();
                true;`);
            } else {
                // TODO: add other platforms
                setReviewWebviewUrl(url);
                setInjectionCode(`(function() {
                  // 리뷰 평점 노드 확인
                  const ratingNode = document.querySelector('.reviews-rating');
                  const hasRating = ratingNode !== null;
                  
                  const divs = document.querySelectorAll('div[class*="review"]');
                  const divContents = [];
                  divs.forEach(div => {
                    if (div.innerText.length > 20) {
                      divContents.push(div.innerText.trim());
                    }
                  });
                  const uniqueContents = Array.from(new Set(divContents));
                  
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ 
                      content: uniqueContents,
                      hasRating: hasRating
                    }));
                  }
                })();
                true;`);
            }
        } catch (error) {
            console.error('URL 파싱 중 오류:', error);
            handleErrorOnce();
        }
    };

    const runJavaScript = () => {
        setTimeout(() => {
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(injectionCode);
            }
        }, 1000);
    };

    const scrollDown = () => {
        if (webViewRef.current) {
            const scrollScript = `
                (function() {
                    const prevScrollY = window.scrollY;
                    window.scrollTo(0, document.body.scrollHeight);
                    
                    // 리뷰 평점 노드 확인
                    const ratingNode = document.querySelector('.reviews-rating');
                    const hasRating = ratingNode !== null;
                    
                    // 리뷰 컨텐츠 추출 코드 직접 실행
                    const divs = document.querySelectorAll('div[class*="review-content"]');
                    const divContents = [];
                    divs.forEach(div => {
                        divContents.push(div.innerText.trim());
                    });
                    const uniqueContents = Array.from(new Set(divContents));
                    
                    // 스크롤 결과와 컨텐츠를 함께 전송
                    setTimeout(function() {
                        const scrollChanged = window.scrollY > prevScrollY;
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'scrollResult',
                            scrollChanged: scrollChanged,
                            content: uniqueContents,
                            hasRating: hasRating
                        }));
                    }, 1000);
                    return true;
                })();
            `;
            webViewRef.current.injectJavaScript(scrollScript);
        }
    };

    useEffect(() => {
        setRetryCount(0);
        setScrollDownCount(0);
        setHasErrorOccurred(false);
        setAccumulatedReviews([]);
        reloadAttempt.current = 0;
        clearWatchdog();
        parseUrl(productUrl).catch(error => {
            console.error('URL 파싱 중 오류:', error);
        });
    }, [productUrl]);

    const handleMessage = (event: WebViewMessageEvent) => {
        const data = event.nativeEvent.data;

        try {
            const parsedData = JSON.parse(data);

            // 스크롤 결과 처리
            if (parsedData.type === 'scrollResult') {
                clearWatchdog();

                // 리뷰 평점 노드가 없으면 에러 처리
                if (!parsedData.hasRating) {
                    console.log('리뷰 평점 노드를 찾을 수 없음');
                    handleError();
                    return;
                }

                if (!parsedData.scrollChanged && scrollDownCount < 11) {
                    scrollDown();
                    setScrollDownCount(count => count + 1);
                    return;
                }

                // 리뷰 평점 노드가 있으면 빈 배열이어도 성공으로 처리
                if (parsedData.hasRating) {
                    if (parsedData.content && parsedData.content.length > 0) {
                        const newReviews = parsedData.content.filter(
                            (review: string) => !accumulatedReviews.includes(review)
                        );

                        if (newReviews.length > 0) {
                            console.log('새로운 리뷰:', newReviews.length, '개 발견');
                            const updatedReviews = [...accumulatedReviews, ...newReviews];
                            setAccumulatedReviews(updatedReviews);
                            onMessage(updatedReviews); // 전체 리뷰 전달
                        } else {
                            // 새로운 리뷰는 없지만 평점 노드가 있으면 성공으로 처리
                            onMessage(accumulatedReviews);
                        }
                    } else {
                        // 리뷰 내용이 없어도 평점 노드가 있으면 성공으로 처리
                        onMessage(accumulatedReviews);
                    }
                }
                return;
            }

            // 일반 컨텐츠 처리
            if (parsedData.hasRating) {
                clearWatchdog();

                // 리뷰 평점 노드가 있으면 빈 배열이어도 성공으로 처리
                if (parsedData.content && parsedData.content.length > 0) {
                    const newReviews = parsedData.content.filter(
                        (review: string) => !accumulatedReviews.includes(review)
                    );

                    if (newReviews.length > 0) {
                        const updatedReviews = [...accumulatedReviews, ...newReviews];
                        setAccumulatedReviews(updatedReviews);
                        onMessage(updatedReviews); // 전체 리뷰 전달
                    } else {
                        // 새로운 리뷰는 없지만 평점 노드가 있으면 성공으로 처리
                        onMessage(accumulatedReviews);
                    }
                } else {
                    // 리뷰 내용이 없어도 평점 노드가 있으면 성공으로 처리
                    onMessage(accumulatedReviews);
                }
            } else {
                console.log('리뷰 평점 노드를 찾을 수 없음, handleError 호출');
                handleError();
            }
        } catch (error) {
            console.error('Failed to parse JSON:', error);
            handleError();
        }
    };

    const handleError = () => {
        clearWatchdog();

        setRetryCount(retryCount => retryCount + 1);
        if (retryCount >= maxRetries) {
            handleErrorOnce();
        } else {
            runJavaScript();
        }
    };

    const component = (
        <View style={{ width: '100%', height: 0 }}>
            <WebView
                ref={webViewRef}
                source={{ uri: reviewWebviewUrl }}
                onMessage={handleMessage}
                onShouldStartLoadWithRequest={request => {
                    // 외부 앱 스킴 차단 (coupang://, intent://, market:// 등)
                    const url = request.url.toLowerCase();
                    if (
                        url.startsWith('coupang://') ||
                        url.startsWith('intent://') ||
                        url.startsWith('market://') ||
                        url.startsWith('play.google.com') ||
                        url.startsWith('itunes.apple.com') ||
                        url.includes('://launch')
                    ) {
                        console.log('Blocked external app scheme:', request.url);
                        return false; // 차단
                    }
                    // HTTP/HTTPS만 허용
                    return url.startsWith('http://') || url.startsWith('https://');
                }}
                onLoadStart={() => {
                    armWatchdog();
                }}
                onLoadEnd={() => {
                    clearWatchdog();
                    runJavaScript();
                }}
                onError={handleError}
                cacheEnabled={false}
                cacheMode="LOAD_NO_CACHE"
                renderToHardwareTextureAndroid={true}
            />
        </View>
    );

    return { component, scrollDown, runJavaScript };
};
