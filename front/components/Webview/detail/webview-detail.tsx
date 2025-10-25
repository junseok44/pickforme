// 목적: 상품 상세 정보를 가져오기 위한 웹뷰 (전략 큐 기반 리팩터)
// 특징:
// - productUrl → 다양한 시도(데스크톱/모바일/대안) 전략을 큐에 쌓고 순차 실행
// - 각 시도는 url + injection + maxRetries 로 구성
// - onLoadEnd → isReady=true 되면 "해당 시도 1회만" injection
// - handleMessage/handleError 에서 성공/실패를 판정하여 재시도 또는 다음 시도로 이동
// - isReady / hasInjected / retryCount / stage 전부 단일화

import React, { useRef, useState, useEffect, useMemo, useRef as useRefAlias, ReactElement } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { View } from 'react-native';
import { Product } from '../../../stores/product/types';
import { resolveRedirectUrl } from '@/utils/url';
import { extractFromUrl } from './utils';
import { getDesktopInjectionCode, getMobileInjectionCode, getMobileInjectionCode2 } from './injection';

interface WebViewProps {
    productUrl: string;
    onMessage: (data: Product) => void;
    onError?: () => void;
    onAttemptLog?: (data: {
        attemptLabel: string;
        success: boolean;
        durationMs: number;
        fields: Record<string, boolean>;
    }) => void;
}

type Ids = { productId?: string; itemId?: string; vendorItemId?: string };

type Attempt = {
    label: string; // 디버깅용 태그
    url: string; // 이 시도에서 열 주소
    getInjection: (ids: Ids) => string; // 이 시도에서 주입할 JS
    maxRetries?: number; // 개별 오버라이드 (기본값 사용 가능)
};

const DEFAULT_MAX_RETRIES = 2; // 통일된 기본 재시도 횟수
const FIRST_INJECT_DELAY_MS = 800; // 최초 주입 딜레이(로딩 안정화)
const RETRY_DELAY_MS = 1000; // 재시도 간격

