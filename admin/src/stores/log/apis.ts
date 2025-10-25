import client from '../../utils/axios';

import {
  Log,
  GetLogsParams,
} from './types';

export const GetLogsAPI = (params: GetLogsParams) => {
  let url = '/admin/log';

  // 쿼리 파라미터를 배열에 조건부로 추가
  const queryParams = [];
  if (params.start) {
    queryParams.push(`start=${params.start}`);
  }
  if (params.end) {
    queryParams.push(`end=${params.end}`);
  }

  // 쿼리 파라미터가 있으면 URL에 추가
  if (queryParams.length) {
    url += '?' + queryParams.join('&');
  }

  return client.get<Log[]>(url);
};