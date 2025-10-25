import { useAtomValue, useSetAtom } from 'jotai';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { userAtom, isShowLackPointModalAtom, isShowLoginModalAtom } from '@stores';
// import { subscriptionAtom, getSubscriptionAtom } from '../stores/purchase/atoms';

const useCheckPoint = (callback: (e?: any) => any) => {
    const setIsShowLackPointModal = useSetAtom(isShowLackPointModalAtom);
    const setIsShowLoginModal = useSetAtom(isShowLoginModalAtom);

    const userData = useAtomValue(userAtom);
    // const subscription = useAtomValue(subscriptionAtom);
    // const getSubscription = useSetAtom(getSubscriptionAtom);

    const router = useRouter();

    return (params: any) => {
        if (!userData) {
            setIsShowLoginModal(true);
            return;
        }
        if (userData.point > 0) {
            callback(params);
            return;
        }
        // setIsShowLackPointModal(true);

        Alert.alert('매니저 질문 갯수를 모두 소모하였어요.'); // tobe
        // asis
        // Alert.alert('이용권이 부족해요.', '이용권을 충전하시겠어요?', [
        //   {
        //     text: '취소',
        //     onPress: () => {},
        //     style: 'cancel',
        //   },
        //   {
        //     text: '확인',
        //     onPress: () => {
        //       router.push('/purchase');
        //     },
        //   },
        // ]);
        // getSubscription();
        // if (subscription) {
        //   callback(params);
        // } else {
        //   setIsShowLackPointModal(true);
        // }
    };
};

export default useCheckPoint;
