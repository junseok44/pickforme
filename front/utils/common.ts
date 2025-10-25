export const hexToRgb = (hex: string) =>
    /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/i
        .exec(hex)
        ?.slice(1, 4)
        .map(a => parseInt(a, 16))
        .join(',');

export const numComma = (num: number) => {
    if (num === undefined || num === null) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const formatDate = (date: string | Date) => {
    const today = new Date(date);
    return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
};

export function formatMonthDay(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
}

export const formatDateAfterOneMonth = (date: string | Date) => {
    const today = new Date(date);
    today.setMonth(today.getMonth() + 1);
    return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
};

export const formatTime = (date: string | Date) => {
    const today = new Date(date);
    return (today.getHours() % 12) + '시 ' + today.getMinutes() + '분';
};

export const checkIsExpired = (date: string | null) => {
    if (!date) return false;
    const today = new Date();
    const targetDate = new Date(date);
    return targetDate.getTime() < today.getTime();
};

// 2024
export enum TABS {
    CAPTION = 'caption',
    REPORT = 'report',
    REVIEW = 'review',
    QUESTION = 'question'
}

export const tabName: Record<TABS, string> = {
    [TABS.CAPTION]: '이미지 설명',
    [TABS.REPORT]: '상세페이지 설명',
    [TABS.REVIEW]: '리뷰 요약',
    [TABS.QUESTION]: '질문하기'
};

export const loadingMessages: Record<TABS | 'manager', string> = {
    [TABS.CAPTION]: '상품의 이미지 설명을 생성중이에요.',
    [TABS.REPORT]: '상품의 자세한 설명을 생성중이에요.',
    [TABS.REVIEW]: '상품의 리뷰를 AI가 요약중이에요.',
    [TABS.QUESTION]: 'AI 포미가 질문에 대한 답변을 생성중이에요.',
    manager: '매니저가 질문에 대한 답변을 준비중이에요. 1시간 내로 답변이 도착할 거에요.'
};

export const deepEqual = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true; // 참조가 같으면 true
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }
    return true;
};
