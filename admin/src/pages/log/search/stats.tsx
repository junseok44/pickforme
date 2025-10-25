// pages/search-log-stats.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
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
import axios from "@/utils/axios";
import {
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useRouter } from "next/router";

const { RangePicker } = DatePicker;

type SourceKind = "webview" | "server";

type SummaryRow = {
  source: SourceKind;
  total: number;
  success: number;
  fail: number;
  successRate: number;
  avgDurationMs?: number;
  avgResultCount?: number;
};

type ByDateRow = {
  date: string;
  source: SourceKind;
  total: number;
  success: number;
  fail: number;
  successRate: number;
  avgDurationMs?: number;
  avgResultCount?: number;
};

type ReasonRow = { reason: string; count: number };

type FieldCompletenessRow = {
  date: string; // 'YYYY-MM-DD'
  source: SourceKind;
  field: string; // 'title' | 'thumbnail' | ...
  ratio: number; // 0~100
};

type StatsResponse = {
  todayBySource: SummaryRow[]; // ✅ '오늘' 요약 데이터 필드 추가
  rangeBySource: SummaryRow[];
  byDateAndSource: ByDateRow[];
  fieldCompletenessByDate: FieldCompletenessRow[];
  failureReasonsWebviewToday: ReasonRow[];
  failureReasonsWebviewRange: ReasonRow[];
  meta?: { tz: string; range: { from: string; to: string } };
};

const COLORS = [
  "#1890ff",
  "#52c41a",
  "#faad14",
  "#eb2f96",
  "#722ed1",
  "#13c2c2",
  "#a0d911",
  "#fa541c",
  "#2f54eb",
  "#eb8a90",
];

// 필드 정의(여기 순서대로 Line 생성)
const FIELD_DEF = [
  { key: "title", label: "제목" },
  { key: "thumbnail", label: "썸네일" },
  { key: "price", label: "가격" },
  { key: "originPrice", label: "원가" },
  { key: "discountRate", label: "할인율" },
  { key: "ratings", label: "평점" },
  { key: "reviews", label: "리뷰수" },
  { key: "url", label: "URL" },
] as const;

