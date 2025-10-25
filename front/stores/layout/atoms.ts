import { atom } from 'jotai';
import { BottomSheetInfo } from './types';

export const bottomSheetsAtom = atom<BottomSheetInfo[]>([]);
export const pushBottomSheetAtom = atom(null, (get, set, params: BottomSheetInfo['nodes']) => {
  set(bottomSheetsAtom, get(bottomSheetsAtom).concat([{
    isVisible: true,
    nodes: params,
  }]));
});

export const closeBottomSheetAtom = atom(null, (get, set, params: number) => {
  set(bottomSheetsAtom, get(bottomSheetsAtom).map((info, i) => i === params ? ({ ...info, isVisible: false }) : info));
});

export const tabNavigationAtom = atom<string>('index');
