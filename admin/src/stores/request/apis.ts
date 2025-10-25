import client from '../../utils/axios';

import {
  Request,
  GetRequestParams,
  GetRequestsParams,
  GetRequestsResponse,
  PostAnswerParams,
} from './types';

export const GetRequestsAPI = (params: GetRequestsParams) => {
  const url = new URL('/admin/request', 'http://example.com'); // 기본 베이스 URL을 사용하여 URL 객체 생성
  const searchParams = new URLSearchParams();

  // 쿼리 파라미터를 조건부로 추가
  if (params.start) searchParams.append('start', params.start);
  if (params.end) searchParams.append('end', params.end);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
  if (params.type) searchParams.append('type', params.type);

  // 쿼리 파라미터를 URL에 추가
  url.search = searchParams.toString();

  return client.get<GetRequestsResponse>(url.toString().replace('http://example.com', '')); // 베이스 URL 제거
};
export const GetRequestAPI = (params: GetRequestParams) => client.get<Request>(`/admin/request/detail/${params.requestId}`);
export const GetUserStatsAPI = () => client.get('/admin/request/user-stats');
export const GetRequestStatsAPI = () => client.get('/admin/request/request-stats');
export const DeleteRequestAPI = (requestId: string) => client.delete(`/admin/request/${requestId}`);
export const PostAnswerAPI = (params: PostAnswerParams) => client.post<Request>(`/admin/request/answer`, params);
