// frontend/src/api/menus.ts
export type Menu = {
  id: number;
  name: string;
  price: number;
  stock?: number | null;
  in_stock?: boolean | null;
  image?: string | null;
};

const API = import.meta.env.VITE_API_BASE;

// 取得（http ラッパを経由せず fetch で no-store と ts を付与）
export async function fetchMenus(): Promise<Menu[]> {
  const u = new URL(`${API}/api/menus`);
  u.searchParams.set("ts", String(Date.now())); // キャッシュバスター
  const res = await fetch(u.toString(), { cache: "no-store" as RequestCache });
  if (!res.ok) throw new Error("failed to load menus");
  return (await res.json()) as Menu[];
}

// 以下は既存どおり http ラッパを使ってもOK（必要なら置換）
import { http } from "./http";

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

// 置換（必要時のみ）
export async function replaceMenu(id: number | string, payload: any) {
  return http.post<any>(`/api/menus/${String(id)}`, payload);
}