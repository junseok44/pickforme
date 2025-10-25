import { useState, useEffect } from 'react';
import { PopupService } from '@/services/popup';

export const useCheckIsFirstLogin = () => {
    const [isFirstLogin, setIsFirstLogin] = useState(false);

    useEffect(() => {
        const checkFirstLogin = async () => {
            try {
                const isFirst = await PopupService.checkIsFirstLogin();
                if (isFirst) {
                    setIsFirstLogin(true);
                    await PopupService.setFirstLoginComplete();
                } else {
                    setIsFirstLogin(false);
                }
            } catch (error) {
                console.error('최초 로그인 체크 에러:', error);
            }
        };

        checkFirstLogin();
    }, []);

    return {
        isFirstLogin
    };
};
