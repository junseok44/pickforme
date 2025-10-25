import { atom } from 'jotai';
import { GetUsersParams, User } from './types';
import { GetUsersAPI } from './apis';


export const usersAtom = atom<User[]>([]);

export const getUsersAtom = atom(null, async (get, set, params: GetUsersParams) => {
  const { data } = await GetUsersAPI(params); // 추후 last chat_id 추가하여 성능 개선
  set(usersAtom, data);
});