export default function SearchLogStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tz, setTz] = useState("Asia/Seoul");
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(6, "day"),
    dayjs(),
  ]);

  const disabledDate = useCallback(
    (cur: dayjs.Dayjs) => {
      if (!cur) return false;
      const [from, to] = range;
      if (from && !from.isSame(cur, "day")) {
        const days = Math.abs(
          cur.startOf("day").diff(from.startOf("day"), "day")
        );
        if (days > 30) return true;
      }
      if (to && !to.isSame(cur, "day")) {
        const days = Math.abs(
          to.startOf("day").diff(cur.startOf("day"), "day")
        );
        if (days > 30) return true;
      }
      return false;
    },
    [range]
  );

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        tz,
        from: range[0].format("YYYY-MM-DD"),
        to: range[1].format("YYYY-MM-DD"),
      };
      const { data } = await axios.get("/search-logs/stats", { params });
      setStats(data);
    } catch (e) {
      console.error("검색 통계 조회 실패:", e);
    } finally {
      setLoading(false);
    }
  }, [tz, range]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ✅ 상단 요약: '오늘' 데이터로 변경
  const summaryRows = useMemo(() => stats?.todayBySource ?? [], [stats]);

  const summaryColumns = [
    { title: "소스", dataIndex: "source", key: "source" },
    { title: "전체", dataIndex: "total", key: "total" },
    {
      title: "성공",
      dataIndex: "success",
      key: "success",
      render: (v: number) => <Tag color="green">{v}</Tag>,
    },
    {
      title: "실패",
      dataIndex: "fail",
      key: "fail",
      render: (v: number) => <Tag color="red">{v}</Tag>,
    },
    {
      title: "성공률",
      dataIndex: "successRate",
      key: "successRate",
      render: (v: number) => `${v.toFixed(2)}%`,
    },
    {
      title: "평균 소요(ms)",
      dataIndex: "avgDurationMs",
      key: "avgDurationMs",
      render: (v?: number) => (Number.isFinite(v) ? Math.round(v!) : "-"),
    },
    {
      title: "평균 결과 수",
      dataIndex: "avgResultCount",
      key: "avgResultCount",
      render: (v?: number) => (Number.isFinite(v) ? v!.toFixed(1) : "-"),
    },
  ];

  // ✅ 라인차트: 툴팁에 필요한 total, success 값도 함께 저장
  const lineData = useMemo(() => {
    if (!stats?.byDateAndSource) return [];
    const byDate: Record<string, any> = {};
    for (const row of stats.byDateAndSource) {
      if (!byDate[row.date]) byDate[row.date] = { date: row.date };
      const { source, successRate, total, success } = row;
      byDate[row.date][`${source}Rate`] = successRate ?? 0;
      byDate[row.date][`${source}Total`] = total;
      byDate[row.date][`${source}Success`] = success;
    }
    return Object.values(byDate).sort((a: any, b: any) =>
      a.date < b.date ? -1 : 1
    );
  }, [stats]);

  // 소스별 필드 충족률 데이터 생성
  const buildFieldChartData = (
    rows: FieldCompletenessRow[] | undefined,
    source: SourceKind
  ) => {
    if (!rows?.length) return [];
    const byDate: Record<string, any> = {};
    for (const r of rows) {
      if (r.source !== source) continue;
      const d = byDate[r.date] ?? { date: r.date };
      d[`${r.field}Rate`] = r.ratio; // e.g., titleRate
      byDate[r.date] = d;
    }
    return Object.values(byDate).sort((a: any, b: any) =>
      a.date < b.date ? -1 : 1
    );
  };

  const webviewFieldData = useMemo(
    () => buildFieldChartData(stats?.fieldCompletenessByDate, "webview"),
    [stats]
  );
  const serverFieldData = useMemo(
    () => buildFieldChartData(stats?.fieldCompletenessByDate, "server"),
    [stats]
  );

  // 파이차트: 웹뷰 실패 원인 (오늘/기간)
  const pieToday = useMemo(
    () => stats?.failureReasonsWebviewToday ?? [],
    [stats]
  );
  const pieRange = useMemo(
    () => stats?.failureReasonsWebviewRange ?? [],
    [stats]
  );

  const sumCount = (rows: ReasonRow[]) => rows.reduce((s, r) => s + r.count, 0);

  return (
    <Container>
      <TopBar>
        <TitleSection>
          <Typography.Title level={2} style={{ margin: 0 }}>
            검색 로그 통계
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
            ]}
          />
          <RangePicker
            value={range}
            onChange={(v) => {
              if (!v) return;
              const days = Math.abs(
                v[1]!.startOf("day").diff(v[0]!.startOf("day"), "day")
              );
              if (days > 30) return;
              setRange(v as [dayjs.Dayjs, dayjs.Dayjs]);
            }}
            allowClear={false}
            disabledDate={disabledDate}
          />
          <Button type="primary" onClick={fetchStats} loading={loading}>
            새로고침
          </Button>
          <Button onClick={() => router.back()}>뒤로가기</Button>
        </Space>
      </TopBar>

      {stats && (
        <ContentSection>
          {/* ✅ 기간 전체 요약 -> 오늘 통계 요약으로 변경 */}
          <StatsCard title="오늘의 통계 요약 (소스별)" loading={loading}>
            <Table
              rowKey={(r) => r.source}
              columns={summaryColumns as any}
              dataSource={summaryRows}
              pagination={false}
            />
          </StatsCard>

          {/* 일자별 성공률 */}
          <ChartCard title="일자별 성공률(%)" loading={loading}>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                {/* ✅ Tooltip formatter 수정 */}
                <Tooltip
                  formatter={(value, name, props) => {
                    if (typeof value !== "number") {
                      return [value as any, name as any];
                    }
                    const source = name === "Webview" ? "webview" : "server";
                    const total = props.payload[`${source}Total`];
                    const success = props.payload[`${source}Success`];

                    if (
                      typeof total === "number" &&
                      typeof success === "number"
                    ) {
                      const formattedValue = `${value.toFixed(
                        2
                      )}% (${success}/${total})`;
                      return [formattedValue, name];
                    }
                    return [`${value.toFixed(2)}%`, name]; // Fallback
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="webviewRate"
                  name="Webview"
                  stroke="#1890ff"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="serverRate"
                  name="Server"
                  stroke="#52c41a"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 필드별 충족률: 웹뷰 / 서버 나란히 */}
          <TwoCol>
            <ChartCard title="필드별 충족률(%) · Webview" loading={loading}>
              {webviewFieldData.length === 0 ? (
                <Typography.Text type="secondary">
                  데이터가 없습니다.
                </Typography.Text>
              ) : (
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={webviewFieldData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(v) =>
                        typeof v === "number" ? `${v.toFixed(1)}%` : (v as any)
                      }
                    />
                    <Legend />
                    {FIELD_DEF.map((f) => (
                      <Line
                        key={f.key}
                        type="monotone"
                        dataKey={`${f.key}Rate`}
                        name={f.label}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="필드별 충족률(%) · Server" loading={loading}>
              {serverFieldData.length === 0 ? (
                <Typography.Text type="secondary">
                  데이터가 없습니다.
                </Typography.Text>
              ) : (
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={serverFieldData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(v) =>
                        typeof v === "number" ? `${v.toFixed(1)}%` : (v as any)
                      }
                    />
                    <Legend />
                    {FIELD_DEF.map((f) => (
                      <Line
                        key={f.key}
                        type="monotone"
                        dataKey={`${f.key}Rate`}
                        name={f.label}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </TwoCol>

          {/* 실패 원인 파이차트 */}
          <TwoCol>
            <ChartCard title="웹뷰 실패 원인 - 오늘(KST)" loading={loading}>
              {sumCount(pieToday) === 0 ? (
                <Typography.Text type="secondary">
                  오늘 웹뷰 실패 로그가 없어요.
                </Typography.Text>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieToday}
                      dataKey="count"
                      nameKey="reason"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label={(d: any) => `${d.reason} (${d.count})`}
                    >
                      {pieToday.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="웹뷰 실패 원인 - 기간 전체" loading={loading}>
              {sumCount(pieRange) === 0 ? (
                <Typography.Text type="secondary">
                  선택한 기간에 웹뷰 실패 로그가 없어요.
                </Typography.Text>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieRange}
                      dataKey="count"
                      nameKey="reason"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label={(d: any) => `${d.reason} (${d.count})`}
                    >
                      {pieRange.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </TwoCol>
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
  .ant-card-head {
    padding: 16px 24px;
  }
  .ant-card-body {
    padding: 24px;
  }
`;
const ChartCard = styled(Card)`
  border-radius: 8px;
  .ant-card-head {
    padding: 16px 24px;
  }
  .ant-card-body {
    padding: 24px;
  }
`;
const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  @media (min-width: 992px) {
    grid-template-columns: 1fr 1fr;
  }
`;
