import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { Button, Table, Tag, Descriptions, Tooltip, message } from "antd";
import axios from "@/utils/axios";

type ProcessType = "webview-detail" | "webview-review" | "server";
type TABS = "CAPTION" | "REPORT" | "REVIEW";

interface CrawlLog {
  _id: string;
  requestId: string;
  productUrl: string;
  processType: ProcessType;
  success: boolean;
  durationMs: number;
  createdAt: string;
  fields?: Record<string, any>;
  attemptLabel?: string; // 웹뷰 attempt 단계
}

type GroupedLogs = Partial<Record<ProcessType, CrawlLog[]>>; // 각 processType별로 배열로 저장
type TabStatus = Partial<Record<TABS, boolean>>;

function checkRequiredData(tab: TABS, product: Record<string, any>): boolean {
  switch (tab) {
    case "CAPTION":
      return !!(product.name && product.thumbnail);
    case "REPORT":
      return !!(product.name && product.detail_images);
    case "REVIEW":
      return !!(product.name && product.reviews);
    default:
      return false;
  }
}

export default function CrawlLogDetailPage() {
  const router = useRouter();
  const { id: requestId } = router.query;
  const [groupedLogs, setGroupedLogs] = useState<GroupedLogs>({});
  const [productUrl, setProductUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [tabStatus, setTabStatus] = useState<TabStatus>({});

  useEffect(() => {
    if (!requestId || typeof requestId !== "string") return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get<CrawlLog[]>(
          `/crawl-logs/${requestId}`
        );

        const grouped: GroupedLogs = {};
        for (const log of data) {
          if (!grouped[log.processType]) {
            grouped[log.processType] = [];
          }
          grouped[log.processType]!.push(log);
        }
        setGroupedLogs(grouped);
        setProductUrl(data[0]?.productUrl ?? "");

        // 모든 필드 합치기
        const mergedFields = Object.values(grouped)
          .flat()
          .reduce((acc, log) => {
            if (!log?.fields) return acc;

            for (const [key, val] of Object.entries(log.fields)) {
              if (val === undefined || val === null) continue;

              if (!acc[key] && val) {
                acc[key] = val;
              }
            }
            return acc;
          }, {} as Record<string, any>);

        console.log(mergedFields);

        // 탭 생성 성공 여부 판단
        const tabs: TABS[] = ["CAPTION", "REPORT", "REVIEW"];
        const status: TabStatus = {};
        for (const tab of tabs) {
          status[tab] = checkRequiredData(tab, mergedFields);
        }
        setTabStatus(status);
      } catch (e) {
        message.error("크롤링 로그를 불러오지 못했습니다.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [requestId]);

  const columns = [
    {
      title: "프로세스",
      dataIndex: "processType",
      key: "processType",
      render: (type: ProcessType) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: "Attempt 단계",
      dataIndex: "attemptLabel",
      key: "attemptLabel",
      render: (label?: string) =>
        label ? <Tag color="purple">{label}</Tag> : "-",
    },
    {
      title: "성공 여부",
      dataIndex: "success",
      key: "success",
      render: (success: boolean) => (
        <Tag color={success ? "green" : "red"}>{success ? "성공" : "실패"}</Tag>
      ),
    },
    {
      title: "소요 시간 (ms)",
      dataIndex: "durationMs",
      key: "durationMs",
      render: (ms: number) => <Tooltip title={`${ms}ms`}>{ms}</Tooltip>,
    },
    {
      title: "필드 요약",
      dataIndex: "fields",
      key: "fields",
      render: (fields: Record<string, boolean> = {}) =>
        Object.keys(fields).length ? (
          <SpaceWrap>
            {Object.entries(fields).map(([key, val]) => (
              <Tag key={key} color={val ? "green" : "red"}>
                {key}: {val ? "✅" : "❌"}
              </Tag>
            ))}
          </SpaceWrap>
        ) : (
          "-"
        ),
    },
    {
      title: "생성 시간",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) => new Date(createdAt).toLocaleString(),
    },
  ];

  return (
    <Container>
      <TopBar>
        <ButtonGroup>
          <Button onClick={() => router.back()}>← 뒤로가기</Button>
        </ButtonGroup>
      </TopBar>

      <TitleSection>
        <h2>크롤링 상세 로그</h2>
      </TitleSection>

      <InfoSection>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Request ID">{requestId}</Descriptions.Item>
          <Descriptions.Item label="상품 URL">
            <a href={productUrl} target="_blank" rel="noopener noreferrer">
              {productUrl}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="탭 생성 여부">
            <SpaceWrap>
              {(["CAPTION", "REPORT", "REVIEW"] as TABS[]).map((tab) => (
                <Tag key={tab} color={tabStatus[tab] ? "green" : "red"}>
                  {tab}: {tabStatus[tab] ? "✅" : "❌"}
                </Tag>
              ))}
            </SpaceWrap>
          </Descriptions.Item>
        </Descriptions>
      </InfoSection>

      <TableSection>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={Object.values(groupedLogs)
            .flat()
            .filter(Boolean)
            .sort((a, b) => {
              // 1순위: processType 순서 (webview-detail -> webview-review -> server)
              const processOrder = [
                "webview-detail",
                "webview-review",
                "server",
              ];
              const aProcessIndex = processOrder.indexOf(a.processType);
              const bProcessIndex = processOrder.indexOf(b.processType);

              if (aProcessIndex !== bProcessIndex) {
                return aProcessIndex - bProcessIndex;
              }

              // 2순위: 생성 시간 순서
              return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
              );
            })}
          loading={loading}
          pagination={false}
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
  margin-bottom: 32px;
  display: flex;
  justify-content: flex-end;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const TitleSection = styled.div`
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #262626;
  }
`;

const InfoSection = styled.div`
  margin-bottom: 32px;
  background: #fafafa;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
`;

const TableSection = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const SpaceWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;
