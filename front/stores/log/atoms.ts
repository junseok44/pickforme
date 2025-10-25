import { atom } from 'jotai';
// import { PostLogAPI } from './apis';
// import { PostLogParams } from './types';
import { userAtom } from '../user';

export const productGroupAtom = atom<String | null>(null);

export const setProductGroupAtom = atom(null, async (get, set, group: String) => {
    set(productGroupAtom, group);
});

export const sendLogAtom = atom(null, async (get, set, { product, action, metaData }) => {
    const group = get(productGroupAtom);
    const userData = await get(userAtom);
    // 에러가 계속 나와서, 수정될때까지 제외
    // PostLogAPI({ userId: userData?._id, product: { ...product, group }, action, metaData } as PostLogParams);
});
