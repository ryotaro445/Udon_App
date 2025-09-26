// src/api/client.ts
export const BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000").replace(/\/+$/, "");

type HeadersMap = Record<string, string>;

async function request<T>(method: "GET"|"POST"|"DELETE"|"PATCH"|"PUT", path: string, body?: unknown, headers?: HeadersMap) {
  if (!path.startsWith("/")) throw new Error("path must start with '/'");
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  const ctype = res.headers.get("Content-Type") ?? "";
  const data = ctype.includes("application/json") ? (text ? JSON.parse(text) : null) : text;
  if (!res.ok) throw new Error((data as any)?.detail ?? `HTTP ${res.status}`);
  return data as T;
}

export const apiGet    = <T>(path: string, headers?: HeadersMap) => request<T>("GET",    path, undefined, headers);
export const apiPost   = <T>(path: string, body?: unknown, headers?: HeadersMap) => request<T>("POST",   path, body, headers);
export const apiDelete = <T>(path: string, headers?: HeadersMap) => request<T>("DELETE", path, undefined, headers);
export const apiPatch  = <T>(path: string, body?: unknown, headers?: HeadersMap) => request<T>("PATCH",  path, body, headers);
export const apiPut    = <T>(path: string, body?: unknown, headers?: HeadersMap) => request<T>("PUT",    path, body, headers);

// デバッグ表示（1回だけ）
if (typeof window !== "undefined") console.log("API_BASE =", BASE);