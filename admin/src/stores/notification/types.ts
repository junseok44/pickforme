
export interface Notification {
  _id: string,
  createdAt: string,
  title: string,
  body: string,
}

export interface GetNotificationParams extends Pick<Notification, '_id'> {};

export interface PostNotificationParams extends Pick<Notification, 'body' | 'title'> {
}
export interface PostNotificationAtomParams extends PostNotificationParams {
  cb: (_id: string) => void;
};
export interface PutNotificationParams extends Pick<Notification, 'body' | 'title' | '_id'> {};

export interface GetNotificationsParams {};
export interface DeleteNotificationParams extends Pick <Notification, '_id'> {};
