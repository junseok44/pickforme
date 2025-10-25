
export interface Notice {
  _id: string,
  createdAt: string,
  text: string,
  title: string,
}

export interface GetNoticeParams extends Pick<Notice, '_id'> {};

export interface PostNoticeParams extends Pick<Notice, 'text' | 'title'> {
}
export interface PostNoticeAtomParams extends PostNoticeParams {
  cb: (_id: string) => void;
};
export interface PutNoticeParams extends Pick<Notice, 'text' | 'title' | '_id'> {};

export interface GetNoticesParams {};
export interface DeleteNoticeParams extends Pick <Notice, '_id'> {};
