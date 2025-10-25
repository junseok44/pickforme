import { useAtomValue, useSetAtom } from 'jotai';

import { isShowLoginModalAtom } from '@stores';
import { userAtom } from '../stores/user';

const useCheckLogin = (callback: (e: any) => any) => {
    const user = useAtomValue(userAtom);
    const setIsShowLoginModal = useSetAtom(isShowLoginModalAtom);
    if (user?.token) {
        return callback;
    }
    return () => {
        setIsShowLoginModal(true);
    };
};

export default useCheckLogin;
