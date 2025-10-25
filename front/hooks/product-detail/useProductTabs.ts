import { useState, useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { TABS } from '../../utils/common';
import { getProductCaptionAtom, getProductReportAtom, getProductReviewAtom } from '../../stores/product/atoms';
import { logEvent } from '@/services/firebase';

export const useProductTabs = (initialTab: TABS = TABS.CAPTION) => {
    const [tab, setTab] = useState<TABS>(initialTab);
    const [isTabPressed, setIsTabPressed] = useState(false);

    const getProductCaption = useSetAtom(getProductCaptionAtom);
    const getProductReport = useSetAtom(getProductReportAtom);
    const getProductReview = useSetAtom(getProductReviewAtom);

    const handlePressTab = useCallback((nextTab: TABS) => {
        // 어떤 탭이든 클릭하면 true로 설정
        logEvent('tab_click', {
            screen: 'ProductDetailScreen',
            tab: nextTab,
            category: 'product_detail'
        });

        setIsTabPressed(true);
        setTab(nextTab);
    }, []);

    const handleRegenerate = useCallback(() => {
        if (tab === TABS.REPORT) getProductReport();
        if (tab === TABS.REVIEW) getProductReview();
        if (tab === TABS.CAPTION) getProductCaption();
    }, [tab, getProductReport, getProductReview, getProductCaption]);

    return {
        tab,
        isTabPressed,
        handlePressTab,
        handleRegenerate
    };
};
