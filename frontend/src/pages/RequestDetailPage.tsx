import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MailOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { getRequest, reviewRequest, cancelRequest } from "../services/api";
import type { AccessRequest } from "../types";

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  pending: "blue",
  approved: "green",
  rejected: "red",
  cancelled: "default",
};

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [req, setReq] = useState<AccessRequest | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>("approved");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setReq(await getRequest(id!));
    } catch {
      message.error("Request not found");
      nav("/requests");
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleReview = async () => {
    setLoading(true);
    try {
      const updated = await reviewRequest(id!, {
        status: reviewStatus,
        reviewer_comment: comment || undefined,
      });
      setReq(updated);
      message.success(`Request ${reviewStatus}`);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelRequest(id!);
      message.success("Request cancelled");
      load();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!req) return null;

  const isPending = req.status === "pending";

  return (
    <Card style={{ maxWidth: 900, margin: "0 auto" }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>
          Access Request
        </Title>
        <Tag color={STATUS_COLORS[req.status]} style={{ fontSize: 14, padding: "4px 12px" }}>
          {req.status.toUpperCase()}
        </Tag>
      </Space>

      <Divider />

      <Descriptions bordered column={2}>
        <Descriptions.Item label="Requester">{req.requester_name}</Descriptions.Item>
        <Descriptions.Item label="Email">{req.requester_email}</Descriptions.Item>
        <Descriptions.Item label="Requested Role">
          {req.requested_role.replace("_", " ").toUpperCase()}
        </Descriptions.Item>
        <Descriptions.Item label="Purpose Category">
          {req.purpose_category.replace("_", " ")}
        </Descriptions.Item>
        <Descriptions.Item label="Purpose (free text)" span={2}>
          {req.purpose_text || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Owner">{req.owner_name || "—"}</Descriptions.Item>
        <Descriptions.Item label="Owner Email">
          {req.owner_email ? (
            <a href={`mailto:${req.owner_email}`}>
              <MailOutlined /> {req.owner_email}
            </a>
          ) : (
            "—"
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {new Date(req.created_at).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="Updated">
          {new Date(req.updated_at).toLocaleString()}
        </Descriptions.Item>
        {req.reviewer_comment && (
          <Descriptions.Item label="Reviewer Comment" span={2}>
            {req.reviewer_comment}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Divider>Requested Assets</Divider>

      <Table
        rowKey={(_, i) => String(i)}
        dataSource={req.items}
        pagination={false}
        columns={[
          { title: "Type", dataIndex: "entity_type", key: "type" },
          {
            title: "Fully Qualified Name",
            dataIndex: "entity_fqn",
            key: "fqn",
            render: (v: string) => <Text code>{v}</Text>,
          },
          {
            title: "Display Name",
            dataIndex: "entity_display_name",
            key: "display",
            render: (v: string | null) => v || "—",
          },
        ]}
      />

      {isPending && (
        <>
          <Divider>Review</Divider>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Select
                value={reviewStatus}
                onChange={setReviewStatus}
                style={{ width: 160 }}
                options={[
                  { value: "approved", label: "Approve" },
                  { value: "rejected", label: "Reject" },
                ]}
              />
              <Input
                placeholder="Comment (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ width: 400 }}
              />
            </Space>
            <Space>
              <Button
                type="primary"
                icon={reviewStatus === "approved" ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                loading={loading}
                onClick={handleReview}
              >
                {reviewStatus === "approved" ? "Approve" : "Reject"}
              </Button>
              <Button danger icon={<StopOutlined />} loading={loading} onClick={handleCancel}>
                Cancel Request
              </Button>
            </Space>
          </Space>
        </>
      )}
    </Card>
  );
}
