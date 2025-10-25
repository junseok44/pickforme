import { atom } from 'jotai';
import { Log, GetLogsParams } from './types';
import { GetLogsAPI } from './apis';

export const logsAtom = atom<Log[]>([]);

export const getLogsAtom = atom(null, async (get, set, params: GetLogsParams) => {
  const { data } = await GetLogsAPI(params);
  set(logsAtom, data);
});