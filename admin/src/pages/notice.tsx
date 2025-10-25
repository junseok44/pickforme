import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
import styled from '@emotion/styled';
import { formatDate } from '@/utils/common';
import { putNoticeAtom, deleteNoticeAtom ,postNoticeAtom, noticesAtom, getNoticeAtom } from '@/stores/notice/atoms';
import { PutNoticeParams, PostNoticeParams, Notice } from '@/stores/notice/types';

const initialNotice = { text: '', title: '' };
export default function NoticeScreen() {
  const router = useRouter();
  const noticeId = router.query.noticeId as string;
  const getNotice = useSetAtom(getNoticeAtom);
  const postNotice = useSetAtom(postNoticeAtom);
  const putNotice = useSetAtom(putNoticeAtom);
  const deleteNotice = useSetAtom(deleteNoticeAtom);
  const [data, setData] = useState<PostNoticeParams>({ ...initialNotice });
  const notice = useAtomValue(noticesAtom).find(({ _id }) => _id === `${noticeId}`);
  const [isChange, setIsChange] = useState(false);
  useEffect(() => {
    if (noticeId) {
      getNotice({ _id: noticeId });
    }
  }, [noticeId, getNotice]);
  useEffect(() => {
    if (notice) {
      setData(notice);
    }
  }, [notice]);

  const handlePost = () => {
    const handleSuccess = (_id: string) => {
      router.push(`?noticeId=${_id}`);
    }
    postNotice({ ...data, cb: handleSuccess });
  }
  const handlePut = () => {
    if (notice) {
      putNotice({ ...data, _id: notice._id });
    }
  }

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement> = (e) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleDelete = async () => {
    if (notice) {
      await deleteNotice({ _id: notice._id });
    }
    router.push('/notice');
  }

  return (
    <Container>
      <Title>
        공지사항 상세
      </Title>
      <Desc>
        제목
      </Desc>
      <Subtitle>
        <NoticeInput value={data.title} name='title' onChange={handleChange}/>
      </Subtitle>
      {!!notice && (
        <Desc>
          생성일: {formatDate(notice.createdAt)}
        </Desc>
      )}
      <Desc>
        내용
      </Desc>
      <Desc>
        <NoticeTextarea value={data.text} name='text' onChange={handleChange}/>
      </Desc>
      {!!notice ? (
        <>
          <Button onClick={handlePut}>
            수정
          </Button>
          <Button onClick={handleDelete}>
            삭제
          </Button>
        </>
      ) : (
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
const NoticeInput = styled.input`
width: 100%;
`;
const NoticeWrap = styled.div`
  display: flex;
  margin-top: 9px;
  flex-direction: column;
`;
const NoticeCard = styled.div`
  border: 2px solid black;
  border-radius: 13px;
  padding: 16px 13px;
`;
const NoticeTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  margin-bottom: 8px;
`;
const NoticePrice = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 15px;
  margin-bottom: 8px;
`;
const NoticeTextarea = styled.textarea`
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
const NoticeTagWrap = styled.div`
  display: flex;
  flex-direction: row;
  gap: 9px;
`;

const NoticeTag = styled.div`
  padding: 0 12px;
`;
const NoticeDesc = styled.div`
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
