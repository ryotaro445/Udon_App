// frontend/src/api/menus.ts
import { http } from "./http";
export type { Menu } from "../components/MenuCard";

// 取得
export async function fetchMenus() {
  return http.get<any[]>("/api/menus");
}

// 追加
export async function createMenu(payload: any) {
  return http.post<any>("/api/menus", payload);
}

// 更新（部分更新）
export async function updateMenu(id: number | string, payload: any) {
  return http.patch<any>(`/api/menus/${String(id)}`, payload);
}

// 削除
export async function deleteMenu(id: number | string) {
  return http.del<void>(`/api/menus/${String(id)}`);
}

// 置換（必要な場合のみ使用）
export async function replaceMenu(id: number | string, payload: any) {
  // PUT がサーバに無い場合は PATCH で代替してもOK
  return http.post<any>(`/api/menus/${String(id)}`, payload);
}