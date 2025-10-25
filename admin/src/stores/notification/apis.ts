import client from '../../utils/axios';

import {
  Notification,
  GetNotificationParams,
  GetNotificationsParams,
  PostNotificationParams,
  DeleteNotificationParams,
  PutNotificationParams,
} from './types';

export const GetNotificationAPI = (params: GetNotificationParams) => client.get<Notification>(`/admin/notification/detail/${params._id}`);
export const DeleteNotificationAPI = (params: DeleteNotificationParams) => client.delete<Notification>(`/admin/notification/detail/${params._id}`);
export const PutNotificationAPI = (params: PutNotificationParams) => client.put<Notification>(`/admin/notification`, params);

export const GetNotificationsAPI = (params: GetNotificationsParams) => client.get<Notification[]>('/admin/notification');
export const PostNotificationAPI = (params: PostNotificationParams) => client.post<Notification>('/admin/notification',params);
