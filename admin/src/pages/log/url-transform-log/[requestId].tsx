import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Divider,
} from "antd";
import { useRouter } from "next/router";
import axios from "@/utils/axios";

const { Title, Text, Paragraph } = Typography;

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

export default function UrlTransformLogDetailPage() {
  const [log, setLog] = useState<UrlTransformLog | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { requestId } = router.query;

  const fetchLog = async () => {
    if (!requestId) return;

    setLoading(true);
    try {
      const { data } = await axios.get<{ data: UrlTransformLog }>(
        `/url-transform-logs/${requestId}`
      );
      setLog(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLog();
  }, [requestId]);

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

  if (!log) {
    return <Container>로딩 중...</Container>;
  }

  return (
    <Container>
      <Header>
        <Title level={2}>URL 변환 로그 상세</Title>
        <Space>
          <Button onClick={() => router.back()}>뒤로가기</Button>
          <Button onClick={fetchLog} loading={loading}>
            새로고침
          </Button>
        </Space>
      </Header>

      <Card title="기본 정보" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="Request ID">
            <Text code>{log.requestId}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="생성일시">
            {formatKSTDate(log.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="URL 타입">
            <Tag color={getUrlTypeColor(log.urlType)}>
              {getUrlTypeLabel(log.urlType)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="상품 ID">
            {log.productId || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="처리시간">
            <Text strong>{log.durationMs}ms</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="URL 변환 과정" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={4}>1. 원본 입력 URL</Title>
            <Paragraph copyable={{ text: log.originalInputUrl }}>
              <Text code style={{ fontSize: "12px", wordBreak: "break-all" }}>
                {log.originalInputUrl}
              </Text>
            </Paragraph>
          </div>

          <div>
            <Title level={4}>2. 정규화된 URL</Title>
            <Paragraph copyable={{ text: log.normalizedUrl }}>
              <Text code style={{ fontSize: "12px", wordBreak: "break-all" }}>
                {log.normalizedUrl}
              </Text>
            </Paragraph>
          </div>

          <div>
            <Title level={4}>3. 변환 결과</Title>
            <Space>
              <Tag color={log.transformSuccess ? "green" : "red"}>
                {log.transformSuccess ? "성공" : "실패"}
              </Tag>
              {!log.transformSuccess && log.errorMsg && (
                <Text type="danger">에러: {log.errorMsg}</Text>
              )}
            </Space>
          </div>
        </Space>
      </Card>

      <Card title="딥링크 생성 결과" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={4}>딥링크 생성 상태</Title>
            <Space>
              <Tag color={log.deeplinkSuccess ? "green" : "red"}>
                {log.deeplinkSuccess ? "성공" : "실패"}
              </Tag>
              {!log.deeplinkSuccess && log.deeplinkErrorMsg && (
                <Text type="danger">에러: {log.deeplinkErrorMsg}</Text>
              )}
            </Space>
          </div>

          {log.deeplinkSuccess && (
            <>
              <Divider />
              <div>
                <Title level={4}>생성된 딥링크들</Title>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  {log.originalUrl && (
                    <div>
                      <Text strong>Original URL:</Text>
                      <br />
                      <Paragraph copyable={{ text: log.originalUrl }}>
                        <Text
                          code
                          style={{ fontSize: "12px", wordBreak: "break-all" }}
                        >
                          {log.originalUrl}
                        </Text>
                      </Paragraph>
                    </div>
                  )}

                  {log.shortenUrl && (
                    <div>
                      <Text strong>Shorten URL:</Text>
                      <br />
                      <Paragraph copyable={{ text: log.shortenUrl }}>
                        <Text
                          code
                          style={{ fontSize: "12px", wordBreak: "break-all" }}
                        >
                          {log.shortenUrl}
                        </Text>
                      </Paragraph>
                    </div>
                  )}

                  {log.landingUrl && (
                    <div>
                      <Text strong>Landing URL (파트너스 연동):</Text>
                      <br />
                      <Paragraph copyable={{ text: log.landingUrl }}>
                        <Text
                          code
                          style={{ fontSize: "12px", wordBreak: "break-all" }}
                        >
                          {log.landingUrl}
                        </Text>
                      </Paragraph>
                    </div>
                  )}
                </Space>
              </div>
            </>
          )}
        </Space>
      </Card>
    </Container>
  );
}

const Container = styled.div`
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;
