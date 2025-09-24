// frontend/src/api/client.ts
import { getStaffToken } from "../components/auth/RequireStaff";

export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

type HeadersMap = Record<string, string>;

type Query =
  | Record<string, string | number | boolean | undefined | null>
  | URLSearchParams;

type RequestOpts = {
  headers?: HeadersMap;
  signal?: AbortSignal;
  query?: Query;
};

function buildUrl(path: string, query?: Query) {
  if (!path.startsWith("/")) throw new Error("path must start with '/'");
  if (!query) return path;

  const usp =
    query instanceof URLSearchParams
      ? query
      : new URLSearchParams(
          Object.entries(query).flatMap(([k, v]) =>
            v === undefined || v === null ? [] : [[k, String(v)]]
          )
        );

  const hasQ = path.includes("?");
  return hasQ ? `${path}&${usp}` : `${path}?${usp}`;
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  opts: RequestOpts = {}
): Promise<T> {
  // ✅ BASEは使わず、必ず "/api/..." を渡す前提（Viteのproxyで8000へ転送）
  const url = buildUrl(path, opts.query);

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
    signal: opts.signal,
    body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(body ?? {}),
  });

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  // 異常系は本文も付けて投げる
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
  }

  // JSON 以外が返ってきた場合の安全策（HTMLをJSONとして読んで落ちるのを防ぐ）
  const ctype = res.headers.get("Content-Type") || "";
  if (!ctype.includes("application/json")) {
    const text = await res.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return text as any as T;
  }

  return (await res.json()) as T;
}

export function apiGet<T>(path: string, opts?: RequestOpts) {
  return request<T>("GET", path, undefined, opts);
}

export function apiPatch<T>(path: string, body?: unknown, opts?: RequestOpts) {
  return request<T>("PATCH", path, body, opts);
}
export function apiPut<T>(path: string, body?: unknown, opts?: RequestOpts) {
  return request<T>("PUT", path, body, opts);
}

export async function apiPost<T>(url: string, body: any, extraHeaders?: Record<string,string>) {
  const token = getStaffToken();
  const headers: any = { "Content-Type": "application/json", ...(extraHeaders || {}) };
  if (token) headers["X-Staff-Token"] = token;
  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const j = await r.json().catch(()=> ({}));
  if (!r.ok) throw new Error((j as any).detail ?? "Request failed");
  return j as T;
}

export async function apiDelete<T>(url: string, extraHeaders?: Record<string,string>) {
  const token = getStaffToken();
  const headers: any = { ...(extraHeaders || {}) };
  if (token) headers["X-Staff-Token"] = token;
  const r = await fetch(url, { method: "DELETE", headers });
  if (!r.ok) {
    const j = await r.json().catch(()=> ({}));
    throw new Error((j as any).detail ?? "Request failed");
  }
  return undefined as T;
}