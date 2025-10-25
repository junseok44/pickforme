// WebViewSearch.tsx
import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Product } from '../stores/product/types';

interface WebViewProps {
    keyword: string;
    onMessage: (data: Product[], opts?: { source?: string; isFinalResult?: boolean }) => void;
    startWebviewSearch: boolean;
}

const searchProductInjectionCode = `
(function () {
  // ---------- utils ----------
  const toNumber = (txt='') => {
    const n = (txt+'').replace(/[^0-9]/g,'');
    return n ? parseInt(n,10) : 0;
  };

  const getStar5 = (li) => {
    // desktop 별점은 style="width: 100%" 로 표기됨 (100% = 5.0)
    const star = li.querySelector('[class*="ProductRating_star"]');
    if (!star) return 0;
    const m = /width:\\s*([0-9.]+)%/.exec(star.getAttribute('style') || '');
    const pct = m ? parseFloat(m[1]) : 0;
    return +(pct / 20).toFixed(2); // 0~5
  };

  const getPriceInfo = (li) => {
    // 새로운 가격 구조: PriceArea_priceArea__NntJz
    const priceArea = li.querySelector('[class*="PriceArea_priceArea"]');
    if (priceArea) {
      // 현재 가격: fw-text-[20px]/[24px] fw-font-bold 클래스가 있는 div
      const currentPriceEl = priceArea.querySelector('div[class*="fw-text-[20px]"]');
      const currentPrice = currentPriceEl ? toNumber(currentPriceEl.textContent) : 0;
      
      // 원가: del 태그 안의 가격
      const originPriceEl = priceArea.querySelector('del');
      const originPrice = originPriceEl ? toNumber(originPriceEl.textContent) : 0;
      
      // 할인율 계산
      const discountRate = originPrice > 0 && currentPrice > 0 
        ? Math.round(((originPrice - currentPrice) / originPrice) * 100)
        : 0;
      
      return {
        price: currentPrice,
        origin_price: originPrice,
        discount_rate: discountRate
      };
    }
    
    // 기존 가격 구조 (fallback)
    return {
      price: toNumber(li.querySelector('[class*="Price_priceValue"]')?.textContent || '0'),
      origin_price: toNumber(li.querySelector('[class*="PriceInfo_basePrice"]')?.textContent || '0'),
      discount_rate: toNumber(li.querySelector('[class*="PriceInfo_discountRate"]')?.textContent || '0')
    };
  };

  const absUrl = (href) => {
    try { return new URL(href, location.origin).href; } catch (e) { return ''; }
  };

  const parseIdsFromHref = (href) => {
    try {
      const u = new URL(href, location.origin);
      const q = u.searchParams;
      return {
        productId: (u.pathname.match(/\\/vp\\/products\\/(\\d+)/) || [])[1] || '',
        itemId: q.get('itemId') || '',
        vendorItemId: q.get('vendorItemId') || ''
      };
    } catch (e) {
      return { productId: '', itemId: '', vendorItemId: '' };
    }
  };

  // ---------- scraper ----------'
  function collect() {
    const list = document.querySelectorAll('#product-list > li[class*="ProductUnit_productUnit"]');
    if (!list.length) return [];

    const items = [];
    list.forEach((li) => {
      // 광고/위젯/베스트셀러 스킵
      if (li.classList.contains('best-seller')) return;
      if (li.querySelector('[class*="AdMark_adMark"]')) return;

      const a = li.querySelector('a[href]');
      if (!a) return;

      const pickName = (li) => {
     // 1) productName 접두사 부분일치 (V2/V3/해시 무관)
     const el =
       li.querySelector('[class*="ProductUnit_productName"]') ||
       li.querySelector('[class*="productName"]') ||
       li.querySelector('a[aria-label]') ||
       li.querySelector('a[title]');

     // 2) textContent가 비면 innerText도 시도 (visibility/line-clamp 이슈)
     const txt =
       (el && (el.textContent || el.innerText)) ||
       // 3) 앵커 속성 폴백
       li.querySelector('a')?.getAttribute('aria-label') ||
       li.querySelector('a')?.getAttribute('title') ||
       '';

     return (txt || '').trim();
   };

      const name = pickName(li);
      const thumbnail = li.querySelector('figure img')?.getAttribute('src') || '';
      const { price, origin_price, discount_rate } = getPriceInfo(li);
      const reviews = toNumber(li.querySelector('[class*="ProductRating_ratingCount"]')?.textContent || '0');
      const rating5 = getStar5(li);                 // 0~5
      const ratings = Math.round(rating5 * 2) / 2;  // 0~5 (0.5점 단위)

      const href = a.getAttribute('href') || '';
      const url = absUrl(href);
      const { productId, itemId, vendorItemId } = parseIdsFromHref(href);

      items.push({
        name,
        thumbnail,
        price,
        origin_price,
        discount_rate,
        ratings,
        reviews,
        url,
        productId,
        itemId,
        vendorItemId,
      });
    });

    return items;
  }

  function post(payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  }

  // ---------- wait & observe ----------
  let tries = 0;
  const maxTries = 8;
  const pollDelay = 700;

  function tryScrape() {
    const products = collect();
    if (products.length) {
      post({ content: products });
      obs && obs.disconnect();
      return true;
    }
    return false;
  }

  // 즉시 한 번 시도
  if (tryScrape()) { return true; }

  // 폴링
  const timer = setInterval(() => {
    tries++;
    if (tryScrape() || tries >= maxTries) {
      clearInterval(timer);
    } else {
      // 무한스크롤 추가로 더 필요하면 아래 라인 주석 해제
      // window.scrollTo(0, document.body.scrollHeight);
    }
  }, pollDelay);

  // DOM 변경 감지
  const root = document.querySelector('#product-list') || document.body;
  const obs = new MutationObserver(() => { tryScrape(); });
  obs.observe(root, { childList: true, subtree: true });

  true;
})();
`;

