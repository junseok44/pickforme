import { resolveRedirectUrl } from '@/utils/url';

export type Ids = { productId?: string; itemId?: string; vendorItemId?: string };

export type ExtractResult =
    | { kind: 'coupang'; ids: Ids; canonicalDesktop: string; mobileVM: string; mobileMLP: string }
    | { kind: 'general'; url: string };

// --- URL 구성 함수들 ---
export const buildDesktop = (productId?: string, itemId?: string, vendorItemId?: string) => {
    if (!productId) return '';
    const sp = new URLSearchParams();
    if (itemId) sp.set('itemId', itemId);
    if (vendorItemId) sp.set('vendorItemId', vendorItemId);
    const qs = sp.toString();
    return `https://www.coupang.com/vp/products/${productId}${qs ? `?${qs}` : ''}`;
};

export const buildMobileVM = (productId: string) => `https://m.coupang.com/vm/products/${productId}/`;

export const buildMobileMLP = (productId?: string, itemId?: string, vendorItemId?: string) => {
    if (!productId) return '';
    const sp = new URLSearchParams({
        flowId: '2',
        productId,
        pageType: 'MLSDP',
        pageValue: productId,
        redirect: 'landing'
    });
    if (itemId) sp.set('itemId', itemId);
    if (vendorItemId) sp.set('vendorItemId', vendorItemId);
    return `https://m.coupang.com/vm/mlp/mweb/mlp-landing?${sp.toString()}`;
};

/** Coupang 여부/ID 추출 및 표준 링크 만들기 */
export const extractFromUrl = async (rawInput: string): Promise<ExtractResult> => {
    let raw = rawInput?.trim() || '';
    if (!raw) return { kind: 'general', url: raw };

    // link.coupang.com → 최종 리디렉트 따라가기
    if (raw.includes('link.coupang.com')) {
        try {
            // 먼저 URL에서 직접 ID들을 추출해보기
            const url = new URL(raw);
            const productId = url.searchParams.get('pageKey') || url.searchParams.get('productId');
            const itemId = url.searchParams.get('itemId');
            const vendorItemId = url.searchParams.get('vendorItemId');

            // ID가 있으면 바로 처리
            if (productId) {
                const canonicalDesktop = buildDesktop(productId, itemId || undefined, vendorItemId || undefined);
                const mobileVM = buildMobileVM(productId);
                const mobileMLP = buildMobileMLP(productId, itemId || undefined, vendorItemId || undefined);
                return {
                    kind: 'coupang',
                    ids: { productId, itemId: itemId || undefined, vendorItemId: vendorItemId || undefined },
                    canonicalDesktop,
                    mobileVM,
                    mobileMLP
                };
            }

            // ID가 없으면 리디렉트 시도
            const redirectUrl = await resolveRedirectUrl(raw);

            // 리디렉트 결과가 여전히 link.coupang.com인 경우 무한루프 방지
            if (redirectUrl.includes('link.coupang.com')) {
                console.warn('extractFromUrl: link.coupang.com 리디렉트 결과가 동일, 일반 URL로 처리');
                return { kind: 'general', url: raw };
            }

            return extractFromUrl(redirectUrl);
        } catch {
            return { kind: 'general', url: raw };
        }
    }

    if (raw.startsWith('//')) raw = 'https:' + raw;
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;

    let u: URL;
    try {
        u = new URL(raw);
    } catch {
        return { kind: 'general', url: raw };
    }

    if (!u.hostname.includes('coupang')) {
        return { kind: 'general', url: raw };
    }

    const q = u.searchParams;
    const productId =
        q.get('productId') ||
        (u.pathname.match(/\/products\/(\d+)/)?.[1] ?? null) ||
        (u.pathname.includes('/su/') && u.pathname.match(/\/items\/(\d+)/)?.[1]) ||
        null;

    if (!productId) {
        return { kind: 'general', url: raw };
    }

    const itemId = q.get('itemId') || undefined;
    const vendorItemId = q.get('vendorItemId') || undefined;

    // 표준 데스크톱/모바일 URL들
    const canonicalDesktop = buildDesktop(productId, itemId, vendorItemId);
    const mobileVM = buildMobileVM(productId);
    const mobileMLP = buildMobileMLP(productId, itemId, vendorItemId);

    return {
        kind: 'coupang',
        ids: { productId: productId || undefined, itemId, vendorItemId },
        canonicalDesktop,
        mobileVM,
        mobileMLP
    };
};
