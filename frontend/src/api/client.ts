// frontend/src/api/client.ts
// 本番: Vercel Env (VITE_API_BASE=https://udon-app.onrender.com)
// ローカル: 未設定なら http://localhost:8000
export const BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000").replace(/\/+$/, "");

/** 汎用 GET（フルURLでもOK） */
export async function getJSON<T = unknown>(url: string) {
  const res = await fetch(url, { credentials: "omit" });
  const text = await res.text();
  const ctype = res.headers.get("Content-Type") || "";

  let data: unknown = text;
  if (ctype.includes("application/json")) {
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      console.error("JSON parse error:", e, "raw:", text);
      throw e;
    }
  }
  if (!res.ok) {
    console.error("API error", res.status, data);
    throw new Error(`API ${res.status}`);
  }
  return data as T;
}

/** パスを BASE と結合（path は必ず '/' 始まり） */
function full(path: string) {
  if (!path.startsWith("/")) throw new Error("path must start with '/'");
  return `${BASE}${path}`;
}

/** 互換ラッパー: posts.ts / likes.ts / orders.ts 等が使う想定 */
export async function apiGet<T>(path: string) {
  return getJSON<T>(full(path));
}

export async function apiPost<T>(path: string, body: any, extraHeaders?: Record<string, string>) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(extraHeaders || {}) };
  const r = await fetch(full(path), { method: "POST", headers, body: JSON.stringify(body ?? {}) });
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) throw new Error((data as any)?.detail ?? `HTTP ${r.status}`);
  return data as T;
}

export async function apiDelete<T>(path: string, extraHeaders?: Record<string, string>) {
  const headers: Record<string, string> = { ...(extraHeaders || {}) };
  const r = await fetch(full(path), { method: "DELETE", headers });
  if (!r.ok) {
    const text = await r.text();
    const data = text ? JSON.parse(text) : null;
    throw new Error((data as any)?.detail ?? `HTTP ${r.status}`);
  }
  // DELETE は多くが 204 を返すので undefined を T にキャスト
  return undefined as T;
}

export async function apiPatch<T>(path: string, body?: any, extraHeaders?: Record<string, string>) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(extraHeaders || {}) };
  const r = await fetch(full(path), { method: "PATCH", headers, body: JSON.stringify(body ?? {}) });
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) throw new Error((data as any)?.detail ?? `HTTP ${r.status}`);
  return data as T;
}

export async function apiPut<T>(path: string, body?: any, extraHeaders?: Record<string, string>) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(extraHeaders || {}) };
  const r = await fetch(full(path), { method: "PUT", headers, body: JSON.stringify(body ?? {}) });
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) throw new Error((data as any)?.detail ?? `HTTP ${r.status}`);
  return data as T;
}

// デバッグ（本番でも一度だけ BASE を表示）
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("API_BASE =", BASE);
}