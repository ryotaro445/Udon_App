// frontend/src/api/menus.ts
import { apiGet, apiPost, apiDelete, apiPatch, apiPut } from "./client";
export type { Menu } from "../components/MenuCard";

// /menus と /api/menus の両対応（まず /menus、失敗したら /api/menus）
async function tryGetMenus(path: "/menus" | "/api/menus") {
  const data = await apiGet<unknown>(path);
  if (Array.isArray(data)) return data as any[];
  if (data && typeof data === "object" && Array.isArray((data as any).items)) {
    return (data as any).items as any[];
  }
  throw new Error("unexpected menus response");
}

export async function fetchMenus() {
  try {
    return await tryGetMenus("/menus");
  } catch {
    return await tryGetMenus("/api/menus");
  }
}

// ---- Admin 用 API ----
export async function createMenu(payload: any) {
  try {
    return await apiPost<any>("/menus", payload);
  } catch {
    return await apiPost<any>("/api/menus", payload);
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

export async function updateMenu(id: number | string, payload: any) {
  const p = String(id);
  try {
    return await apiPatch<any>(`/menus/${p}`, payload);
  } catch {
    return await apiPatch<any>(`/api/menus/${p}`, payload);
  }
}

export async function replaceMenu(id: number | string, payload: any) {
  const p = String(id);
  try {
    return await apiPut<any>(`/menus/${p}`, payload);
  } catch {
    return await apiPut<any>(`/api/menus/${p}`, payload);
  }
}