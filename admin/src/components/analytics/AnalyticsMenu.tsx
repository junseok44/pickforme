import React from "react";
import { Menu } from "antd";
import {
  UserOutlined,
  HomeOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

interface AnalyticsMenuProps {
  selectedKey: string;
}

const AnalyticsMenu: React.FC<AnalyticsMenuProps> = ({ selectedKey }) => {
  const router = useRouter();

  const menuItems = [
    {
      key: "overview",
      icon: <FileTextOutlined />,
      label: "전체 통계",
      onClick: () => router.push("/analytics"),
    },
    {
      key: "user",
      icon: <UserOutlined />,
      label: "사용자 통계",
      onClick: () => router.push("/analytics/user"),
    },
    {
      key: "home",
      icon: <HomeOutlined />,
      label: "홈화면 통계",
      onClick: () => router.push("/analytics/home"),
    },
    {
      key: "search",
      icon: <SearchOutlined />,
      label: "검색 통계",
      onClick: () => router.push("/analytics/search"),
    },
    {
      key: "productDetail",
      icon: <ShoppingCartOutlined />,
      label: "상품 상세페이지 & 링크 검색 통계",
      onClick: () => router.push("/analytics/product-detail"),
    },
    {
      key: "membership",
      icon: <UserOutlined />,
      label: "멤버십 통계",
      onClick: () => router.push("/analytics/membership"),
    },
    {
      key: "manager",
      icon: <QuestionCircleOutlined />,
      label: "매니저 관련 통계",
      onClick: () => router.push("/analytics/manager"),
    },
    {
      key: "user-analytics",
      icon: <TeamOutlined />,
      label: "유저 분석",
      onClick: () => router.push("/analytics/user-analytics"),
    },
  ];

  return (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      style={{ borderRight: 0 }}
      items={menuItems}
    />
  );
};

export default AnalyticsMenu;