/** ===== 메인 훅 ===== */
export const useWebViewDetail = ({
    productUrl,
    onMessage,
    onError,
    onAttemptLog
}: WebViewProps): JSX.Element | null => {
    const webViewRef = useRef<WebView>(null);

    // 전략 큐 + 진행 상태
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [retryCount, setRetryCount] = useState(0);

    // 단일 Ready/Inject 상태
    const [isReady, setIsReady] = useState(false);
    const [hasInjected, setHasInjected] = useState(false);

    // 컨텍스트
    const idsRef = useRef<Ids>({});
    const successRef = useRef(false);
    const erroredRef = useRef(false);
    const attemptStartTimeRef = useRef<number>(Date.now());

    // 현재 시도
    const currentAttempt = attempts[currentIdx];

    /** productUrl 변경 시: 전략 큐 구성 */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            // 모든 상태 초기화
            setAttempts([]);
            setCurrentIdx(0);
            setRetryCount(0);
            setIsReady(false);
            setHasInjected(false);
            successRef.current = false;
            erroredRef.current = false;
            idsRef.current = {};
            attemptStartTimeRef.current = Date.now(); // 초기 attempt 시작 시간 기록

            const extracted = await extractFromUrl(productUrl);

            if (cancelled) return;

            if (extracted.kind === 'general') {
                // 쿠팡이 아니면, "그냥 그 URL 열고 간단 주입" 시도 하나만 구성
                setAttempts([
                    {
                        label: 'general',
                        url: extracted.url,
                        getInjection: () => `(function(){ try {
              window.ReactNativeWebView?.postMessage(JSON.stringify({ error: 'non-coupang url' }));
            } catch(e) { window.ReactNativeWebView?.postMessage(JSON.stringify({ error: String(e&&e.message||e) })); } })();`,
                        maxRetries: 0
                    }
                ]);
            } else {
                // 쿠팡: 데스크톱 → 모바일(두 가지) 순으로 시도
                idsRef.current = extracted.ids;
                const queue: Attempt[] = [
                    {
                        label: 'desktop-1',
                        url: extracted.canonicalDesktop,
                        getInjection: () => getDesktopInjectionCode(),
                        maxRetries: 1
                    },
                    {
                        label: 'mobile-mlp',
                        url: extracted.mobileMLP,
                        getInjection: (ids: Ids) => getMobileInjectionCode2(ids),
                        maxRetries: 3
                    },
                    {
                        label: 'mobile-vm',
                        url: extracted.mobileVM,
                        getInjection: (ids: Ids) => getMobileInjectionCode(),
                        maxRetries: 2
                    }
                ].filter(a => !!a.url);
                setAttempts(queue);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [productUrl]);

    /** onLoadEnd → Ready → (시도당 단 1회) 주입 */
    useEffect(() => {
        if (!currentAttempt) return;
        if (!isReady) return;
        if (hasInjected) return;
        // 최초 주입 딜레이 후 1회만
        const t = setTimeout(() => {
            try {
                console.log('link changed, injecting javascript code....', currentAttempt.label);

                const code = currentAttempt.getInjection(idsRef.current);
                webViewRef.current?.injectJavaScript(code);
                setHasInjected(true);
            } catch (e) {
                // 주입 자체가 실패하면 즉시 실패 처리
                triggerFailure();
            }
        }, FIRST_INJECT_DELAY_MS);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, hasInjected, currentAttempt?.label]);

    /** 실패 처리 (재시도 또는 다음 시도 이동) */
    const triggerFailure = () => {
        if (successRef.current || erroredRef.current) return;

        console.log('triggerFailure -----', currentAttempt?.label, retryCount);

        const max = currentAttempt?.maxRetries ?? DEFAULT_MAX_RETRIES;
        if (retryCount < max) {
            // 재주입
            setRetryCount(c => c + 1);
            setIsReady(false);
            setHasInjected(false);
            setTimeout(() => {
                try {
                    webViewRef.current?.reload();
                } catch {}
            }, RETRY_DELAY_MS);
        } else {
            // 이 attempt 실패 로그 기록
            if (onAttemptLog && currentAttempt) {
                const durationMs = Date.now() - attemptStartTimeRef.current;
                onAttemptLog({
                    attemptLabel: currentAttempt.label,
                    success: false,
                    durationMs,
                    fields: {
                        name: false,
                        thumbnail: false,
                        detail_images: false
                    }
                });
            }

            // 다음 시도
            if (currentIdx + 1 < attempts.length) {
                setCurrentIdx(i => i + 1);
                setRetryCount(0);
                setIsReady(false);
                setHasInjected(false);
                attemptStartTimeRef.current = Date.now(); // 다음 attempt 시작 시간 기록
            } else {
                // 모든 시도 실패
                erroredRef.current = true;
                onError?.();
            }
        }
    };

    /** 성공 처리 */
    const triggerSuccess = (payload: Product) => {
        if (successRef.current) return;
        successRef.current = true;

        // 성공 attempt 로그 기록
        if (onAttemptLog && currentAttempt) {
            const durationMs = Date.now() - attemptStartTimeRef.current;
            onAttemptLog({
                attemptLabel: currentAttempt.label,
                success: true,
                durationMs,
                fields: {
                    name: !!payload.name,
                    thumbnail: !!payload.thumbnail,
                    detail_images: Array.isArray(payload?.detail_images) && payload.detail_images.length > 0
                }
            });
        }

        onMessage(payload);
    };

    /** 메시지 핸들러: 성공/실패 판정 */
    const handleMessage = (event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.error) {
                // 시도 실패 → 재시도/다음시도
                triggerFailure();
                return;
            }

            const content = data.content;
            if (content?.name) {
                // (옵션) 불완전한 payload 거르기
                if (successRef.current && (!content.detail_images?.length || !content.name || !content.thumbnail)) {
                    return;
                }
                // 원본 productUrl로 치환
                triggerSuccess({ ...content, url: productUrl });
            } else {
                triggerFailure();
            }
        } catch {
            // 파싱 실패도 실패로 처리
            triggerFailure();
        }
    };

    return currentAttempt ? (
        <View style={{ width: '100%', height: 0 }}>
            <WebView
                ref={webViewRef}
                source={{ uri: currentAttempt.url }}
                onMessage={handleMessage}
                onLoadStart={() => {
                    // ReactNativeWebView 객체 보장
                    webViewRef.current?.injectJavaScript(`
                        window.ReactNativeWebView = window.ReactNativeWebView || {};
                        true;
                    `);
                }}
                onLoad={() => setIsReady(true)}
                onError={() => triggerFailure()}
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
                cacheEnabled={false}
                cacheMode="LOAD_NO_CACHE"
                renderToHardwareTextureAndroid
                mediaPlaybackRequiresUserAction
                style={{ flex: 1 }}
            />
        </View>
    ) : null;
};
