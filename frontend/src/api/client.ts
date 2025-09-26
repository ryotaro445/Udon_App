// src/api/client.ts
// すべてのHTTPメソッドで BASE を確実に付与する
export const BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000").replace(/\/+$/, "");

function abs(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? `${BASE}${url}` : `${BASE}/${url}`;
}

type HeadersMap = Record<string, string>;

export async function getJSON<T = unknown>(url: string, headers?: HeadersMap) {
  const res = await fetch(abs(url), { credentials: "omit", headers });
  const text = await res.text();
  const ctype = res.headers.get("Content-Type") || "";
  const data = ctype.includes("application/json") ? (text ? JSON.parse(text) : null) : text;
  if (!res.ok) {
    console.error("API error", res.status, data);
    throw new Error(`API ${res.status}`);
  }
  return data as T;
}

export async function apiPost<T>(url: string, body: any, extraHeaders?: HeadersMap) {
  const res = await fetch(abs(url), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const ctype = res.headers.get("Content-Type") || "";
  return (ctype.includes("application/json") ? await res.json() : await res.text()) as T;
}

export async function apiDelete<T>(url: string, extraHeaders?: HeadersMap) {
  const res = await fetch(abs(url), { method: "DELETE", headers: { ...(extraHeaders ?? {}) } });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  // DELETE 204 の場合もあるのでとりあえず undefined を返す
  return undefined as T;
}

export async function apiPatch<T>(url: string, body?: any, extraHeaders?: HeadersMap) {
  const res = await fetch(abs(url), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const ctype = res.headers.get("Content-Type") || "";
  return (ctype.includes("application/json") ? await res.json() : await res.text()) as T;
}

export async function apiPut<T>(url: string, body?: any, extraHeaders?: HeadersMap) {
  const res = await fetch(abs(url), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const ctype = res.headers.get("Content-Type") || "";
  return (ctype.includes("application/json") ? await res.json() : await res.text()) as T;
}