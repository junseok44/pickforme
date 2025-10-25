import React from "react";
import { Card, Row, Col, Statistic } from "antd";
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

interface ManagerQAStatistics {
  date: string;
  managerResponseConfirmationRate: number;
  managerResponses: number;
  responseConfirmationPageViews: number;
}

const ManagerQAAnalytics: React.FC = () => {
  // 퍼센트 포맷팅 함수 (백엔드에서 이미 퍼센트로 변환됨)
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // 오늘 데이터 추출 함수
  const extractTodayData = (trendData: any[]): ManagerQAStatistics | null => {
    if (trendData.length === 0) return null;
    const lastItem = trendData[trendData.length - 1];
    return {
      date: lastItem.period,
      managerResponseConfirmationRate:
        lastItem.data.managerQA?.managerResponseConfirmationRate || 0,
      managerResponses: lastItem.data.managerQA?.managerResponses || 0,
      responseConfirmationPageViews:
        lastItem.data.managerQA?.responseConfirmationPageViews || 0,
    };
  };

  const { loading, error, todayStats, trendData } =
    useAnalyticsData({
      endpoint: "/analytics/statistics",
      extractTodayData,
    });

  // 매니저 Q&A 데이터 변환
  const managerQAData = trendData.map((item: any) => ({
    date: item.period,
    managerResponseConfirmationRate:
      item.data.managerQA?.managerResponseConfirmationRate || 0,
    managerResponses: item.data.managerQA?.managerResponses || 0,
    responseConfirmationPageViews:
      item.data.managerQA?.responseConfirmationPageViews || 0,
  }));

  return (
    <AnalyticsLayout
      selectedKey="managerQA"
      title="매니저 Q&A 통계"
      loading={loading}
      error={error}
    >

      {todayStats && (
        <>
          {/* 주요 지표 카드들 */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="매니저 응답 확인률"
                  value={todayStats.managerResponseConfirmationRate}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="매니저 응답 수"
                  value={todayStats.managerResponses}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="응답 확인 페이지 조회수"
                  value={todayStats.responseConfirmationPageViews}
                />
              </Card>
            </Col>
          </Row>

          {/* 일주일 추이 차트들 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="매니저 응답 확인률 추이 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={managerQAData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatPercentage(value as number)}
                    />
                    <Line
                      type="monotone"
                      dataKey="managerResponseConfirmationRate"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="매니저 응답 수 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="managerResponses" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </AnalyticsLayout>
  );
};

export default ManagerQAAnalytics;
