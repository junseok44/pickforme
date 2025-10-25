import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { Table, Tag, Button, Space, Typography, Tooltip } from "antd";
import { useRouter } from "next/router";
import axios from "@/utils/axios";

type SearchSource = "webview" | "server";

interface FieldStats {
  total: number;
  title: number;
  thumbnail: number;
  price: number;
  originPrice: number;
  discountRate: number;
  ratings: number;
  reviews: number;
  url: number;
}

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
  fieldStats?: FieldStats;
}

interface ListRespRaw {
  results: SearchLog[];
  total: number;
  page: number;
  limit: number;
}

const FIELD_LIST = [
  { key: "title", label: "제목" },
  { key: "thumbnail", label: "썸네일" },
  { key: "price", label: "가격" },
  { key: "originPrice", label: "원가" },
  { key: "discountRate", label: "할인율" },
  { key: "ratings", label: "평점" },
  { key: "reviews", label: "리뷰수" },
  { key: "url", label: "URL" },
] as const;

export default function SearchLogDetailPage() {
  const router = useRouter();
  const { requestId } = router.query as { requestId: string };
  const [rows, setRows] = useState<SearchLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDetail = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const { data } = await axios.get<ListRespRaw>("/search-logs/list", {
        params: { requestId, limit: 100 },
      });
      setRows(
        (data.results || []).sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const pct = (n: number, d: number) =>
    d > 0 ? `${Math.round((n / d) * 100)}%` : "-";

  useEffect(() => {
    fetchDetail();
  }, [requestId]);

  const renderFieldPresence = (fs?: FieldStats) => {
    if (!fs) return <Typography.Text type="secondary">-</Typography.Text>;
    const d = fs.total || 0;

    return (
      <FieldGrid>
        {FIELD_LIST.map(({ key, label }) => {
          const count = (fs as any)[key] as number | undefined;
          const ok = (count || 0) > 0;
          const color = ok ? "green" : "red";
          const tooltip = `${label}: ${ok ? "있음" : "없음"} • ${
            count ?? 0
          }/${d} (${pct(count ?? 0, d)})`;

          return (
            <Tooltip key={key} title={tooltip}>
              <FieldChip color={color}>
                <span className="label">{label}</span>
                <span className="status">
                  {count}/{d} {ok ? "✅" : "❌"}
                </span>
              </FieldChip>
            </Tooltip>
          );
        })}
      </FieldGrid>
    );
  };

  const columns = [
    { title: "시간", dataIndex: "createdAt", key: "createdAt", width: 200 },
    {
      title: "소스",
      dataIndex: "source",
      key: "source",
      width: 120,
      render: (s: SearchSource) => (
        <Tag color={s === "webview" ? "blue" : "gold"}>{s}</Tag>
      ),
    },
    {
      title: "성공",
      dataIndex: "success",
      key: "success",
      width: 120,
      render: (ok: boolean) => (
        <Tag color={ok ? "green" : "red"}>{ok ? "성공" : "실패"}</Tag>
      ),
    },
    {
      title: "소요(ms)",
      dataIndex: "durationMs",
      key: "durationMs",
      width: 120,
    },
    {
      title: "결과수",
      dataIndex: "resultCount",
      key: "resultCount",
      width: 120,
    },
    { title: "키워드", dataIndex: "keyword", key: "keyword" },
    { title: "에러", dataIndex: "errorMsg", key: "errorMsg", ellipsis: true },
    {
      title: "필드(있/없)",
      key: "fieldPresence",
      // 테이블 셀에서 줄바꿈 허용 + 패딩 여유
      onCell: () => ({
        style: { whiteSpace: "normal", paddingTop: 12, paddingBottom: 12 },
      }),
      render: (_: any, r: SearchLog) => renderFieldPresence(r.fieldStats),
    },
  ];

  const meta = rows[0];

  return (
    <Container>
      <TopBar>
        <Space size={12}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            검색 요청 상세: {requestId}
          </Typography.Title>
        </Space>
        <Space>
          <Button onClick={() => router.back()}>← 뒤로</Button>
        </Space>
      </TopBar>

      <MetaBox>
        <div>
          <b>키워드:</b> {meta?.keyword || "-"}
        </div>
        <div>
          <b>총 이벤트:</b> {rows.length}
        </div>
      </MetaBox>

      <Table
        rowKey={(r) => r._id || `${r.source}-${r.createdAt}`}
        dataSource={rows}
        columns={columns as any}
        loading={loading}
        pagination={false}
      />
    </Container>
  );
}

const Container = styled.div`
  padding: 32px;
  max-width: 1000px;
  margin: 0 auto;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const MetaBox = styled.div`
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

/* ✅ 반응형 그리드: 셀 너비에 맞춰 자동 줄바꿈 */
const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 6px;
  width: 100%;
`;

/* ✅ 칩(Tag) 축소/정렬: 한 줄, 좌우 배치, 오버플로우 숨김 */
const FieldChip = styled(Tag)`
  margin: 0;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .status {
    margin-left: 8px;
    flex: 0 0 auto;
  }
`;
