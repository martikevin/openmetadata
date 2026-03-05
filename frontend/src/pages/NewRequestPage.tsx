import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
  Divider,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { createRequest, fetchEnums } from "../services/api";
import type { Enums } from "../types";

const { Title } = Typography;

const ENTITY_TYPES = [
  { value: "table", label: "Table" },
  { value: "topic", label: "Topic" },
  { value: "dashboard", label: "Dashboard" },
  { value: "pipeline", label: "Pipeline" },
  { value: "mlmodel", label: "ML Model" },
  { value: "container", label: "Container" },
  { value: "storedProcedure", label: "Stored Procedure" },
];

export default function NewRequestPage() {
  const [form] = Form.useForm();
  const nav = useNavigate();
  const [enums, setEnums] = useState<Enums | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEnums().then(setEnums).catch(() => message.error("Failed to load options"));
  }, []);

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const req = await createRequest(values);
      message.success("Access request created!");
      nav(`/requests/${req.id}`);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!enums) return null;

  return (
    <Card style={{ maxWidth: 800, margin: "0 auto" }}>
      <Title level={3}>New Access Request</Title>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* Requester info */}
        <Form.Item name="requester_name" label="Your Name" rules={[{ required: true }]}>
          <Input placeholder="Jane Doe" />
        </Form.Item>
        <Form.Item
          name="requester_email"
          label="Your Email"
          rules={[{ required: true, type: "email" }]}
        >
          <Input placeholder="jane@company.com" />
        </Form.Item>

        <Divider>Requested Role & Purpose</Divider>

        <Form.Item name="requested_role" label="Role" initialValue="viewer">
          <Select options={enums.roles} />
        </Form.Item>

        <Form.Item name="purpose_category" label="Purpose Category" initialValue="other">
          <Select options={enums.purpose_categories} />
        </Form.Item>

        <Form.Item name="purpose_text" label="Purpose (free text)">
          <Input.TextArea rows={3} placeholder="Describe why you need access…" />
        </Form.Item>

        <Divider>Data Assets</Divider>

        <Form.List
          name="items"
          rules={[
            {
              validator: async (_, items) => {
                if (!items || items.length === 0)
                  throw new Error("Add at least one asset");
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(({ key, name, ...rest }) => (
                <Space key={key} align="baseline" style={{ display: "flex", marginBottom: 8 }}>
                  <Form.Item
                    {...rest}
                    name={[name, "entity_type"]}
                    rules={[{ required: true, message: "Type required" }]}
                  >
                    <Select
                      placeholder="Type"
                      options={ENTITY_TYPES}
                      style={{ width: 160 }}
                    />
                  </Form.Item>
                  <Form.Item
                    {...rest}
                    name={[name, "entity_fqn"]}
                    rules={[{ required: true, message: "FQN required" }]}
                  >
                    <Input placeholder="service.database.schema.table" style={{ width: 360 }} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, "entity_display_name"]}>
                    <Input placeholder="Display name (optional)" style={{ width: 200 }} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Asset
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} size="large" block>
            Submit Request
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
