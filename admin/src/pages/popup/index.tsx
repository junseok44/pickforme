import { useState, useEffect, useCallback } from "react";
import styled from "@emotion/styled";
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  message,
  DatePicker,
  Switch,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useAtom } from "jotai";
import { usersAtom } from "@/stores/user/atoms";
import client from "@/utils/axios";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ko");

interface Popup {
  popup_id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export default function PopupManagement() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [hasDuration, setHasDuration] = useState(false);

  // 팝업 목록 조회
  const fetchPopups = useCallback(async () => {
    try {
      const { data } = await client.get("/popup");
      setPopups(data);
    } catch (error: any) {
      console.error("팝업 목록 조회 실패:", error);
      messageApi.error(
        error.response?.data?.error || "팝업 목록을 불러오는데 실패했습니다."
      );
    }
  }, [messageApi]);

  useEffect(() => {
    fetchPopups();
  }, [fetchPopups]);

  // 팝업 생성
  const handleCreate = async (values: any) => {
    try {
      const { startDate, endDate, ...otherValues } = values;

      const payload = {
        ...otherValues,
        startDate:
          hasDuration && startDate ? startDate.toISOString() : undefined,
        endDate: hasDuration && endDate ? endDate.toISOString() : undefined,
      };

      const { data } = await client.post("/popup", payload);

      if (data) {
        setIsModalVisible(false);
        form.resetFields();
        setHasDuration(false);
        fetchPopups();
        messageApi.success("팝업이 성공적으로 생성되었습니다.");
      }
    } catch (error: any) {
      console.error("팝업 생성 실패:", error);
      messageApi.error(
        error.response?.data?.error || "팝업 생성에 실패했습니다."
      );
    }
  };

  // 팝업 삭제
  const handleDelete = async (popup_id: string) => {
    try {
      const { data } = await client.delete(`/popup/${popup_id}`);

      if (data) {
        fetchPopups();
        messageApi.success("팝업이 성공적으로 삭제되었습니다.");
      }
    } catch (error: any) {
      console.error("팝업 삭제 실패:", error);
      messageApi.error(
        error.response?.data?.error || "팝업 삭제에 실패했습니다."
      );
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "popup_id",
      key: "popup_id",
    },
    {
      title: "제목",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "설명",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "기간",
      key: "duration",
      render: (_: any, record: Popup) => {
        if (!record.startDate && !record.endDate) {
          return "무제한";
        }

        if (record.startDate && record.endDate) {
          const startDate = dayjs(record.startDate)
            .tz("Asia/Seoul")
            .format("YYYY년 MM월 DD일");
          const endDate = dayjs(record.endDate)
            .tz("Asia/Seoul")
            .format("YYYY년 MM월 DD일");
          return `${startDate} ~ ${endDate}`;
        }

        if (record.startDate && !record.endDate) {
          const startDate = dayjs(record.startDate)
            .tz("Asia/Seoul")
            .format("YYYY년 MM월 DD일");
          return `${startDate} ~ 무제한`;
        }

        if (!record.startDate && record.endDate) {
          const endDate = dayjs(record.endDate)
            .tz("Asia/Seoul")
            .format("YYYY년 MM월 DD일");
          return `즉시 ~ ${endDate}`;
        }

        return "무제한";
      },
    },
    {
      title: "작업",
      key: "action",
      render: (_: any, record: Popup) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.popup_id)}
        />
      ),
    },
  ];

  return (
    <Container>
      {contextHolder}
      <Header>
        <TitleContainer>
          <h1>팝업 관리</h1>
          <SubTitle>앱에서 보여줄 팝업 목록을 설정합니다.</SubTitle>
        </TitleContainer>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          새 팝업
        </Button>
      </Header>

      <Table columns={columns} dataSource={popups} rowKey="popup_id" />

      <Modal
        title="새 팝업 생성"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setHasDuration(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="popup_id"
            label="팝업 ID"
            rules={[{ required: true, message: "팝업 ID를 입력해주세요" }]}
            tooltip="앱에서 팝업을 구분해서 보여주기 위한 고유 ID입니다. 쉬운 id를 사용하되 기존 popup_id와 중복되지 않도록 해주세요."
          >
            <Input placeholder="event_hansiryun" />
          </Form.Item>
          <Form.Item
            name="title"
            label="제목"
            rules={[{ required: true, message: "제목을 입력해주세요" }]}
            tooltip="팝업을 구분하기 위한 제목입니다."
          >
            <Input placeholder="한시련 이벤트" />
          </Form.Item>
          <Form.Item
            name="description"
            label="설명"
            tooltip="팝업을 구분하기 위한 설명입니다."
          >
            <Input.TextArea placeholder="한시련 이벤트 팝업입니다." />
          </Form.Item>
          <Form.Item
            label="기간 지정"
            tooltip="기간을 지정하면 해당 기간에만 팝업이 표시됩니다. 지정하지 않으면 무제한으로 표시됩니다."
          >
            <Switch
              checked={hasDuration}
              onChange={setHasDuration}
              checkedChildren="지정"
              unCheckedChildren="무제한"
            />
          </Form.Item>
          {hasDuration && (
            <>
              <Form.Item
                name="startDate"
                label="시작 날짜 (선택사항)"
                tooltip="팝업이 표시되기 시작할 날짜입니다. 지정하지 않으면 즉시 시작됩니다."
              >
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="시작 날짜 선택 (선택사항)"
                  showTime
                  format="YYYY-MM-DD HH:mm"
                />
              </Form.Item>
              <Form.Item
                name="endDate"
                label="종료 날짜 (선택사항)"
                tooltip="팝업이 표시를 중단할 날짜입니다. 지정하지 않으면 무제한으로 표시됩니다."
              >
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="종료 날짜 선택 (선택사항)"
                  showTime
                  format="YYYY-MM-DD HH:mm"
                />
              </Form.Item>
            </>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit">
              생성
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
}

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SubTitle = styled.p`
  color: #666;
  font-size: 14px;
  margin: 0;
`;
