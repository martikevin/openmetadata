import { useEffect, useState } from "react";
import { Button, Card, Select, Space, Table, Tag, Typography, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listRequests, fetchEnums } from "../services/api";
import type { AccessRequest, Enums } from "../types";

const { Title } = Typography;

const STATUS_COLORS: Record<string, string> = {
  pending: "blue",
  approved: "green",
  rejected: "red",
  cancelled: "default",
};

export default function RequestListPage() {
  const nav = useNavigate();
  const [data, setData] = useState<AccessRequest[]>([]);
  const [enums, setEnums] = useState<Enums | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const load = async (status?: string) => {
    setLoading(true);
    try {
      const [reqs, e] = await Promise.all([listRequests(status), fetchEnums()]);
      setData(reqs);
      setEnums(e);
    } catch {
      message.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter]);

  const columns = [
    {
      title: "Requester",
      dataIndex: "requester_name",
      key: "requester_name",
    },
    {
      title: "Role",
      dataIndex: "requested_role",
      key: "requested_role",
      render: (v: string) => v.replace("_", " ").toUpperCase(),
    },
    {
      title: "Purpose",
      dataIndex: "purpose_category",
      key: "purpose_category",
      render: (v: string) => v.replace("_", " "),
    },
    {
      title: "Assets",
      key: "items",
      render: (_: any, r: AccessRequest) =>
        r.items.map((i) => i.entity_display_name || i.entity_fqn).join(", "),
    },
    {
      title: "Owner",
      dataIndex: "owner_name",
      key: "owner_name",
      render: (v: string | null) => v || "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s.toUpperCase()}</Tag>,
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: "",
      key: "action",
      render: (_: any, r: AccessRequest) => (
        <Button size="small" onClick={() => nav(`/requests/${r.id}`)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          Access Requests
        </Title>
        <Space>
          <Select
            allowClear
            placeholder="Filter by status"
            style={{ width: 180 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={enums?.statuses}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => nav("/requests/new")}>
            New Request
          </Button>
        </Space>
      </Space>
      <Table
        rowKey="id"
        dataSource={data}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </Card>
  );
}
