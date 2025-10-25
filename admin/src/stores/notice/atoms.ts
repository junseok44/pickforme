import { atom } from 'jotai';
import { Notice, GetNoticeParams, PostNoticeAtomParams, PutNoticeParams, DeleteNoticeParams  } from './types';
import { GetNoticesAPI, PostNoticeAPI, GetNoticeAPI, PutNoticeAPI, DeleteNoticeAPI } from './apis';
import { userDataAtom } from '../auth/atoms';

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

export const deleteNoticeAtom = atom(null, async (get, set, params: GetNoticeParams) => {
  await DeleteNoticeAPI(params); 
  alert('공지사항이 삭제되었습니다.');
  set(noticesAtom, get(noticesAtom).filter((notice) => notice._id !== params._id));
});
export const postNoticeAtom = atom(null, async (get, set, { cb, ...params }: PostNoticeAtomParams) => {
  const { data } = await PostNoticeAPI(params);  
  const notices = get(noticesAtom)           
  set(noticesAtom, [data].concat(notices));
  alert('공지사항이 게시되었습니다.');
  cb(data._id);
});

export const putNoticeAtom = atom(null, async (get, set, params: PutNoticeParams) => {
  const { data } = await PutNoticeAPI(params);
  const notices = get(noticesAtom)
  const already = notices.find((notice) => notice._id === data._id);
  set(noticesAtom, !already ? [data].concat(notices) : notices.map((notice) => notice === already ? data : notice));
  alert('공지사항이 수정되었습니다.');
});

