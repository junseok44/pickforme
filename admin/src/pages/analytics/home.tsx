import React from "react";
import { Card, Row, Col, Statistic, Table } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import AnalyticsLayout from "@/components/analytics/AnalyticsLayout";

interface HomeStatistics {
  date: string;
  recommendedProductClickRate: number;
  homePageViews: number;
  recommendedProductClicks: number;
  categoryClickRates: {
    [key: string]: {
      clickRate: number;
      clicks: number;
      pageViews: number;
    };
  };
}

const HomeAnalytics: React.FC = () => {
  // 퍼센트 포맷팅 함수 (백엔드에서 이미 퍼센트로 변환됨)
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // 오늘 데이터 추출 함수
  const extractTodayData = (
    trendData: HomeStatistics[]
  ): HomeStatistics | null => {
    if (trendData.length === 0) return null;
    return trendData[trendData.length - 1];
  };

  const { loading, error, todayStats, trendData } = useAnalyticsData({
    endpoint: "/analytics/statistics/home",
    extractTodayData,
  });

  // 카테고리 클릭률 테이블 컬럼
  const categoryColumns = [
    {
      title: "카테고리",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "클릭률",
      dataIndex: "clickRate",
      key: "clickRate",
      render: (value: number) => formatPercentage(value),
    },
    {
      title: "클릭 수",
      dataIndex: "clicks",
      key: "clicks",
    },
    {
      title: "페이지 조회수",
      dataIndex: "pageViews",
      key: "pageViews",
    },
  ];

  // 카테고리 데이터 변환
  const getCategoryTableData = () => {
    if (!todayStats?.categoryClickRates) return [];

    return Object.entries(todayStats.categoryClickRates).map(
      ([category, data]: [string, any]) => ({
        key: category,
        category,
        clickRate: data.clickRate,
        clicks: data.clicks,
        pageViews: data.pageViews,
      })
    );
  };

  return (
    <AnalyticsLayout
      selectedKey="home"
      title="홈화면 통계"
      loading={loading}
      error={error}
    >
      {todayStats && (
        <>
          {/* 주요 지표 카드들 */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="추천 상품 클릭률"
                  value={todayStats.recommendedProductClickRate}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="홈페이지 조회수"
                  value={todayStats.homePageViews}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="추천 상품 클릭 수"
                  value={todayStats.recommendedProductClicks}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="카테고리 수"
                  value={Object.keys(todayStats.categoryClickRates).length}
                />
              </Card>
            </Col>
          </Row>

          {/* 일주일 추이 차트들 */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} lg={12}>
              <Card title="추천 상품 클릭률 추이 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatPercentage(value as number)}
                    />
                    <Line
                      type="monotone"
                      dataKey="recommendedProductClickRate"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="홈페이지 조회수 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="homePageViews" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* 카테고리별 클릭률 테이블 */}
          <Card title="카테고리별 클릭률 (오늘)">
            <Table
              columns={categoryColumns}
              dataSource={getCategoryTableData()}
              pagination={false}
              size="small"
            />
          </Card>
        </>
      )}
    </AnalyticsLayout>
  );
};

export default HomeAnalytics;
