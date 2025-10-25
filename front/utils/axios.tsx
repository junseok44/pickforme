import axios from 'axios';
import { Platform } from 'react-native';

const baseURL = process.env.EXPO_PUBLIC_API_HOST;
// 로컬 개발 시
// const baseURL = Platform.OS === 'ios' ? 'http://localhost:3001' : 'http://10.0.2.2:3001';

console.log('baseURL', baseURL);

const client = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});
client.defaults.timeout = 40000;

export const setClientToken = (token?: string) => {
    if (token) {
        client.defaults.headers.common = {
            ...client.defaults.headers.common,
            authorization: `Bearer ${token}`
        };
    } else {
        delete client.defaults.headers.common.authorization;
    }
};

export function changeToken(value?: string) {
    if (!value) {
        delete client.defaults.headers.common.authorization;
    } else {
        client.defaults.headers.common = {
            ...client.defaults.headers.common,
            authorization: `Bearer ${value}`
        };
    }
}

// 에러 핸들링, 전역 Error API와 attempt 패턴 적용
export const handleApiError = (error: any, context: string) => {
    console.error(`API 에러 [${context}]:`, error);
    // 필요한 경우 에러 로깅, 분석 또는 변환
    return Promise.reject(error); // 호출자에게 에러 전파
};

type AttemptResult<T> = { ok: true; value: T } | { ok: false; error: any };

// 비동기 함수 처리를 위한 attempt 함수
export async function attempt<T>(
    operation: () => Promise<T>,
    options = { maxAttempts: 3, delay: 1000, backoffFactor: 2 }
): Promise<AttemptResult<T>> {
    let attempts = 0;
    let currentDelay = options.delay;

    while (attempts < options.maxAttempts) {
        attempts++;

        try {
            const value = await operation();
            return { ok: true, value };
        } catch (error) {
            if (attempts === options.maxAttempts) {
                console.error(`작업 실패 (${attempts}회 시도):`, error);
                return { ok: false, error };
            }

            console.log(`시도 ${attempts}/${options.maxAttempts} 실패, ${currentDelay}ms 후 재시도...`);
            await new Promise(resolve => setTimeout(resolve, currentDelay));
            currentDelay *= options.backoffFactor;
        }
    }

    return { ok: false, error: new Error('알 수 없는 오류') };
}
export default client;
