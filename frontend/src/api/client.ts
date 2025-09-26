// frontend/src/api/client.ts
import { getStaffToken } from "../components/auth/RequireStaff";

// 本番: VercelのEnv / ローカル: http://localhost:8000
export const BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000").replace(/\/+$/, "");

type HeadersMap = Record<string, string>;

function toURL(url: string) {
  // "http" で始まらない＝相対パスなら BASE を付与
  return /^https?:\/\//i.test(url) ? url : `${BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

// ---- GET は既に BASE を付けている実装があるなら残してOK ----
export async function getJSON<T = unknown>(url: string) {
  const res = await fetch(toURL(url), { credentials: "omit" });
  const text = await res.text();
  const ctype = res.headers.get("Content-Type") || "";
  const data = ctype.includes("application/json") ? (text ? JSON.parse(text) : null) : text;
  if (!res.ok) throw new Error(`API ${res.status}`);
  return data as T;
}

// ---- ここが重要：POST/PUT/PATCH/DELETE でも toURL() を通す ----
export async function apiPost<T>(url: string, body: any, extraHeaders?: HeadersMap) {
  const token = getStaffToken();
  const headers: HeadersMap = { "Content-Type": "application/json", ...(extraHeaders || {}) };
  if (token) headers["X-Staff-Token"] = token;
  const r = await fetch(toURL(url), { method: "POST", headers, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as any).detail ?? "Request failed");
  return j as T;
}

export async function apiPatch<T>(url: string, body?: any, extraHeaders?: HeadersMap) {
  const token = getStaffToken();
  const headers: HeadersMap = { "Content-Type": "application/json", ...(extraHeaders || {}) };
  if (token) headers["X-Staff-Token"] = token;
  const r = await fetch(toURL(url), { method: "PATCH", headers, body: JSON.stringify(body ?? {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as any).detail ?? "Request failed");
  return j as T;
}

export async function apiPut<T>(url: string, body?: any, extraHeaders?: HeadersMap) {
  const token = getStaffToken();
  const headers: HeadersMap = { "Content-Type": "application/json", ...(extraHeaders || {}) };
  if (token) headers["X-Staff-Token"] = token;
  const r = await fetch(toURL(url), { method: "PUT", headers, body: JSON.stringify(body ?? {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as any).detail ?? "Request failed");
  return j as T;
}

export async function apiDelete<T>(url: string, extraHeaders?: HeadersMap) {
  const token = getStaffToken();
  const headers: HeadersMap = { ...(extraHeaders || {}) };
  if (token) headers["X-Staff-Token"] = token;
  const r = await fetch(toURL(url), { method: "DELETE", headers });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error((j as any).detail ?? "Request failed");
  }
  return undefined as T;
}