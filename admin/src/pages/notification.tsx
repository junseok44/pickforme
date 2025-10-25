import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
import styled from '@emotion/styled';
import { formatDate } from '@/utils/common';
import { putNotificationAtom, deleteNotificationAtom ,postNotificationAtom, notificationsAtom, getNotificationAtom } from '@/stores/notification/atoms';
import { PutNotificationParams, PostNotificationParams, Notification } from '@/stores/notification/types';

const initialNotification = { body: '', title: '' };
export default function NotificationScreen() {
  const router = useRouter();
  const notificationId = router.query.notificationId as string;
  const getNotification = useSetAtom(getNotificationAtom);
  const postNotification = useSetAtom(postNotificationAtom);
  const putNotification = useSetAtom(putNotificationAtom);
  const deleteNotification = useSetAtom(deleteNotificationAtom);
  const [data, setData] = useState<PostNotificationParams>({ ...initialNotification });
  const notification = useAtomValue(notificationsAtom).find(({ _id }) => _id === `${notificationId}`);
  const [isChange, setIsChange] = useState(false);
  useEffect(() => {
    if (notificationId) {
      getNotification({ _id: notificationId });
    }
  }, [notificationId, getNotification]);
  useEffect(() => {
    if (notification) {
      setData(notification);
    }
  }, [notification]);

  const handlePost = () => {
    const handleSuccess = (_id: string) => {
      router.push(`?notificationId=${_id}`);
    }
    postNotification({ ...data, cb: handleSuccess });
  }
  const handlePut = () => {
    if (notification) {
      putNotification({ ...data, _id: notification._id });
    }
  }

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement> = (e) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleDelete = async () => {
    if (notification) {
      await deleteNotification({ _id: notification._id });
    }
    router.push('/notification');
  }

  const readOnly= !!notification;
  return (
    <Container>
      <Title>
        푸쉬알림 상세
      </Title>
      <Desc>
        제목
      </Desc>
      <Subtitle>
        <NotificationInput value={data.title} name='title' onChange={handleChange} readOnly={readOnly} />
      </Subtitle>
      {!!notification && (
        <Desc>
          생성일: {formatDate(notification.createdAt)}
        </Desc>
      )}
      <Desc>
        내용
      </Desc>
      <Desc>
        <NotificationTextarea value={data.body} name='body' onChange={handleChange} readOnly={readOnly}/>
      </Desc>
      {!notification && (
          <Button onClick={handlePost}>
            저장
          </Button>
      )}
    </Container>
  );
}

const Root = styled.button`
  border: none;
  background-color: transparent;
`;
const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  justify-content: flex-start;
`;
const Title = styled.div`
  font-weight: 600;
  font-size: 20px;
  line-height: 24px;
  margin-bottom: 30px;
`;
const Subtitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  line-height: 19px;
  margin-bottom: 18px;
`;
const Desc = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  margin-bottom: 26px;
`;
const NotificationInput = styled.input`
width: 100%;
`;
const NotificationWrap = styled.div`
  display: flex;
  margin-top: 9px;
  flex-direction: column;
`;
const NotificationCard = styled.div`
  border: 2px solid black;
  border-radius: 13px;
  padding: 16px 13px;
`;
const NotificationTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  margin-bottom: 8px;
`;
const NotificationPrice = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 15px;
  margin-bottom: 8px;
`;
const NotificationTextarea = styled.textarea`
  height: 500px;
  width: 100%;
`;
const Row = styled.div`
  display: flex;
  flex-direction: row;
`;
const RemoveButton = styled.button`
  display: block;
  margin-left: auto;
`;
const NotificationTagWrap = styled.div`
  display: flex;
  flex-direction: row;
  gap: 9px;
`;

const NotificationTag = styled.div`
  padding: 0 12px;
`;
const NotificationDesc = styled.div`
  text-align: left;
  margin-top: 10px;
  margin-bottom: 12px;
`;
const ButtonWrap = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: flex-end;
`;
const Button = styled.button`
  padding: 0 12px;
`;
