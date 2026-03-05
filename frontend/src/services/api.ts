const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Enums ──────────────────────────────────────────────────────────────────

import type { Enums, AccessRequest } from "../types";

export const fetchEnums = () => request<Enums>("/requests/enums");

// ── Requests CRUD ──────────────────────────────────────────────────────────

export const createRequest = (body: object) =>
  request<AccessRequest>("/requests", { method: "POST", body: JSON.stringify(body) });

export const listRequests = (status?: string) =>
  request<AccessRequest[]>(`/requests${status ? `?status=${status}` : ""}`);

export const getRequest = (id: string) =>
  request<AccessRequest>(`/requests/${id}`);

export const reviewRequest = (id: string, body: { status: string; reviewer_comment?: string }) =>
  request<AccessRequest>(`/requests/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const cancelRequest = (id: string) =>
  request<void>(`/requests/${id}`, { method: "DELETE" });

// ── Asset search ───────────────────────────────────────────────────────────

export const searchAssets = (q: string, entityType?: string) =>
  request<any>(`/assets/search?q=${encodeURIComponent(q)}${entityType ? `&entity_type=${entityType}` : ""}`);
