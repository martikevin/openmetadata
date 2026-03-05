/*
 *  Copyright 2024 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import {
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TitleBreadcrumb from '../../components/common/TitleBreadcrumb/TitleBreadcrumb.component';
import { TitleBreadcrumbProps } from '../../components/common/TitleBreadcrumb/TitleBreadcrumb.interface';
import PageLayoutV1 from '../../components/PageLayoutV1/PageLayoutV1';

const { Title, Text } = Typography;

// ── Types ──────────────────────────────────────────────────────────────────

interface RequestItem {
  entity_type: string;
  entity_fqn: string;
  entity_display_name?: string;
}

interface AccessRequest {
  id: string;
  requester_name: string;
  requester_email: string;
  requested_role: string;
  purpose_category: string;
  purpose_text?: string;
  owner_name?: string;
  status: string;
  created_at: string;
  items: RequestItem[];
}

// ── Config ─────────────────────────────────────────────────────────────────

const BACKEND_URL =
  (window as any).__REQUEST_ACCESS_BACKEND_URL || '/api/request-access';

const ROLES = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
];

const PURPOSES = [
  { value: 'analytics', label: 'Analytics' },
  { value: 'reporting', label: 'Reporting' },
  { value: 'machine_learning', label: 'Machine Learning' },
  { value: 'data_quality', label: 'Data Quality' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'development', label: 'Development' },
  { value: 'other', label: 'Other' },
];

const ENTITY_TYPES = [
  { value: 'table', label: 'Table' },
  { value: 'topic', label: 'Topic' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'mlmodel', label: 'ML Model' },
  { value: 'container', label: 'Container' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'blue',
  approved: 'green',
  rejected: 'red',
  cancelled: 'default',
};

// ── API helpers ────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ── Component ──────────────────────────────────────────────────────────────

const RequestAccessPage: React.FC = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [form] = Form.useForm();

  const breadcrumb: TitleBreadcrumbProps['titleLinks'] = useMemo(
    () => [{ name: t('label.request-access'), url: '' }],
    [t]
  );

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : '';
      setRequests(await apiFetch<AccessRequest[]>(`/requests${qs}`));
    } catch {
      // Backend not reachable – show empty state
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await apiFetch('/requests', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      message.success('Access request created');
      setModalOpen(false);
      form.resetFields();
      loadRequests();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (
    id: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      await apiFetch(`/requests/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      message.success(`Request ${status}`);
      loadRequests();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const columns: ColumnsType<AccessRequest> = [
    { title: 'Requester', dataIndex: 'requester_name', key: 'name' },
    {
      title: 'Role',
      dataIndex: 'requested_role',
      key: 'role',
      render: (v: string) => v.toUpperCase(),
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose_category',
      key: 'purpose',
      render: (v: string) => v.replace(/_/g, ' '),
    },
    {
      title: 'Assets',
      key: 'items',
      render: (_, r) =>
        r.items
          .map((i) => i.entity_display_name || i.entity_fqn)
          .join(', '),
    },
    { title: 'Owner', dataIndex: 'owner_name', key: 'owner' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={STATUS_COLORS[s]}>{s.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) =>
        r.status === 'pending' ? (
          <Space>
            <Button
              size="small"
              type="primary"
              onClick={() => handleReview(r.id, 'approved')}>
              Approve
            </Button>
            <Button
              danger
              size="small"
              onClick={() => handleReview(r.id, 'rejected')}>
              Reject
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <PageLayoutV1 pageTitle={t('label.request-access')}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <TitleBreadcrumb titleLinks={breadcrumb} />
        </Col>

        <Col span={24}>
          <Card>
            <Space
              style={{
                width: '100%',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
              <Title level={4} style={{ margin: 0 }}>
                {t('label.request-access')}
                <Badge
                  count={requests.filter((r) => r.status === 'pending').length}
                  offset={[8, -4]}
                  style={{ backgroundColor: '#1890ff' }}
                />
              </Title>
              <Space>
                <Select
                  allowClear
                  options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                  placeholder="Filter by status"
                  style={{ width: 180 }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
                <Button type="primary" onClick={() => setModalOpen(true)}>
                  New Request
                </Button>
              </Space>
            </Space>

            <Table
              columns={columns}
              dataSource={requests}
              loading={loading}
              pagination={{ pageSize: 20 }}
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>

      {/* ── New Request Modal ────────────────────────────────────────── */}
      <Modal
        destroyOnClose
        footer={null}
        open={modalOpen}
        title="New Access Request"
        width={720}
        onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Your Name"
                name="requester_name"
                rules={[{ required: true }]}>
                <Input placeholder="Jane Doe" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Your Email"
                name="requester_email"
                rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="jane@company.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                initialValue="viewer"
                label="Requested Role"
                name="requested_role">
                <Select options={ROLES} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                initialValue="other"
                label="Purpose"
                name="purpose_category">
                <Select options={PURPOSES} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Purpose (free text)" name="purpose_text">
            <Input.TextArea
              placeholder="Describe why you need access…"
              rows={2}
            />
          </Form.Item>

          <Divider plain>Data Assets</Divider>

          <Form.List
            name="items"
            rules={[
              {
                validator: async (_, items) => {
                  if (!items || items.length === 0) {
                    throw new Error('Add at least one asset');
                  }
                },
              },
            ]}>
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space
                    key={key}
                    style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item
                      {...rest}
                      name={[name, 'entity_type']}
                      rules={[{ required: true, message: 'Type required' }]}>
                      <Select
                        options={ENTITY_TYPES}
                        placeholder="Type"
                        style={{ width: 130 }}
                      />
                    </Form.Item>
                    <Form.Item
                      {...rest}
                      name={[name, 'entity_fqn']}
                      rules={[{ required: true, message: 'FQN required' }]}>
                      <Input
                        placeholder="service.database.schema.table"
                        style={{ width: 300 }}
                      />
                    </Form.Item>
                    <Form.Item
                      {...rest}
                      name={[name, 'entity_display_name']}>
                      <Input
                        placeholder="Display name"
                        style={{ width: 160 }}
                      />
                    </Form.Item>
                    <Button danger size="small" onClick={() => remove(name)}>
                      ✕
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button block type="dashed" onClick={() => add()}>
                    + Add Asset
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Button
              block
              htmlType="submit"
              loading={submitting}
              size="large"
              type="primary">
              Submit Request
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageLayoutV1>
  );
};

export default RequestAccessPage;