const shouldBlock = (url: string) => {
    const u = url.toLowerCase();
    return (
        u.startsWith('coupang://') ||
        u.startsWith('intent://') ||
        u.startsWith('market://') ||
        u.includes('://launch') ||
        u.includes('play.google.com') ||
        u.includes('itunes.apple.com') ||
        u.includes('apps.apple.com')
    );
};

const buildUrl = (kw: string) => `https://www.coupang.com/np/search?q=${encodeURIComponent(kw)}&page=1`;

const _WebViewSearch = ({ keyword, onMessage, startWebviewSearch }: WebViewProps) => {
    const webViewRef = useRef<WebView>(null);
    const [retryCount, setRetryCount] = useState<number>(0);
    const maxRetries = 5;

    const [uri, setUri] = useState<string>('');

    const safeInject = useCallback(() => {
        // CSR 환경을 고려해 약간 지연 후 인젝션
        setTimeout(() => {
            webViewRef.current?.injectJavaScript(searchProductInjectionCode);
        }, 800);
    }, []);

    const handleMessage = (event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data?.error) {
                handleError(data.error);
                return;
            }
            if (Array.isArray(data?.content)) {
                // console.log('🚀 ~ handleMessage ~ data.content:', data.content);
                // webview에서 성공 - 최종 결과로 처리
                onMessage(data.content, { source: 'webview', isFinalResult: true });
            }
        } catch (error) {
            console.error('Failed to parse WebView message:', error);
        }
    };

    const handleError = (_err: any) => {
        if (retryCount < maxRetries) {
            setRetryCount(c => c + 1);
            setTimeout(() => {
                handleExecuteSearch();
            }, 1000);
        }
    };

    const handleExecuteSearch = () => {
        const next = buildUrl(keyword);
        if (next !== uri) {
            setUri(next); // ← 네비게이션 발생 (URL 변경)
        } else {
            webViewRef.current?.reload(); // ← 같은 URL이면 새로고침만
        }
    };

    useEffect(() => {
        if (startWebviewSearch && keyword) {
            setRetryCount(0);
            handleExecuteSearch();
        }
    }, [startWebviewSearch, keyword]);

    return (
        <View style={{ width: '100%', height: 0 }}>
            <WebView
                ref={webViewRef}
                source={{ uri: uri }}
                // 데스크톱 DOM을 강제하기 위해 UA를 데스크톱으로 설정
                userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
                onMessage={handleMessage}
                onShouldStartLoadWithRequest={req => {
                    if (shouldBlock(req.url)) {
                        // 콘솔만 남기고 네비게이션 차단
                        console.log('[webview] blocked external scheme:', req.url);
                        return false;
                    }
                    return true;
                }}
                onLoadStart={() => {
                    // ReactNativeWebView 존재 보장 (일부 환경에서 방어적)
                    webViewRef.current?.injectJavaScript(`
            window.ReactNativeWebView = window.ReactNativeWebView || {};
            true;
          `);
                }}
                onLoadEnd={safeInject}
                onError={handleError}
                cacheEnabled={false}
                cacheMode="LOAD_NO_CACHE"
                renderToHardwareTextureAndroid
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                // 숨김용 웹뷰
                // style={{ opacity: 0.01, height: 1 }}
            />
        </View>
    );
};

export const WebViewSearch = memo(_WebViewSearch);
