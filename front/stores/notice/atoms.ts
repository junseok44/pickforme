import { atom } from 'jotai';
import { Notice, GetNoticeParams, } from './types';
import { GetNoticesAPI, GetNoticeAPI } from './apis';

// 2.0 공지사항 기능을 위한 모듈이고, 3.0에선 사용되지 않음

export const noticesAtom = atom<Notice[]>([]);

export const getNoticesAtom = atom(null, async (get, set) => {
  const { data } = await GetNoticesAPI({}); // 추후 last chat_id 추가하여 성능 개선
  set(noticesAtom, data);
});
export const getNoticeAtom = atom(null, async (get, set, params: GetNoticeParams) => {
  const { data } = await GetNoticeAPI(params); // 추후 last chat_id 추가하여 성능 개선
  const notices = get(noticesAtom);
  const already = notices.find(notice => notice._id === data._id);
  set(noticesAtom, already ? notices.map((notice) => notice === already ? data : notice) : [data].concat(notices));
});

