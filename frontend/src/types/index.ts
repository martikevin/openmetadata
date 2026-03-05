export interface RequestItem {
  id?: string;
  entity_type: string;
  entity_fqn: string;
  entity_id?: string;
  entity_display_name?: string;
}

export interface AccessRequest {
  id: string;
  requester_name: string;
  requester_email: string;
  requested_role: string;
  purpose_category: string;
  purpose_text?: string;
  owner_name?: string;
  owner_email?: string;
  status: string;
  reviewer_comment?: string;
  created_at: string;
  updated_at: string;
  items: RequestItem[];
}

export interface EnumOption {
  value: string;
  label: string;
}

export interface Enums {
  roles: EnumOption[];
  purpose_categories: EnumOption[];
  statuses: EnumOption[];
}
