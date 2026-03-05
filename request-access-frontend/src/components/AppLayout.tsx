import { Layout, Menu } from "antd";
import {
  PlusCircleOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const { Header, Content } = Layout;

export default function AppLayout() {
  const nav = useNavigate();
  const loc = useLocation();

  const items = [
    { key: "/requests", icon: <UnorderedListOutlined />, label: "Requests" },
    { key: "/requests/new", icon: <PlusCircleOutlined />, label: "New Request" },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{ color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}
          onClick={() => nav("/requests")}
        >
          Request Access
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[loc.pathname]}
          items={items}
          onClick={({ key }) => nav(key)}
          style={{ flex: 1 }}
        />
      </Header>
      <Content style={{ padding: 24 }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
