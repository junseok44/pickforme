import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import client, { clearDefaultInterceptor } from '@/utils/axios';
import { useAtom } from 'jotai';
import { userDataAtom } from '../stores/auth/atoms';

const useInterceptor = () => {
  const router = useRouter();
  const [userData, setUserData] = useAtom(userDataAtom);
  const token = useMemo(() => userData?.token, [userData]);
  useEffect(() => {
    if (token) {
      const clientInterceptor = client.interceptors.request.use(
        (request) => {
          clearDefaultInterceptor();
          request.headers.authorization = `Bearer ${token}`;
          return request;
        }
      );
      return () => {
        client.interceptors.request.eject(clientInterceptor);
      };
    }
  }, [token]);
  useEffect(() => {
    const clientInterceptor = client.interceptors.response.use(
      async (response) => response,
      async (error) => {
        // if (error.response && error.response.status === 401 && !error.config.isRetryRequest) {
        if (error.response && error.response.status === 401) {
          console.log(error.response.message);
          /*
          const promise = new ControlledPromise<void>();
          addRetryPromise({ promise, preventReLogin });
          getAccessToken();
          return retry(promise, client, error.config);
          */
          // setUserData(undefined);
          // router.push('/login');
        }
        return Promise.reject(error);
      },
    );
    return () => {
      client.interceptors.response.eject(clientInterceptor);
    };
  }, [router]);

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
