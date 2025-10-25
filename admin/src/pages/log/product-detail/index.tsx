// pages/crawl-log/index.tsx
import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { Table, Tag, Button, Tooltip, Space, message } from "antd";
import { useRouter } from "next/router";
import axios from "@/utils/axios";

type ProcessType = "webview-detail" | "webview-review" | "server";

interface ProcessCell {
  success: boolean;
  durationMs: number;
  logId: string;
}
interface GroupedLog {
  requestId: string;
  productUrl: string;
  processes: Partial<Record<ProcessType, ProcessCell>>;
  lastCreatedAt: string;
}

interface ListResp {
  results: GroupedLog[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export default function CrawlLogListPage() {
  const [data, setData] = useState<ListResp>({
    results: [],
    total: 0,
    page: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchLogs = async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      // ✅ 서버: /crawl-logs/list-grouped (requestId 단위 페이지네이션)
      const { data } = await axios.get<ListResp>("/crawl-logs/list-grouped", {
        params: { page, limit },
      });
      setData({
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

  const renderProcess = (p?: ProcessCell) => {
    if (!p) return <Tag>-</Tag>;
    return (
      <Tooltip title={`${p.durationMs}ms`}>
        <Tag color={p.success ? "green" : "red"}>
          {p.success ? "성공" : "실패"}
        </Tag>
      </Tooltip>
    );
  };

  // KST 기준으로 날짜를 포맷팅하는 함수
  const formatKSTDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      // KST는 UTC+9
      const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

      const year = kstDate.getUTCFullYear();
      const month = kstDate.getUTCMonth() + 1;
      const day = kstDate.getUTCDate();
      const hours = kstDate.getUTCHours();
      const minutes = kstDate.getUTCMinutes();
      const seconds = kstDate.getUTCSeconds();

      return `${year}년 ${month}월 ${day}일 ${hours
        .toString()
        .padStart(2, "0")}시 ${minutes.toString().padStart(2, "0")}분 ${seconds
        .toString()
        .padStart(2, "0")}초`;
    } catch (e) {
      return "-";
    }
  };

  // Request ID 복사 함수
  const copyRequestId = async (requestId: string) => {
    try {
      await navigator.clipboard.writeText(requestId);
      message.success("Request ID가 복사되었습니다!");
    } catch (err) {
      message.error("복사에 실패했습니다.");
    }
  };

  const columns = [
    {
      title: "Request ID",
      dataIndex: "requestId",
      key: "requestId",
      width: 200,
      render: (requestId: string) => (
        <Tooltip title={`클릭하여 복사: ${requestId}`}>
          <span
            style={{
              cursor: "pointer",
            }}
            onClick={() => copyRequestId(requestId)}
          >
            {requestId.length > 20 ? `${requestId.slice(0, 17)}...` : requestId}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "상품 URL",
      dataIndex: "productUrl",
      key: "productUrl",
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url.length > 40 ? `${url.slice(0, 37)}...` : url}
        </a>
      ),
    },
    {
      title: "웹뷰 상세",
      key: "webview-detail",
      align: "center" as const,
      render: (_: any, record: GroupedLog) =>
        renderProcess(record.processes["webview-detail"]),
    },
    {
      title: "웹뷰 리뷰",
      key: "webview-review",
      align: "center" as const,
      render: (_: any, record: GroupedLog) =>
        renderProcess(record.processes["webview-review"]),
    },
    {
      title: "서버 크롤링",
      key: "server",
      align: "center" as const,
      render: (_: any, record: GroupedLog) =>
        renderProcess(record.processes["server"]),
    },
    {
      title: "생성일시",
      key: "createdAt",
      width: 220,
      render: (_: any, record: GroupedLog) => (
        <span style={{ fontSize: "13px", color: "#666" }}>
          {record.lastCreatedAt ? formatKSTDate(record.lastCreatedAt) : "-"}
        </span>
      ),
    },
    {
      title: "상세",
      key: "action",
      width: 120,
      render: (_: any, record: GroupedLog) => (
        <Button
          onClick={() =>
            router.push(`/crawl-log/product-detail/${record.requestId}`)
          }
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
          <h1>크롤링 요청 로그</h1>
        </TitleSection>
        <ButtonGroup>
          <Button
            onClick={() => fetchLogs(data.page, data.limit)}
            loading={loading}
          >
            🔄 새로고침
          </Button>
          <Button
            onClick={() => router.push("/crawl-log/product-detail/stats")}
          >
            통계
          </Button>
        </ButtonGroup>
      </TopBar>

      <TableSection>
        <Table
          rowKey="requestId"
          columns={columns}
          dataSource={data.results}
          loading={loading}
          pagination={{
            current: data.page,
            pageSize: data.limit,
            total: data.total,
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
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
