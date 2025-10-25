import { Product } from '@/stores/product/types';
import client from './axios'; // Axios 인스턴스

type ProcessType = 'webview-detail' | 'webview-review' | 'server';

type CrawlFieldKeys = keyof Pick<Product, 'name' | 'thumbnail' | 'detail_images' | 'reviews'>;

interface LogCrawlProcessResultParams {
    requestId: string;
    productUrl: string;
    processType: ProcessType;
    success: boolean;
    durationMs: number;
    fields: Partial<Record<CrawlFieldKeys, boolean>>;
    attemptLabel?: string;
}

export const logCrawlProcessResult = async ({
    requestId,
    productUrl,
    processType,
    success,
    durationMs,
    fields,
    attemptLabel
}: LogCrawlProcessResultParams) => {
    try {
        const payload = {
            requestId,
            productUrl,
            processType,
            success,
            durationMs,
            fields,
            attemptLabel,
            timestamp: new Date().toISOString()
        };

        await client.post('/crawl-logs', payload);
    } catch (err) {
        console.warn('크롤링 프로세스 로그 전송 실패:', err);
    }
};
