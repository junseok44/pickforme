import {
    getAnalytics,
    logEvent as firebaseLogEvent,
    setUserProperty,
    setUserId,
    logScreenView as firebaseLogScreenView,
    setAnalyticsCollectionEnabled,
    FirebaseAnalyticsTypes
} from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';
import { AnalyticsEventName, AnalyticsScreenName, AnalyticsEventParams } from '../types/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Analytics 인스턴스
const app = getApp();
const isProd = process.env.EXPO_PUBLIC_APP_ENV === 'production';

let analytics: FirebaseAnalyticsTypes.Module;

// 프로덕션이 아닌 경우 Analytics 비활성화
if (!isProd) {
    console.log('🚫 Firebase Analytics disabled (not production)');
} else {
    analytics = getAnalytics(app);
    setAnalyticsCollectionEnabled(analytics, true); // 명시적으로 활성화
    console.log('✅ Firebase Analytics enabled (production)');
}

const INSTALL_TIME_KEY = 'install_time_ms';
const SESSION_STARTED_AT_KEY = 'session_started_at_ms';
const FIRST_ACTION_LOGGED_KEY = 'first_action_logged';

// 앱 최초 설치 시간 확보
export async function ensureInstallTime() {
    const v = await AsyncStorage.getItem(INSTALL_TIME_KEY);
    if (!v) {
        const now = Date.now();
        await AsyncStorage.setItem(INSTALL_TIME_KEY, String(now));
        return now;
    }
    return Number(v);
}

export async function startNewSession() {
    const startedAt = Date.now();
    await AsyncStorage.setItem(SESSION_STARTED_AT_KEY, String(startedAt));
    await AsyncStorage.setItem(FIRST_ACTION_LOGGED_KEY, 'false');

    if (isProd && analytics) {
        await firebaseLogEvent(analytics, 'session_start_custom', {
            session_started_at_ms: startedAt
        });
    }
}

export async function maybeLogFirstAction(actionName: string) {
    if (!isProd || !analytics) return;

    const sessionStartedAtStr = await AsyncStorage.getItem(SESSION_STARTED_AT_KEY);
    if (!sessionStartedAtStr) return;
    const sessionStartedAt = Number(sessionStartedAtStr);

    const elapsed_ms = Date.now() - sessionStartedAt;

    const firstActionLogged = await AsyncStorage.getItem(FIRST_ACTION_LOGGED_KEY);
    if (firstActionLogged) return;

    await firebaseLogEvent(analytics, 'first_action', {
        action_name: actionName,
        elapsed_ms
    });

    // 필요하다면 세션당 1회만 찍도록 flag 저장
    await AsyncStorage.setItem(FIRST_ACTION_LOGGED_KEY, 'true');
}

export async function logClickBuy(params: {
    item_id: string | number;
    item_name?: string;
    category?: string;
    price?: number;
}) {
    if (!isProd || !analytics) return;

    const sessionStartedAtStr = await AsyncStorage.getItem(SESSION_STARTED_AT_KEY);
    const sessionStartedAt = sessionStartedAtStr ? Number(sessionStartedAtStr) : Date.now();
    const elapsed_ms = Date.now() - sessionStartedAt;

    await firebaseLogEvent(analytics, 'click_buy', {
        item_id: String(params.item_id),
        item_name: params.item_name,
        category: params.category,
        price: params.price,
        elapsed_ms_since_session: elapsed_ms // ★ 앱 실행 시점과의 차이
    });
}

async function isWithin24hOfInstall() {
    const install = await ensureInstallTime();
    return Date.now() - install <= 24 * 60 * 60 * 1000;
}

export async function logViewItemDetail(params: {
    item_id: string | number;
    item_name?: string;
    category?: string;
    price?: number;
}) {
    if (!isProd || !analytics) return;
    const within_24h = await isWithin24hOfInstall();

    await firebaseLogEvent(analytics, 'view_item_detail', {
        item_id: String(params.item_id),
        item_name: params.item_name,
        category: params.category,
        price: params.price,
        within_24h // ★ 설치기준 전환율에 쓰는 핵심 필드
    });
}

// 이벤트 로깅
export const logEvent = async (eventName: AnalyticsEventName, params?: AnalyticsEventParams) => {
    if (!isProd || !analytics) return;

    try {
        await firebaseLogEvent(analytics, eventName, params);
    } catch (error) {
        console.error('Analytics event logging failed:', error);
    }
};

// 화면 추적
export const logScreenView = async (screenName: AnalyticsScreenName, screenClass: string) => {
    if (!isProd || !analytics) return;

    try {
        await firebaseLogScreenView(analytics, {
            screen_name: screenName,
            screen_class: screenClass
        });
    } catch (error) {
        console.error('Screen view logging failed:', error);
    }
};

// 사용자 ID 설정
export const setAnalyticsUserId = async (userId: string | number | null) => {
    if (!isProd || !analytics) return;

    try {
        await setUserId(analytics, userId ? String(userId) : null);
        console.log('✅ Firebase Analytics User ID set:', userId);
    } catch (error) {
        console.error('Setting user ID failed:', error);
    }
};

// 사용자 속성 설정
export const setUserProperties = async (properties: { [key: string]: string }) => {
    if (!isProd || !analytics) return;

    try {
        for (const [key, value] of Object.entries(properties)) {
            await setUserProperty(analytics, key, value);
        }
    } catch (error) {
        console.error('Setting user properties failed:', error);
    }
};

// 탭 콘텐츠 프로세스 결과 로깅 (question 제거)
export const logTabContentProcess = async (params: {
    request_id: string;
    tab: 'caption' | 'report' | 'review'; // question 제거
    status: 'success' | 'failed';
    duration_ms: number;
    failure_reason?: 'no_data' | 'ai_generation_failed' | 'network_error' | 'crawling_failed';
    process_path?: 'webview_only' | 'server_only' | 'webview_then_server';
    product_url?: string;
}) => {
    if (!isProd || !analytics) return;

    try {
        await firebaseLogEvent(analytics, 'tab_content_process', {
            request_id: params.request_id,
            tab: params.tab,
            status: params.status,
            duration_ms: params.duration_ms,
            failure_reason: params.failure_reason,
            process_path: params.process_path,
            product_url: params.product_url
        });
    } catch (error) {
        console.error('Tab content process logging failed:', error);
    }
};
