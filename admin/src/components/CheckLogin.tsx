import { useMemo, useEffect, PropsWithChildren } from 'react';
import { useAtomValue } from 'jotai';
import { useRouter } from 'next/router';
import { userDataAtom } from '@/stores/auth/atoms';
import useInterceptor from '@/hooks/useInterceptor';


interface Props extends PropsWithChildren {
}
const useCheckLogin: React.FC<Props> = (props) => {
  useInterceptor();
  const router = useRouter();
  const userData = useAtomValue(userDataAtom);
  const isLogin = useMemo(() => !!userData, [userData]);
  const isLoginPage = useMemo(() => router.pathname === '/login', [router]);
  useEffect(() => {
    if (!isLogin && !isLoginPage) {
      router.push('/login')
    }
  }, [router, isLogin, isLoginPage]);

  if (!isLogin && !isLoginPage) {
    return null;
  }
  return props.children;
}

export default useCheckLogin;
