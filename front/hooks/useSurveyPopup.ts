import { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import { PopupService } from '@/services/popup';

interface UseSurveyPopupProps {
    onSurveyClose?: () => void;
}

export const useSurveyPopup = ({ onSurveyClose }: UseSurveyPopupProps = {}) => {
    const [isSurveyVisible, setSurveyVisible] = useState(false);

    useEffect(() => {
        const checkSurveyPopup = async () => {
            try {
                const hasSurvey = await PopupService.checkSurveyPopup();
                console.log('hasSurvey', hasSurvey);
                if (hasSurvey) {
                    setSurveyVisible(true);
                }
            } catch (error) {
                console.error('설문조사 팝업 체크 에러:', error);
            }
        };

        checkSurveyPopup();
    }, []);

    const handleSurveyClose = () => {
        setSurveyVisible(false);
        onSurveyClose?.();
    };

    const handleDontShowToday = async () => {
        try {
            await PopupService.setDontShowSurvey();
            handleSurveyClose();
        } catch (error) {
            console.error('설문조사 팝업 설정 실패:', error);
        }
    };

    const handleSurveyClick = () => {
        Linking.openURL('https://forms.gle/mpVjgn7bCZ4iMvJD9');
        handleSurveyClose();
    };

    const handleHelpClick = () => {
        Linking.openURL('https://pf.kakao.com/_csbDxj');
        handleSurveyClose();
    };

    return {
        isSurveyVisible,
        handleSurveyClose,
        handleDontShowToday,
        handleSurveyClick,
        handleHelpClick
    };
};
