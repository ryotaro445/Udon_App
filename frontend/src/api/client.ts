// frontend/src/api/client.ts
// 本番：Vercel の Env (VITE_API_BASE=https://udon-app.onrender.com) を使用
// ローカル：未設定なら http://localhost:8000 にフォールバック
export const BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000").replace(/\/+$/, "");

// 汎用 GET（レスポンスが JSON 以外でも安全に扱う）
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

// デバッグ（本番でも一度だけ BASE を表示）
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("API_BASE =", BASE);
}