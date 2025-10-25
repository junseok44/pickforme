import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import {
  UserData,
  LoginResponse,
  GoogleLoginParams,
} from './types';
import { GoogleLoginAPI } from './apis';

export const isReadyAtom = atomWithStorage<boolean>('isReady', false);
export const userDataAtom = atomWithStorage<UserData | void>('userData', undefined);

export const handleLoginResultAtom = atom(null, (get, set, data: LoginResponse) => {
  set(userDataAtom, data.user);
});

export const loginGoogleAtom = atom(null, async (get, set, params: GoogleLoginParams) => {
  const { data } = await GoogleLoginAPI(params);
  set(handleLoginResultAtom, data);
});
