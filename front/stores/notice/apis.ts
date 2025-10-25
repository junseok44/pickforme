import client, { handleApiError } from '../../utils/axios';

import { Notice, GetNoticeParams, GetNoticesParams } from './types';

export const GetNoticeAPI = (params: GetNoticeParams) =>
    client.get<Notice>(`/notice/detail/${params._id}`).catch(error => handleApiError(error, 'GetNotice'));

export const GetNoticesAPI = (params: GetNoticesParams) =>
    client.get<Notice[]>('/notice').catch(error => handleApiError(error, 'GetNotices'));
