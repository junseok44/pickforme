import { useEffect, PropsWithChildren } from 'react';
import { useAtom } from 'jotai';
import {userDataAtom, isReadyAtom } from '@/stores/auth/atoms';

interface Props extends PropsWithChildren {
}
const useCheckReady: React.FC<Props> = (props) => {
  const [userData] = useAtom(userDataAtom);
  const [isReady, setIsReady] = useAtom(isReadyAtom);
  useEffect(() => {
    setIsReady(true);
  }, [setIsReady]);
  if (!isReady) {
    return null;
  }
  return props.children;
}

export default useCheckReady;
