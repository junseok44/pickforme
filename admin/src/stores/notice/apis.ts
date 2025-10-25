import client from '../../utils/axios';

import {
  Notice,
  GetNoticeParams,
  GetNoticesParams,
  PostNoticeParams,
  DeleteNoticeParams,
  PutNoticeParams,
} from './types';

export const GetNoticeAPI = (params: GetNoticeParams) => client.get<Notice>(`/admin/notice/detail/${params._id}`);
export const DeleteNoticeAPI = (params: DeleteNoticeParams) => client.delete<Notice>(`/admin/notice/detail/${params._id}`);
export const PutNoticeAPI = (params: PutNoticeParams) => client.put<Notice>(`/admin/notice`, params);

export const GetNoticesAPI = (params: GetNoticesParams) => client.get<Notice[]>('/admin/notice');
export const PostNoticeAPI = (params: PostNoticeParams) => client.post<Notice>('/admin/notice',params);
