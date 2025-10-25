import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import {
  Card,
  Statistic,
  Row,
  Col,
  Table,
  Tag,
  DatePicker,
  Button,
  Space,
  Typography,
  Progress,
  Tooltip,
} from "antd";
import { useRouter } from "next/router";
import axios from "@/utils/axios";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface UrlTypeStats {
  urlType: string;
  count: number;
  transformSuccess: number;
  deeplinkSuccess: number;
  transformSuccessRate: number;
  deeplinkSuccessRate: number;
}

interface StatsData {
  totalRequests: number;
  transformSuccessCount: number;
  deeplinkSuccessCount: number;
  transformSuccessRate: number;
  deeplinkSuccessRate: number;
  avgDurationMs: number;
  urlTypeStats: UrlTypeStats[];
}

export default function UrlTransformLogStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >([dayjs().subtract(7, "day"), dayjs()]);
  const router = useRouter();

  const fetchStats = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await axios.get<{ success: boolean; data: StatsData }>(
        "/url-transform-logs/stats",
        {
          params,
        }
      );

      console.log("통계 API 응답:", data); // 디버깅용 로그

      if (data.success && data.data) {
        setStats(data.data);
      } else {
        console.error("통계 API 응답 오류:", data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 기본적으로 일주일 전부터 오늘까지의 데이터를 가져옴
    const endDate = dayjs();
    const startDate = dayjs().subtract(7, "day");
    fetchStats(startDate.format("YYYY-MM-DD"), endDate.format("YYYY-MM-DD"));
  }, []);

  const handleDateRangeChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      const [start, end] = dates;
      fetchStats(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
    } else {
      fetchStats();
    }
  };

  const getUrlTypeColor = (urlType: string) => {
    switch (urlType) {
      case "affiliate":
        return "blue";
      case "product":
        return "green";
      case "mobile":
        return "orange";
      case "unknown":
        return "red";
      default:
        return "default";
    }
  };

  const getUrlTypeLabel = (urlType: string) => {
    switch (urlType) {
      case "affiliate":
        return "어필리에이트";
      case "product":
        return "일반상품";
      case "mobile":
        return "모바일";
      case "unknown":
        return "알수없음";
      default:
        return urlType;
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return "#52c41a";
    if (rate >= 90) return "#faad14";
    return "#ff4d4f";
  };

  const urlTypeColumns = [
    {
      title: "URL 타입",
      dataIndex: "urlType",
      key: "urlType",
      width: 120,
      render: (urlType: string) => (
        <Tag color={getUrlTypeColor(urlType)}>{getUrlTypeLabel(urlType)}</Tag>
      ),
    },
    {
      title: "총 요청 수",
      dataIndex: "count",
      key: "count",
      width: 100,
      align: "center" as const,
      render: (count: number) => <strong>{count.toLocaleString()}</strong>,
    },
    {
      title: "변환 성공률",
      key: "transformSuccessRate",
      width: 150,
      align: "center" as const,
      render: (_: any, record: UrlTypeStats) => (
        <div>
          <Progress
            percent={record.transformSuccessRate}
            size="small"
            strokeColor={getSuccessRateColor(record.transformSuccessRate)}
            format={(percent) => `${percent?.toFixed(1)}%`}
          />
          <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>
            {record.transformSuccess}/{record.count}
          </div>
        </div>
      ),
    },
    {
      title: "딥링크 성공률",
      key: "deeplinkSuccessRate",
      width: 150,
      align: "center" as const,
      render: (_: any, record: UrlTypeStats) => (
        <div>
          <Progress
            percent={record.deeplinkSuccessRate}
            size="small"
            strokeColor={getSuccessRateColor(record.deeplinkSuccessRate)}
            format={(percent) => `${percent?.toFixed(1)}%`}
          />
          <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>
            {record.deeplinkSuccess}/{record.count}
          </div>
        </div>
      ),
    },
  ];

  if (!stats) {
    return <Container>로딩 중...</Container>;
  }

  return (
    <Container>
      <Header>
        <Title level={2}>URL 변환 통계</Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            placeholder={["시작일", "종료일"]}
          />
          <Button
            onClick={() => {
              const endDate = dayjs();
              const startDate = dayjs().subtract(7, "day");
              setDateRange([startDate, endDate]);
              fetchStats(
                startDate.format("YYYY-MM-DD"),
                endDate.format("YYYY-MM-DD")
              );
            }}
          >
            최근 7일
          </Button>
          <Button
            onClick={() => {
              setDateRange(null);
              fetchStats();
            }}
          >
            전체 기간
          </Button>
          <Button onClick={() => router.back()}>뒤로가기</Button>
        </Space>
      </Header>

      {/* 전체 통계 카드 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="총 요청 수"
              value={stats.totalRequests}
              valueStyle={{ color: "#1890ff" }}
              suffix="건"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="변환 성공률"
              value={stats.transformSuccessRate}
              precision={2}
              suffix="%"
              valueStyle={{
                color: getSuccessRateColor(stats.transformSuccessRate),
              }}
            />
            <div style={{ fontSize: "12px", color: "#666", marginTop: 8 }}>
              {stats.transformSuccessCount}/{stats.totalRequests} 성공
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="딥링크 성공률"
              value={stats.deeplinkSuccessRate}
              precision={2}
              suffix="%"
              valueStyle={{
                color: getSuccessRateColor(stats.deeplinkSuccessRate),
              }}
            />
            <div style={{ fontSize: "12px", color: "#666", marginTop: 8 }}>
              {stats.deeplinkSuccessCount}/{stats.totalRequests} 성공
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="평균 처리시간"
              value={stats.avgDurationMs}
              precision={0}
              suffix="ms"
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* URL 타입별 통계 테이블 */}
      <Card title="URL 타입별 상세 통계" loading={loading}>
        <Table
          columns={urlTypeColumns}
          dataSource={stats.urlTypeStats}
          rowKey="urlType"
          pagination={false}
          size="small"
        />
      </Card>
    </Container>
  );
}

const Container = styled.div`
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;
