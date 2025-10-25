import React from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';

import { formatTime } from '../utils/common';
import { Chat as IChat } from '../stores/request/types';

interface Props {
  data: IChat,
}
const Chat: React.FC<Props> = ({ data }) => {
  const button = data.button;
  return (
    <Root isMine={!data.isMine}>
      <Card>
        <Text>
          {data.text}
        </Text>
        {button && (
          <Link href={button.deeplink}>
            <button>{button.text}</button>
          </Link>
        )}
      </Card>
      <div>
        <DateText>
          {formatTime(data.createdAt)}
        </DateText>
      </div> 
    </Root>
  );
}

export default Chat;

const Root = styled.div<{ isMine: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 10px;
  margin-bottom: 21px;
  ${({ isMine }) => isMine && `
    flex-direction: row-reverse;
  `}
`;
const Card = styled.div`
  max-width: 60%;
  padding: 12px
  border-radius: 12px;
  border: 1px solid black;
`;
const Text = styled.div`
  white-space: pre-wrap;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
`;
const DateText = styled.div`
  font-weight: 400;
  font-size: 10px;
  line-height: 12px;
`;
