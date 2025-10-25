import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import {
  Button,
  Table,
  Input,
  DatePicker,
  Form,
  Space,
  message,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import axios from "@/utils/axios";

const { RangePicker } = DatePicker;

export default function PurchaseFailures() {
  const [failures, setFailures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryingIds, setRetryingIds] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchFailures = async (filters = {}) => {
    setLoading(true);
    try {
      const { data } = await axios.get("/purchase/failures", {
        params: filters,
      });
      setFailures(data.results);
    } catch (error: any) {
      console.error(error);
      messageApi.error("결제 실패 이력을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const onSearch = (values: any) => {
    const { userId, productId, dateRange } = values;
    const filters: any = {
      userId: userId || undefined,
      productId: productId || undefined,
    };
    if (dateRange?.[0] && dateRange?.[1]) {
      filters.startDate = format(dateRange[0].toDate(), "yyyy-MM-dd");
      filters.endDate = format(dateRange[1].toDate(), "yyyy-MM-dd");
    }
    fetchFailures(filters);
  };

  const handleRetry = async (record: any) => {
    try {
      setRetryingIds((prev) => [...prev, record._id]);
      const { data } = await axios.post("/purchase/retry", {
        userId: record.userId,
        _id: record.productId,
        receipt: record.receipt,
      });
      messageApi.success(
        `재시도 성공: ${data?.product?.displayName || "Success"}`
      );
      const filters = form.getFieldsValue();
      onSearch(filters);
    } catch (error: any) {
      console.error(error);
      messageApi.error(
        `재시도 실패: ${error.response?.data?.error || "Unknown error"}`
      );
    } finally {
      setRetryingIds((prev) => prev.filter((id) => id !== record._id));
    }
  };

  const handleAdminRetry = async (record: any) => {
    try {
      setRetryingIds((prev) => [...prev, `${record._id}_admin`]);
      const { data } = await axios.post("/purchase/admin/retry", {
        userId: record.userId,
        _id: record.productId,
        receipt: record.receipt || null,
      });
      messageApi.success(
        `멤버쉽 부여 성공: ${data?.product?.displayName || "Success"}`
      );
      const filters = form.getFieldsValue();
      onSearch(filters);
    } catch (error: any) {
      console.error(error);
      messageApi.error(
        `멤버쉽 부여 실패: ${error.response?.data?.error || "Unknown error"}`
      );
    } finally {
      setRetryingIds((prev) =>
        prev.filter((id) => id !== `${record._id}_admin`)
      );
    }
  };

  useEffect(() => {
    fetchFailures();
  }, []);

  const columns = [
    {
      title: "유저 ID",
      dataIndex: "userId",
      key: "userId",
      width: 180,
      render: (val: any) => (
        <Typography.Text
          ellipsis
          style={{ maxWidth: 160, display: "inline-block" }}
        >
          {String(val ?? "")}
        </Typography.Text>
      ),
    },
    {
      title: "상품 ID",
      dataIndex: "productId",
      key: "productId",
      width: 220,
      render: (val: any) => (
        <Typography.Text
          ellipsis
          style={{ maxWidth: 200, display: "inline-block" }}
        >
          {String(val ?? "")}
        </Typography.Text>
      ),
    },
    {
      title: "에러 메시지",
      dataIndex: "errorMessage",
      key: "errorMessage",
      width: 520, // 필요 시 조절
      render: (val: any) => {
        const text =
          typeof val === "string" ? val : val ? JSON.stringify(val) : "";
        return (
          <Tooltip
            title={
              // 긴 문자열 줄바꿈/띄어쓰기 보존
              <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {text}
              </div>
            }
            // ✅ 여기서 가로폭 확실히 늘려줌
            overlayStyle={{ maxWidth: "60vw" }} // 바깥 박스 폭 제한
            overlayInnerStyle={{ whiteSpace: "normal" }} // 내부 줄바꿈 허용(보조)
            mouseEnterDelay={0.15}
          >
            <Typography.Text
              ellipsis
              style={{
                maxWidth: 500,
                display: "inline-block",
                verticalAlign: "middle",
                whiteSpace: "nowrap",
              }}
            >
              {text}
            </Typography.Text>
          </Tooltip>
        );
      },
    },
    {
      title: "상태",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={status === "RESOLVED" ? "green" : "red"}>
          {status === "RESOLVED" ? "RESOLVED" : "FAILED"}
        </Tag>
      ),
    },
    {
      title: "발생 시각",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 200,
      render: (text: string) => (
        <Typography.Text>{new Date(text).toLocaleString()}</Typography.Text>
      ),
    },
    {
      title: (
        <Space>
          작업
          <Tooltip title="일반 재시도는 영수증 검증을 통해 구독을 재시도하고, 어드민 권한으로 멤버쉽 부여는 영수증 검증 없이 바로 구독을 생성합니다. 어드민 권한으로 멤버쉽 부여는 주의해서 사용해주세요.">
            <InfoCircleOutlined style={{ color: "#1890ff" }} />
          </Tooltip>
        </Space>
      ),
      key: "action",
      width: 260,
      render: (_: any, record: any) => (
        <Space wrap>
          <Button
            type="link"
            icon={<ReloadOutlined />}
            disabled={
              record.status === "RESOLVED" || retryingIds.includes(record._id)
            }
            onClick={() => handleRetry(record)}
          >
            {retryingIds.includes(record._id) ? "재시도 중..." : "재시도"}
          </Button>
          <Button
            type="link"
            danger
            icon={<ReloadOutlined />}
            disabled={
              record.status === "RESOLVED" ||
              retryingIds.includes(`${record._id}_admin`)
            }
            onClick={() => handleAdminRetry(record)}
          >
            {retryingIds.includes(`${record._id}_admin`)
              ? "멤버쉽 부여 중..."
              : "어드민 권한으로 멤버쉽 부여"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Container>
      {contextHolder}
      <h1>결제 실패 이력</h1>

      <Form
        form={form}
        onFinish={onSearch}
        layout="inline"
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="userId">
          <Input placeholder="User ID" />
        </Form.Item>
        <Form.Item name="productId">
          <Input placeholder="Product ID" />
        </Form.Item>
        <Form.Item name="dateRange">
          <RangePicker />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            검색
          </Button>
        </Form.Item>
      </Form>

      {/* 가로 스크롤 컨테이너 */}
      <div style={{ width: "100%", overflowX: "auto" }}>
        <Table
          columns={columns}
          dataSource={failures}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          tableLayout="fixed"
          scroll={{ x: "max-content" }} // 표 내부에서만 가로 스크롤
        />
      </div>
    </Container>
  );
}

const Container = styled.div`
  padding: 24px;
  max-width: 100%;
`;
