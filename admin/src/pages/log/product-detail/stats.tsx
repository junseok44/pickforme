// pages/crawl-log-stats.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import styled from "@emotion/styled";
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  DatePicker,
  Select,
  Space,
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import axios from "@/utils/axios";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const { RangePicker } = DatePicker;

interface ProcessStats {
  total: number;
  success: number;
  fail: number;
  successRate: number;
  avgDurationMs?: number;
}

interface TabStats {
  total: number;
  success: number;
  fail: number;
  successRate: number;
}

interface AttemptStats {
  total: number;
  success: number;
  fail: number;
  successRate: number;
  avgDurationMs?: number;
}

interface StatsResponse {
  todayStats: Record<string, ProcessStats>;
  byDateAndProcess: Record<string, Record<string, ProcessStats>>;
  todayTabStats: Record<string, TabStats>;
  byDateAndTab: Record<string, Record<string, TabStats>>;
  todayAttemptStats: Record<string, AttemptStats>;
  byDateAndAttempt: Record<string, Record<string, AttemptStats>>;
  meta?: { tz: string; range: { from: string; to: string } };
}

export default function CrawlLogStatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tz, setTz] = useState("Asia/Seoul"); // 기본 KST
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(6, "day"),
    dayjs(),
  ]);
  const router = useRouter();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        tz,
        from: range[0].format("YYYY-MM-DD"),
        to: range[1].format("YYYY-MM-DD"),
      };
      const { data } = await axios.get("/crawl-logs/stats", { params });
      setStats(data);
    } catch (e) {
      console.error("통계 조회 실패:", e);
    } finally {
      setLoading(false);
    }
  }, [tz, range]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]); // fetchStats dependency 추가

  const processColumns = [
    { title: "프로세스", dataIndex: "name", key: "name" },
    { title: "분모(전체)", dataIndex: "total", key: "total" },
    {
      title: "성공",
      dataIndex: "success",
      key: "success",
      render: (val: number) => <Tag color="green">{val}</Tag>,
    },
    {
      title: "실패",
      dataIndex: "fail",
      key: "fail",
      render: (val: number) => <Tag color="red">{val}</Tag>,
    },
    {
      title: "성공률",
      dataIndex: "successRate",
      key: "successRate",
      render: (val: number) => `${val.toFixed(2)}%`,
    },
    {
      title: "평균 소요시간",
      dataIndex: "avgDurationMs",
      key: "avgDurationMs",
      render: (val?: number) => (val ? `${Math.round(val)} ms` : "-"),
    },
  ];

  const tabColumns = [
    { title: "탭", dataIndex: "name", key: "name" },
    { title: "분모(전체)", dataIndex: "total", key: "total" },
    {
      title: "성공",
      dataIndex: "success",
      key: "success",
      render: (val: number) => <Tag color="green">{val}</Tag>,
    },
    {
      title: "실패",
      dataIndex: "fail",
      key: "fail",
      render: (val: number) => <Tag color="red">{val}</Tag>,
    },
    {
      title: "성공률",
      dataIndex: "successRate",
      key: "successRate",
      render: (val: number) => `${val.toFixed(2)}%`,
    },
  ];

  const attemptColumns = [
    { title: "Attempt 단계", dataIndex: "name", key: "name" },
    { title: "분모(전체)", dataIndex: "total", key: "total" },
    {
      title: "성공",
      dataIndex: "success",
      key: "success",
      render: (val: number) => <Tag color="green">{val}</Tag>,
    },
    {
      title: "실패",
      dataIndex: "fail",
      key: "fail",
      render: (val: number) => <Tag color="red">{val}</Tag>,
    },
    {
      title: "성공률",
      dataIndex: "successRate",
      key: "successRate",
      render: (val: number) => `${val.toFixed(2)}%`,
    },
    {
      title: "평균 소요시간",
      dataIndex: "avgDurationMs",
      key: "avgDurationMs",
      render: (val?: number) => (val ? `${Math.round(val)} ms` : "-"),
    },
  ];

  const todayProcessData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.todayStats).map(([name, v]) => ({
      name,
      ...v,
    }));
  }, [stats]);

  const todayTabData = useMemo(() => {
    if (!stats?.todayTabStats) return [];
    return Object.entries(stats.todayTabStats).map(([name, v]) => ({
      name,
      ...v,
    }));
  }, [stats]);

  const todayAttemptData = useMemo(() => {
    if (!stats?.todayAttemptStats) return [];
    return Object.entries(stats.todayAttemptStats).map(([name, v]) => ({
      name,
      ...v,
    }));
  }, [stats]);

  const chartData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byDateAndProcess)
      .map(([date, processes]) => ({
        date,
        webviewDetail: processes["webview-detail"]?.successRate ?? 0,
        webviewReview: processes["webview-review"]?.successRate ?? 0,
        server: processes["server"]?.successRate ?? 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [stats]);

  const tabChartData = useMemo(() => {
    if (!stats?.byDateAndTab) return [];
    return Object.entries(stats.byDateAndTab)
      .map(([date, tabs]) => ({
        date,
        CAPTION: tabs["CAPTION"]?.successRate ?? 0,
        REPORT: tabs["REPORT"]?.successRate ?? 0,
        REVIEW: tabs["REVIEW"]?.successRate ?? 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [stats]);

  const attemptChartData = useMemo(() => {
    if (!stats?.byDateAndAttempt) return [];
    return Object.entries(stats.byDateAndAttempt)
      .map(([date, attempts]) => ({
        date,
        "desktop-1": attempts["desktop-1"]?.successRate ?? 0,
        "mobile-vm": attempts["mobile-vm"]?.successRate ?? 0,
        "mobile-mlp": attempts["mobile-mlp"]?.successRate ?? 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [stats]);

  return (
    <Container>
      <TopBar>
        <TitleSection>
          <Typography.Title level={2} style={{ margin: 0 }}>
            크롤링 통계
          </Typography.Title>
          <Typography.Text type="secondary">
            기준 타임존: {stats?.meta?.tz ?? tz} / 범위:{" "}
            {stats?.meta?.range?.from} ~ {stats?.meta?.range?.to}
          </Typography.Text>
        </TitleSection>

        <Space wrap>
          <Select
            value={tz}
            style={{ width: 200 }}
            onChange={setTz}
            options={[
              { value: "Asia/Seoul", label: "Asia/Seoul (KST)" },
              { value: "UTC", label: "UTC" },
              // 필요시 타임존 추가
            ]}
          />
          <RangePicker
            value={range}
            onChange={(v) => v && setRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
            allowClear={false}
          />
          <Button type="primary" onClick={fetchStats} loading={loading}>
            새로고침
          </Button>
          <Button onClick={() => router.push("/crawl-log")}>← 리스트로</Button>
        </Space>
      </TopBar>

      {stats && (
        <ContentSection>
          <StatsCard
            title="선택한 '끝 날짜' 기준(보통 오늘)의 프로세스별 집계"
            loading={loading}
          >
            <Table
              rowKey="name"
              columns={processColumns}
              dataSource={todayProcessData}
              pagination={false}
            />
            <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
              * webview-detail / webview-review는 같은 분모(해당 날짜의 웹뷰
              requestId 합집합 개수)를 사용합니다.
            </Typography.Paragraph>
          </StatsCard>

          <ChartCard title="일자별 프로세스 성공률(%)" loading={loading}>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value, name) => {
                    if (typeof value === "number") {
                      return [`${value.toFixed(2)}%`, name];
                    }
                    return [value, name];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="webviewDetail"
                  name="Webview-Detail"
                  stroke="#1890ff"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="webviewReview"
                  name="Webview-Review"
                  stroke="#52c41a"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="server"
                  name="Server"
                  stroke="#9254de"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <StatsCard
            title="선택한 '끝 날짜' 기준 탭별 생성 성공률"
            loading={loading}
          >
            <Table
              rowKey="name"
              columns={tabColumns}
              dataSource={todayTabData}
              pagination={false}
            />
            <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
              * CAPTION: name + thumbnail 필요 | REPORT: name + detail_images
              필요 | REVIEW: name + reviews 필요
            </Typography.Paragraph>
          </StatsCard>

          <ChartCard title="일자별 탭별 생성 성공률(%)" loading={loading}>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={tabChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value, name) => {
                    if (typeof value === "number") {
                      return [`${value.toFixed(2)}%`, name];
                    }
                    return [value, name];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="CAPTION"
                  name="CAPTION"
                  stroke="#ff7300"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="REPORT"
                  name="REPORT"
                  stroke="#00c851"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="REVIEW"
                  name="REVIEW"
                  stroke="#e91e63"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <StatsCard
            title="선택한 '끝 날짜' 기준 웹뷰 Attempt별 성공률"
            loading={loading}
          >
            <Table
              rowKey="name"
              columns={attemptColumns}
              dataSource={todayAttemptData}
              pagination={false}
            />
            <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
              * desktop-1: 데스크톱 첫 번째 시도 | mobile-vm: 모바일 VM |
              mobile-mlp: 모바일 MLP
            </Typography.Paragraph>
          </StatsCard>

          <ChartCard title="일자별 웹뷰 Attempt별 성공률(%)" loading={loading}>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={attemptChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value, name) => {
                    if (typeof value === "number") {
                      return [`${value.toFixed(2)}%`, name];
                    }
                    return [value, name];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="desktop-1"
                  name="Desktop-1"
                  stroke="#ff4d4f"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="mobile-vm"
                  name="Mobile-VM"
                  stroke="#1890ff"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="mobile-mlp"
                  name="Mobile-MLP"
                  stroke="#52c41a"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </ContentSection>
      )}
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
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;
const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #262626;
  }
`;
const ContentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;
const StatsCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  .ant-card-head {
    border-bottom: 1px solid #f0f0f0;
    padding: 16px 24px;
  }
  .ant-card-body {
    padding: 24px;
  }
`;
const ChartCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  .ant-card-head {
    border-bottom: 1px solid #f0f0f0;
    padding: 16px 24px;
  }
  .ant-card-body {
    padding: 24px;
  }
`;
