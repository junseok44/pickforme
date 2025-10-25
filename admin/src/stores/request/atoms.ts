import { atom } from 'jotai';
import { GetPreviewParams, Request, GetRequestsParams, GetRequestParams, PostAnswerParams } from './types';
import { GetRequestsAPI, GetRequestStatsAPI, GetUserStatsAPI, GetRequestAPI, PostAnswerAPI, DeleteRequestAPI } from './apis';

export const requestsAtom = atom<Request[]>([]);
export const currentPageAtom = atom(1);
export const totalPagesAtom = atom(1);

export const getRequestsAtom = atom(null, async (get, set, params: GetRequestsParams) => {
  const { data: { totalRequests, requests, totalPages, currentPage} } = await GetRequestsAPI(params); // 추후 last chat_id 추가하여 성능 개선
  set(requestsAtom, requests);
  set(totalPagesAtom, totalPages);
  set(currentPageAtom, currentPage);
});

export const getRequestAtom = atom(null, async (get, set, params: GetRequestParams) => {
  const { data } = await GetRequestAPI(params); // 추후 last chat_id 추가하여 성능 개선
  set(requestsAtom, get(requestsAtom).map((request) => request._id === data._id ? data : request));
  const requests = await get(requestsAtom);
  if (requests.length === 0) {
    set(requestsAtom, [data]);
  }
});

export const postAnswerAtom = atom(null, async (get, set, params: PostAnswerParams) => {
  const { data } = await PostAnswerAPI(params);  
  const requests = get(requestsAtom)           
  set(requestsAtom, requests.map((request) => request._id === params.requestId ? data : request));
});  

export const deleteRequestAtom = atom(null, async (get, set, requestId: string) => {
  await DeleteRequestAPI(requestId);
  set(requestsAtom, get(requestsAtom).filter((request) => request._id !== requestId));
});

export const userStatsAtom = atom<any[]>([]);
export const requestStatsAtom = atom<any[]>([]);

export const getUserStatsAtom = atom(null, async (get, set) => {
  const { data } = await GetUserStatsAPI();
  set(userStatsAtom, data);
});

export const getRequestStatsAtom = atom(null, async (get, set) => {
  const { data } = await GetRequestStatsAPI();
  set(requestStatsAtom, data);
});        

