// frontend/src/api/menus.ts
import { getJSON, BASE, apiPost, apiDelete, apiPatch, apiPut } from "./client";
export type { Menu } from "../components/MenuCard"; // ← MenuAdminPage が type Menu をここから import している想定

// /menus と /api/menus の両対応（まず /menus を試し、ダメなら /api/menus）
async function tryGetMenus(path: "/menus" | "/api/menus") {
  const data = await getJSON<unknown>(`${BASE}${path}`);
  if (Array.isArray(data)) return data as any[];
  if (data && typeof data === "object" && Array.isArray((data as any).items)) {
    return (data as any).items as any[];
  }
  console.error("Unexpected menus shape:", data);
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
// create: POST /menus もしくは /api/menus
export async function createMenu(payload: any) {
  try {
    return await apiPost<any>("/menus", payload);
  } catch {
    return await apiPost<any>("/api/menus", payload);
  }
}

// delete: DELETE /menus/:id もしくは /api/menus/:id
export async function deleteMenu(id: number | string) {
  const p = typeof id === "number" ? String(id) : id;
  try {
    return await apiDelete<void>(`/menus/${p}`);
  } catch {
    return await apiDelete<void>(`/api/menus/${p}`);
  }
}

// （必要なら）更新系も用意しておくと便利
export async function updateMenu(id: number | string, payload: any) {
  const p = typeof id === "number" ? String(id) : id;
  try {
    return await apiPatch<any>(`/menus/${p}`, payload);
  } catch {
    return await apiPatch<any>(`/api/menus/${p}`, payload);
  }
}