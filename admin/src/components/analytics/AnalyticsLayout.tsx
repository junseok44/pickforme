import React from "react";
import { Layout, Spin, Alert } from "antd";
import AnalyticsMenu from "./AnalyticsMenu";
import DateRangePicker from "./DateRangePicker";

const { Sider, Content } = Layout;

interface AnalyticsLayoutProps {
  selectedKey: string;
  title: string;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}

const AnalyticsLayout: React.FC<AnalyticsLayoutProps> = ({
  selectedKey,
  title,
  loading = false,
  error = null,
  children,
}) => {
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <Alert message="오류" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={250} style={{ background: "#fff" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #f0f0f0" }}>
          <h2>Analytics</h2>
        </div>
        <AnalyticsMenu selectedKey={selectedKey} />
      </Sider>

      <Layout>
        <Content style={{ padding: "24px", background: "#f5f5f5" }}>
          <h1 style={{ marginBottom: "24px" }}>{title}</h1>
          <DateRangePicker />
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AnalyticsLayout;
