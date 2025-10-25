import { useState, useCallback, useEffect } from 'react';

interface PopupConfig {
    id: string;
    shouldShow: () => Promise<boolean>;
    onShow: () => void;
    onClose: () => void;
    priority?: number;
}

export const usePopupSystem = () => {
    const [popups, setPopups] = useState<PopupConfig[]>([]);
    const [currentPopup, setCurrentPopup] = useState<PopupConfig | null>(null);
    const [shownPopups, setShownPopups] = useState<Set<string>>(new Set());
    const [isRegistered, setIsRegistered] = useState(false);

    const registerPopup = useCallback((config: PopupConfig) => {
        setPopups(prevPopups => {
            const existingIndex = prevPopups.findIndex(p => p.id === config.id);
            if (existingIndex !== -1) {
                const newPopups = [...prevPopups];
                newPopups[existingIndex] = config;
                return newPopups;
            }
            return [...prevPopups, config];
        });
    }, []);

    const showNextPopup = useCallback(async () => {
        // 현재 팝업 닫기
        if (currentPopup) {
            currentPopup.onClose();
            setCurrentPopup(null);
        }

        // 다음 팝업 체크
        const remainingPopups = popups.filter(p => !shownPopups.has(p.id));
        if (remainingPopups.length === 0) {
            return;
        }

        // 우선순위에 따라 정렬
        const sortedPopups = [...remainingPopups].sort((a, b) => (a.priority || 0) - (b.priority || 0));

        // 다음 팝업의 shouldShow 조건 확인
        for (const popup of sortedPopups) {
            const shouldShow = await popup.shouldShow();
            if (shouldShow) {
                setCurrentPopup(popup);
                setShownPopups(prev => new Set([...prev, popup.id]));
                popup.onShow();
                return; // 팝업을 찾았으면 즉시 종료
            }
        }
    }, [currentPopup, popups, shownPopups]);

    const handlePopupClose = useCallback(() => {
        showNextPopup();
    }, [showNextPopup]);

    // 팝업 등록이 완료되면 isRegistered를 true로 설정
    useEffect(() => {
        if (popups.length > 0 && !isRegistered) {
            setIsRegistered(true);
        }
    }, [popups, isRegistered]);

    return {
        registerPopup,
        showNextPopup,
        handlePopupClose,
        isRegistered
    };
};
