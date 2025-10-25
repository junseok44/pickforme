import { atom } from 'jotai';

export const searchTextAtom = atom('');
export const searchQueryAtom = atom('');
export const currentCategoryAtom = atom('');
// 스크롤 초기화를 위한 atom (값이 변경되면 스크롤 초기화 트리거)
export const scrollResetTriggerAtom = atom(0);
