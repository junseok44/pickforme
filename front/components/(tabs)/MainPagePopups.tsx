import HansiryunPopup from '@/components/HansiryunPopup';
import { PopupService } from '@/services/popup';
import React from 'react';

import { useCheckIsFirstLogin } from '@/hooks/useCheckIsFirstLogin';
import { usePopupSystem } from '@/hooks/usePopupSystem';
import { How } from '@components';

import Modal from 'react-native-modal';

import { useEffect } from 'react';
import { Linking } from 'react-native';
import Survey from './popups/Survey';
import UpdateNotice from './popups/UpdateNotice';
import TestGroupRecruitment from './popups/TestGroupRecruitment';

const MainPagePopups = () => {
    const [isHowModalVisible, setIsHowModalVisible] = React.useState(false);
    const [isSurveyVisible, setIsSurveyVisible] = React.useState(false);
    const { isFirstLogin } = useCheckIsFirstLogin();
    const { registerPopup, showNextPopup, handlePopupClose, isRegistered } = usePopupSystem();
    const [isHansiryunVisible, setIsHansiryunVisible] = React.useState(false);
    const [isUpdateNoticeVisible, setIsUpdateNoticeVisible] = React.useState(false);
    const [isTestGroupRecruitmentVisible, setIsTestGroupRecruitmentVisible] = React.useState(false);

    // 팝업 등록
    useEffect(() => {
        registerPopup({
            id: 'how',
            shouldShow: async () => {
                return isFirstLogin;
            },
            onShow: () => {
                setTimeout(() => {
                    setIsHowModalVisible(true);
                }, 300);
            },
            onClose: () => {
                setIsHowModalVisible(false);
            },
            priority: 2
        });
        registerPopup({
            id: 'survey',
            shouldShow: async () => {
                try {
                    const result = await PopupService.checkSurveyPopup();
                    return result;
                } catch (error) {
                    console.error('설문조사 팝업 체크 에러:', error);
                    return false;
                }
            },
            onShow: () => {
                setTimeout(() => {
                    setIsSurveyVisible(true);
                }, 300);
            },
            onClose: () => {
                setIsSurveyVisible(false);
            },
            priority: 1
        });
        registerPopup({
            id: 'hansiryun',
            shouldShow: async () => {
                return PopupService.checkHansiryunPopup()
                    .then(hasPopup => {
                        return hasPopup;
                    })
                    .catch(error => {
                        console.error('한시련 팝업 체크 에러:', error);
                        return false;
                    });
            },
            onShow: () => {
                setTimeout(() => {
                    setIsHansiryunVisible(true);
                }, 300);
            },
            onClose: () => {
                setIsHansiryunVisible(false);
            },
            priority: 0
        });
        registerPopup({
            id: 'update-notice',
            shouldShow: async () => {
                try {
                    const result = await PopupService.checkUpdateNoticePopup();
                    return result;
                } catch (error) {
                    console.error('업데이트 안내 팝업 체크 에러:', error);
                    return false;
                }
            },
            onShow: () => {
                setTimeout(() => {
                    setIsUpdateNoticeVisible(true);
                }, 300);
            },
            onClose: () => {
                setIsUpdateNoticeVisible(false);
            },
            priority: 4
        });
        registerPopup({
            id: 'test-group-recruitment',
            shouldShow: async () => {
                try {
                    const result = await PopupService.checkTestGroupRecruitmentPopup();
                    return result;
                } catch (error) {
                    console.error('체험단 모집 팝업 체크 에러:', error);
                    return false;
                }
            },
            onShow: () => {
                setTimeout(() => {
                    setIsTestGroupRecruitmentVisible(true);
                }, 300);
            },
            onClose: () => {
                setIsTestGroupRecruitmentVisible(false);
            },
            priority: 3
        });
    }, [isFirstLogin, registerPopup]);

    // 팝업 등록이 완료되면 showNextPopup 호출
    useEffect(() => {
        if (isRegistered) {
            showNextPopup();
        }
    }, [isRegistered]);

    return (
        <>
            <Modal
                isVisible={isHowModalVisible}
                onBackButtonPress={handlePopupClose}
                onBackdropPress={handlePopupClose}
                animationIn="slideInUp"
                animationInTiming={300}
                style={{
                    justifyContent: 'flex-end',
                    margin: 0
                }}
            >
                <How visible={isHowModalVisible} onClose={handlePopupClose} />
            </Modal>

            <UpdateNotice
                visible={isUpdateNoticeVisible}
                onClose={handlePopupClose}
                onShoppingClick={() => {
                    handlePopupClose();
                    // 홈 탭으로 이동하는 로직 (추후 구현 가능)
                }}
            />

            <TestGroupRecruitment
                visible={isTestGroupRecruitmentVisible}
                onClose={handlePopupClose}
                onGoogleFormClick={() => {
                    Linking.openURL(
                        'https://docs.google.com/forms/d/e/1FAIpQLSdCg5mjvaoDVAae31wrztXvU7zG_vNMSHh4PjAeBLr9J9WXEQ/viewform?usp=header'
                    );
                }}
                onInquiryClick={() => {
                    Linking.openURL('http://pf.kakao.com/_csbDxj');
                }}
            />
        </>
    );
};

export default MainPagePopups;
