export interface Log {
    userId?: string;
    product: {
        id?: number;
        url?: string;
        group: 'bestcategories' | 'goldbox' | 'local' | 'search' | 'link' | 'liked' | 'request';
    };
    action: 'caption' | 'report' | 'review' | 'like' | 'link' | 'request' | 'question';
    metaData?: object;
    createdAt: string;
    updatedAt: string;
}

export interface GetLogsParams {
    start?: string;
    end?: string;
}