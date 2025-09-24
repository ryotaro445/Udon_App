import { apiGet, apiPost, apiPatch } from "./client";

// 注文作成
export const createOrder = (payload: {
  table: string;
  items: { menu_id: number; quantity: number }[];
}) => apiPost("/api/orders", payload);

// 注文詳細取得
export const getOrder = (id: number) => apiGet(`/api/orders/${id}`);

// 注文ステータス更新
export const updateOrderStatus = (
  id: number,
  status: "placed" | "cooking" | "served"
) => apiPatch(`/api/orders/${id}`, { status });