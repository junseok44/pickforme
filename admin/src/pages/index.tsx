import React, { useEffect } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import Link from 'next/link';
import styled from '@emotion/styled';

import { RequestStatus } from '@/stores/request/types';
import { getRequestsAtom, requestsAtom, currentPageAtom, totalPagesAtom } from '@/stores/request/atoms';
import { formatDate, formatRemainingTime } from '@/utils/common';

enum TABS {
  ALL = 'ALL',
  QUESTON = 'QUESTION',
  RECOMMEND = 'RECOMMEND',
  RESEARCH = 'RESEARCH'
};

const tabName = {
  [TABS.ALL]: '전체',
  [TABS.QUESTON]: '픽포미 질문',
  [TABS.RECOMMEND]: '픽포미 추천',
  [TABS.RESEARCH]: '픽포미 분석'
}

export default function RequestsScreen() {
  const currentPage = useAtomValue(currentPageAtom);
  const totalPages = useAtomValue(totalPagesAtom);
  const setCurrentPage = useSetAtom(currentPageAtom);
  const setTotalPages = useSetAtom(totalPagesAtom);

  const [tab, setTab] = React.useState<TABS>(TABS.ALL);

  const getRequests = useSetAtom(getRequestsAtom);
  const requests = useAtomValue(requestsAtom)
                    // .filter(request => tab === 'ALL' ? true : request.type === tab as string)
                    .sort((a, b) =>  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    getRequests({ type: tab, page: currentPage, pageSize: 15 });
  }, [getRequests, currentPage, tab, setTotalPages]);

  const handleNextPage = () => setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
  const handlePreviousPage = () => setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
  const handlePageClick = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <Container>
      <Title>의뢰 목록</Title>
      <TabWrap>
        {Object.values(TABS).map((TAB) => (
          <Tab 
            key={`Requests-Tab-${TAB}`} 
            onClick={() => {
              setCurrentPage(1); 
              setTab(TAB);
            }}
            active={tab === TAB}
          >
            {tabName[TAB]}
          </Tab>
        ))}
      </TabWrap>
      <Cards>
        {requests.map((request) => (
          <Link
            href={`/request/?requestId=${request._id}`}
            key={`Request-card-${request._id}`}
          >
            <Card>
              <Row>
                <RowLeft>
                  <Name>
                    {request.name}
                  </Name>
                  <DateText>
                    {formatDate(request.createdAt)}
                  </DateText>
                  <Tag type={request.type}>
                    {tabName[request.type]}
                  </Tag>
                </RowLeft>
                
                <Chip status={request.status}>
                  {request.status}
                </Chip>
                
              </Row>
              {request.status === RequestStatus.PENDING && (
                <RemainingTime>
                  {formatRemainingTime(request.createdAt)}
                </RemainingTime>
              )}
              
            </Card>
          </Link>
        ))}
      </Cards>
      <Pagination>
        <Button onClick={handlePreviousPage} disabled={currentPage === 1}>이전</Button>
        {Array.from({ length: totalPages }, (_, index) => (
          <PageButton
            key={`page-${index + 1}`}
            onClick={() => handlePageClick(index + 1)}
            active={currentPage === index + 1}
          >
            {index + 1}
          </PageButton>
        ))}
        <Button onClick={handleNextPage} disabled={currentPage === totalPages}>다음</Button>
      </Pagination>
    </Container>
  );
}

const Chip = styled.div<{ status: RequestStatus }>`
  background-color: ${({ status }) => (status === RequestStatus.SUCCESS ? '#4caf50' : status === RequestStatus.PENDING ? '#ff9800' : '#f44336')};
  color: white;
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: capitalize;
`;

const Container = styled.div`
  width: 100%;
  padding: 20px;
  padding-top: 50px;
  background-color: #f9f9f9;
`;

const Title = styled.h1`
  font-weight: 600;
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
`;

const Tag = styled.div<{ type: any }>`
  color: ${({ type }) => 
    type === TABS.QUESTON ? '#2196f3' : 
    type === TABS.RECOMMEND ? '#4caf50' : 
    type === TABS.RESEARCH ? '#9c27b0' : '#ccc'};
  background-color: #f9f9f9;
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: capitalize;
  margin-left: 10px;
`;

const TabWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 10px;
  border: none;
  border-bottom: 2px solid ${({ active }) => (active ? '#333' : 'transparent')};
  background-color: transparent;
  cursor: pointer;
  font-size: 16px;
  font-weight: ${({ active }) => (active ? 600 : 400)};
  color: ${({ active }) => (active ? '#333' : '#888')};
  transition: color 0.3s, border-bottom 0.3s;

  &:hover {
    color: #333;
  }
`;

const Cards = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: 10px;
`;

const Card = styled.div`
  padding: 15px;
  border-radius: 12px;
  border: 1px solid #ddd;
  background-color: white;
  transition: box-shadow 0.3s;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const RowLeft = styled.div`
  display: flex;
  align-items: center;
`;

const Name = styled.div`
  font-weight: 600;
  font-size: 16px;
  margin-right: 10px;
  color: #333;
`;

const DateText = styled.div`
  font-size: 12px;
  color: #888;
`;

const Preview = styled.div`
  font-size: 14px;
  color: #555;
  line-height: 1.4;
`;

const RemainingTime = styled.div`
  font-size: 12px;
  color: #ff9800;
  margin-top: 10px;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  margin: 0 10px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:disabled {
    background-color: #888;
    cursor: not-allowed;
  }
`;

const PageButton = styled.button<{ active: boolean }>`
  padding: 10px 15px;
  margin: 0 5px;
  background-color: ${({ active }) => (active ? '#333' : '#fff')};
  color: ${({ active }) => (active ? '#fff' : '#333')};
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #ddd;
  }
`;

const PageInfo = styled.div`
  font-size: 16px;
  color: #333;
`;
