// frontend/src/api/orders.ts
import { apiGet, apiPost, apiPatch } from "./client";

export const createOrder = (payload: {
  table: string;
  items: { menu_id: number; quantity: number }[];
}) => apiPost("/api/orders", payload);

export const getOrder = (id: number) => apiGet(`/api/orders/${id}`);

export const updateOrderStatus = (
  id: number,
  status: "placed" | "cooking" | "served"
) => apiPatch(`/api/orders/${id}`, { status });