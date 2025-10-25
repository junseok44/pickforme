import client, { handleApiError } from '../../utils/axios';

import { Request, RequestParams as PostRequestParams, GetRequestsParams } from './types';

export const PostRequestAPI = (params: PostRequestParams) =>
    client.post<Request>('/request', params).catch(error => handleApiError(error, 'PostRequest'));
export const GetRequestsAPI = (params: GetRequestsParams) =>
    client.get<Request[]>('/request').catch(error => handleApiError(error, 'GetRequests'));
export const GetRequestAPI = (requestId: string) =>
    client.get<Request>(`/request/detail/${requestId}`).catch(error => handleApiError(error, 'GetRequest'));
