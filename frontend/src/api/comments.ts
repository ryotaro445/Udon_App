// frontend/src/api/comments.ts
import { apiGet, apiPost } from "./client";

export type Comment = { id: number; user: string | null; text: string };

export function fetchComments(menuId: number) {
  return apiGet<Comment[]>(`/api/menus/${menuId}/comments`);
}

export function createComment(menuId: number, payload: { user?: string; text: string }) {
  return apiPost<Comment>(`/api/menus/${menuId}/comments`, payload);
}