
export interface Notice {
  _id: string,
  createdAt: string,
  text: string,
  title: string,
}

export interface GetNoticeParams extends Pick<Notice, '_id'> {};

export interface GetNoticesParams {};
