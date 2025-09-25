// frontend/src/api/menus.ts
import { getJSON, BASE } from "./client";
import type { Menu } from "../components/MenuCard";

// /menus か /api/menus か分からない場合のフォールバック対応
async function tryMenus(path: "/menus" | "/api/menus") {
  const data = await getJSON<unknown>(`${BASE}${path}`);
  if (Array.isArray(data)) return data as Menu[];
  if (data && typeof data === "object" && Array.isArray((data as any).items)) {
    return (data as any).items as Menu[];
  }
  console.error("Unexpected menus shape:", data);
  throw new Error("unexpected menus response");
}

export async function fetchMenus(): Promise<Menu[]> {
  try {
    return await tryMenus("/menus");
  } catch (e) {
    // 404 などの場合は /api/menus も試す
    return await tryMenus("/api/menus");
  }
}