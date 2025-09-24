import { apiGet, apiPost, apiDelete } from "./client";

export type Menu = { id: number; name: string; price: number; stock: number; image?: string | null };

export const fetchMenus = () => apiGet<Menu[]>("/api/menus");

export const createMenu = (p: { name: string; price: number; stock?: number; image?: string | null }) =>
  apiPost<Menu>("/api/menus", { ...p, stock: p.stock ?? 0, image: p.image ?? null });

export const deleteMenu = (id: number) => apiDelete<void>(`/api/menus/${id}`);