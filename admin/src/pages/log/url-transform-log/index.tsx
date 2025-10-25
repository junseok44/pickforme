import { useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import {
  Table,
  Tag,
  Button,
  Tooltip,
  Space,
  Input,
  Select,
  Switch,
} from "antd";
import { useRouter } from "next/router";
import axios from "@/utils/axios";

export type UrlType = "affiliate" | "product" | "mobile" | "unknown";

interface UrlTransformLog {
  _id?: string;
  requestId: string;
  originalInputUrl: string;
  normalizedUrl: string;
  productId: string;
  urlType: UrlType;
  transformSuccess: boolean;
  errorMsg?: string;
  deeplinkSuccess: boolean;
  deeplinkErrorMsg?: string;
  originalUrl?: string;
  shortenUrl?: string;
  landingUrl?: string;
  durationMs: number;
  createdAt: string;
}

interface ListRespRaw {
  results: UrlTransformLog[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export default function UrlTransformLogListPage() {
  const [raw, setRaw] = useState<ListRespRaw>({
    results: [],
    total: 0,
    page: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: "",
    urlType: "",
    transformSuccess: "",
    deeplinkSuccess: "",
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const router = useRouter();

  const fetchLogs = async (page = 1, limit = 20, filterParams = filters) => {
    setLoading(true);
    try {
      const { data } = await axios.get<{ success: boolean; data: ListRespRaw }>(
        "/url-transform-logs/list",
        {
          params: { page, limit, ...filterParams },
        }
      );

      console.log("API 응답:", data); // 디버깅용 로그

      if (data.success && data.data) {
        setRaw({
          results: data.data.results ?? [],
          total: data.data.total ?? 0,
          page: data.data.page ?? page,
          limit: data.data.limit ?? limit,
          totalPages: data.data.totalPages,
        });
      } else {
        console.error("API 응답 오류:", data);
        setRaw({
          results: [],
          total: 0,
          page: 1,
          limit: 20,
        });
      }
    } catch (e) {
      console.error("API 호출 오류:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, 20);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 자동 새로고침 기능
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLogs(raw.page, raw.limit);
      }, 10000); // 10초마다 새로고침
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, raw.page, raw.limit]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchLogs(1, raw.limit, newFilters);
  };

  const getUrlTypeColor = (urlType: UrlType) => {
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

  const getUrlTypeLabel = (urlType: UrlType) => {
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

  const formatKSTDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Seoul",
      }).format(date);
    } catch (e) {
      return "-";
    }
  };

  const columns = [
    {
      title: "Request ID",
      dataIndex: "requestId",
      key: "requestId",
      width: 200,
      render: (v: string) => (
        <a onClick={() => router.push(`/log/url-transform-log/${v}`)}>{v}</a>
      ),
    },
    {
      title: "원본 URL",
      dataIndex: "originalInputUrl",
      key: "originalInputUrl",
      width: 250,
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <span style={{ fontSize: "12px" }}>{url}</span>
        </Tooltip>
      ),
    },
    {
      title: "정규화 URL",
      dataIndex: "normalizedUrl",
      key: "normalizedUrl",
      width: 250,
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <span style={{ fontSize: "12px" }}>{url}</span>
        </Tooltip>
      ),
    },
    {
      title: "상품 ID",
      dataIndex: "productId",
      key: "productId",
      width: 120,
      render: (id: string) => id || "-",
    },
    {
      title: "URL 타입",
      dataIndex: "urlType",
      key: "urlType",
      width: 100,
      render: (urlType: UrlType) => (
        <Tag color={getUrlTypeColor(urlType)}>{getUrlTypeLabel(urlType)}</Tag>
      ),
    },
    {
      title: "변환 성공",
      dataIndex: "transformSuccess",
      key: "transformSuccess",
      width: 100,
      align: "center" as const,
      render: (success: boolean, record: UrlTransformLog) => (
        <Space direction="vertical" size={4}>
          <Tag color={success ? "green" : "red"}>
            {success ? "성공" : "실패"}
          </Tag>
          {!success && record.errorMsg && (
            <Tooltip title={record.errorMsg}>
              <span style={{ fontSize: "10px", color: "#999" }}>에러</span>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "딥링크 성공",
      dataIndex: "deeplinkSuccess",
      key: "deeplinkSuccess",
      width: 100,
      align: "center" as const,
      render: (success: boolean, record: UrlTransformLog) => (
        <Space direction="vertical" size={4}>
          <Tag color={success ? "green" : "red"}>
            {success ? "성공" : "실패"}
          </Tag>
          {!success && record.deeplinkErrorMsg && (
            <Tooltip title={record.deeplinkErrorMsg}>
              <span style={{ fontSize: "10px", color: "#999" }}>에러</span>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "처리시간",
      dataIndex: "durationMs",
      key: "durationMs",
      width: 100,
      align: "center" as const,
      render: (ms: number) => <span style={{ fontSize: "12px" }}>{ms}ms</span>,
    },
    {
      title: "생성일시",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) => (
        <span style={{ fontSize: "12px", color: "#666" }}>
          {formatKSTDate(date)}
        </span>
      ),
    },
    {
      title: "상세",
      key: "action",
      width: 100,
      render: (_: any, record: UrlTransformLog) => (
        <Button
          size="small"
          onClick={() =>
            router.push(`/log/url-transform-log/${record.requestId}`)
          }
        >
          상세
        </Button>
      ),
    },
  ];

  return (
    <Container>
      <TitleSection>
        <h1>URL 변환 로그</h1>
      </TitleSection>
      <TopBar>
        <Space size={12}>
          <Input.Search
            allowClear
            placeholder="URL 검색"
            value={filters.keyword}
            onChange={(e) =>
              setFilters({ ...filters, keyword: e.target.value })
            }
            onSearch={() => fetchLogs(1, raw.limit)}
            style={{ width: 200 }}
            loading={loading}
          />
          <Select
            placeholder="URL 타입"
            value={filters.urlType || undefined}
            onChange={(value) => handleFilterChange("urlType", value)}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="affiliate">어필리에이트</Select.Option>
            <Select.Option value="product">일반상품</Select.Option>
            <Select.Option value="mobile">모바일</Select.Option>
            <Select.Option value="unknown">알수없음</Select.Option>
          </Select>
          <Select
            placeholder="변환 성공"
            value={filters.transformSuccess || undefined}
            onChange={(value) => handleFilterChange("transformSuccess", value)}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="true">성공</Select.Option>
            <Select.Option value="false">실패</Select.Option>
          </Select>
          <Select
            placeholder="딥링크 성공"
            value={filters.deeplinkSuccess || undefined}
            onChange={(value) => handleFilterChange("deeplinkSuccess", value)}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="true">성공</Select.Option>
            <Select.Option value="false">실패</Select.Option>
          </Select>
          <Space>
            <span>자동 새로고침:</span>
            <Switch
              checked={autoRefresh}
              onChange={setAutoRefresh}
              size="small"
            />
          </Space>
          <Button
            onClick={() => {
              fetchLogs(raw.page, raw.limit);
            }}
            loading={loading}
          >
            🔄 새로고침
          </Button>
          <Button
            type="primary"
            onClick={() => router.push("/log/url-transform-log/stats")}
          >
            📊 통계 보기
          </Button>
          <Button type="default" onClick={() => router.back()}>
            뒤로가기
          </Button>
        </Space>
      </TopBar>

      <TableSection>
        <Table
          rowKey={(r: UrlTransformLog) => r._id || r.requestId}
          columns={columns as any}
          dataSource={raw.results}
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            current: raw.page,
            pageSize: raw.limit,
            total: raw.total,
            showSizeChanger: true,
            onChange: (page, pageSize) => fetchLogs(page, pageSize),
          }}
        />
      </TableSection>
    </Container>
  );
}

const Container = styled.div`
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const TitleSection = styled.div`
  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #262626;
    margin-bottom: 20px;
  }
`;

const TableSection = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  .ant-table {
    border-radius: 8px;
  }
  .ant-table-thead > tr > th {
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    padding: 16px;
  }
  .ant-table-tbody > tr > td {
    padding: 16px;
  }
`;
