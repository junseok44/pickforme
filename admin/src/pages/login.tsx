import React from "react";
import { useGoogleLogin } from '@react-oauth/google';

import { useAtomValue, useSetAtom } from 'jotai';

import {
  userDataAtom,
  loginGoogleAtom,
} from '@/stores/auth/atoms';

import { useRouter} from 'next/router';
const LoginScreen: React.FC = () => {
  const router = useRouter();
  const userData = useAtomValue(userDataAtom);
  const isLogin = React.useMemo(() => !!userData, [userData]);
  const loginGoogle = useSetAtom(loginGoogleAtom);

  const handleGoogleLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/userinfo.profile',
    onSuccess: async ({ access_token: accessToken }) => {
      loginGoogle({ accessToken });
    },
  });

  React.useEffect(() => {
    if (isLogin) {
      router.push('/'); 
    }
  }, [router, isLogin]);

  return (
    <button onClick={() => handleGoogleLogin()}>
      google login
    </button>
  );
}

export default LoginScreen;
