import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  DatePicker,
  message,
  Space,
  Typography,
  Tag,
  Avatar,
  Row,
  Col,
  Divider,
  Spin,
} from "antd";
import {
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import AnalyticsLayout from "@/components/analytics/AnalyticsLayout";
import { useAnalyticsDate } from "@/contexts/AnalyticsDateContext";
import axios from "@/utils/axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface ActiveUser {
  user_unique_id: string;
  total_events: number;
  first_event_time: string;
  last_event_time: string;
}

interface UserEvent {
  user_unique_id: string;
  event_name: string;
  event_timestamp: number;
  category?: string;
  search_query?: string;
  session_id?: string;
  screen?: string;
  tab?: string;
  type?: string;
}

interface ActiveUsersResponse {
  success: boolean;
  data: ActiveUser[];
  queryParams: {
    date: string;
  };
}

interface UserEventsResponse {
  success: boolean;
  data: UserEvent[];
  queryParams: {
    userUniqueId: string;
    date: string;
  };
}

const UserAnalyticsPage: React.FC = () => {
  const { dateRange } = useAnalyticsDate();
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(dateRange.endDate);

  const fetchActiveUsers = async (date: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/analytics/statistics/active-users?date=${date}`
      );
      const result: ActiveUsersResponse = response.data;

      if (result.success) {
        // 이벤트 수 기준으로 내림차순 정렬 (백엔드에서도 정렬하지만 프론트엔드에서도 확실히 정렬)
        const sortedUsers = result.data.sort(
          (a, b) => b.total_events - a.total_events
        );
        setUsers(sortedUsers);
        // 첫 번째 유저를 자동으로 선택
        if (sortedUsers.length > 0) {
          setSelectedUser(sortedUsers[0]);
          fetchUserEvents(sortedUsers[0].user_unique_id, date);
        }
      } else {
        message.error("활성 유저 목록을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Error fetching active users:", error);
      message.error("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEvents = async (userId: string, date: string) => {
    setEventsLoading(true);
    try {
      const response = await axios.get(
        `/analytics/statistics/user-events?userUniqueId=${userId}&date=${date}`
      );
      const result: UserEventsResponse = response.data;

      if (result.success) {
        // 백엔드에서 이미 시간순으로 정렬되어 있으므로 그대로 사용

        const sortedEvents = result.data.sort((a, b) => {
          return a.event_timestamp - b.event_timestamp;
        });

        setUserEvents(sortedEvents);
      } else {
        message.error("유저 이벤트를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Error fetching user events:", error);
      message.error("서버 오류가 발생했습니다.");
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveUsers(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setSelectedDate(dateRange.endDate);
  }, [dateRange.endDate]);

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date.format("YYYY-MM-DD"));
    }
  };

  const handleUserSelect = (user: ActiveUser) => {
    setSelectedUser(user);
    fetchUserEvents(user.user_unique_id, selectedDate);
  };

  const getEventNameColor = (eventName: string): string => {
    const colorMap: { [key: string]: string } = {
      button_click: "blue",
      question_send: "green",
      login_success: "green",
      login_attempt: "orange",
      register_success: "green",
      home_item_click: "purple",
      search_item_click: "cyan",
      search_mode_view: "blue",
      link_search_attempt: "orange",
      link_search_complete: "green",
      product_detail_wishlist_toggle: "pink",
      product_detail_tab_click: "purple",
      product_detail_buy_click: "red",
      subscription_request: "gold",
      subscription_request_success: "green",
      subscription_unsubscribe: "red",
      main_products_request: "blue",
      manager_answer_push_click: "green",
    };
    return colorMap[eventName] || "default";
  };

  const eventColumns = [
    {
      title: "시간",
      dataIndex: "event_timestamp",
      key: "event_timestamp",
      width: 100,
      render: (value: number) => (
        <Space>
          <ClockCircleOutlined />
          <Text code style={{ fontSize: "12px" }}>
            {dayjs(value / 1000).format("HH:mm:ss")}
          </Text>
        </Space>
      ),
    },
    {
      title: "이벤트",
      dataIndex: "event_name",
      key: "event_name",
      width: 200,
      render: (value: string) => (
        <Tag color={getEventNameColor(value)} style={{ fontSize: "11px" }}>
          {value}
        </Tag>
      ),
    },
    {
      title: "카테고리",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (value: string) => value || "-",
    },
    {
      title: "검색어",
      dataIndex: "search_query",
      key: "search_query",
      width: 150,
      render: (value: string) => value || "-",
      ellipsis: true,
    },
    {
      title: "화면",
      dataIndex: "screen",
      key: "screen",
      width: 120,
      render: (value: string) => value || "-",
    },
    {
      title: "탭",
      dataIndex: "tab",
      key: "tab",
      width: 100,
      render: (value: string) => value || "-",
    },
    {
      title: "타입",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (value: string) => value || "-",
    },
    {
      title: "세션",
      dataIndex: "session_id",
      key: "session_id",
      width: 100,
      render: (value: string) => value || "-",
    },
  ];

  const eventSummary = userEvents.reduce((acc, event) => {
    acc[event.event_name] = (acc[event.event_name] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  return (
    <AnalyticsLayout
      selectedKey="user-analytics"
      title="유저 분석"
      loading={loading}
    >
      <Row gutter={[16, 16]} style={{ height: "calc(100vh - 200px)" }}>
        {/* 왼쪽 사이드바 - 유저 목록 */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <CalendarOutlined />
                <DatePicker
                  value={dayjs(selectedDate)}
                  onChange={handleDateChange}
                  format="YYYY-MM-DD"
                  size="small"
                />
              </Space>
            }
            size="small"
            style={{ height: "100%" }}
          >
            <div style={{ height: "calc(100vh - 300px)", overflowY: "auto" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <Spin />
                </div>
              ) : (
                <div>
                  {users.map((user) => (
                    <div
                      key={user.user_unique_id}
                      style={{
                        cursor: "pointer",
                        backgroundColor:
                          selectedUser?.user_unique_id === user.user_unique_id
                            ? "#f0f0f0"
                            : "transparent",
                        borderRadius: "6px",
                        padding: "8px",
                        margin: "4px 0",
                        border: "1px solid #f0f0f0",
                      }}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <Avatar
                          icon={<UserOutlined />}
                          style={{
                            backgroundColor:
                              selectedUser?.user_unique_id ===
                              user.user_unique_id
                                ? "#1890ff"
                                : "#d9d9d9",
                            marginRight: "12px",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: "4px" }}>
                            <Text
                              code
                              style={{
                                fontSize: "12px",
                                color:
                                  selectedUser?.user_unique_id ===
                                  user.user_unique_id
                                    ? "#1890ff"
                                    : "#000",
                              }}
                            >
                              {user.user_unique_id.slice(0, 8)}...
                            </Text>
                          </div>
                          <Space direction="vertical" size={2}>
                            <Space>
                              {/* <ActivityOutlined /> */}
                              <Text style={{ fontSize: "11px" }}>
                                {user.total_events}개 이벤트
                              </Text>
                            </Space>
                            <Text style={{ fontSize: "10px", color: "#666" }}>
                              {dayjs(user.first_event_time).format("HH:mm")} -{" "}
                              {dayjs(user.last_event_time).format("HH:mm")}
                            </Text>
                          </Space>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* 오른쪽 컨텐츠 영역 - 선택한 유저의 이벤트 */}
        <Col xs={24} lg={16}>
          <Card
            title={
              selectedUser ? (
                <Space>
                  <UserOutlined />
                  <Text code>{selectedUser.user_unique_id}</Text>
                  <Text type="secondary">
                    ({dayjs(selectedDate).format("YYYY년 MM월 DD일")})
                  </Text>
                </Space>
              ) : (
                "유저를 선택하세요"
              )
            }
            size="small"
            style={{ height: "100%" }}
            loading={eventsLoading}
          >
            {selectedUser && (
              <>
                {/* 이벤트 요약 */}
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Space wrap>
                    {Object.entries(eventSummary).map(([eventName, count]) => (
                      <Tag key={eventName} color={getEventNameColor(eventName)}>
                        {eventName}: {count}회
                      </Tag>
                    ))}
                  </Space>
                </Card>

                {/* 이벤트 테이블 */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "calc(100vh - 400px)",
                  }}
                >
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    <Table
                      columns={eventColumns}
                      dataSource={userEvents}
                      rowKey={(record, index) =>
                        `${record.event_timestamp}-${index}`
                      }
                      loading={eventsLoading}
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} / 총 ${total}개 이벤트`,
                        size: "small",
                        position: ["bottomCenter"],
                      }}
                      scroll={{ x: 1000, y: "calc(100vh - 500px)" }}
                      sticky={{ offsetHeader: 0 }}
                      size="small"
                    />
                  </div>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </AnalyticsLayout>
  );
};

export default UserAnalyticsPage;
