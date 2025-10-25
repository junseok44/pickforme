import { atom } from 'jotai';
import { Notification, GetNotificationParams, PostNotificationAtomParams, PutNotificationParams, DeleteNotificationParams  } from './types';
import { GetNotificationsAPI, PostNotificationAPI, GetNotificationAPI, PutNotificationAPI, DeleteNotificationAPI } from './apis';
import { userDataAtom } from '../auth/atoms';

export const notificationsAtom = atom<Notification[]>([]);

export const getNotificationsAtom = atom(null, async (get, set) => {
  const { data } = await GetNotificationsAPI({}); // 추후 last chat_id 추가하여 성능 개선
  set(notificationsAtom, data);
});
export const getNotificationAtom = atom(null, async (get, set, params: GetNotificationParams) => {
  const { data } = await GetNotificationAPI(params); // 추후 last chat_id 추가하여 성능 개선
  const notifications = get(notificationsAtom);
  const already = notifications.find(notification => notification._id === data._id);
  set(notificationsAtom, already ? notifications.map((notification) => notification === already ? data : notification) : [data].concat(notifications));
});

export const deleteNotificationAtom = atom(null, async (get, set, params: GetNotificationParams) => {
  await DeleteNotificationAPI(params); 
  alert('푸쉬알림이 삭제되었습니다.');
  set(notificationsAtom, get(notificationsAtom).filter((notification) => notification._id !== params._id));
});
export const postNotificationAtom = atom(null, async (get, set, { cb, ...params }: PostNotificationAtomParams) => {
  const { data } = await PostNotificationAPI(params);  
  const notifications = get(notificationsAtom)           
  set(notificationsAtom, [data].concat(notifications));
  alert('푸쉬알림이 발송되었습니다.');
  cb(data._id);
});

export const putNotificationAtom = atom(null, async (get, set, params: PutNotificationParams) => {
  const { data } = await PutNotificationAPI(params);
  const notifications = get(notificationsAtom)
  const already = notifications.find((notification) => notification._id === data._id);
  set(notificationsAtom, !already ? [data].concat(notifications) : notifications.map((notification) => notification === already ? data : notification));
  alert('푸쉬알림이 수정되었습니다.');
});

