import styled from "@emotion/styled";
import Link from "next/link";
import { Card, Button, Space, Typography } from "antd";
import {
  SearchOutlined,
  ProfileOutlined,
  BarChartOutlined,
  LinkOutlined,
} from "@ant-design/icons";

export default function SystemLogHomePage() {
  return (
    <Container>
      <TopBar>
        <Typography.Title level={2} style={{ margin: 0 }}>
          시스템 로그 대시보드
        </Typography.Title>
      </TopBar>

      <Grid>
        {/* 검색 로그 */}
        <Card
          title={
            <Space align="center">
              <SearchOutlined />
              <span>검색 로그 (Search)</span>
            </Space>
          }
        >
          <Desc>
            <li>requestId 단위로 웹뷰/서버 검색 성공 여부 확인</li>
            <li>소요 시간(ms), 결과 개수, 에러 메시지 툴팁</li>
            <li>Request ID 클릭 시 상세 타임라인</li>
          </Desc>

          <Space size={12}>
            <Link href="/log/search">
              <Button type="default" icon={<SearchOutlined />}>
                검색 로그 보기
              </Button>
            </Link>
            {/* ✅ 통계 버튼 추가 */}
            <Link href="/log/search/stats">
              <Button type="primary" icon={<BarChartOutlined />}>
                통계 바로가기
              </Button>
            </Link>
          </Space>
        </Card>

        {/* 상품 상세 로그 */}
        <Card
          title={
            <Space align="center">
              <ProfileOutlined />
              <span>상품 상세 로그 (Product Detail)</span>
            </Space>
          }
        >
          <Desc>
            <li>productUrl 단위로 상세/리뷰/서버 크롤링 결과 조회</li>
            <li>필드 처리 상태, 프로세스별 소요 시간, 성공/실패 요약</li>
            <li>Request ID별 이력 드릴다운</li>
          </Desc>

          <Space size={12}>
            <Link href="/log/product-detail">
              <Button icon={<ProfileOutlined />}>상품 상세 로그 보기</Button>
            </Link>
            <Link href="/log/product-detail/stats">
              <Button type="primary" icon={<BarChartOutlined />}>
                통계 바로가기
              </Button>
            </Link>
          </Space>
        </Card>

        {/* URL 변환 로그 */}
        <Card
          title={
            <Space align="center">
              <LinkOutlined />
              <span>URL 변환 로그 (URL Transform)</span>
            </Space>
          }
        >
          <Desc>
            <li>URL 정규화 및 딥링크 생성 과정의 상세 로그</li>
            <li>변환 성공률, 딥링크 성공률, 처리 시간 분석</li>
            <li>Request ID별 상세 변환 과정 및 에러 추적</li>
          </Desc>

          <Space size={12}>
            <Link href="/log/url-transform-log">
              <Button icon={<LinkOutlined />}>URL 변환 로그 보기</Button>
            </Link>
            <Link href="/log/url-transform-log/stats">
              <Button type="primary" icon={<BarChartOutlined />}>
                통계 바로가기
              </Button>
            </Link>
          </Space>
        </Card>
      </Grid>
    </Container>
  );
}

const Container = styled.div`
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 16px;
`;

const Desc = styled.ul`
  margin: 0 0 16px 18px;
  padding: 0;
  color: #595959;
  li + li {
    margin-top: 6px;
  }
`;
