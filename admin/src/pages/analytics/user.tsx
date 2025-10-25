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

interface UserStatistics {
  date: string;
  signupConversionRate: number;
  signupPageViews: number;
  signupCompletions: number;
  loginSuccessRate: number;
  loginFailureRate: number;
  loginAttempts: number;
  loginSuccesses: number;
  loginFailures: number;
  socialLoginStats: {
    google: number;
    apple: number;
    kakao: number;
  };
  ttfa: {
    averageTime: number;
    medianTime: number;
  };
  firstVisitorConversionRate: number;
  firstVisitors: number;
  firstVisitorDetailViews: number;
}

const UserAnalytics: React.FC = () => {
  // 퍼센트 포맷팅 함수 (백엔드에서 이미 퍼센트로 변환됨)
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // 오늘 데이터 추출 함수
  const extractTodayData = (
    trendData: UserStatistics[]
  ): UserStatistics | null => {
    if (trendData.length === 0) return null;
    return trendData[trendData.length - 1];
  };

  const { loading, error, todayStats, trendData } =
    useAnalyticsData({
      endpoint: "/analytics/statistics/user",
      extractTodayData,
    });

  return (
    <AnalyticsLayout
      selectedKey="user"
      title="사용자 통계"
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
                  title="회원가입 전환율"
                  value={todayStats.signupConversionRate}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="로그인 성공률"
                  value={todayStats.loginSuccessRate}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="첫 방문자 전환율"
                  value={todayStats.firstVisitorConversionRate}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="평균 TTFA (초)"
                  value={todayStats.ttfa.averageTime}
                  precision={2}
                />
              </Card>
            </Col>
          </Row>

          {/* 수치 카드들 */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="회원가입 페이지 조회수"
                  value={todayStats.signupPageViews}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="회원가입 완료 수"
                  value={todayStats.signupCompletions}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="로그인 시도 수"
                  value={todayStats.loginAttempts}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="로그인 성공 수"
                  value={todayStats.loginSuccesses}
                />
              </Card>
            </Col>
          </Row>

          {/* 소셜 로그인 통계 */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Google 로그인"
                  value={todayStats.socialLoginStats.google}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Apple 로그인"
                  value={todayStats.socialLoginStats.apple}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Kakao 로그인"
                  value={todayStats.socialLoginStats.kakao}
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
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatPercentage(value as number)}
                    />
                    <Line
                      type="monotone"
                      dataKey="signupConversionRate"
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
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatPercentage(value as number)}
                    />
                    <Line
                      type="monotone"
                      dataKey="loginSuccessRate"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="회원가입 페이지 조회수 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="signupPageViews" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="회원가입 완료 수 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="signupCompletions" fill="#82ca9d" />
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

export default UserAnalytics;
