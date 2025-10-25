import React from "react";
import { Card, Row, Col, Statistic, Button, message } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import AnalyticsLayout from "@/components/analytics/AnalyticsLayout";
import client from "@/utils/axios";

interface StatisticsData {
  user: any;
  home: any;
  search: any;
  linkSearch: any;
  productDetail: any;
  membership: any;
  managerQA: any;
}

interface TrendData {
  period: string;
  data: StatisticsData;
}

const AnalyticsIndex: React.FC = () => {
  // 퍼센트 포맷팅 함수 (백엔드에서 이미 퍼센트로 변환됨)
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // 오늘 데이터 추출 함수
  const extractTodayData = (trendData: TrendData[]): StatisticsData | null => {
    if (trendData.length === 0) return null;
    return trendData[trendData.length - 1].data;
  };

  const { loading, error, todayStats, trendData } = useAnalyticsData({
    endpoint: "/analytics/statistics",
    extractTodayData,
  });

  const clearCacheAndReload = async () => {
    try {
      if (!trendData || trendData.length === 0) {
        message.warning("삭제할 캐시의 기간 데이터를 찾을 수 없어요.");
        return;
      }
      const startDate = trendData[0].period;
      const endDate = trendData[trendData.length - 1].period;

      const resp = await client.post(
        `/analytics/statistics/cache/clear?startDate=${startDate}&endDate=${endDate}`,
        {
          params: {
            startDate,
            endDate,
          },
        }
      );
      if (resp.status !== 200) throw new Error("캐시 삭제 실패");
      message.success("캐시를 삭제했어요. 새로고침합니다.");
      setTimeout(() => window.location.reload(), 300);
    } catch (e) {
      message.error("캐시 삭제 중 오류가 발생했어요.");
    }
  };

  return (
    <AnalyticsLayout
      selectedKey="overview"
      title="전체 통계 대시보드"
      loading={loading}
      error={error}
    >
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button onClick={clearCacheAndReload}>캐시 삭제 후 새로고침</Button>
      </div>
      {todayStats && (
        <>
          {/* 주요 지표 카드들 */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="회원가입 전환율"
                  value={todayStats.user?.signupConversionRate}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="로그인 성공률"
                  value={todayStats.user?.loginSuccessRate}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="검색 성공률"
                  value={todayStats.search?.searchSuccessRate}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="멤버십 사용자 비율"
                  value={todayStats.membership?.membershipUserRatio}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
          </Row>

          {/* 추가 지표 카드들 */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="링크 검색 성공률"
                  value={todayStats.linkSearch?.linkSearchSuccessRate}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="구매 버튼 클릭률"
                  value={todayStats.productDetail?.purchaseButtonClickRate}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="상품 상세 페이지 조회수"
                  value={todayStats.productDetail?.productDetailPageViews}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="홈 추천 상품 클릭률"
                  value={todayStats.home?.recommendedProductClickRate}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
          </Row>

          {/* 일주일 추이 차트들 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="회원가입 전환율 추이 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatPercentage(value as number)}
                    />
                    <Line
                      type="monotone"
                      dataKey="data.user.signupConversionRate"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="로그인 성공률 추이 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatPercentage(value as number)}
                    />
                    <Line
                      type="monotone"
                      dataKey="data.user.loginSuccessRate"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="검색 성공률 추이 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatPercentage(value as number)}
                    />
                    <Line
                      type="monotone"
                      dataKey="data.search.searchSuccessRate"
                      stroke="#ffc658"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="멤버십 사용자 비율 추이 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatPercentage(value as number)}
                    />
                    <Line
                      type="monotone"
                      dataKey="data.membership.membershipUserRatio"
                      stroke="#ff7300"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="링크 검색 성공률 추이 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatPercentage(value as number)}
                    />
                    <Line
                      type="monotone"
                      dataKey="data.linkSearch.linkSearchSuccessRate"
                      stroke="#52c41a"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="구매 버튼 클릭률 추이 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatPercentage(value as number)}
                    />
                    <Line
                      type="monotone"
                      dataKey="data.productDetail.purchaseButtonClickRate"
                      stroke="#722ed1"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </AnalyticsLayout>
  );
};

export default AnalyticsIndex;
