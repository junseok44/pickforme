import { useEffect } from 'react';
import { useSetAtom } from 'jotai';

import { client } from '../utils';
import { isShowLoginModalAtom } from '../stores/auth/atoms';
import { userAtom } from '@stores';

const useInterceptor = () => {
    const setUserData = useSetAtom(userAtom);
    const setIsShowLoginModal = useSetAtom(isShowLoginModalAtom);
    useEffect(() => {
        const clientInterceptor = client.interceptors.response.use(
            async (response: any) => response,
            async (error: any) => {
                console.log('Request baseURL:', error.config.baseURL, error.config.url, error.config.method);
                if (error.response) {
                    if (error.response.status === 401) {
                        console.log(error.response.message);
                        /*
            const promise = new ControlledPromise<void>();
            addRetryPromise({ promise, preventReLogin });
            getAccessToken();
            return retry(promise, client, error.config);
            */
                        setUserData(undefined);
                        setIsShowLoginModal(true);
                    } else {
                        // 다른 에러 처리
                        console.log(error.response.data);
                    }
                } else {
                    console.error('Error Details:', {
                        message: error.message,
                        name: error.name,
                        stack: error.stack,
                        config: error.config,
                        code: error.code
                    });
                    console.error('응답이 없습니다. 네트워크 오류일 수 있습니다.');
                }
                return Promise.reject(error);
            }
        );
        return () => {
            client.interceptors.response.eject(clientInterceptor);
        };
    }, []);

    /*
   * refresh 구현이후 사용
useEffect(() => {
if (Token?.refreshToken) {
  if (checkExpire(jwtDecode<Token>(Token.refreshToken).exp)) {
    removeToken();
  } else if (checkExpire(jwtDecode<Token>(Token.accessToken).exp)) {
    getAccessToken();
  }
  setPreventReLogin(false);
}
}, [Token, getAccessToken, removeToken]);
  */

    return null;
};

export default useInterceptor;
