import React, { useState, useEffect } from "react";
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

interface ProductDetailStatistics {
  date: string;
  buttonClickRates: {
    [key: string]: {
      clickRate: number;
      clicks: number;
      pageViews: number;
    };
  };
  purchaseButtonClickRate: number;
  purchaseButtonClicks: number;
  productDetailPageViews: number;
  purchaseCompletionRate: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  purchaseCompletions: number;
  // 링크 검색 관련 데이터 추가
  linkSearchSuccessRate: number;
  linkSearchAttempts: number;
  linkSearchSuccesses: number;
  // 탭 콘텐츠 프로세스 통계 추가 (question 제거)
  tabContentProcess: {
    caption: {
      successCount: number;
      failedCount: number;
      successRate: number;
      avgDurationMs: number;
    };
    report: {
      successCount: number;
      failedCount: number;
      successRate: number;
      avgDurationMs: number;
    };
    review: {
      successCount: number;
      failedCount: number;
      successRate: number;
      avgDurationMs: number;
    };
    // question 제거
  };
}

const ProductDetailAnalytics: React.FC = () => {
  // 퍼센트 포맷팅 함수 (백엔드에서 이미 퍼센트로 변환됨)
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // 오늘 데이터 추출 함수
  const extractTodayData = (
    trendData: any[]
  ): ProductDetailStatistics | null => {
    if (trendData.length === 0) return null;
    const lastItem = trendData[trendData.length - 1];

    // 탭 콘텐츠 통계 계산 함수
    const calculateTabStats = (
      successCount: number,
      failedCount: number,
      avgDurationMs: number
    ) => {
      const total = successCount + failedCount;
      return {
        successCount,
        failedCount,
        successRate: total > 0 ? (successCount / total) * 100 : 0,
        avgDurationMs: avgDurationMs || 0,
      };
    };

    return {
      date: lastItem.date,
      buttonClickRates: lastItem.buttonClickRates || {},
      purchaseButtonClickRate: lastItem.purchaseButtonClickRate || 0,
      purchaseButtonClicks: lastItem.purchaseButtonClicks || 0,
      productDetailPageViews: lastItem.productDetailPageViews || 0,
      purchaseCompletionRate: lastItem.purchaseCompletionRate || 0,
      dailyActiveUsers: lastItem.dailyActiveUsers || 0,
      weeklyActiveUsers: lastItem.weeklyActiveUsers || 0,
      monthlyActiveUsers: lastItem.monthlyActiveUsers || 0,
      purchaseCompletions: lastItem.purchaseCompletions || 0,
      // 링크 검색 관련 데이터 추가
      linkSearchSuccessRate: lastItem.linkSearchSuccessRate || 0,
      linkSearchAttempts: lastItem.linkSearchAttempts || 0,
      linkSearchSuccesses: lastItem.linkSearchSuccesses || 0,
      // 탭 콘텐츠 프로세스 통계 추가 (question 제거)
      tabContentProcess: {
        caption: calculateTabStats(
          lastItem.tabContentProcess?.caption?.successCount || 0,
          lastItem.tabContentProcess?.caption?.failedCount || 0,
          lastItem.tabContentProcess?.caption?.avgDurationMs || 0
        ),
        report: calculateTabStats(
          lastItem.tabContentProcess?.report?.successCount || 0,
          lastItem.tabContentProcess?.report?.failedCount || 0,
          lastItem.tabContentProcess?.report?.avgDurationMs || 0
        ),
        review: calculateTabStats(
          lastItem.tabContentProcess?.review?.successCount || 0,
          lastItem.tabContentProcess?.review?.failedCount || 0,
          lastItem.tabContentProcess?.review?.avgDurationMs || 0
        ),
        // question 제거
      },
    };
  };

  const { loading, error, todayStats, trendData, handleDateChange } =
    useAnalyticsData({
      endpoint: "/analytics/statistics/product-detail",
      extractTodayData,
    });

  // 상품 상세 데이터 변환
  const productDetailData = trendData.map((item: any) => {
    // 탭 콘텐츠 통계 계산 함수
    const calculateTabStats = (
      successCount: number,
      failedCount: number,
      avgDurationMs: number
    ) => {
      const total = successCount + failedCount;
      return {
        successCount,
        failedCount,
        successRate: total > 0 ? (successCount / total) * 100 : 0,
        avgDurationMs: avgDurationMs || 0,
      };
    };

    return {
      date: item.date,
      buttonClickRates: item.buttonClickRates || {},
      purchaseButtonClickRate: item.purchaseButtonClickRate || 0,
      purchaseButtonClicks: item.purchaseButtonClicks || 0,
      productDetailPageViews: item.productDetailPageViews || 0,
      purchaseCompletionRate: item.purchaseCompletionRate || 0,
      dailyActiveUsers: item.dailyActiveUsers || 0,
      weeklyActiveUsers: item.weeklyActiveUsers || 0,
      monthlyActiveUsers: item.monthlyActiveUsers || 0,
      purchaseCompletions: item.purchaseCompletions || 0,
      // 링크 검색 관련 데이터 추가
      linkSearchSuccessRate: item.linkSearchSuccessRate || 0,
      linkSearchAttempts: item.linkSearchAttempts || 0,
      linkSearchSuccesses: item.linkSearchSuccesses || 0,
      // 탭 콘텐츠 프로세스 통계 추가 (question 제거)
      tabContentProcess: {
        caption: calculateTabStats(
          item.tabContentProcess?.caption?.successCount || 0,
          item.tabContentProcess?.caption?.failedCount || 0,
          item.tabContentProcess?.caption?.avgDurationMs || 0
        ),
        report: calculateTabStats(
          item.tabContentProcess?.report?.successCount || 0,
          item.tabContentProcess?.report?.failedCount || 0,
          item.tabContentProcess?.report?.avgDurationMs || 0
        ),
        review: calculateTabStats(
          item.tabContentProcess?.review?.successCount || 0,
          item.tabContentProcess?.review?.failedCount || 0,
          item.tabContentProcess?.review?.avgDurationMs || 0
        ),
        // question 제거
      },
    };
  });

  // 버튼 클릭률 테이블 컬럼
  const buttonColumns = [
    {
      title: "버튼",
      dataIndex: "button",
      key: "button",
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

  // 탭 콘텐츠 프로세스 테이블 컬럼 (question 제거)
  const tabContentColumns = [
    {
      title: "탭",
      dataIndex: "tab",
      key: "tab",
      render: (value: string) => {
        const tabNames: { [key: string]: string } = {
          caption: "캡션",
          report: "리포트",
          review: "리뷰",
          // question 제거
        };
        return tabNames[value] || value;
      },
    },
    {
      title: "성공률",
      dataIndex: "successRate",
      key: "successRate",
      render: (value: number) => formatPercentage(value),
    },
    {
      title: "성공 수",
      dataIndex: "successCount",
      key: "successCount",
    },
    {
      title: "실패 수",
      dataIndex: "failedCount",
      key: "failedCount",
    },
    {
      title: "평균 처리시간 (ms)",
      dataIndex: "avgDurationMs",
      key: "avgDurationMs",
      render: (value: number) => value.toFixed(0),
    },
  ];

  // 버튼 데이터 변환
  const getButtonTableData = () => {
    if (!todayStats?.buttonClickRates) return [];

    return Object.entries(todayStats.buttonClickRates).map(
      ([button, data]: [string, any]) => ({
        key: button,
        button,
        clickRate: data.clickRate,
        clicks: data.clicks,
        pageViews: data.pageViews,
      })
    );
  };

  // 탭 콘텐츠 데이터 변환 (question 제거)
  const getTabContentTableData = () => {
    if (!todayStats?.tabContentProcess) return [];

    return Object.entries(todayStats.tabContentProcess).map(
      ([tab, data]: [string, any]) => ({
        key: tab,
        tab,
        successRate: data.successRate,
        successCount: data.successCount,
        failedCount: data.failedCount,
        avgDurationMs: data.avgDurationMs,
      })
    );
  };

  return (
    <AnalyticsLayout
      selectedKey="productDetail"
      title="상품 상세 & 링크 검색 통계"
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
                  title="구매 버튼 클릭률"
                  value={todayStats.purchaseButtonClickRate}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="상품 상세 페이지 조회수"
                  value={todayStats.productDetailPageViews}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="구매 버튼 클릭 수"
                  value={todayStats.purchaseButtonClicks}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="구매 완료율"
                  value={todayStats.purchaseCompletionRate}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
          </Row>

          {/* 링크 검색 통계 카드들 */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="링크 검색 성공률"
                  value={todayStats.linkSearchSuccessRate}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="링크 검색 시도 수"
                  value={todayStats.linkSearchAttempts}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="링크 검색 성공 수"
                  value={todayStats.linkSearchSuccesses}
                />
              </Card>
            </Col>
          </Row>

          {/* 일주일 추이 차트들 */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} lg={12}>
              <Card title="구매 버튼 클릭률 추이 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={productDetailData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatPercentage(value as number)}
                    />
                    <Line
                      type="monotone"
                      dataKey="purchaseButtonClickRate"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="상품 상세 페이지 조회수 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productDetailData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="productDetailPageViews" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* 링크 검색 추이 차트들 */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} lg={12}>
              <Card title="링크 검색 성공률 추이 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={productDetailData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatPercentage(value as number)}
                    />
                    <Line
                      type="monotone"
                      dataKey="linkSearchSuccessRate"
                      stroke="#52c41a"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="링크 검색 시도 수 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productDetailData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="linkSearchAttempts" fill="#52c41a" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* 탭 콘텐츠 프로세스 통계 카드들 (question 제거) */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="캡션 성공률"
                  value={
                    todayStats.tabContentProcess?.caption?.successRate || 0
                  }
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="리포트 성공률"
                  value={todayStats.tabContentProcess?.report?.successRate || 0}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="리뷰 성공률"
                  value={todayStats.tabContentProcess?.review?.successRate || 0}
                  formatter={(value) => formatPercentage(value as number)}
                  precision={2}
                />
              </Card>
            </Col>
            {/* question 카드 제거 */}
          </Row>

          {/* 탭 콘텐츠 프로세스 추이 차트 (question 제거) */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} lg={12}>
              <Card title="탭별 성공률 추이 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={productDetailData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatPercentage(value as number)}
                    />
                    <Line
                      type="monotone"
                      dataKey="tabContentProcess.caption.successRate"
                      stroke="#1890ff"
                      strokeWidth={2}
                      name="캡션"
                    />
                    <Line
                      type="monotone"
                      dataKey="tabContentProcess.report.successRate"
                      stroke="#52c41a"
                      strokeWidth={2}
                      name="리포트"
                    />
                    <Line
                      type="monotone"
                      dataKey="tabContentProcess.review.successRate"
                      stroke="#faad14"
                      strokeWidth={2}
                      name="리뷰"
                    />
                    {/* question 라인 제거 */}
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="탭별 평균 처리시간 (7일)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={productDetailData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="tabContentProcess.caption.avgDurationMs"
                      stroke="#1890ff"
                      strokeWidth={2}
                      name="캡션"
                    />
                    <Line
                      type="monotone"
                      dataKey="tabContentProcess.report.avgDurationMs"
                      stroke="#52c41a"
                      strokeWidth={2}
                      name="리포트"
                    />
                    <Line
                      type="monotone"
                      dataKey="tabContentProcess.review.avgDurationMs"
                      stroke="#faad14"
                      strokeWidth={2}
                      name="리뷰"
                    />
                    {/* question 라인 제거 */}
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* 탭 콘텐츠 프로세스 상세 테이블 */}
          <Card
            title="탭별 콘텐츠 프로세스 통계 (오늘)"
            style={{ marginBottom: "24px" }}
          >
            <Table
              columns={tabContentColumns}
              dataSource={getTabContentTableData()}
              pagination={false}
              size="small"
            />
          </Card>

          {/* 버튼별 클릭률 테이블 */}
          <Card title="버튼별 클릭률 (오늘)">
            <Table
              columns={buttonColumns}
              dataSource={getButtonTableData()}
              pagination={false}
              size="small"
            />
          </Card>
        </>
      )}
    </AnalyticsLayout>
  );
};

export default ProductDetailAnalytics;
