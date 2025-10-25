import { useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { Table, Tag, Button, Tooltip, Space, Input } from "antd";
import { useRouter } from "next/router";
import axios from "@/utils/axios";

// [수정] 'coupang_api' 타입 추가
export type SearchSource = "webview" | "server" | "coupang_api";

interface SearchLog {
  _id?: string;
  requestId: string;
  keyword: string;
  source: SearchSource;
  success: boolean;
  durationMs: number;
  resultCount: number;
  errorMsg?: string;
  createdAt: string;
}

interface ListRespRaw {
  results: SearchLog[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

interface ProcessCell {
  success: boolean;
  durationMs: number;
  resultCount: number;
  logId?: string;
  createdAt?: string;
}
interface GroupedRow {
  requestId: string;
  keyword: string;
  processes: Partial<Record<SearchSource, ProcessCell>>;
  lastCreatedAt?: string;
}

export default function SearchLogListPage() {
  const [raw, setRaw] = useState<ListRespRaw>({
    results: [],
    total: 0,
    page: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState("");
  const router = useRouter();

  const fetchLogs = async (page = 1, limit = 20, keyword = "") => {
    setLoading(true);
    try {
      const { data } = await axios.get<ListRespRaw>("/search-logs/list", {
        params: { page, limit, keyword },
      });
      setRaw({
        results: data.results ?? [],
        total: data.total ?? 0,
        page: data.page ?? page,
        limit: data.limit ?? limit,
        totalPages: data.totalPages,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, 20);
  }, []);

  const grouped = useMemo<GroupedRow[]>(() => {
    const map = new Map<string, GroupedRow>();
    for (const r of raw.results) {
      const existed = map.get(r.requestId) ?? {
        requestId: r.requestId,
        keyword: r.keyword,
        processes: {},
        lastCreatedAt: r.createdAt,
      };
      const prev = existed.processes[r.source];
      if (!prev || (prev.createdAt || "") < r.createdAt) {
        existed.processes[r.source] = {
          success: r.success,
          durationMs: r.durationMs,
          resultCount: r.resultCount,
          logId: r._id,
          createdAt: r.createdAt,
        };
      }
      if (!existed.lastCreatedAt || existed.lastCreatedAt < r.createdAt) {
        existed.lastCreatedAt = r.createdAt;
      }
      existed.keyword = r.keyword;
      map.set(r.requestId, existed);
    }
    return Array.from(map.values()).sort((a, b) =>
      (b.lastCreatedAt || "").localeCompare(a.lastCreatedAt || "")
    );
  }, [raw.results]);

  const renderProcess = (p?: ProcessCell) => {
    if (!p) return <Tag>-</Tag>;
    const color = p.success ? "green" : "red";
    const title = `${p.durationMs}ms • 결과 ${p.resultCount}개`;
    return (
      <Tooltip title={title}>
        <Space size={6}>
          <Tag color={color}>{p.success ? "성공" : "실패"}</Tag>
          <span style={{ color: "#999" }}>{p.durationMs}ms</span>
        </Space>
      </Tooltip>
    );
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
      width: 280,
      render: (v: string) => (
        <a onClick={() => router.push(`/crawl-log/search/${v}`)}>{v}</a>
      ),
    },
    { title: "키워드", dataIndex: "keyword", key: "keyword", ellipsis: true },
    // [추가] 쿠팡 API 컬럼
    {
      title: "쿠팡 API",
      key: "coupang_api",
      align: "center" as const,
      render: (_: any, record: GroupedRow) =>
        renderProcess(record.processes["coupang_api"]),
    },
    {
      title: "웹뷰",
      key: "webview",
      align: "center" as const,
      render: (_: any, record: GroupedRow) =>
        renderProcess(record.processes["webview"]),
    },
    {
      title: "서버",
      key: "server",
      align: "center" as const,
      render: (_: any, record: GroupedRow) =>
        renderProcess(record.processes["server"]),
    },

    {
      title: "생성일시",
      key: "createdAt",
      width: 220,
      render: (_: any, record: GroupedRow) => (
        <span style={{ fontSize: "13px", color: "#666" }}>
          {record.lastCreatedAt ? formatKSTDate(record.lastCreatedAt) : "-"}
        </span>
      ),
    },
    {
      title: "상세",
      key: "action",
      width: 120,
      render: (_: any, record: GroupedRow) => (
        <Button
          onClick={() => router.push(`/crawl-log/search/${record.requestId}`)}
        >
          상세 보기
        </Button>
      ),
    },
  ];

  return (
    <Container>
      <TopBar>
        <TitleSection>
          <h1>검색 요청 로그</h1>
        </TitleSection>
        <Space size={12}>
          <Input.Search
            allowClear
            placeholder="키워드로 필터"
            onSearch={(kw) => {
              setKeywordFilter(kw);
              fetchLogs(1, raw.limit, kw);
            }}
            style={{ width: 280 }}
            loading={loading}
          />
          <Button
            onClick={() => fetchLogs(raw.page, raw.limit, keywordFilter)}
            loading={loading}
          >
            🔄 새로고침
          </Button>
          <Button
            type="primary"
            onClick={() => router.push("/crawl-log/search/stats")}
          >
            통계 바로가기
          </Button>
          <Button type="default" onClick={() => router.back()}>
            뒤로가기
          </Button>
        </Space>
      </TopBar>

      <TableSection>
        <Table
          rowKey={(r: GroupedRow) => r.requestId}
          columns={columns as any}
          dataSource={grouped}
          loading={loading}
          pagination={{
            current: raw.page,
            pageSize: raw.limit,
            total: raw.total,
            showSizeChanger: true,
            onChange: (page, pageSize) =>
              fetchLogs(page, pageSize, keywordFilter),
          }}
        />
      </TableSection>
    </Container>
  );
}

// ... styled components ...
const Container = styled.div`
  padding: 32px;
  max-width: 1200px;
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
