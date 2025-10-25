import React from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import Link from 'next/link';
import styled from '@emotion/styled';

import { getNoticesAtom, noticesAtom } from '@/stores/notice/atoms';
import { formatDate } from '@/utils/common';

export default function NoticesScreen() {
  const getNotices = useSetAtom(getNoticesAtom);
  const notices = useAtomValue(noticesAtom);

  React.useEffect(() => {
    getNotices();
  }, [getNotices]);

  return (
    <Container>
      <Title>공지 목록</Title>
      <Link href='/notice'>
        <button>
          쓰러가기
        </button>
      </Link>
      <Cards>
        {notices.map((notice) => (
          <Link
            href={`/notice/?noticeId=${notice._id}`}
            key={`Notice-card-${notice._id}`}
          >
            <Card>
              <Row>
                <RowLeft>
                  <Name>
                    {notice.title}
                  </Name>
                  <DateText>
                    {formatDate(notice.createdAt)}
                  </DateText>
                </RowLeft>
              </Row>
              <div>
                {notice.text.slice(0, 100)}
              </div>
            </Card>
          </Link>
        ))}
      </Cards>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  padding: 20px;
  padding-top: 50px;
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 22px;
  line-height: 27px;
  margin-bottom: 13px;
`;

const Subtitle = styled.div`
  font-weight: 500;
  font-size: 14px
  line-height: 17px;
  margin-bottom: 32px;
`;
const TabWrap = styled.div`
  flex-direction: row;
  align-content: stretch;
  align-items: center;
  justify-content: space-between;
  gap: 13px;
`;
const Tab = styled.button`
  flex: 1;
`;
const Cards = styled.div`
  flex-direction: column-reverse;
`;
const Card = styled.div`
  padding: 12px;
  border-radius: 12px;
  border: 2px solid black;
  margin-bottom: 13px;
`;
const Row = styled.div`
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
`;
const RowLeft = styled.div`
  flex-direction: row;
  align-items: center;
`;
const Name = styled.div`
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  margin-right: 9px;
`;
const DateText = styled.div`
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
`;
const Preview = styled.div`
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
`;

const Status = styled.div`
  padding-left: 18px;
  padding-right: 18px;
`;
