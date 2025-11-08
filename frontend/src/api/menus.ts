// frontend/src/api/menus.ts
import { http } from "./http";

export type Menu = {
  id: number;
  name: string;
  price: number;
  stock?: number | null;
  in_stock?: boolean | null;
  image?: string | null;
};

export async function fetchMenus(): Promise<Menu[]> {
  const ts = `?ts=${Date.now()}`; // cache-buster
  return http.get<Menu[]>(`/api/menus${ts}`, { cache: "no-store" });
}

export async function createMenu(payload: any) {
  return http.post<any>("/api/menus", payload);
}

export async function updateMenu(id: number | string, payload: any) {
  return http.patch<any>(`/api/menus/${String(id)}`, payload);
}

export async function deleteMenu(id: number | string) {
  return http.del<void>(`/api/menus/${String(id)}`);
}

export async function replaceMenu(id: number | string, payload: any) {
  return http.post<any>(`/api/menus/${String(id)}`, payload);
}