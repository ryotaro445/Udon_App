// frontend/src/api/menus.ts
import { apiGet, apiPost, apiDelete, apiPatch, apiPut } from "./client";
export type { Menu } from "../components/MenuCard";

// --------- helpers ----------
function is422(err: unknown): boolean {
  const msg = String((err as any)?.message ?? "");
  // client 実装により message か statusCode を持つ想定
  const code = (err as any)?.status ?? (err as any)?.statusCode ?? "";
  return msg.includes("422") || String(code) === "422";
}

// stock(number/bool) → in_stock(bool) へ変換（バックエンドが in_stock を期待する場合に備えた保険）
function toInStockFallback(payload: any) {
  if (payload && typeof payload === "object" && "stock" in payload && !("in_stock" in payload)) {
    const n = Number(payload.stock);
    return { ...payload, in_stock: Number.isFinite(n) ? n > 0 : !!payload.stock };
  }
  return payload;
}

// GET: /menus と /api/menus の両対応
async function tryGetMenus(path: "/menus" | "/api/menus") {
  const data = await apiGet<unknown>(path);
  if (Array.isArray(data)) return data as any[];
  if (data && typeof data === "object" && Array.isArray((data as any).items)) {
    return (data as any).items as any[];
  }
  throw new Error("unexpected menus response");
}

// --------- public APIs ----------
export async function fetchMenus() {
  try {
    return await tryGetMenus("/menus");
  } catch {
    return await tryGetMenus("/api/menus");
  }
}

export async function createMenu(payload: any) {
  // 1st: /menus、2nd: /api/menus、3rd: 422なら in_stock へ変換して /api/menus
  try {
    return await apiPost<any>("/menus", payload);
  } catch {
    try {
      return await apiPost<any>("/api/menus", payload);
    } catch (e2) {
      if (is422(e2)) {
        const fallback = toInStockFallback(payload);
        return await apiPost<any>("/api/menus", fallback);
      }
      throw e2;
    }
  }
}

export async function updateMenu(id: number | string, payload: any) {
  const p = String(id);
  // 1st: /menus/:id、2nd: /api/menus/:id、3rd: 422なら in_stock へ変換して /api/menus/:id
  try {
    return await apiPatch<any>(`/menus/${p}`, payload);
  } catch {
    try {
      return await apiPatch<any>(`/api/menus/${p}`, payload);
    } catch (e2) {
      if (is422(e2)) {
        const fallback = toInStockFallback(payload);
        return await apiPatch<any>(`/api/menus/${p}`, fallback);
      }
      throw e2;
    }
  }
}

export async function deleteMenu(id: number | string) {
  const p = String(id);
  try {
    return await apiDelete<void>(`/menus/${p}`);
  } catch {
    return await apiDelete<void>(`/api/menus/${p}`);
  }
}

// PUT 置換が必要な場合用
export async function replaceMenu(id: number | string, payload: any) {
  const p = String(id);
  try {
    return await apiPut<any>(`/menus/${p}`, payload);
  } catch {
    return await apiPut<any>(`/api/menus/${p}`, payload);
  }
}