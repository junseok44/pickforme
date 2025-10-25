// hooks/useTabData.ts
import { useSetAtom } from 'jotai';
import { getProductCaptionAtom, getProductReportAtom, getProductReviewAtom } from '@/stores/product/atoms';
import { TABS } from '@/utils/common';
import { Product, ProductDetailState, ProductReview } from '@/stores/product/types';
import { useEffect } from 'react';
import { LoadingStatus } from '@/stores/product/atoms';

interface UseTabDataProps {
    tab: TABS;
    productDetail: ProductDetailState | undefined;
    productReview: string[];
    productUrl: string;
    loadingStatus: {
        caption: LoadingStatus;
        review: LoadingStatus;
        report: LoadingStatus;
        question: LoadingStatus;
    };
}

// 각 탭별로 필요한 데이터를 체크하는 함수
export const checkRequiredData = (tab: TABS, product: Product | undefined, productReview: string[]): boolean => {
    if (!product) return false;

    switch (tab) {
        case TABS.CAPTION:
            return !!(product.name && product.thumbnail);
        case TABS.REPORT:
            return !!(product.name && product.detail_images && product.detail_images.length > 0);
        case TABS.REVIEW:
            return !!(productReview.length > 0 && product.name);
        default:
            return false;
    }
};

export const useTabData = ({ tab, productDetail, productReview, productUrl, loadingStatus }: UseTabDataProps) => {
    const getProductCaption = useSetAtom(getProductCaptionAtom);
    const getProductReport = useSetAtom(getProductReportAtom);
    const getProductReview = useSetAtom(getProductReviewAtom);

    // 각 탭별로 데이터가 있는지 체크하는 함수
    const hasTabData = (tab: TABS, productDetail: ProductDetailState | undefined): boolean => {
        if (!productDetail) return false;

        switch (tab) {
            case TABS.CAPTION:
                return !!productDetail.caption;
            case TABS.REPORT:
                return !!productDetail.report;
            case TABS.REVIEW:
                return !!productDetail.review;
            case TABS.QUESTION:
                return true;
            default:
                return false;
        }
    };

    // 각 탭별 API 호출 함수
    const callTabAPI = (tab: TABS) => {
        // question tab은 자동으로 호출되므로 패스.
        if (tab === TABS.QUESTION) {
            // console.log('question 탭 호출');
            return;
        }

        // 1: 이미 데이터를 가져오고 있다 -> 그러면 중복호출임.
        // 2: 데이터를 가져오는데 실패했다 -> handleRegenerate를 통해서 유저가 수동으로 호출해야 함.
        // 3: 데이터를 가져오는데 성공했다. 그러면 또 가져올 필요가 없음.
        if (loadingStatus[tab] !== LoadingStatus.INIT) {
            // console.log(`${tab} 탭이 초기화 상태가 아닙니다. 현재상태 - ${LoadingStatus[loadingStatus[tab]]}`);
            return;
        }

        // 사실 위에서 3번 상태이면 데이터가 존재하는것이므로 여기 조건을 통과할 일은 거의 없지만 예외처리를 위해 남겨둠.
        if (hasTabData(tab, productDetail)) {
            // console.log(`${tab} 탭의 데이터가 이미 존재합니다.`);
            return;
        }

        if (!checkRequiredData(tab, productDetail?.product, productReview)) {
            // console.log(`${tab} 탭에 필요한 데이터가 없습니다.`);
            return;
        }

        switch (tab) {
            case TABS.CAPTION:
                getProductCaption();
                break;
            case TABS.REPORT:
                getProductReport();
                break;
            case TABS.REVIEW:
                getProductReview();
                break;
        }
    };

    // 모든 탭에 대해 조건을 만족하면 fetch하는 함수
    const fetchAllAvailableTabs = () => {
        if (!productDetail) return;

        // 모든 탭에 대해 조건을 체크하고 fetch
        Object.values(TABS).forEach(tabKey => {
            if (tabKey !== TABS.QUESTION) {
                // QUESTION 탭은 제외
                callTabAPI(tabKey);
            }
        });
    };

    // productDetail이 변경될 때마다 모든 탭의 API 호출 여부 체크
    useEffect(() => {
        fetchAllAvailableTabs();
    }, [productDetail, loadingStatus, productReview]);

    return {
        checkRequiredData,
        hasTabData
    };
};
