// frontend/src/api/comments.ts
import { http } from "./http";

export type Comment = { id: number; user: string | null; text: string; created_at?: string };

// 取得
export function fetchComments(menuId: number) {
  return http.get<Comment[]>(`/api/menus/${menuId}/comments`);
}

// 追加
export function createComment(menuId: number, payload: { user?: string; text: string }) {
  return http.post<Comment>(`/api/menus/${menuId}/comments`, payload);
}