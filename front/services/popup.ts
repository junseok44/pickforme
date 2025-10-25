import { GetPopupAPI, SetPopupAPI } from '@/stores';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PopupService = {
    async checkPopup(popupId: string) {
        try {
            const res = await GetPopupAPI();
            const flag = res.data?.find(p => p.popup_id === popupId);
            return !!flag;
        } catch (error) {
            console.error('팝업 데이터 로딩 실패:', error);
            return false;
        }
    },

    async checkHansiryunPopup() {
        return this.checkPopup('event_hansiryun');
    },

    async checkSurveyPopup() {
        return this.checkPopup('event_survey');
    },

    async checkUpdateNoticePopup() {
        return this.checkPopup('event_update_notice');
    },

    async checkTestGroupRecruitmentPopup() {
        return this.checkPopup('event_test_group_recruitment');
    },

    async setDontShowUpdateNotice() {
        try {
            const payload = { popup_id: 'event_update_notice', flag: 1 };
            const res = await SetPopupAPI(payload);
            return res.status === 200;
        } catch (error) {
            console.error('업데이트 안내 팝업 설정 실패:', error);
            return false;
        }
    },

    async setDontShowTestGroupRecruitment() {
        try {
            const payload = { popup_id: 'event_test_group_recruitment', flag: 1 };
            const res = await SetPopupAPI(payload);
            return res.status === 200;
        } catch (error) {
            console.error('체험단 모집 팝업 설정 실패:', error);
            return false;
        }
    },

    async setDontShowSurvey() {
        try {
            const payload = { popup_id: 'event_survey', flag: 1 };
            const res = await SetPopupAPI(payload);
            return res.status === 200;
        } catch (error) {
            console.error('설문조사 팝업 설정 실패:', error);
            return false;
        }
    },

    // 최초 로그인 관련 메서드들
    async checkIsFirstLogin(): Promise<boolean> {
        try {
            const hasLoggedIn = await AsyncStorage.getItem('hasLoggedIn');
            return !hasLoggedIn;
        } catch (error) {
            console.error('최초 로그인 체크 에러:', error);
            return false;
        }
    },

    async setFirstLoginComplete(): Promise<void> {
        try {
            await AsyncStorage.setItem('hasLoggedIn', 'true');
        } catch (error) {
            console.error('최초 로그인 완료 설정 에러:', error);
        }
    },

    async resetFirstLogin(): Promise<void> {
        try {
            await AsyncStorage.removeItem('hasLoggedIn');
        } catch (error) {
            console.error('최초 로그인 리셋 에러:', error);
        }
    }
};
